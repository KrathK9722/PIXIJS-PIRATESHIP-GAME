import { useEffect, useState } from 'react'
import type { MatchResult } from '../../types/types'
import { getErrorMessage, isRetryableError } from '../../services/api'
import { toSubmitRequest } from '../../services/pendingMatches'
import { useSubmitMatch } from '../../services/queries'
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
  const [submitRequest] = useState(() => toSubmitRequest(result))
  const submit = useSubmitMatch()
  const { mutate } = submit

  // SEND THE MATCH AS SOON AS THE SCREEN OPENS
  useEffect(() => {
    mutate(submitRequest)
  }, [mutate, submitRequest])

  function getRegistrationStatus(): string {
    if (submit.isPending) return 'Saving match to ranking and history…'
    if (submit.isSuccess) return 'Match saved to ranking and history.'
    if (submit.isError) {
      return isRetryableError(submit.error)
        ? `Could not save the match. ${getErrorMessage(submit.error)} It will be sent again later.`
        : 'The server rejected this match, so it was not saved.'
    }
    return ''
  }

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
          {getRegistrationStatus()}
        </p>
        {!isSavedLocally && (
          <p className="result-save-status">This result could not be saved on this device.</p>
        )}
        {submit.isError && isRetryableError(submit.error) && (
          <button
            type="button"
            className="result-retry-button"
            onClick={() => mutate(submitRequest)}
          >
            Retry
          </button>
        )}
        <div className="result-actions">
          {/* PLAY AGAIN WORKS EVEN WHILE THE MATCH IS STILL BEING SAVED */}
          <button type="button" className="result-button" onClick={onPlayAgain}>Play Again</button>
          <button type="button" className="result-button result-button-secondary" onClick={onReturnToMenu}>Main Menu</button>
        </div>
      </div>
    </section>
  )
}

export default ResultScreen
