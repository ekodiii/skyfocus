import useFlightStore from '../../store/flightStore';
import { formatTimeWithSeconds } from '../../utils/timeUtils';
import { nmToMiles } from '../../utils/flightMath';

export default function StatsSummary() {
  const {
    selectedAirport,
    destinationAirport,
    stats,
    reset
  } = useFlightStore();

  const handleNewFlight = () => {
    reset();
  };

  return (
    <div className="min-h-screen bg-ife-bg flex items-center justify-center p-8">
      <div className="max-w-2xl w-full border border-ife-accent p-1 bg-black shadow-[0_0_20px_rgba(255,215,0,0.15)]">
        <div className="bg-black p-8 border border-white/10">
          <div className="text-center mb-8 border-b-2 border-ife-accent pb-6">
            <h1 className="text-4xl font-mono font-bold text-ife-accent tracking-widest mb-2 uppercase">MISSION DEBRIEF</h1>
            <p className="text-ife-text-dim font-mono uppercase tracking-wide text-sm">Flight Log #{Math.floor(Math.random() * 9000) + 1000}</p>
          </div>

          <div className="bg-black border border-ife-border p-6 mb-8 relative overflow-hidden">
            {/* Diagonal stripe overlay */}
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
              <div className="w-32 h-32 border-t-2 border-r-2 border-ife-accent"></div>
            </div>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-2 font-mono">
                <span className="font-bold text-4xl text-white">
                  {selectedAirport?.iata}
                </span>
                <span className="text-2xl text-ife-accent">==&gt;</span>
                <span className="font-bold text-4xl text-white">
                  {destinationAirport?.iata}
                </span>
              </div>
              <div className="text-ife-text-dim font-mono text-sm uppercase tracking-wider">
                {selectedAirport?.city.toUpperCase()} TO {destinationAirport?.city.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <StatItem
                label="TOTAL TIME"
                value={formatTimeWithSeconds(stats.totalTime)}
              />
              <StatItem
                label="DISTANCE"
                value={`${Math.round(nmToMiles(stats.distanceTraveled)).toLocaleString()} MI`}
              />
              <StatItem
                label="MAX ALT"
                value={`${stats.maxAltitude.toLocaleString()} FT`}
              />
              <StatItem
                label="AVG SPEED"
                value={`${Math.round(stats.averageSpeed)} KTS`}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleNewFlight}
              className="flex-1 bg-ife-accent hover:bg-white hover:text-black text-black font-bold font-mono py-4 px-6 transition-colors uppercase tracking-widest border-2 border-ife-accent"
            >
              INITIALIZE NEW PLAN
            </button>
          </div>

          <p className="text-center text-ife-text-dim text-xs font-mono uppercase tracking-widest mt-6 opacity-50">
            End of Record
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="bg-ife-panel/50 border border-ife-border p-4">
      <div className="text-xs text-ife-accent uppercase tracking-widest mb-1 font-mono">
        {label}
      </div>
      <div className="text-xl font-mono font-bold text-white tracking-wider">
        {value}
      </div>
    </div>
  );
}
