import { PowerupItem, PowerupType, PlayerState, ActiveEffect, GameMode } from './types'
import {
  POWERUP_RADIUS, POWERUP_SPAWN_MIN, POWERUP_SPAWN_MAX,
  MAX_POWERUPS, EFFECT_DURATIONS, SPEED_MULT, SLOW_MULT,
  THIN_THICKNESS, THICK_THICKNESS, TRAIL_THICKNESS, BASE_SPEED,
  MODE_POWERUPS
} from './constants'

let nextPuId = 0

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export class PowerupManager {
  powerups: PowerupItem[] = []
  private spawnTimer = 0
  private nextSpawnAt: number
  private allowedTypes: PowerupType[]

  constructor(mode: GameMode, customPowerups?: PowerupType[]) {
    this.nextSpawnAt = randomBetween(POWERUP_SPAWN_MIN, POWERUP_SPAWN_MAX)
    if (mode === 'custom' && customPowerups) {
      this.allowedTypes = customPowerups
    } else {
      this.allowedTypes = MODE_POWERUPS[mode] || []
    }
  }

  reset(mode: GameMode, customPowerups?: PowerupType[]) {
    this.powerups = []
    this.spawnTimer = 0
    this.nextSpawnAt = randomBetween(POWERUP_SPAWN_MIN, POWERUP_SPAWN_MAX)
    if (mode === 'custom' && customPowerups) {
      this.allowedTypes = customPowerups
    } else {
      this.allowedTypes = MODE_POWERUPS[mode] || []
    }
  }

  update(dt: number, arenaW: number, arenaH: number, players: PlayerState[]) {
    if (this.allowedTypes.length === 0) return
    this.spawnTimer += dt
    if (this.spawnTimer >= this.nextSpawnAt && this.powerups.length < MAX_POWERUPS) {
      this.spawn(arenaW, arenaH, players)
      this.spawnTimer = 0
      this.nextSpawnAt = randomBetween(POWERUP_SPAWN_MIN, POWERUP_SPAWN_MAX)
    }
  }

  private spawn(arenaW: number, arenaH: number, _players: PlayerState[]) {
    const padding = 40
    const x = padding + Math.random() * (arenaW - padding * 2)
    const y = padding + Math.random() * (arenaH - padding * 2)
    const type = this.allowedTypes[Math.floor(Math.random() * this.allowedTypes.length)]
    this.powerups.push({
      id: `pu_${nextPuId++}`,
      type,
      x, y,
      radius: POWERUP_RADIUS
    })
  }

  removePowerup(id: string) {
    this.powerups = this.powerups.filter(p => p.id !== id)
  }
}

/**
 * Apply a powerup effect to the collecting player (and possibly opponents).
 */
export function applyPowerup(
  type: PowerupType,
  collector: PlayerState,
  allPlayers: PlayerState[]
) {
  const duration = EFFECT_DURATIONS[type]

  switch (type) {
    case 'speed':
      collector.speed = collector.baseSpeed * SPEED_MULT
      collector.activeEffects.push({ type: 'speed', remainingMs: duration })
      break
    case 'slow':
      collector.speed = collector.baseSpeed * SLOW_MULT
      collector.activeEffects.push({ type: 'slow', remainingMs: duration })
      break
    case 'thin':
      collector.thickness = THIN_THICKNESS
      collector.activeEffects.push({ type: 'thin', remainingMs: duration })
      break
    case 'thick':
      // Make all opponents thick
      for (const p of allPlayers) {
        if (p.id !== collector.id && p.alive) {
          p.thickness = THICK_THICKNESS
          p.activeEffects.push({ type: 'thick', remainingMs: duration })
        }
      }
      break
    case 'eraser':
      // Clear a random portion of all trails
      for (const p of allPlayers) {
        const len = p.trail.length
        if (len > 40) {
          const start = Math.floor(Math.random() * (len - 30))
          const count = Math.min(Math.floor(len * 0.3), 200)
          for (let i = start; i < start + count && i < len; i++) {
            p.trail[i].gap = true
          }
        }
      }
      break
    case 'reverse':
      for (const p of allPlayers) {
        if (p.id !== collector.id && p.alive) {
          p.controlsReversed = true
          p.activeEffects.push({ type: 'reverse', remainingMs: duration })
        }
      }
      break
  }
}

/**
 * Tick down effect timers and restore defaults when expired.
 */
export function tickEffects(player: PlayerState, dt: number) {
  player.activeEffects = player.activeEffects.filter(eff => {
    eff.remainingMs -= dt
    if (eff.remainingMs <= 0) {
      // Restore default when effect expires
      switch (eff.type) {
        case 'speed':
        case 'slow':
          // Only reset speed if no other speed/slow effects remain
          player.speed = player.baseSpeed
          break
        case 'thin':
        case 'thick':
          player.thickness = TRAIL_THICKNESS
          break
        case 'reverse':
          player.controlsReversed = false
          break
      }
      return false
    }
    return true
  })
}
