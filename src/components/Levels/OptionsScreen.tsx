import { useState } from 'react'
import type { FormEvent } from 'react'
import {DEFAULT_OPTIONS,OPTIONS_LIMITS,validateOptions,} from '../Experience/config/config'
import { loadOptions, saveOptions } from '../../services/optionsStorage'
import './OptionsScreen.css'

type OptionsScreenProps = {
  onComeBack: () => void
}

function OptionsScreen(props: OptionsScreenProps) {
  const [initialOptions] = useState(loadOptions)

  const [duration, setDuration] = useState(
    String(initialOptions.matchDurationSeconds),
  )

  const [spawnInterval, setSpawnInterval] = useState(
    String(initialOptions.spawnIntervalSeconds),
  )

  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setSaved(false)

    const options = {
      matchDurationSeconds: Number(duration),
      spawnIntervalSeconds: Number(spawnInterval),
    }

    const validationError = validateOptions(options)

    if (validationError !== null) {
      setError(validationError)
      return
    }

    try {
      saveOptions(options)
      setSaved(true)
    } catch {
      setError('Could not save options. Please try again.')
    }
  }

  function handleReset() {
    setDuration(String(DEFAULT_OPTIONS.matchDurationSeconds))
    setSpawnInterval(String(DEFAULT_OPTIONS.spawnIntervalSeconds))
    setError(null)
    setSaved(false)
  }

  return (
    <section className="options-screen">
      <img
        src="/assets/jungleGaming/png/default/ui/menu/title_pirate_battle.png"
        alt="Pirate Battle"
      />

      <form className="options-menu" onSubmit={handleSave} noValidate>
        <h1>Options</h1>

        <div className="options-field">
          <label htmlFor="match-duration">Match duration</label>

          <input
            id="match-duration"
            type="number"
            min={OPTIONS_LIMITS.durationMin}
            max={OPTIONS_LIMITS.durationMax}
            step="1"
            value={duration}
            aria-describedby="duration-help options-error"
            aria-invalid={error !== null}
            onChange={(event) => {
              setDuration(event.target.value)
              setError(null)
              setSaved(false)
            }}
          />

          <small id="duration-help">60–180 seconds</small>
        </div>

        <div className="options-field">
          <label htmlFor="spawn-interval">Enemy spawn interval</label>

          <input
            id="spawn-interval"
            type="number"
            min={OPTIONS_LIMITS.spawnMin}
            max={OPTIONS_LIMITS.spawnMax}
            step="any"
            value={spawnInterval}
            aria-describedby="spawn-help options-error"
            aria-invalid={error !== null}
            onChange={(event) => {
              setSpawnInterval(event.target.value)
              setError(null)
              setSaved(false)
            }}
          />

          <small id="spawn-help">1–15 seconds</small>
        </div>

        <p id="options-error" role="alert">
          {error}
        </p>

        <p role="status">
          {saved ? 'Options saved. Changes apply to new matches.' : ''}
        </p>

        <button type="submit" className="options-menu-button">
          Save Options
        </button>
        <div className="options-secondary-menu">
            <button type="button" className="options-menu-secondary-button" onClick={handleReset}>
            Restore Defaults
            </button>

            <button type="button" className="options-menu-secondary-button" onClick={props.onComeBack}>
            Back to Menu
            </button>
        </div>
      </form>
    </section>
  )
}

export default OptionsScreen