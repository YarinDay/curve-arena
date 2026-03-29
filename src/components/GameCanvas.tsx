import React, { useRef, useEffect, useCallback, useState } from 'react'
import { GameState } from '../engine/GameState'
import { GameConfig, GameSnapshot, PowerupType } from '../engine/types'
import HUD from './HUD'

interface Props {
  config: GameConfig
  onMainMenu: () => void
}

const POWERUP_COLORS: Record<PowerupType, string> = {
  speed: '#44FF44',
  slow: '#4488FF',
  thin: '#FFFFFF',
  thick: '#FF8800',
  eraser: '#FF4444',
  reverse: '#AA44FF',
}

const POWERUP_LABELS: Record<PowerupType, string> = {
  speed: '⚡', slow: '🐢', thin: '—', thick: '█', eraser: '✕', reverse: '↺',
}

export default function GameCanvas({ config, onMainMenu }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameState | null>(null)
  const keysRef = useRef({ left: false, right: false })
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Initialize game
  useEffect(() => {
    gameRef.current = new GameState(config)
    setSnapshot(gameRef.current.getSnapshot())
  }, [config])

  // Keyboard handlers
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true

      // Space to advance rounds
      if (e.key === ' ') {
        const game = gameRef.current
        if (!game) return
        if (game.phase === 'roundEnd') {
          game.startRound()
        } else if (game.phase === 'matchEnd') {
          // Do nothing, show match end screen
        }
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Render function
  const render = useCallback((ctx: CanvasRenderingContext2D, snap: GameSnapshot) => {
    const { arenaWidth: aw, arenaHeight: ah } = snap
    const canvas = ctx.canvas

    // Calculate scale to fit canvas
    const scaleX = canvas.width / aw
    const scaleY = canvas.height / ah
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (canvas.width - aw * scale) / 2
    const offsetY = (canvas.height - ah * scale) / 2

    // Clear
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // Arena background
    ctx.fillStyle = '#111111'
    ctx.fillRect(0, 0, aw, ah)

    // Arena border
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, aw - 3, ah - 3)

    // Grid (subtle)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 0.5
    const gridSize = 50
    for (let x = gridSize; x < aw; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ah); ctx.stroke()
    }
    for (let y = gridSize; y < ah; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(aw, y); ctx.stroke()
    }

    // Draw trails
    for (const player of snap.players) {
      const trail = player.trail
      if (trail.length < 2) continue

      for (let i = 0; i < trail.length - 1; i++) {
        const a = trail[i]
        const b = trail[i + 1]
        if (a.gap || b.gap) continue

        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = player.color
        ctx.lineWidth = (a.thickness + b.thickness) / 2
        ctx.lineCap = 'round'
        ctx.stroke()
      }
    }

    // Draw player heads (glowing dots)
    for (const player of snap.players) {
      if (!player.alive) continue

      // Glow
      const gradient = ctx.createRadialGradient(
        player.x, player.y, 0,
        player.x, player.y, 12
      )
      gradient.addColorStop(0, player.color + '80')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(player.x, player.y, 12, 0, Math.PI * 2)
      ctx.fill()

      // Head dot
      ctx.fillStyle = player.color
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.thickness + 1, 0, Math.PI * 2)
      ctx.fill()

      // White center
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(player.x, player.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw powerups
    for (const pu of snap.powerups) {
      const color = POWERUP_COLORS[pu.type]

      // Outer glow
      const gradient = ctx.createRadialGradient(pu.x, pu.y, 0, pu.x, pu.y, pu.radius * 2)
      gradient.addColorStop(0, color + '40')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, pu.radius * 2, 0, Math.PI * 2)
      ctx.fill()

      // Circle
      ctx.fillStyle = color + '30'
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Icon
      ctx.fillStyle = color
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(POWERUP_LABELS[pu.type], pu.x, pu.y)
    }

    // Countdown overlay
    if (snap.phase === 'countdown' && snap.countdown > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, aw, ah)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 80px Orbitron, monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(snap.countdown.toString(), aw / 2, ah / 2)
    }

    ctx.restore()
  }, [])

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time
      const dt = time - lastTimeRef.current
      lastTimeRef.current = time

      const game = gameRef.current
      if (game && game.phase !== 'matchEnd') {
        const snap = game.tick(dt, keysRef.current)
        setSnapshot(snap)
        render(ctx, snap)
      } else if (game) {
        const snap = game.getSnapshot()
        render(ctx, snap)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [render])

  // Overlays
  const isRoundEnd = snapshot?.phase === 'roundEnd'
  const isMatchEnd = snapshot?.phase === 'matchEnd'
  const winner = snapshot?.players.find(p => p.id === snapshot?.winnerId)

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {snapshot && <HUD snapshot={snapshot} />}

      {/* Round End overlay */}
      {isRoundEnd && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 text-center max-w-sm">
            <h2 className="font-game text-2xl text-white mb-4">Round Over</h2>
            <div className="space-y-2 mb-6">
              {[...snapshot!.players].sort((a, b) => b.score - a.score).map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/80">{p.name}</span>
                  </div>
                  <span className="font-game font-bold" style={{ color: p.color }}>{p.score}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-sm">Press SPACE for next round</p>
          </div>
        </div>
      )}

      {/* Match End overlay */}
      {isMatchEnd && winner && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="bg-black/85 backdrop-blur-md rounded-2xl p-10 text-center max-w-md">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="font-game text-3xl font-bold mb-2" style={{ color: winner.color }}>
              {winner.name} WINS!
            </h2>
            <p className="text-gray-400 mb-6">Final score: {winner.score}</p>

            <div className="space-y-2 mb-8">
              {[...snapshot!.players].sort((a, b) => b.score - a.score).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm w-5">#{i + 1}</span>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/80">{p.name}</span>
                  </div>
                  <span className="font-game font-bold" style={{ color: p.color }}>{p.score}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  gameRef.current?.reset()
                  lastTimeRef.current = 0
                }}
                className="flex-1 py-3 rounded-xl font-game font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white hover:scale-105 transition-all"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onMainMenu}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
