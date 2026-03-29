import React, { useState } from 'react'
import { Difficulty, GameMode, GameConfig } from '../engine/types'

interface Props {
  onStart: (config: GameConfig) => void
  onBack: () => void
}

const ARENA_BASE_W = 800
const ARENA_BASE_H = 600

export default function GameSetup({ onStart, onBack }: Props) {
  const [botCount, setBotCount] = useState(3)
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameMode, setGameMode] = useState<GameMode>('basic')
  const [targetScore, setTargetScore] = useState(10)

  const handleStart = () => {
    const scale = 1 + (botCount - 1) * 0.15
    onStart({
      arenaWidth: Math.round(ARENA_BASE_W * scale),
      arenaHeight: Math.round(ARENA_BASE_H * scale),
      botCount,
      botDifficulty: difficulty,
      gameMode,
      targetScore,
    })
  }

  const optionBtn = (active: boolean) =>
    `px-4 py-2 rounded-lg font-medium text-sm transition-all ${
      active
        ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
    }`

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <h2 className="font-game text-3xl font-bold text-center bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
          GAME SETUP
        </h2>

        {/* Bot Count */}
        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Opponents</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setBotCount(n)} className={optionBtn(botCount === n)}>
                {n} Bot{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Bot Difficulty</label>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={optionBtn(difficulty === d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Game Mode</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['basic', 'All Powerups'],
              ['none', 'No Powerups'],
              ['thin', 'Thin Only'],
              ['speed', 'Speed + Eraser'],
            ] as [GameMode, string][]).map(([mode, label]) => (
              <button key={mode} onClick={() => setGameMode(mode)} className={optionBtn(gameMode === mode)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Target Score */}
        <div>
          <label className="text-gray-400 text-sm font-medium mb-2 block">Target Score</label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map(s => (
              <button key={s} onClick={() => setTargetScore(s)} className={optionBtn(targetScore === s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
          >
            Back
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl font-game font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-900/30 hover:shadow-red-600/50 hover:scale-105 transition-all"
          >
            START
          </button>
        </div>
      </div>
    </div>
  )
}
