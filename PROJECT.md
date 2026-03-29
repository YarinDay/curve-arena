# Curve Arena — Project Spec

## Overview
A browser-based "Achtung, die Kurve!" / Curve Fever style game. Single-player vs AI bots. Built as a pure frontend app (no backend server needed).

## Tech Stack
- React 18 + Vite + TypeScript
- HTML5 Canvas for game rendering
- TailwindCSS for UI/menus
- No backend — all game logic runs client-side

## Architecture
Two modules:
1. **Game Engine** (`src/engine/`) — Pure TypeScript, no DOM dependencies. Handles game state, physics, collision, bot AI, powerups, scoring.
2. **UI/Renderer** (`src/components/` + `src/App.tsx`) — React app with Canvas rendering, menus, HUD, settings.

## Game Mechanics

### Core
- Players/bots are **curves** that continuously move forward at a base speed
- Steering: left/right input turns the curve (smooth turning, not grid-based)
- Each curve leaves a **trail** (wall) behind it as it moves
- **Gaps**: Small random gaps appear in trails periodically (classic mechanic — trail briefly stops drawing, creating passable openings)
- **Collision**: Hitting any trail, arena border, or another curve = elimination
- **Last alive wins** the round, scores a point
- Match = multiple rounds; first to target score wins

### Arena
- Rectangular arena with solid border walls
- Size scales with player count (bigger arena for more players)
- Dark background with colored trails for visibility

### Players & Bots
- 2-6 total players/bots per game
- Human player: Arrow keys (left/right) or A/D
- Bots: 3 difficulty levels
  - **Easy**: Slow reaction, basic wall avoidance
  - **Medium**: Decent pathfinding, avoids dead-ends, picks up powerups
  - **Hard**: Fast reaction, strategic play, cuts off opponents, efficient powerup usage
- Each player/bot gets a unique color and name

### Powerups
Powerups spawn randomly on the arena. Drive over one to pick it up.

| Powerup | Effect | Duration |
|---------|--------|----------|
| **Speed** (green) | Increases YOUR speed | 3s |
| **Slow** (blue) | Decreases YOUR speed (advantage — tighter control) | 3s |
| **Thin** (white) | Makes YOUR trail thinner (easier to squeeze through gaps) | 4s |
| **Thick** (orange) | Makes OPPONENTS' trails thicker | 4s |
| **Eraser** (red) | Clears a portion of ALL trails on the map | Instant |
| **Reverse** (purple) | Reverses OPPONENTS' left/right controls | 3s |

- Max 3 powerups on field at once
- New powerup spawns every 5-8 seconds (random)
- Powerups spawn at random positions (not on trails)

### Game Modes
- **Basic**: All powerups enabled (default)
- **None/Pure**: No powerups, pure driving skill
- **Thin**: Only thin powerup spawns
- **Speed**: Only speed + eraser powerups
- **Custom**: Player picks which powerups are active

### Scoring
- Round-based: last alive gets points equal to (number of eliminated players)
- Second-to-last gets fewer points, etc.
- Match ends when a player reaches the target score (default: 10)

## Screens / UI Flow
1. **Main Menu**: Title, "Play" button, "Settings" button
2. **Game Setup**: Choose number of bots (1-5), bot difficulty, game mode, target score
3. **Game Screen**: Canvas (game arena), HUD overlay showing:
   - Player names + colors + scores (top of screen)
   - Current round number
   - Active powerup effects on player (bottom of screen)
   - Countdown before round starts (3-2-1-GO)
4. **Round End**: Brief overlay showing round results
5. **Match End**: Winner announcement, "Play Again" / "Main Menu" buttons

## Color Palette
- Player: #FF4444 (red)
- Bot colors cycle: #44FF44 (green), #4444FF (blue), #FFFF44 (yellow), #FF44FF (magenta), #44FFFF (cyan)
- Arena background: #111111
- Arena border: #333333
- HUD: Semi-transparent dark overlay with white text

## File Structure
```
curve-arena/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── engine/
│   │   ├── types.ts          — All shared types/interfaces
│   │   ├── constants.ts      — Game constants (speeds, sizes, timings)
│   │   ├── GameState.ts      — Core game state manager
│   │   ├── Player.ts         — Player/curve entity
│   │   ├── BotAI.ts          — Bot intelligence
│   │   ├── Collision.ts      — Collision detection
│   │   ├── Powerup.ts        — Powerup spawning & effects
│   │   └── index.ts          — Engine barrel export
│   ├── components/
│   │   ├── MainMenu.tsx
│   │   ├── GameSetup.tsx
│   │   ├── GameCanvas.tsx     — Canvas rendering + game loop
│   │   ├── HUD.tsx
│   │   ├── RoundEnd.tsx
│   │   ├── MatchEnd.tsx
│   │   └── index.ts
│   └── assets/
└── PROJECT.md
```

## Engine Interface (API Contract)

### types.ts
```typescript
export interface Point { x: number; y: number; }
export interface Segment { from: Point; to: Point; thickness: number; }

export type PowerupType = 'speed' | 'slow' | 'thin' | 'thick' | 'eraser' | 'reverse';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'basic' | 'none' | 'thin' | 'speed' | 'custom';
export type GamePhase = 'countdown' | 'playing' | 'roundEnd' | 'matchEnd';

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  angle: number;           // radians
  speed: number;
  thickness: number;
  alive: boolean;
  score: number;
  trail: Segment[];
  isBot: boolean;
  difficulty?: Difficulty;
  activeEffects: ActiveEffect[];
  isGap: boolean;          // currently in a gap (not drawing trail)
  controlsReversed: boolean;
}

export interface ActiveEffect {
  type: PowerupType;
  remainingMs: number;
}

export interface PowerupItem {
  id: string;
  type: PowerupType;
  x: number;
  y: number;
  radius: number;
}

export interface GameConfig {
  arenaWidth: number;
  arenaHeight: number;
  playerCount: number;    // always 1 human
  botCount: number;       // 1-5
  botDifficulty: Difficulty;
  gameMode: GameMode;
  customPowerups?: PowerupType[];
  targetScore: number;
}

export interface GameSnapshot {
  phase: GamePhase;
  players: PlayerState[];
  powerups: PowerupItem[];
  round: number;
  countdown: number;       // seconds remaining in countdown, 0 if playing
  winnerId?: string;       // set when matchEnd
}
```

### GameState.ts — Key Methods
```typescript
class GameState {
  constructor(config: GameConfig);
  
  // Call every frame with deltaTime in ms
  tick(dt: number, humanInput: { left: boolean; right: boolean }): GameSnapshot;
  
  // Start a new round (resets positions, keeps scores)
  startRound(): void;
  
  // Get current snapshot without advancing
  getSnapshot(): GameSnapshot;
  
  // Reset entire match
  reset(config?: GameConfig): void;
}
```

The frontend renders `GameSnapshot` every frame onto the Canvas and passes keyboard input to `tick()`.
