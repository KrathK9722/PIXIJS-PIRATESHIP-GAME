import type { MatchResult } from '../../types/types'
import { formatTime } from '../Experience/config/time'
import './ResultScreen.css'

type ResultScreenProps = {
  result: MatchResult
  isSavedLocally: boolean
  onPlayAgain: () => void
  onReturnToMenu: () => void
}

function ResultScreen({ result, isSavedLocally, onPlayAgain, onReturnToMenu }: ResultScreenProps) {
  const finishReason = result.finishReason === 'time' ? 'Time is up' : 'Ship destroyed'

  return (
    <section className="result-screen" aria-labelledby="result-title">
      <img
        className="result-title-art"
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />
      <div className="result-panel">
        <h1 id="result-title">Results</h1>
        <dl className="result-summary">
          <div><dt>Final score</dt><dd>{result.score}</dd></div>
          <div><dt>Time played</dt><dd>{formatTime(result.durationSeconds)}</dd></div>
          <div><dt>Match ended</dt><dd>{finishReason}</dd></div>
        </dl>
        <p className="result-save-status" role="status">
          {isSavedLocally
            ? 'Match result saved on this device and ready for match history sync.'
            : 'This result is available until you leave this screen, but could not be saved on this device.'}
        </p>
        <div className="result-actions">
          <button type="button" className="result-button" onClick={onPlayAgain}>Play Again</button>
          <button type="button" className="result-button result-button-secondary" onClick={onReturnToMenu}>Main Menu</button>
        </div>
      </div>
    </section>
  )
}

export default ResultScreen
