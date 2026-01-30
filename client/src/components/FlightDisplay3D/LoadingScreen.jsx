import useFlightStore from '../../store/flightStore';

export default function LoadingScreen() {
  const { isLoadingTiles, destinationAirport } = useFlightStore();

  if (!isLoadingTiles) return null;

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-ife-accent"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">
          Loading Flight Data
        </h2>
        {destinationAirport && (
          <p className="text-ife-text-dim uppercase tracking-wide text-sm mb-4">
            Preparing tiles for {destinationAirport.name} ({destinationAirport.iata})
          </p>
        )}
        <p className="text-ife-text-dim font-mono text-xs animate-pulse">
          Loading high-resolution satellite imagery...
        </p>
      </div>
    </div>
  );
}

