import { useMemo } from 'react';

export default function AttitudeIndicator({ pitch, bank, size = 150 }) {
    // Pitch scale: ~2.5 pixels per degree
    const pitchScale = 2.5;
    const pitchOffset = (pitch || 0) * pitchScale;
    const bankRotation = -(bank || 0); // Rotate opposite to bank for horizon

    const radius = size / 2;
    const innerRadius = radius - 10;

    return (
        <div
            className="relative overflow-hidden rounded-full border-4 border-gray-800 bg-gray-900 shadow-lg"
            style={{ width: size, height: size }}
        >
            {/* Rotating Horizon Group */}
            <div
                className="absolute inset-0 transition-transform duration-100 ease-out will-change-transform"
                style={{
                    transform: `rotate(${bankRotation}deg)`
                }}
            >
                {/* Sky */}
                <div
                    className="absolute left-[-50%] right-[-50%] top-[-150%] bottom-[50%] bg-sky-500"
                    style={{ transform: `translateY(${pitchOffset}px)` }}
                />

                {/* Ground */}
                <div
                    className="absolute left-[-50%] right-[-50%] top-[50%] bottom-[-150%] bg-[#8B4513]" // SaddleBrown
                    style={{ transform: `translateY(${pitchOffset}px)` }}
                />

                {/* Horizon Line */}
                <div
                    className="absolute left-[-50%] right-[-50%] top-[50%] h-0.5 bg-white shadow-sm"
                    style={{ transform: `translateY(${pitchOffset}px)` }}
                />

                {/* Pitch Ladder Lines (Simplified) */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    style={{ transform: `translateY(${pitchOffset}px)` }}
                >
                    {/* +10 deg */}
                    <div className="w-12 h-px bg-white/50 mb-[25px]" />
                    {/* +20 deg */}
                    <div className="w-8 h-px bg-white/50 mb-[25px]" />

                    <div className="h-0.5 w-0" /> {/* Center spacer */}

                    {/* -10 deg */}
                    <div className="w-12 h-px bg-white/50 mt-[25px]" />
                    {/* -20 deg */}
                    <div className="w-8 h-px bg-white/50 mt-[25px]" />
                </div>
            </div>

            {/* Fixed Aircraft Symbol (Orange V) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Wings */}
                <div className="w-24 h-1 bg-yellow-400 rounded-full border border-black/50" />
                {/* Center Dot */}
                <div className="absolute w-2 h-2 bg-yellow-400 rounded-full border border-black/50" />
            </div>

            {/* Glass Reflection effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

            {/* Label */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-[10px] font-mono font-bold text-yellow-500 bg-black/50 px-1 rounded">ATTITUDE</span>
            </div>
        </div>
    );
}
