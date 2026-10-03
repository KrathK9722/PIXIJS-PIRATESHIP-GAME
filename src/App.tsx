import { useState } from 'react'
import './App.css'
import GameScreen from './components/Levels/GameScreen'
import ResultScreen from './components/Levels/ResultScreen'
import OptionsScreen from './components/Levels/OptionsScreen'
import MainMenu from './components/Levels/MainMenu'
import RankingScreen from './components/Levels/RankingScreen'
import MatchHistoryScreen from './components/Levels/MatchHistoryScreen'
import type { MatchResult } from './types/types'
import { saveLatestResult } from './services/resultStorage'

type Screen = 'menu' | 'options' | 'game' | 'result' | 'ranking' | 'history'

function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [latestResult, setLatestResult] = useState<MatchResult | null>(null)
  const [resultSavedLocally, setResultSavedLocally] = useState(true)

  return (
    <main>
      {screen === 'options' && (<OptionsScreen onComeBack={() => setScreen('menu')}/>)}

      {screen === 'menu' && (
        <MainMenu
          onStartGame={() => setScreen('game')}
          onOpenOptions={() => setScreen('options')}
          onOpenRanking={() => setScreen('ranking')}
          onOpenMatchHistory={() => setScreen('history')}
        />
      )}

      {screen === 'ranking' && (<RankingScreen onComeBack={() => setScreen('menu')}/>)}

      {screen === 'history' && (<MatchHistoryScreen onComeBack={() => setScreen('menu')}/>)}

      {screen === 'game' && (
        <GameScreen
          onMatchEnd={(result) => {
            setResultSavedLocally(saveLatestResult(result))
            setLatestResult(result)
            setScreen('result')
          }}
          onReturnToMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'result' && latestResult !== null && (
        <ResultScreen
          result={latestResult}
          isSavedLocally={resultSavedLocally}
          onPlayAgain={() => setScreen('game')}
          onReturnToMenu={() => setScreen('menu')}
        />
      )}
    </main>
  )
}

export default App
