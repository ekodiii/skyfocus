import useFlightStore from '../../../store/flightStore';

export default function ProgressBar() {
  const { progress } = useFlightStore();
  const percentage = Math.round(progress * 100);

  return (
    <div className="bg-black px-6 py-4">
      <div className="flex items-center gap-4 border border-ife-accent p-2">
        <div className="text-sm text-ife-accent font-bold uppercase tracking-widest min-w-[100px]">
          Flight Progress
        </div>
        <div className="flex-1 bg-ife-panel h-6 border border-ife-accent/50 relative">
          {/* Ticks for runway effect */}
          <div className="absolute inset-0 flex justify-between px-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-full w-px bg-ife-accent/20" />
            ))}
          </div>
          <div
            className="h-full bg-ife-accent transition-all duration-500 ease-linear"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xl font-mono font-bold text-ife-accent min-w-[60px] text-right bg-ife-panel px-2">
          {percentage}%
        </div>
      </div>
    </div>
  );
}
