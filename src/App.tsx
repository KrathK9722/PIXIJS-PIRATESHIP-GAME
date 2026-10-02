import { useState } from 'react'
import './App.css'
import GameScreen from './screens/GameScreen'
import ResultScreen from './screens/ResultScreen'
import OptionsScreen from './screens/OptionsScreen'
import MainMenu from './screens/MainMenu'

type Screen = 'menu' | 'options' | 'game' | 'result'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')

  return (
    <main>
      {screen === 'options' && (<OptionsScreen onComeBack={() => setScreen('menu')}/>)}

      {screen === 'menu' && (<MainMenu onStartGame={() => setScreen('game')} onOpenOptions={() => setScreen('options')}/>)}

      {screen === 'game' && <GameScreen />}

      {screen === 'result' && <ResultScreen />}
    </main>
  )
}

export default App