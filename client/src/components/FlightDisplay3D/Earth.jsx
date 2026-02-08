import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { latLonToVector3 } from '../../utils/geo';

// Simplified Globe component using only three-globe base texture
function Globe() {
  const globeRef = useRef();
  const { scene } = useThree();

  useEffect(() => {
    // Create globe with your NASA Blue Marble texture
    const globe = new ThreeGlobe({ animateIn: false })
      .globeImageUrl('https://neo.gsfc.nasa.gov/archive/bluemarble/land_shallow_topo_21600.tif')
      .showAtmosphere(true)
      .atmosphereColor('#4a9eff')
      .atmosphereAltitude(0.15);

    // Scale to match our coordinate system (radius 100)
    globe.scale.set(1, 1, 1);

    // Disable any rotation animations - ensure globe stays fixed
    globe.rotation.set(0, 0, 0);
    globe.userData.autoRotate = false;

    globeRef.current = globe;
    scene.add(globe);

    // Load and apply bump map manually to the globe material
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bathymetry/gebco_08_rev_bath_5400x2700.jpg',
      (bumpTexture) => {
        const globeMesh = globe.children.find(child => child.type === 'Mesh');
        if (globeMesh && globeMesh.material) {
          globeMesh.material.bumpMap = bumpTexture;
          // Set bump scale to match flight altitude scale
          // Flight altitudes: 0-45000ft = 0-2 units on our scale
          // Using 0.5 for more visible terrain depth
          globeMesh.material.bumpScale = 0.5;
          globeMesh.material.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.error('Error loading bump map:', error);
      }
    );

    return () => {
      scene.remove(globe);
    };
  }, [scene]);

  // Prevent any rotation animations on the globe
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.set(0, 0, 0);
    }
  });

  return null;
}

export default function Earth({ showCityLights = false }) {
  return (
    <group>
      <Globe />
    </group>
  );
}

// Flight path line - renders at correct altitudes
// Points should include { lat, lon, altitude } where altitude is in feet
export function FlightPathLine({ points, color = '#FFD700', completed = false, altitudeOffset = 0 }) {
  const geometry = useMemo(() => {
    if (!points || points.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);

    points.forEach((point, i) => {
      // Convert altitude to radius: 0 ft = 100, 45000 ft = 102
      // Use altitude if available, otherwise default to slight offset above surface
      const altitudeFeet = (point.altitude || 0) + (altitudeOffset || 0);
      const radius = 100 + (altitudeFeet / 45000) * 2;

      const vec = latLonToVector3(point.lat, point.lon, radius);
      positions[i * 3] = vec.x;
      positions[i * 3 + 1] = vec.y;
      positions[i * 3 + 2] = vec.z;
    });

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [points]);

  const material = useMemo(() =>
    new THREE.LineBasicMaterial({
      color: color,
      linewidth: 2,
      transparent: !completed,
      opacity: completed ? 1 : 0.4
    }), [color, completed]
  );

  if (!geometry) return null;

  return <line geometry={geometry} material={material} />;
}

// Airport marker
export function AirportMarker({ lat, lon, label, type = 'origin' }) {
  const position = latLonToVector3(lat, lon, 101);

  return (
    <mesh position={[position.x, position.y, position.z]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={type === 'origin' ? '#10b981' : '#ef4444'} />
    </mesh>
  );
}
