import { PlayerState, PowerupItem, TrailPoint } from './types'
import { COLLISION_SKIP_TRAIL, PICKUP_RADIUS } from './constants'

/**
 * Distance from point P to line segment AB
 */
function pointSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/**
 * Check if a player head collides with any trail segments.
 * Returns true if collision detected.
 */
export function checkTrailCollision(
  player: PlayerState,
  allPlayers: PlayerState[]
): boolean {
  const px = player.x
  const py = player.y

  for (const other of allPlayers) {
    if (!other.alive && other.trail.length === 0) continue
    const trail = other.trail
    const skipLast = other.id === player.id ? COLLISION_SKIP_TRAIL : 0

    const end = trail.length - 1 - skipLast
    for (let i = 0; i < end; i++) {
      const a = trail[i]
      const b = trail[i + 1]
      // Skip gap segments
      if (a.gap || b.gap) continue
      const halfThick = (a.thickness + b.thickness) / 4 + player.thickness / 2
      const dist = pointSegDist(px, py, a.x, a.y, b.x, b.y)
      if (dist < halfThick) return true
    }
  }
  return false
}

/**
 * Check if player head hits the arena border.
 */
export function checkBorderCollision(
  player: PlayerState,
  arenaW: number,
  arenaH: number
): boolean {
  const margin = player.thickness / 2
  return (
    player.x < margin ||
    player.x > arenaW - margin ||
    player.y < margin ||
    player.y > arenaH - margin
  )
}

/**
 * Check if player picks up any powerup. Returns picked up powerup or null.
 */
export function checkPowerupPickup(
  player: PlayerState,
  powerups: PowerupItem[]
): PowerupItem | null {
  for (const pu of powerups) {
    const dist = Math.hypot(player.x - pu.x, player.y - pu.y)
    if (dist < PICKUP_RADIUS + pu.radius) return pu
  }
  return null
}

/**
 * Raycast from a point in a direction, return distance to first collision with trails or walls.
 */
export function raycast(
  ox: number, oy: number, angle: number,
  maxDist: number,
  players: PlayerState[],
  arenaW: number, arenaH: number,
  selfId?: string
): number {
  const step = 4
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  for (let d = step; d <= maxDist; d += step) {
    const px = ox + cos * d
    const py = oy + sin * d

    // Border check
    if (px < 2 || px > arenaW - 2 || py < 2 || py > arenaH - 2) return d

    // Trail check (simplified: point-in-thick-trail)
    for (const p of players) {
      const trail = p.trail
      const skipLast = p.id === selfId ? COLLISION_SKIP_TRAIL + 5 : 0
      const end = trail.length - 1 - skipLast
      for (let i = Math.max(0, end - 600); i < end; i++) {
        const a = trail[i]
        const b = trail[i + 1]
        if (a.gap || b.gap) continue
        const halfThick = (a.thickness + b.thickness) / 4 + 1
        const dist = pointSegDist(px, py, a.x, a.y, b.x, b.y)
        if (dist < halfThick) return d
      }
    }
  }
  return maxDist
}
