import PixiGame from '../Experience/PixiGame'
import './GameScreen.css'
import {useState } from 'react'
import {loadOptions} from '../../services/optionsStorage'
import { formatTime } from '../Experience/config/time'
import OptionsScreen from './OptionsScreen'

type GameScreenProps = {
  onMatchEnd: () => void
  onReturnToMenu: () => void
}

function GameScreen(props: GameScreenProps) {
  const [matchOptions] = useState(loadOptions)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseOptionsOpen, setPauseOptionsOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(
    matchOptions.matchDurationSeconds,
  )

  return (
    <section className="game-screen">
      <img src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png" alt="Pirate Battle" />
      <p className="visually-hidden" role="timer" aria-live="off">
        Time remaining: {formatTime(secondsRemaining)}
      </p>
      <div className="game-frame">
        <div className="simulation">
        <PixiGame
          matchDurationSeconds={matchOptions.matchDurationSeconds}
          debugEnabled={matchOptions.debugEnabled}
          isPaused={isPaused}
          onPause={setIsPaused}
          onTimeUpdate={setSecondsRemaining}
          onMatchEnd={props.onMatchEnd}
        />
        </div>
      </div>
      {isPaused && !pauseOptionsOpen && (
        <div className="pause-overlay">
          <section
            className="pause-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
          >
            <h1 id="pause-title">Paused</h1>
            <p>Ready when you are.</p>
            <button
              type="button"
              className="options-menu-button pause-menu-button"
              onClick={() => setIsPaused(false)}
            >
              Resume
            </button>
            <button
              type="button"
              className="options-menu-button pause-menu-button"
              onClick={() => setPauseOptionsOpen(true)}
            >
              Options
            </button>
            <button
              type="button"
              className="options-menu-button pause-menu-button"
              onClick={props.onReturnToMenu}
            >
              Main Menu
            </button>
          </section>
        </div>
      )}
      {isPaused && pauseOptionsOpen && (
        <div className="pause-options-overlay">
          <OptionsScreen
            onComeBack={() => setPauseOptionsOpen(false)}
            returnButtonLabel="Back to Pause"
          />
        </div>
      )}
    </section>
  )
}

export default GameScreen