import { useState, useEffect } from 'react';
import { fetchRoutesForDuration, fetchAirport } from '../../api/client';
import useFlightStore from '../../store/flightStore';
import { formatDuration } from '../../utils/timeUtils';
import { nmToMiles } from '../../utils/flightMath';
import LoadingScreen from '../FlightDisplay3D/LoadingScreen';

export default function RouteList() {
  const { selectedAirport, selectedDuration, setSelectedRoute, setScreen, setLoadingTiles } = useFlightStore();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRoutesForDuration(selectedAirport.icao, selectedDuration);
      setRoutes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoute = async (route) => {
    try {
      // Show loading screen
      setLoadingTiles(true);
      
      // Fetch full airport details for destination
      const destAirport = await fetchAirport(route.to);
      const originAirport = await fetchAirport(route.from);

      // Select best runways (longest)
      const departureRunway = originAirport.runways?.sort((a, b) => b.length - a.length)[0];
      const arrivalRunway = destAirport.runways?.sort((a, b) => b.length - a.length)[0];

      setSelectedRoute(route, destAirport, departureRunway, arrivalRunway);
      
      // Wait a bit for tiles to start loading, then switch to in-flight screen
      // The Earth component will handle the actual tile loading
      setTimeout(() => {
        setLoadingTiles(false);
        setScreen('in-flight');
      }, 1500); // Give tiles time to start loading
    } catch (err) {
      console.error('Error selecting route:', err);
      setLoadingTiles(false);
      alert('Failed to load flight details');
    }
  };

  const handleBack = () => {
    setScreen('duration-selection');
  };

  return (
    <>
      <LoadingScreen />
      <div className="min-h-screen bg-ife-bg flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-black border-2 border-ife-accent p-6 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <button
            onClick={handleBack}
            className="text-ife-text-dim hover:text-ife-accent mb-4 flex items-center gap-2 uppercase tracking-wider text-sm font-bold"
          >
            ← Back
          </button>

          <div className="mb-6 border-b border-ife-accent/30 pb-4">
            <h2 className="text-2xl font-bold mb-2 uppercase tracking-wide text-white">Available Flights</h2>
            <p className="text-ife-text-dim uppercase tracking-wider text-sm">
              FROM <span className="text-ife-accent">{selectedAirport?.iata}</span> • <span className="text-white">{formatDuration(selectedDuration)}</span> SESSION
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-ife-text-dim font-mono animate-pulse uppercase">
              SCANNING FLIGHT PATHS...
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border-2 border-red-700 p-4 text-red-300">
              <p className="font-bold mb-2 uppercase">No flights found</p>
              <p className="text-sm font-mono">{error}</p>
              <button
                onClick={handleBack}
                className="mt-4 text-sm underline hover:no-underline uppercase"
              >
                Try a different duration
              </button>
            </div>
          ) : routes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-ife-text-dim mb-4 uppercase">
                No flights found for this duration from {selectedAirport?.iata}
              </p>
              <button
                onClick={handleBack}
                className="text-ife-accent hover:underline uppercase font-bold"
              >
                Try a different duration
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
              {routes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectRoute(route)}
                  className="w-full text-left bg-black hover:bg-ife-accent hover:text-black border border-ife-border p-4 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="font-mono font-bold text-xl text-ife-accent group-hover:text-black">
                          {selectedAirport.iata}
                        </span>
                        <span className="text-ife-text-dim group-hover:text-black/50">→</span>
                        <span className="font-mono font-bold text-xl text-ife-accent group-hover:text-black">
                          {route.destination.iata}
                        </span>
                      </div>
                      <div className="text-ife-text font-bold uppercase tracking-wide group-hover:text-black">
                        {route.destination.name}
                      </div>
                      <div className="text-sm text-ife-text-dim mt-1 uppercase group-hover:text-black/70">
                        {route.destination.city}, {route.destination.country}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-ife-text font-bold font-mono text-lg group-hover:text-black">
                        {formatDuration(route.time)}
                      </div>
                      <div className="text-sm text-ife-text-dim mt-1 font-mono group-hover:text-black/70">
                        {Math.round(nmToMiles(route.distance))} MI
                      </div>
                      <div className="text-xs text-ife-accent mt-2 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold group-hover:text-black">
                        Select →
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {routes.length > 0 && (
          <p className="text-center text-ife-text-dim text-sm mt-4">
            Select a flight to begin your study session
          </p>
        )}
      </div>
    </div>
    </>
  );
}
