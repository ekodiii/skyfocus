import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import useFlightStore from '../../store/flightStore';

export default function CameraController({
  aircraftPosition,
  aircraftQuaternion,
  mode = 'chase', // 'chase' or 'overview'
  enableOrbit = false
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const targetPosition = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3());
  const lookAtTarget = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  // Get flight phase for dynamic camera behavior
  const phase = useFlightStore(state => state.phase);

  // Dynamic camera parameters based on flight phase
  // Distances are 100x smaller for very close zoom
  const cameraParams = useMemo(() => {
    switch (phase) {
      case 'takeoff_roll':
      case 'liftoff':
        // Low and close during takeoff for dramatic effect
        return { distance: 0.6, height: 0.3, smoothing: 0.08, lookAhead: 0.3 };
      case 'initial_climb':
        // Pull back slightly as we climb
        return { distance: 0.8, height: 0.5, smoothing: 0.06, lookAhead: 0.2 };
      case 'departure_turn':
        // Wider view during turn
        return { distance: 1.2, height: 0.8, smoothing: 0.05, lookAhead: 0.1 };
      case 'climb':
        // Standard climb view
        return { distance: 1.0, height: 0.7, smoothing: 0.05, lookAhead: 0.1 };
      case 'cruise':
        // Comfortable cruise view
        return { distance: 1.2, height: 0.8, smoothing: 0.04, lookAhead: 0.05 };
      case 'descent':
        // Start pulling in for approach
        return { distance: 1.0, height: 0.7, smoothing: 0.05, lookAhead: 0.1 };
      case 'approach_turn':
        // Wider view during pattern
        return { distance: 1.2, height: 0.8, smoothing: 0.05, lookAhead: 0.15 };
      case 'final':
        // Close and low for landing approach
        return { distance: 0.8, height: 0.5, smoothing: 0.06, lookAhead: 0.2 };
      case 'flare':
      case 'touchdown':
        // Very close for landing drama
        return { distance: 0.6, height: 0.3, smoothing: 0.08, lookAhead: 0.3 };
      default:
        return { distance: 1.0, height: 0.8, smoothing: 0.05, lookAhead: 0.1 };
    }
  }, [phase]);

  useEffect(() => {
    if (mode === 'chase') {
      // Reset controls when switching to chase mode
      if (controlsRef.current) {
        controlsRef.current.enabled = enableOrbit;
      }
      // Force a snap on next frame so we don't animate in from origin
      initialized.current = false;
    } else if (mode === 'overview') {
      // Overview mode - show entire route
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  }, [mode, enableOrbit]);

  useFrame(() => {
    if (!aircraftPosition) return;

    const aircraftPos = new THREE.Vector3(...aircraftPosition);

    // Calculate local up vector (normal to earth surface at aircraft position)
    const localUp = aircraftPos.clone().normalize();

    if (mode === 'chase') {
      // Correct global up vector for orbit controls or regular camera
      camera.up.copy(localUp);

      // If orbit is enabled, only update the target, not camera position
      if (enableOrbit && controlsRef.current) {
        controlsRef.current.target.copy(aircraftPos);
        controlsRef.current.update();
        return; // Let orbit controls handle camera
      }

      // Chase camera - follow behind aircraft using quaternion
      const { distance, height, smoothing, lookAhead } = cameraParams;

      // Get forward direction from quaternion
      let forward = new THREE.Vector3(0, 0, -1);

      // Local up for aircraft (might be banked/pitched)
      let aircraftUp = new THREE.Vector3(0, 1, 0);

      if (aircraftQuaternion) {
        forward.applyQuaternion(aircraftQuaternion);
        aircraftUp.applyQuaternion(aircraftQuaternion);
      }

      // Camera position: behind and above aircraft
      targetPosition.current.copy(aircraftPos)
        .add(forward.clone().multiplyScalar(-distance))
        .add(aircraftUp.clone().multiplyScalar(height));

      // On first frame (or after mode change), snap to target to avoid swooping up
      if (!initialized.current) {
        currentPosition.current.copy(targetPosition.current);
        camera.position.copy(currentPosition.current);

        const lookTarget = aircraftPos.clone()
          .add(forward.clone().multiplyScalar(lookAhead * distance));
        lookAtTarget.current.copy(lookTarget);
        camera.lookAt(lookAtTarget.current);

        initialized.current = true;
        return;
      }

      // Smooth camera movement (varies by phase)
      currentPosition.current.lerp(targetPosition.current, smoothing);
      camera.position.copy(currentPosition.current);

      // Look slightly ahead of aircraft for cinematic feel
      const lookTarget = aircraftPos.clone()
        .add(forward.clone().multiplyScalar(lookAhead * distance));

      lookAtTarget.current.lerp(lookTarget, smoothing * 2);
      camera.lookAt(lookAtTarget.current);
    } else if (mode === 'overview') {
      // Overview mode - position camera to see entire route
      const distance = 250;

      // Set Global up or Local up? For overview, global Y up is usually fine if we are far away,
      // but aligning with local up keeps it consistent.
      camera.up.copy(localUp);

      camera.position.set(
        aircraftPos.x,
        distance * 0.6,
        aircraftPos.z + distance * 0.8
      );

      camera.lookAt(aircraftPos);

      if (controlsRef.current) {
        controlsRef.current.target.copy(aircraftPos);
        controlsRef.current.update();
      }
    }
  });

  return (
    <>
      {enableOrbit || mode === 'overview' ? (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={0.2}
          maxDistance={100}
          enableDamping={true}
          dampingFactor={0.05}
        />
      ) : null}
    </>
  );
}
