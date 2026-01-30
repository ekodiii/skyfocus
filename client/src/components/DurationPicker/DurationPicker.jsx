import { useState } from 'react';
import useFlightStore from '../../store/flightStore';
import { formatDuration } from '../../utils/timeUtils';

export default function DurationPicker() {
  const { selectedAirport, selectedDuration, setSelectedDuration, setScreen } = useFlightStore();
  const [duration, setDuration] = useState(selectedDuration);

  const presetDurations = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '1.5 hours', value: 90 },
    { label: '2 hours', value: 120 },
    { label: '3 hours', value: 180 },
    { label: '4 hours', value: 240 },
    { label: '6 hours', value: 360 },
  ];

  const handleContinue = () => {
    setSelectedDuration(duration);
    setScreen('route-selection');
  };

  const handleBack = () => {
    setScreen('airport-selection');
  };

  return (
    <div className="min-h-screen bg-ife-bg flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-black border-2 border-ife-accent p-6 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <button
            onClick={handleBack}
            className="text-ife-text-dim hover:text-ife-accent mb-4 flex items-center gap-2 uppercase tracking-wider text-sm font-bold"
          >
            ← Back
          </button>

          <h2 className="text-2xl font-bold mb-2 uppercase tracking-wide text-white">
            Flying from <span className="text-ife-accent">{selectedAirport?.name}</span>
          </h2>
          <p className="text-ife-text-dim mb-6 uppercase tracking-wider text-sm">
            {selectedAirport?.city}, {selectedAirport?.country} <span className="text-ife-accent font-mono ml-2">[{selectedAirport?.iata}]</span>
          </p>

          <div className="mb-6">
            <label className="block text-sm font-bold mb-3 uppercase tracking-widest text-ife-accent">
              Select Flight Duration
            </label>

            <div className="grid grid-cols-4 gap-3 mb-4">
              {presetDurations.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setDuration(preset.value)}
                  className={`px-4 py-3 border-2 transition-all font-mono font-bold ${duration === preset.value
                      ? 'bg-ife-accent border-ife-accent text-black scale-105'
                      : 'bg-black border-ife-panel text-ife-text hover:border-ife-accent hover:text-ife-accent'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="bg-ife-panel border border-ife-border p-4">
              <label className="block text-sm mb-2 uppercase tracking-wide text-ife-text-dim">Custom duration (minutes)</label>
              <input
                type="range"
                min="15"
                max="480"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full mb-2 accent-ife-accent h-2 bg-black rounded-none appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-ife-text-dim font-mono">
                <span>15 MIN</span>
                <span className="text-ife-accent font-bold text-xl">
                  {formatDuration(duration)}
                </span>
                <span>8 HRS</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-ife-accent hover:bg-white hover:text-black text-black font-bold uppercase tracking-widest py-4 px-6 border-2 border-ife-accent transition-colors"
          >
            Find Flights →
          </button>
        </div>

        <div className="mt-4 text-center text-ife-text-dim text-sm">
          We'll find real flight routes that match your study time
        </div>
      </div>
    </div>
  );
}
