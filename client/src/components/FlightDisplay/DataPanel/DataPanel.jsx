import useFlightStore from '../../../store/flightStore';
import { formatTimeWithSeconds, getLocalTime, formatTime } from '../../../utils/timeUtils';
import { nmToMiles, calculateOAT, celsiusToFahrenheit } from '../../../utils/flightMath';

export default function DataPanel() {
  const {
    selectedAirport,
    destinationAirport,
    altitude,
    speed,
    heading,
    totalDistance,
    progress,
    elapsedTime,
    selectedDuration
  } = useFlightStore();

  const distanceTraveled = totalDistance * progress;
  const distanceRemaining = totalDistance * (1 - progress);
  const timeRemaining = (selectedDuration * 60) - elapsedTime;

  const oat = calculateOAT(altitude);
  const oatF = celsiusToFahrenheit(oat);

  const originTime = selectedAirport ? getLocalTime(selectedAirport.lon) : new Date();
  const destTime = destinationAirport ? getLocalTime(destinationAirport.lon) : new Date();

  return (
    <div className="bg-black border-t-4 border-ife-accent p-6 text-ife-accent">
      <div className="grid grid-cols-4 gap-6">
        {/* Column 1: Speed & Altitude */}
        <div className="space-y-4">
          <DataItem
            label="Ground Speed"
            value={speed}
            unit="kts"
            large
          />
          <DataItem
            label="Altitude"
            value={altitude.toLocaleString()}
            unit="ft"
            large
          />
          <DataItem
            label="Heading"
            value={heading}
            unit="°"
          />
        </div>

        {/* Column 2: Distance */}
        <div className="space-y-4">
          <DataItem
            label="Distance Traveled"
            value={Math.round(nmToMiles(distanceTraveled)).toLocaleString()}
            unit="mi"
          />
          <DataItem
            label="Distance Remaining"
            value={Math.round(nmToMiles(distanceRemaining)).toLocaleString()}
            unit="mi"
          />
          <DataItem
            label="Total Distance"
            value={Math.round(nmToMiles(totalDistance)).toLocaleString()}
            unit="mi"
          />
        </div>

        {/* Column 3: Time */}
        <div className="space-y-4">
          <DataItem
            label="Time Elapsed"
            value={formatTimeWithSeconds(elapsedTime)}
            large
          />
          <DataItem
            label="Time Remaining"
            value={formatTimeWithSeconds(timeRemaining)}
            large
          />
          <DataItem
            label="Outside Air Temp"
            value={Math.round(oatF)}
            unit="°F"
          />
        </div>

        {/* Column 4: Locations & Time */}
        <div className="space-y-4">
          <div>
            <div className="text-xs text-ife-text uppercase tracking-widest mb-1 border-b border-ife-accent/30 pb-1">
              Local Time - {selectedAirport?.iata}
            </div>
            <div className="text-xl font-mono text-white">
              {formatTime(originTime)}
            </div>
          </div>
          <div>
            <div className="text-xs text-ife-text uppercase tracking-widest mb-1 border-b border-ife-accent/30 pb-1">
              Local Time - {destinationAirport?.iata}
            </div>
            <div className="text-xl font-mono text-white">
              {formatTime(destTime)}
            </div>
          </div>
          <div>
            <div className="text-xs text-ife-text uppercase tracking-widest mb-1 border-b border-ife-accent/30 pb-1">
              Route
            </div>
            <div className="text-xl font-mono font-bold text-ife-accent bg-ife-panel px-2 py-1 inline-block mt-1">
              {selectedAirport?.iata} → {destinationAirport?.iata}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataItem({ label, value, unit, large }) {
  return (
    <div className="border border-ife-accent/20 p-2 bg-ife-panel/50">
      <div className="text-[10px] text-ife-accent uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className={`font-mono ${large ? 'text-3xl' : 'text-xl'} text-white flex items-baseline gap-1`}>
        <span className="font-bold">{value}</span>
        {unit && <span className="text-sm text-ife-accent">{unit}</span>}
      </div>
    </div>
  );
}
