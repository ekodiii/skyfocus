import { useState, useEffect, useCallback } from 'react';
import { fetchAirports } from '../../api/client';
import useFlightStore from '../../store/flightStore';

export default function AirportSelector() {
  const [airports, setAirports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { setSelectedAirport, setScreen } = useFlightStore();

  const loadAirports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAirports(search, 50, 0);
      setAirports(data.airports);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAirports();
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [loadAirports]);

  const handleSelect = (airport) => {
    setSelectedAirport(airport);
    setScreen('duration-selection');
  };

  return (
    <div className="min-h-screen bg-ife-bg flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">✈️ SkyFocus</h1>
          <p className="text-ife-text-dim">Study with purpose. Fly with focus.</p>
        </div>

        <div className="bg-black border-2 border-ife-accent p-6 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
          <h2 className="text-xl font-bold uppercase tracking-widest mb-4 text-ife-accent border-b border-ife-accent/30 pb-2">Select Your Home Airport</h2>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by city, airport name, or code..."
            className="w-full bg-black border-2 border-ife-text-dim px-4 py-3 mb-4 text-ife-text focus:outline-none focus:border-ife-accent transition-colors font-mono uppercase placeholder-ife-text-dim/50"
            autoFocus
          />

          {error && (
            <div className="bg-red-900/20 border-2 border-red-700 p-3 mb-4 text-red-300 font-bold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8 text-ife-text-dim font-mono animate-pulse">
              LOADING AIRPORT DATA...
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {airports.length === 0 ? (
                <div className="text-center py-8 text-ife-text-dim uppercase">
                  No airports found. Try a different search.
                </div>
              ) : (
                <div className="space-y-2">
                  {airports.map((airport) => (
                    <button
                      key={airport.icao}
                      onClick={() => handleSelect(airport)}
                      className="w-full text-left bg-black hover:bg-ife-accent hover:text-black border border-ife-border p-4 transition-colors group flex justify-between items-start"
                    >
                      <div>
                        <div className="font-bold text-ife-text group-hover:text-black transition-colors uppercase tracking-wide">
                          {airport.name}
                        </div>
                        <div className="text-sm text-ife-text-dim group-hover:text-black/70 mt-1 uppercase">
                          {airport.city}, {airport.country}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-ife-accent font-bold text-xl group-hover:text-black">
                          {airport.iata}
                        </div>
                        <div className="text-xs text-ife-text-dim font-mono mt-1 group-hover:text-black/70">
                          {airport.icao}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-ife-text-dim text-sm mt-4">
          Data from OurAirports & OpenFlights
        </p>
      </div>
    </div>
  );
}
