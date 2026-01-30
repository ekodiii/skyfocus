import FlightMap from './Map';
import DataPanel from './DataPanel';
import ProgressBar from './ProgressBar';
import PauseOverlay from './PauseOverlay';
import useFlightSimulation from '../../hooks/useFlightSimulation';
import useFlightStore from '../../store/flightStore';

export default function FlightDisplay() {
  const { togglePause } = useFlightStore();

  // Initialize flight simulation
  useFlightSimulation();

  return (
    <div className="h-screen flex flex-col bg-ife-bg relative">
      {/* Map area */}
      <div className="flex-1 relative">
        <FlightMap />


        {/* Pause button overlay */}
        <button
          onClick={togglePause}
          className="absolute top-4 right-4 bg-black border-2 border-ife-accent text-ife-accent px-4 py-2 hover:bg-ife-accent hover:text-black transition-colors z-10 font-bold uppercase tracking-wider"
        >
          ⏸ Pause (Space)
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar />

      {/* Data panel */}
      <DataPanel />

      {/* Pause overlay */}
      <PauseOverlay />
    </div>
  );
}
