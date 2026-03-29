import { PowerupType } from './types'

export const BASE_SPEED = 150        // px/s
export const TURN_RATE = 2.8         // rad/s
export const TRAIL_THICKNESS = 3     // px
export const THIN_THICKNESS = 1.5
export const THICK_THICKNESS = 6
export const POWERUP_RADIUS = 12
export const SPEED_MULT = 1.6
export const SLOW_MULT = 0.6
export const GAP_INTERVAL_MIN = 2000  // ms
export const GAP_INTERVAL_MAX = 5000
export const GAP_DURATION_MIN = 150   // ms
export const GAP_DURATION_MAX = 250
export const POWERUP_SPAWN_MIN = 5000
export const POWERUP_SPAWN_MAX = 8000
export const MAX_POWERUPS = 3
export const COUNTDOWN_SECONDS = 3
export const SPAWN_PADDING = 60
export const COLLISION_SKIP_TRAIL = 15  // skip last N trail points for self-collision
export const PICKUP_RADIUS = 15

export const EFFECT_DURATIONS: Record<PowerupType, number> = {
  speed: 3000,
  slow: 3000,
  thin: 4000,
  thick: 4000,
  eraser: 0,    // instant
  reverse: 3000,
}

export const PLAYER_COLORS = [
  '#FF4444', // red (human)
  '#44FF44', // green
  '#4488FF', // blue
  '#FFFF44', // yellow
  '#FF44FF', // magenta
  '#44FFFF', // cyan
]

export const BOT_NAMES = ['Viper', 'Phantom', 'Blaze', 'Storm', 'Shadow']

export const MODE_POWERUPS: Record<string, PowerupType[]> = {
  basic: ['speed', 'slow', 'thin', 'thick', 'eraser', 'reverse'],
  none: [],
  thin: ['thin'],
  speed: ['speed', 'eraser'],
}
