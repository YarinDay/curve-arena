import React from 'react'
import { GameSnapshot, PowerupType } from '../engine/types'

interface Props {
  snapshot: GameSnapshot
}

const POWERUP_ICONS: Record<PowerupType, string> = {
  speed: '⚡',
  slow: '🐢',
  thin: '📏',
  thick: '🔶',
  eraser: '🧹',
  reverse: '🔄',
}

const POWERUP_COLORS: Record<PowerupType, string> = {
  speed: '#44FF44',
  slow: '#4488FF',
  thin: '#FFFFFF',
  thick: '#FF8800',
  eraser: '#FF4444',
  reverse: '#AA44FF',
}

export default function HUD({ snapshot }: Props) {
  const human = snapshot.players.find(p => !p.isBot)

  // Sort players by score descending
  const sorted = [...snapshot.players].sort((a, b) => b.score - a.score)

  return (
    <>
      {/* Scoreboard - top center */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {sorted.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm font-medium
              ${p.alive ? 'bg-black/50' : 'bg-black/30 opacity-50'}`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }}
            />
            <span className="text-white/90">{p.name}</span>
            <span className="font-game text-base font-bold" style={{ color: p.color }}>
              {p.score}
            </span>
            {!p.alive && <span className="text-red-400 text-xs">💀</span>}
          </div>
        ))}
      </div>

      {/* Round indicator */}
      <div className="absolute top-3 right-4 z-10 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-gray-400 text-xs">ROUND</span>
        <span className="font-game text-white font-bold ml-2">{snapshot.round}</span>
      </div>

      {/* Active effects on human player - bottom center */}
      {human && human.activeEffects.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {human.activeEffects.map((eff, i) => (
            <div
              key={`${eff.type}-${i}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-sm"
              style={{ borderLeft: `3px solid ${POWERUP_COLORS[eff.type]}` }}
            >
              <span>{POWERUP_ICONS[eff.type]}</span>
              <span className="text-white/80">{(eff.remainingMs / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
