import { PlayerState, PowerupItem, Difficulty } from './types'
import { raycast } from './Collision'
import { TURN_RATE } from './constants'

interface BotDecision {
  left: boolean
  right: boolean
}

const LOOK_AHEAD: Record<Difficulty, number> = {
  easy: 80,
  medium: 150,
  hard: 250,
}

const RAY_COUNT: Record<Difficulty, number> = {
  easy: 3,
  medium: 7,
  hard: 13,
}

const REACTION_DELAY: Record<Difficulty, number> = {
  easy: 200,
  medium: 100,
  hard: 40,
}

// Internal state for reaction delay
const botTimers: Map<string, number> = new Map()
const botLastDecision: Map<string, BotDecision> = new Map()

export function resetBotState() {
  botTimers.clear()
  botLastDecision.clear()
}

export function computeBotInput(
  bot: PlayerState,
  allPlayers: PlayerState[],
  powerups: PowerupItem[],
  arenaW: number,
  arenaH: number,
  dt: number
): BotDecision {
  const diff = bot.difficulty || 'medium'

  // Reaction delay
  const timer = (botTimers.get(bot.id) || 0) + dt
  const delay = REACTION_DELAY[diff]
  if (timer < delay) {
    botTimers.set(bot.id, timer)
    return botLastDecision.get(bot.id) || { left: false, right: false }
  }
  botTimers.set(bot.id, 0)

  const lookAhead = LOOK_AHEAD[diff]
  const numRays = RAY_COUNT[diff]
  const spreadAngle = Math.PI * 0.8 // total spread

  // Cast rays in a fan and score each direction
  let bestScore = -Infinity
  let bestAngleOffset = 0

  for (let i = 0; i < numRays; i++) {
    const t = numRays === 1 ? 0 : (i / (numRays - 1)) - 0.5 // -0.5 to 0.5
    const angleOffset = t * spreadAngle
    const rayAngle = bot.angle + angleOffset

    const dist = raycast(
      bot.x, bot.y, rayAngle, lookAhead,
      allPlayers, arenaW, arenaH, bot.id
    )

    // Score: prefer directions with more open space
    let score = dist

    // Slight preference for going straight
    score -= Math.abs(angleOffset) * 15

    // Medium+: seek powerups
    if (diff !== 'easy' && powerups.length > 0) {
      for (const pu of powerups) {
        const toPuAngle = Math.atan2(pu.y - bot.y, pu.x - bot.x)
        let angleDiff = toPuAngle - rayAngle
        // Normalize
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        const puDist = Math.hypot(pu.x - bot.x, pu.y - bot.y)
        if (Math.abs(angleDiff) < 0.5 && puDist < lookAhead * 1.5) {
          score += (lookAhead - puDist) * 0.4
        }
      }
    }

    // Hard: try to cut off opponents
    if (diff === 'hard') {
      for (const p of allPlayers) {
        if (p.id === bot.id || !p.alive) continue
        const toOppAngle = Math.atan2(p.y - bot.y, p.x - bot.x)
        let angleDiff = toOppAngle - rayAngle
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
        const oppDist = Math.hypot(p.x - bot.x, p.y - bot.y)
        // Only approach if we have safe space
        if (Math.abs(angleDiff) < 0.3 && oppDist < lookAhead && dist > oppDist * 0.8) {
          score += 25
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestAngleOffset = angleOffset
    }
  }

  // Emergency: if best score is very low, take sharpest turn away from danger
  const decision: BotDecision = { left: false, right: false }

  // Determine turn direction
  const turnThreshold = 0.08
  if (bestAngleOffset < -turnThreshold) {
    // Account for reversed controls
    if (bot.controlsReversed) {
      decision.left = true
    } else {
      decision.right = true
    }
  } else if (bestAngleOffset > turnThreshold) {
    if (bot.controlsReversed) {
      decision.right = true
    } else {
      decision.left = true
    }
  }

  // Emergency wall avoidance — always active
  const emergencyDist = 20
  const fwdDist = raycast(bot.x, bot.y, bot.angle, emergencyDist + 10, allPlayers, arenaW, arenaH, bot.id)
  if (fwdDist < emergencyDist) {
    // Check left and right
    const leftDist = raycast(bot.x, bot.y, bot.angle - 0.5, lookAhead * 0.5, allPlayers, arenaW, arenaH, bot.id)
    const rightDist = raycast(bot.x, bot.y, bot.angle + 0.5, lookAhead * 0.5, allPlayers, arenaW, arenaH, bot.id)
    decision.left = leftDist > rightDist
    decision.right = !decision.left
    if (bot.controlsReversed) {
      const tmp = decision.left
      decision.left = decision.right
      decision.right = tmp
    }
  }

  botLastDecision.set(bot.id, decision)
  return decision
}
