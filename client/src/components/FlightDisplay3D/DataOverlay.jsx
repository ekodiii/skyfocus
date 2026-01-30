import { useState, useEffect } from 'react';
import useFlightStore from '../../store/flightStore';
import { formatTimeWithSeconds } from '../../utils/timeUtils';
import { nmToMiles, calculateOAT, celsiusToFahrenheit } from '../../utils/flightMath';
import Gauge from './Gauge';
import AttitudeIndicator from './AttitudeIndicator';

export default function DataOverlay() {
  const [displayMode, setDisplayMode] = useState('full'); // 'minimal', 'full', 'hidden'
  const [showGauges, setShowGauges] = useState(false);

  const {
    altitude,
    speed,
    heading,
    pitch,
    bank,
    totalDistance,
    progress,
    elapsedTime,
    selectedDuration,
    selectedAirport,
    destinationAirport
  } = useFlightStore();

  const distanceRemaining = totalDistance * (1 - progress);
  const timeRemaining = (selectedDuration * 60) - elapsedTime;
  const oat = calculateOAT(altitude);
  const oatF = celsiusToFahrenheit(oat);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'd' || e.key === 'D') {
        // Cycle display modes
        setDisplayMode(current => {
          if (current === 'full') return 'minimal';
          if (current === 'minimal') return 'hidden';
          return 'full';
        });
      }
      if (e.key === 'g' || e.key === 'G') {
        // Toggle gauges
        setShowGauges(current => !current);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Row */}
      <div className="flex justify-between items-start pointer-events-auto">
        {/* Left: Flight Info */}
        {(displayMode === 'full') && (
          <div className="bg-ife-panel border-2 border-ife-border rounded-lg p-4 min-w-[200px] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <div className="text-xs text-ife-accent font-bold uppercase tracking-widest mb-2 border-b border-ife-border pb-1">FLIGHT LOG</div>
            <div className="font-mono text-xl font-bold text-ife-text mb-3 tracking-wider">
              {selectedAirport?.iata} <span className="text-ife-border">==&gt;</span> {destinationAirport?.iata}
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-ife-text-dim">ELAPSED</span>
                <span className="text-ife-text">{formatTimeWithSeconds(elapsedTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ife-text-dim">REMAINING</span>
                <span className="text-ife-text">{formatTimeWithSeconds(timeRemaining)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Right: Altitude & Speed */}
        {(displayMode === 'full' || displayMode === 'minimal') && (
          <div className="bg-ife-panel border-2 border-ife-border rounded-lg p-4 min-w-[280px] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <div className="text-xs text-ife-accent font-bold uppercase tracking-widest mb-2 border-b border-ife-border pb-1">INSTRUMENTS</div>
            {showGauges ? (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Gauge value={speed} max={600} label="SPD" />
                  <span className="font-mono text-xs text-ife-text-dim mt-1">KTS</span>
                </div>
                <div className="flex flex-col items-center">
                  {/* Artificial Horizon */}
                  <AttitudeIndicator pitch={pitch} bank={bank} size={150} />
                </div>
                <div className="flex flex-col items-center">
                  <Gauge value={altitude} max={45000} label="ALT" />
                  <span className="font-mono text-xs text-ife-text-dim mt-1">FT</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                <div>
                  <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">ALTITUDE</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ife-text">{altitude.toLocaleString()}</span>
                    <span className="text-xs text-ife-accent">FT</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">AIRSPEED</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ife-text">{speed}</span>
                    <span className="text-xs text-ife-accent">KTS</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="flex justify-between items-end pointer-events-auto">
        {/* Left: Navigation */}
        {(displayMode === 'full' || displayMode === 'minimal') && (
          <div className="bg-ife-panel border-2 border-ife-border rounded-lg p-4 min-w-[180px] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <div className="text-xs text-ife-accent font-bold uppercase tracking-widest mb-2 border-b border-ife-border pb-1">NAV SYSTEM</div>
            {showGauges ? (
              <div className="flex flex-col items-center">
                <Gauge value={heading} max={360} label="HDG" type="circular" />
                <span className="font-mono text-lg font-bold text-ife-text mt-1">{heading}°</span>
              </div>
            ) : (
              <div className="space-y-3 font-mono">
                <div>
                  <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">HEADING</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-ife-text">{heading}</span>
                    <span className="text-xs text-ife-accent">DEG</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">DISTANCE</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-ife-text">
                      {Math.round(nmToMiles(distanceRemaining)).toLocaleString()}
                    </span>
                    <span className="text-xs text-ife-accent">MI</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right: Environment/Status */}
        {displayMode === 'full' && (
          <div className="bg-ife-panel border-2 border-ife-border rounded-lg p-4 min-w-[180px] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <div className="text-xs text-ife-accent font-bold uppercase tracking-widest mb-2 border-b border-ife-border pb-1">
              STATUS
            </div>
            <div className="space-y-3 font-mono">
              <div>
                <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">OAT</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-ife-text">{Math.round(oatF)}</span>
                  <span className="text-xs text-ife-accent">°F</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-ife-text-dim uppercase tracking-wide mb-1">PROGRESS</div>
                <div className="w-full bg-ife-bg h-2 rounded-full overflow-hidden border border-ife-border/50">
                  <div
                    className="bg-ife-accent h-full"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="text-right text-xs text-ife-accent mt-1">{Math.round(progress * 100)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint - discreet */}
      {displayMode !== 'hidden' && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-ife-text-dim/50 text-[10px] font-mono tracking-widest uppercase pointer-events-auto bg-ife-bg/80 px-2 rounded border border-ife-border/30">
          [D] DISPLAY • [G] GAUGES
        </div>
      )}
      {displayMode === 'hidden' && (
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button
            onClick={() => setDisplayMode('full')}
            className="bg-ife-panel border border-ife-border text-ife-accent px-3 py-1 rounded text-xs font-mono uppercase hover:bg-ife-border/50"
          >
            SHOW DATA
          </button>
        </div>
      )}
    </div>
  );
}

function getMaxForLabel(label) {
  switch (label) {
    case 'Altitude': return 45000;
    case 'Speed': return 600;
    case 'Heading': return 360;
    default: return 100;
  }
}
