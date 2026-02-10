import { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import ThreeGlobe from 'three-globe';
import * as THREE from 'three';
import { latLonToVector3 } from '../../utils/geo';
import useFlightStore from '../../store/flightStore';

// High-res NASA texture URL (21600x10800 JPEG, ~27MB)
const HIRES_TEXTURE_URL = 'https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/august/world.topo.bathy.200408.3x21600x10800.jpg';

// Simplified Globe component using only three-globe base texture
function Globe() {
  const globeRef = useRef();
  const hiresLoadedRef = useRef(false);
  const { scene } = useThree();
  const selectedAirport = useFlightStore((state) => state.selectedAirport);

  useEffect(() => {
    // Stage 1: Load local textures for instant display
    const globe = new ThreeGlobe({ animateIn: false })
      .globeImageUrl('/textures/earth.jpg')
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

    // Load and apply bump map from local assets
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/textures/bathymetry.jpg',
      (bumpTexture) => {
        const globeMesh = globe.children.find(child => child.type === 'Mesh');
        if (globeMesh && globeMesh.material) {
          globeMesh.material.bumpMap = bumpTexture;
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

  // Stage 2: Upgrade to high-res NASA texture after first airport selection
  useEffect(() => {
    if (!selectedAirport || hiresLoadedRef.current || !globeRef.current) return;
    hiresLoadedRef.current = true;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      HIRES_TEXTURE_URL,
      (hiresTexture) => {
        const globe = globeRef.current;
        if (!globe) return;
        const globeMesh = globe.children.find(child => child.type === 'Mesh');
        if (globeMesh && globeMesh.material) {
          globeMesh.material.map = hiresTexture;
          globeMesh.material.needsUpdate = true;
        }
      },
      undefined,
      (error) => {
        console.error('Error loading high-res texture:', error);
      }
    );
  }, [selectedAirport]);

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
