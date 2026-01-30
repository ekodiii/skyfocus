import { useEffect } from 'react';
import useFlightStore from '../../../store/flightStore';

export default function PauseOverlay() {
  const { isPaused, togglePause } = useFlightStore();

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePause]);

  if (!isPaused) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="text-6xl font-bold text-ife-text mb-4">
          PAUSED
        </div>
        <div className="text-ife-text-dim mb-8">
          Your flight is on hold
        </div>
        <button
          onClick={togglePause}
          className="bg-ife-accent hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded transition-colors"
        >
          Resume Flight
        </button>
        <div className="text-ife-text-dim text-sm mt-4">
          Press <kbd className="bg-ife-panel px-2 py-1 rounded">Space</kbd> to resume
        </div>
      </div>
    </div>
  );
}
