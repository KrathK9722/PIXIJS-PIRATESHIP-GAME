import { useState } from 'react'
import './App.css'
import GameScreen from './components/Levels/GameScreen'
import ResultScreen from './components/Levels/ResultScreen'
import OptionsScreen from './components/Levels/OptionsScreen'
import MainMenu from './components/Levels/MainMenu'

type Screen = 'menu' | 'options' | 'game' | 'result'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <main>
      {screen === 'options' && (<OptionsScreen onComeBack={() => setScreen('menu')}/>)}

      {screen === 'menu' && (<MainMenu onStartGame={() => setScreen('game')} onOpenOptions={() => setScreen('options')}/>)}

      {screen === 'game' && (
        <GameScreen
          onMatchEnd={() => setScreen('result')}
          onReturnToMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'result' && <ResultScreen />}
    </main>
  )
}

export default App