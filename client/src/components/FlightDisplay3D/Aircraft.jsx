import { useRef, Suspense, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import * as THREE from 'three';

// Procedural 737 model (shorter, narrower body)
function Boeing737() {
  return (
    <group>
      {/* Fuselage */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 4, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 0, 2.2]} castShadow>
        <coneGeometry args={[0.4, 0.6, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tail cone */}
      <mesh position={[0, 0, -2.2]} castShadow>
        <coneGeometry args={[0.4, 0.6, 16]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wings */}
      <mesh position={[0, -0.2, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[6, 0.1, 1.2]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wing tips (winglets) */}
      <mesh position={[3, 0.1, 0]} rotation={[0, 0, 0.3]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-3, 0.1, 0]} rotation={[0, 0, -0.3]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.4]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Horizontal stabilizer */}
      <mesh position={[0, 0.2, -1.8]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 0.08, 0.6]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Vertical stabilizer */}
      <mesh position={[0, 0.8, -2]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 1.2, 1]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tail logo accent */}
      <mesh position={[0, 1.2, -2]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.4]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engines */}
      <mesh position={[1.5, -0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 1, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.5, -0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.28, 1, 12]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Engine nacelles front */}
      <mesh position={[1.5, -0.5, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-1.5, -0.5, 1.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.25, 0.3, 12]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Windows stripe */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.41, 0.41, 3.5, 16]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Procedural 787 model (longer, wider body)
function Boeing787() {
  return (
    <group>
      {/* Fuselage - longer and wider */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 6, 20]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Nose cone - more streamlined */}
      <mesh position={[0, 0, 3.3]} castShadow>
        <coneGeometry args={[0.5, 0.8, 20]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tail cone */}
      <mesh position={[0, 0, -3.3]} castShadow>
        <coneGeometry args={[0.5, 0.8, 20]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wings - longer wingspan */}
      <mesh position={[0, -0.25, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[8.5, 0.12, 1.5]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wing tips - raked wingtips (787 signature) */}
      <mesh position={[4.25, 0.15, 0]} rotation={[0, 0, 0.4]} castShadow>
        <boxGeometry args={[0.12, 0.8, 0.5]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-4.25, 0.15, 0]} rotation={[0, 0, -0.4]} castShadow>
        <boxGeometry args={[0.12, 0.8, 0.5]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Horizontal stabilizer */}
      <mesh position={[0, 0.25, -2.7]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[3.2, 0.1, 0.8]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Vertical stabilizer - taller */}
      <mesh position={[0, 1, -3]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 1.5, 1.3]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tail logo accent */}
      <mesh position={[0, 1.5, -3]} castShadow>
        <boxGeometry args={[0.12, 0.5, 0.5]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Engines - larger GEnx engines */}
      <mesh position={[2.2, -0.6, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.38, 1.3, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-2.2, -0.6, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.38, 1.3, 16]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Engine nacelles front - chevrons */}
      <mesh position={[2.2, -0.6, 1.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.32, 0.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-2.2, -0.6, 1.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.32, 0.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Windows stripe - dreamliner style */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.51, 0.51, 5.5, 20]} />
        <meshStandardMaterial color="#2563eb" metalness={0.8} roughness={0.2} transparent opacity={0.25} />
      </mesh>

      {/* Extra detail - cockpit windows */}
      <mesh position={[0, 0.4, 3.2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.05} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// OBJ Model Loader
function AircraftModel({ modelPath, scale = 1 }) {
  const obj = useLoader(OBJLoader, modelPath);

  // Clone and apply materials
  const model = obj.clone();

  model.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: '#e8e8e8',
        metalness: 0.7,
        roughness: 0.3,
      });
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={model} scale={scale} />;
}

// Always use 737 model - it has correct orientation with nose on blue arrow
function Aircraft737Model({ scale }) {
  const [useOBJ, setUseOBJ] = useState(true);
  const modelPath = '/models/737.obj';

  // Try loading OBJ, fall back to procedural on error
  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then(res => {
        if (!res.ok) setUseOBJ(false);
      })
      .catch(() => setUseOBJ(false));
  }, []);

  if (!useOBJ) {
    return <Boeing737 />;
  }

  return (
    <Suspense fallback={<Boeing737 />}>
      <AircraftModel modelPath={modelPath} scale={scale} />
    </Suspense>
  );
}

export default function Aircraft({ position = [0, 0, 0], quaternion = null }) {
  const groupRef = useRef();

  // Use 737 scale for all aircraft
  const scale = 0.00009;

  useFrame(() => {
    if (groupRef.current && quaternion) {
      // Apply quaternion directly for proper tangent-to-surface orientation
      // Use faster slerp for more responsive attitude changes
      groupRef.current.quaternion.slerp(quaternion, 0.15);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Inner rotation to correct for model's default orientation */}
      {/* Nose is +Z, we want -Z (Standard Forward) */}
      <group rotation={[0, Math.PI, 0]}>
        <Aircraft737Model scale={scale} />
      </group>
    </group>
  );
}
