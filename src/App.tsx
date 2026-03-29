import React, { useState } from 'react'
import MainMenu from './components/MainMenu'
import GameSetup from './components/GameSetup'
import GameCanvas from './components/GameCanvas'
import { GameConfig } from './engine/types'

type Screen = 'menu' | 'setup' | 'game'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)

  if (screen === 'menu') {
    return <MainMenu onPlay={() => setScreen('setup')} />
  }

  if (screen === 'setup') {
    return (
      <GameSetup
        onStart={(config) => {
          setGameConfig(config)
          setScreen('game')
        }}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'game' && gameConfig) {
    return (
      <GameCanvas
        key={JSON.stringify(gameConfig)}
        config={gameConfig}
        onMainMenu={() => setScreen('menu')}
      />
    )
  }

  return null
}
