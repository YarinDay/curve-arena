import React from 'react'

interface Props {
  onPlay: () => void
}

export default function MainMenu({ onPlay }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Animated background dots */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#FF4444', '#44FF44', '#4488FF', '#FFFF44', '#FF44FF', '#44FFFF'][i % 6],
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center">
        {/* Title */}
        <h1 className="font-game text-6xl md:text-8xl font-black mb-2 bg-gradient-to-r from-red-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
          CURVE
        </h1>
        <h1 className="font-game text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-red-500 bg-clip-text text-transparent">
          ARENA
        </h1>

        <p className="text-gray-400 text-lg mb-12 max-w-md mx-auto">
          Outlast your opponents. Don't hit the walls. Be the last curve standing.
        </p>

        {/* Play button */}
        <button
          onClick={onPlay}
          className="group relative px-12 py-4 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl font-game text-xl font-bold tracking-wider text-white shadow-lg shadow-red-900/40 hover:shadow-red-600/60 hover:scale-105 transition-all duration-200"
        >
          PLAY
          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Controls hint */}
        <div className="mt-16 text-gray-500 text-sm space-y-1">
          <p>⬅️ ➡️ Arrow keys or A / D to steer</p>
          <p>Space to start next round</p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
      `}</style>
    </div>
  )
}
