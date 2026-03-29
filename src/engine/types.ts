export interface Point { x: number; y: number }

export interface TrailPoint {
  x: number
  y: number
  thickness: number
  gap: boolean  // true = not drawn (passable)
}

export type PowerupType = 'speed' | 'slow' | 'thin' | 'thick' | 'eraser' | 'reverse'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type GameMode = 'basic' | 'none' | 'thin' | 'speed' | 'custom'
export type GamePhase = 'countdown' | 'playing' | 'roundEnd' | 'matchEnd'

export interface ActiveEffect {
  type: PowerupType
  remainingMs: number
}

export interface PlayerState {
  id: string
  name: string
  color: string
  x: number
  y: number
  angle: number
  speed: number
  baseSpeed: number
  thickness: number
  alive: boolean
  score: number
  trail: TrailPoint[]
  isBot: boolean
  difficulty?: Difficulty
  activeEffects: ActiveEffect[]
  isGap: boolean
  controlsReversed: boolean
  // internal gap timing
  gapTimer: number
  nextGapAt: number
  gapDuration: number
  inGapFor: number
}

export interface PowerupItem {
  id: string
  type: PowerupType
  x: number
  y: number
  radius: number
}

export interface GameConfig {
  arenaWidth: number
  arenaHeight: number
  botCount: number
  botDifficulty: Difficulty
  gameMode: GameMode
  customPowerups?: PowerupType[]
  targetScore: number
}

export interface GameSnapshot {
  phase: GamePhase
  players: PlayerState[]
  powerups: PowerupItem[]
  round: number
  countdown: number
  winnerId?: string
  arenaWidth: number
  arenaHeight: number
}
