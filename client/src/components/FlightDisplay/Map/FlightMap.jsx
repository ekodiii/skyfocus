import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import useFlightStore from '../../../store/flightStore';
import 'leaflet/dist/leaflet.css';

// Custom plane icon
const planeIcon = (rotation) => L.divIcon({
  className: 'plane-icon',
  html: `<div style="transform: rotate(${rotation}deg); font-size: 24px;">✈️</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle map updates
function MapUpdater() {
  const map = useMap();
  const { position, heading, progress } = useFlightStore();

  useEffect(() => {
    if (position) {
      // Center on aircraft
      map.setView([position.lat, position.lon], map.getZoom(), {
        animate: true,
        duration: 0.5
      });

      // Adjust zoom based on flight phase
      let targetZoom;
      if (progress < 0.1 || progress > 0.9) {
        targetZoom = 10; // Zoomed in for takeoff/landing
      } else if (progress < 0.2 || progress > 0.8) {
        targetZoom = 8; // Climbing/descending
      } else {
        targetZoom = 6; // Cruise
      }

      if (Math.abs(map.getZoom() - targetZoom) > 1) {
        map.setZoom(targetZoom, {
          animate: true
        });
      }
    }
  }, [position, progress, map]);

  return null;
}

export default function FlightMap() {
  const {
    selectedAirport,
    destinationAirport,
    flightPath,
    position,
    heading,
    progress
  } = useFlightStore();

  if (!selectedAirport || !destinationAirport || !flightPath) {
    return <div className="w-full h-full flex items-center justify-center text-ife-text-dim">
      Loading map...
    </div>;
  }

  const center = position || {
    lat: selectedAirport.lat,
    lon: selectedAirport.lon
  };

  // Split path into completed and remaining
  const completedPath = flightPath.slice(0, Math.floor(progress * flightPath.length));
  const remainingPath = flightPath.slice(Math.floor(progress * flightPath.length));

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={8}
      className="w-full h-full"
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapUpdater />

      {/* Origin marker */}
      <Marker
        position={[selectedAirport.lat, selectedAirport.lon]}
        icon={L.divIcon({
          className: 'airport-marker',
          html: `<div style="color: #FFD700; font-size: 16px; text-align: center;">
            <div style="text-shadow: 0 0 5px black;">🛫</div>
            <div style="font-size: 10px; margin-top: 2px; font-weight: bold; background: black; padding: 0 2px;">${selectedAirport.iata}</div>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })}
      />

      {/* Destination marker */}
      <Marker
        position={[destinationAirport.lat, destinationAirport.lon]}
        icon={L.divIcon({
          className: 'airport-marker',
          html: `<div style="color: #FFD700; font-size: 16px; text-align: center;">
            <div style="text-shadow: 0 0 5px black;">🛬</div>
            <div style="font-size: 10px; margin-top: 2px; font-weight: bold; background: black; padding: 0 2px;">${destinationAirport.iata}</div>
          </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })}
      />

      {/* Completed flight path (solid line) */}
      {completedPath.length > 1 && (
        <Polyline
          positions={completedPath.map(p => [p.lat, p.lon])}
          pathOptions={{
            color: '#FFD700',
            weight: 3,
            opacity: 0.8
          }}
        />
      )}

      {/* Remaining flight path (dotted line) */}
      {remainingPath.length > 1 && (
        <Polyline
          positions={remainingPath.map(p => [p.lat, p.lon])}
          pathOptions={{
            color: '#FFD700',
            weight: 2,
            opacity: 0.4,
            dashArray: '10, 10'
          }}
        />
      )}

      {/* Aircraft position */}
      {position && (
        <Marker
          position={[position.lat, position.lon]}
          icon={planeIcon(heading)}
        />
      )}
    </MapContainer>
  );
}
