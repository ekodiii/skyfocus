import { Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import useFlightStore from '../../store/flightStore';
import Earth, { FlightPathLine, AirportMarker } from './Earth';
import Aircraft from './Aircraft';
import CameraController from './CameraController';
import * as THREE from 'three';
import { latLonToVector3 } from '../../utils/geo';

// Scene component receives enableOrbit as prop
function Scene({ enableOrbit }) {
  const {
    position,
    heading,
    altitude,
    pitch,
    bank,
    flightPath,
    progress
  } = useFlightStore();

  const [cameraMode, setCameraMode] = useState('chase');
  // enableOrbit state moved to parent

  // Calculate if it's night based on sun position
  const isNight = useMemo(() => {
    if (!position) return false;
    // Simple day/night calc - if position is on opposite side of earth from sun
    const sunVector = new THREE.Vector3(200, 50, 100); // Sun position
    const posVector = latLonToVector3(position.lat, position.lon, 100);
    const angle = posVector.angleTo(sunVector);
    return angle > Math.PI / 2; // Night if angle > 90 degrees
  }, [position]);

  // Convert position to 3D coordinates
  // Earth radius = 100
  const aircraftPosition3D = useMemo(() => {
    if (!position) return [0, 100, 0];
    const altitudeRadius = 100 + (altitude / 45000) * 2;
    const pos = latLonToVector3(position.lat, position.lon, altitudeRadius);
    return [pos.x, pos.y, pos.z];
  }, [position, altitude]);

  // Calculate aircraft orientation tangent to earth surface
  const aircraftQuaternion = useMemo(() => {
    if (!position) return null;

    const pos = latLonToVector3(position.lat, position.lon, 1).normalize();
    const upVector = pos.clone();

    // North roughly toward +Y
    const worldUp = new THREE.Vector3(0, 1, 0);
    let north = worldUp.clone().sub(upVector.clone().multiplyScalar(upVector.dot(worldUp))).normalize();

    if (north.lengthSq() < 0.001) north = new THREE.Vector3(1, 0, 0);

    const east = new THREE.Vector3().crossVectors(north, upVector).normalize();
    north = new THREE.Vector3().crossVectors(upVector, east).normalize();

    // Heading rotation
    const headingRad = (heading || 0) * (Math.PI / 180);
    const forward = north.clone().multiplyScalar(Math.cos(headingRad))
      .add(east.clone().multiplyScalar(Math.sin(headingRad)));

    const right = new THREE.Vector3().crossVectors(forward, upVector).normalize();
    const rotMatrix = new THREE.Matrix4().makeBasis(right, upVector, forward.clone().negate());
    const baseQuaternion = new THREE.Quaternion().setFromRotationMatrix(rotMatrix);

    const pitchRad = (pitch || 0) * (Math.PI / 180);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchRad);

    const bankRad = (bank || 0) * (Math.PI / 180);
    const bankQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, -1), bankRad);

    return baseQuaternion.clone().multiply(pitchQuat).multiply(bankQuat);
  }, [position, heading, pitch, bank]);

  // Toggle Camera Mode (C key) - Managed internally as it doesn't affect UI outside
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Toggle mode
      if (e.key === 'c' || e.key === 'C') {
        setCameraMode(current => current === 'chase' ? 'overview' : 'chase');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Split flight path
  const completedPath = useMemo(() => {
    if (!flightPath || flightPath.length === 0) return [];
    return flightPath.slice(0, Math.floor(progress * flightPath.length));
  }, [flightPath, progress]);

  const remainingPath = useMemo(() => {
    if (!flightPath || flightPath.length === 0) return [];
    return flightPath.slice(Math.floor(progress * flightPath.length));
  }, [flightPath, progress]);

  return (
    <>
      {/* Strong ambient light for uniform globe illumination */}
      <ambientLight intensity={1.2} />

      {/* Main directional light from front */}
      <directionalLight position={[200, 50, 100]} intensity={1.5} />

      {/* Fill lights from multiple angles for even coverage */}
      <directionalLight position={[-200, 50, -100]} intensity={1.2} />
      <directionalLight position={[0, 200, 0]} intensity={1.0} />
      <directionalLight position={[0, -100, 0]} intensity={0.8} />

      <Stars radius={300} depth={50} count={5000} factor={4} fade saturation={0} />

      <Earth
        showCityLights={isNight}
        cameraPosition={aircraftPosition3D}
      />

      {completedPath.length > 0 && <FlightPathLine points={completedPath} color="#FFD700" completed={true} altitudeOffset={-2000} />}
      {remainingPath.length > 0 && <FlightPathLine points={remainingPath} color="#4a9eff" completed={false} altitudeOffset={-2000} />}

      {position && aircraftQuaternion && (
        <Aircraft
          position={aircraftPosition3D}
          quaternion={aircraftQuaternion}
          scale={0.005} // Scale the aircraft to be visible relative to Earth's radius of 100
        />
      )}

      <CameraController
        aircraftPosition={aircraftPosition3D}
        aircraftQuaternion={aircraftQuaternion}
        mode={cameraMode}
        enableOrbit={enableOrbit}
      />
    </>
  );
}

export default function Scene3D() {
  const [enableOrbit, setEnableOrbit] = useState(false);

  // Handle Free Look Toggle (F key) in parent to sync with UI
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'f' || e.key === 'F') {
        setEnableOrbit(current => !current);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      <Canvas
        camera={{ position: [0, 110, 120], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000' }}
      >
        <Suspense fallback={null}>
          <Scene enableOrbit={enableOrbit} />
        </Suspense>
      </Canvas>

      <div className="absolute top-4 left-4 flex gap-2">
        <button
          onClick={() => setEnableOrbit(!enableOrbit)}
          className={`px-3 py-1 rounded text-sm font-mono border ${enableOrbit
            ? 'bg-blue-600 border-blue-400 text-white'
            : 'bg-black/60 border-gray-600 text-gray-300 hover:bg-black/80'
            }`}
        >
          {enableOrbit ? 'Chase Mode' : 'Free Look'}
        </button>

        {enableOrbit && (
          <button
            onClick={() => setEnableOrbit(false)}
            className="px-3 py-1 rounded text-sm font-mono bg-red-600/80 border border-red-400 text-white hover:bg-red-600 transition-colors"
          >
            Reset to Chase
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 bg-black/60 text-white p-2 rounded text-xs font-mono">
        <div>LOD: Mid-Tier (Optimized)</div>
      </div>
    </div>
  );
}
