import {
  GameConfig, GameSnapshot, GamePhase, PlayerState, PowerupItem
} from './types'
import {
  BASE_SPEED, TURN_RATE, TRAIL_THICKNESS, SPAWN_PADDING,
  COUNTDOWN_SECONDS, PLAYER_COLORS, BOT_NAMES,
  GAP_INTERVAL_MIN, GAP_INTERVAL_MAX, GAP_DURATION_MIN, GAP_DURATION_MAX
} from './constants'
import { checkTrailCollision, checkBorderCollision, checkPowerupPickup } from './Collision'
import { PowerupManager, applyPowerup, tickEffects } from './Powerup'
import { computeBotInput, resetBotState } from './BotAI'

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function createPlayer(
  id: string, name: string, color: string, isBot: boolean,
  difficulty?: 'easy' | 'medium' | 'hard'
): PlayerState {
  return {
    id, name, color, isBot, difficulty,
    x: 0, y: 0, angle: 0,
    speed: BASE_SPEED, baseSpeed: BASE_SPEED,
    thickness: TRAIL_THICKNESS,
    alive: true, score: 0,
    trail: [],
    activeEffects: [],
    isGap: false,
    controlsReversed: false,
    gapTimer: 0,
    nextGapAt: rand(GAP_INTERVAL_MIN, GAP_INTERVAL_MAX),
    gapDuration: rand(GAP_DURATION_MIN, GAP_DURATION_MAX),
    inGapFor: 0,
  }
}

export class GameState {
  players: PlayerState[] = []
  powerupMgr: PowerupManager
  phase: GamePhase = 'countdown'
  round = 1
  countdown = COUNTDOWN_SECONDS
  config: GameConfig
  winnerId?: string

  constructor(config: GameConfig) {
    this.config = config
    this.powerupMgr = new PowerupManager(config.gameMode, config.customPowerups)
    this.initPlayers()
    this.spawnPositions()
  }

  private initPlayers() {
    // Human player
    this.players = [
      createPlayer('human', 'You', PLAYER_COLORS[0], false)
    ]
    // Bots
    for (let i = 0; i < this.config.botCount; i++) {
      this.players.push(
        createPlayer(
          `bot_${i}`,
          BOT_NAMES[i] || `Bot ${i + 1}`,
          PLAYER_COLORS[i + 1] || '#888888',
          true,
          this.config.botDifficulty
        )
      )
    }
  }

  private spawnPositions() {
    const { arenaWidth: w, arenaHeight: h } = this.config
    const pad = SPAWN_PADDING
    const cx = w / 2
    const cy = h / 2

    for (let i = 0; i < this.players.length; i++) {
      const angle = (Math.PI * 2 * i) / this.players.length
      const radius = Math.min(w, h) * 0.3
      const px = cx + Math.cos(angle) * radius
      const py = cy + Math.sin(angle) * radius

      const p = this.players[i]
      p.x = Math.max(pad, Math.min(w - pad, px))
      p.y = Math.max(pad, Math.min(h - pad, py))
      // Face toward center
      p.angle = Math.atan2(cy - p.y, cx - p.x) + rand(-0.3, 0.3)
      p.alive = true
      p.trail = []
      p.speed = BASE_SPEED
      p.baseSpeed = BASE_SPEED
      p.thickness = TRAIL_THICKNESS
      p.activeEffects = []
      p.isGap = false
      p.controlsReversed = false
      p.gapTimer = 0
      p.nextGapAt = rand(GAP_INTERVAL_MIN, GAP_INTERVAL_MAX)
      p.gapDuration = rand(GAP_DURATION_MIN, GAP_DURATION_MAX)
      p.inGapFor = 0
    }
  }

  startRound() {
    this.round++
    this.phase = 'countdown'
    this.countdown = COUNTDOWN_SECONDS
    this.powerupMgr.reset(this.config.gameMode, this.config.customPowerups)
    this.spawnPositions()
    resetBotState()
  }

  reset(config?: GameConfig) {
    if (config) this.config = config
    this.round = 1
    this.winnerId = undefined
    this.players = []
    this.initPlayers()
    this.powerupMgr.reset(this.config.gameMode, this.config.customPowerups)
    this.phase = 'countdown'
    this.countdown = COUNTDOWN_SECONDS
    this.spawnPositions()
    resetBotState()
  }

  tick(dt: number, humanInput: { left: boolean; right: boolean }): GameSnapshot {
    // Cap dt to prevent huge jumps
    dt = Math.min(dt, 50)

    if (this.phase === 'countdown') {
      this.countdown -= dt / 1000
      if (this.countdown <= 0) {
        this.countdown = 0
        this.phase = 'playing'
      }
      return this.getSnapshot()
    }

    if (this.phase !== 'playing') {
      return this.getSnapshot()
    }

    const { arenaWidth: aw, arenaHeight: ah } = this.config

    // Update each alive player
    for (const p of this.players) {
      if (!p.alive) continue

      // Determine input
      let input = { left: false, right: false }
      if (p.isBot) {
        input = computeBotInput(p, this.players, this.powerupMgr.powerups, aw, ah, dt)
      } else {
        input = { ...humanInput }
      }

      // Apply steering (respect reversed controls)
      const steerMult = p.controlsReversed ? -1 : 1
      if (input.left) p.angle -= TURN_RATE * (dt / 1000) * steerMult
      if (input.right) p.angle += TURN_RATE * (dt / 1000) * steerMult

      // Move
      p.x += Math.cos(p.angle) * p.speed * (dt / 1000)
      p.y += Math.sin(p.angle) * p.speed * (dt / 1000)

      // Gap logic
      p.gapTimer += dt
      if (p.isGap) {
        p.inGapFor += dt
        if (p.inGapFor >= p.gapDuration) {
          p.isGap = false
          p.gapTimer = 0
          p.nextGapAt = rand(GAP_INTERVAL_MIN, GAP_INTERVAL_MAX)
          p.gapDuration = rand(GAP_DURATION_MIN, GAP_DURATION_MAX)
          p.inGapFor = 0
        }
      } else if (p.gapTimer >= p.nextGapAt) {
        p.isGap = true
        p.inGapFor = 0
      }

      // Record trail
      p.trail.push({
        x: p.x, y: p.y,
        thickness: p.thickness,
        gap: p.isGap
      })

      // Tick effects
      tickEffects(p, dt)
    }

    // Collision detection (second pass so all positions are updated)
    for (const p of this.players) {
      if (!p.alive) continue

      if (checkBorderCollision(p, aw, ah)) {
        this.killPlayer(p)
        continue
      }
      if (checkTrailCollision(p, this.players)) {
        this.killPlayer(p)
      }
    }

    // Powerup spawning & pickup
    this.powerupMgr.update(dt, aw, ah, this.players)
    for (const p of this.players) {
      if (!p.alive) continue
      const picked = checkPowerupPickup(p, this.powerupMgr.powerups)
      if (picked) {
        applyPowerup(picked.type, p, this.players)
        this.powerupMgr.removePowerup(picked.id)
      }
    }

    // Check round end
    const aliveCount = this.players.filter(p => p.alive).length
    if (aliveCount <= 1) {
      // Award points to survivor
      const survivor = this.players.find(p => p.alive)
      if (survivor) {
        survivor.score += 1
      }
      // Also give points based on survival order (already handled by kill order)

      // Check match end
      const winner = this.players.find(p => p.score >= this.config.targetScore)
      if (winner) {
        this.winnerId = winner.id
        this.phase = 'matchEnd'
      } else {
        this.phase = 'roundEnd'
      }
    }

    return this.getSnapshot()
  }

  private killPlayer(p: PlayerState) {
    p.alive = false
    // Award +1 to all surviving players
    for (const other of this.players) {
      if (other.alive && other.id !== p.id) {
        other.score += 1
      }
    }
  }

  getSnapshot(): GameSnapshot {
    return {
      phase: this.phase,
      players: this.players,
      powerups: this.powerupMgr.powerups,
      round: this.round,
      countdown: Math.ceil(this.countdown),
      winnerId: this.winnerId,
      arenaWidth: this.config.arenaWidth,
      arenaHeight: this.config.arenaHeight,
    }
  }
}
