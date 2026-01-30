import Scene3D from './Scene3D';
import DataOverlay from './DataOverlay';
import PauseOverlay from '../FlightDisplay/PauseOverlay';
import useFlightSimulation from '../../hooks/useFlightSimulation';
import useFlightStore from '../../store/flightStore';

export default function FlightDisplay3D() {
  const { togglePause } = useFlightStore();

  // Initialize flight simulation
  useFlightSimulation();

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* 3D Scene */}
      <Scene3D />

      {/* Data Overlay */}
      <DataOverlay />

      {/* Pause button */}
      <button
        onClick={togglePause}
        className="absolute top-4 right-4 bg-ife-panel/90 hover:bg-ife-border border border-ife-border text-ife-text px-4 py-2 rounded shadow-lg transition-colors z-10"
      >
        ⏸ Pause (Space)
      </button>

      {/* Pause overlay */}
      <PauseOverlay />
    </div>
  );
}
