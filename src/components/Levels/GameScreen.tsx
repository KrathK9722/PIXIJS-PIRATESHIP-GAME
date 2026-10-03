import PixiGame from '../Experience/PixiGame'
import './GameScreen.css'
import {useState } from 'react'
import {loadOptions} from '../../services/optionsStorage'
import { formatTime } from '../Experience/config/time'

type GameScreenProps = {
  onMatchEnd: () => void
}

function GameScreen(props: GameScreenProps) {
  const [matchOptions] = useState(loadOptions)
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
          onTimeUpdate={setSecondsRemaining}
          onMatchEnd={props.onMatchEnd}
        />
        </div>
      </div>
    </section>
  )
}

export default GameScreen