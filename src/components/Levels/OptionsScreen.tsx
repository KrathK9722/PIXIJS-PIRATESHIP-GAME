import { useState } from 'react'
import type { FormEvent } from 'react'
import {DEFAULT_OPTIONS,OPTIONS_LIMITS,validateOptions,} from '../Experience/config/config'
import { loadOptions, saveOptions } from '../../services/optionsStorage'
import './OptionsScreen.css'

type OptionsScreenProps = {
  onComeBack: () => void
  returnButtonLabel?: string
}

function OptionsScreen(props: OptionsScreenProps) {
  const [initialOptions] = useState(loadOptions)

  const [duration, setDuration] = useState(
    String(initialOptions.matchDurationSeconds),
  )

  const [spawnInterval, setSpawnInterval] = useState(
    String(initialOptions.spawnIntervalSeconds),
  )
  const [debugEnabled, setDebugEnabled] = useState(initialOptions.debugEnabled)

  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function changeDuration(amount: number) {
    const nextValue = Math.min(
      OPTIONS_LIMITS.durationMax,
      Math.max(OPTIONS_LIMITS.durationMin, Number(duration) + amount),
    )

    setDuration(String(nextValue))
    setError(null)
    setSaved(false)
  }

  function changeSpawnInterval(amount: number) {
    const nextValue = Math.min(
      OPTIONS_LIMITS.spawnMax,
      Math.max(OPTIONS_LIMITS.spawnMin, Number(spawnInterval) + amount),
    )

    setSpawnInterval(String(nextValue))
    setError(null)
    setSaved(false)
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError(null)
    setSaved(false)

    const options = {
      matchDurationSeconds: Number(duration),
      spawnIntervalSeconds: Number(spawnInterval),
      debugEnabled,
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
    setDebugEnabled(DEFAULT_OPTIONS.debugEnabled)
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

        <div className="options-field" role="group" aria-labelledby="duration-label">
          <span id="duration-label">Game session time</span>

          <div className="options-stepper">
            <button
              type="button"
              className="options-stepper-button"
              aria-label="Decrease game session time"
              disabled={Number(duration) <= OPTIONS_LIMITS.durationMin}
              onClick={() => changeDuration(-10)}
            >
              <img src="/assets/jungleGaming/png/default/ui/controls/icon_minus.png" alt="" />
            </button>

            <output className="options-stepper-value" aria-live="polite">
              {duration} s
            </output>

            <button
              type="button"
              className="options-stepper-button"
              aria-label="Increase game session time"
              disabled={Number(duration) >= OPTIONS_LIMITS.durationMax}
              onClick={() => changeDuration(10)}
            >
              <img src="/assets/jungleGaming/png/default/ui/controls/icon_plus.png" alt="" />
            </button>
          </div>

          <small id="duration-help">60–180 seconds</small>
        </div>

        <div className="options-field" role="group" aria-labelledby="spawn-label">
          <span id="spawn-label">Enemy spawn time</span>

          <div className="options-stepper">
            <button
              type="button"
              className="options-stepper-button"
              aria-label="Decrease enemy spawn time"
              disabled={Number(spawnInterval) <= OPTIONS_LIMITS.spawnMin}
              onClick={() => changeSpawnInterval(-1)}
            >
              <img src="/assets/jungleGaming/png/default/ui/controls/icon_minus.png" alt="" />
            </button>

            <output className="options-stepper-value" aria-live="polite">
              {spawnInterval} s
            </output>

            <button
              type="button"
              className="options-stepper-button"
              aria-label="Increase enemy spawn time"
              disabled={Number(spawnInterval) >= OPTIONS_LIMITS.spawnMax}
              onClick={() => changeSpawnInterval(1)}
            >
              <img src="/assets/jungleGaming/png/default/ui/controls/icon_plus.png" alt="" />
            </button>
          </div>

          <small id="spawn-help">1–15 seconds</small>
        </div>

        <button
          type="button"
          className="options-menu-secondary-button"
          aria-pressed={debugEnabled}
          onClick={() => {
            setDebugEnabled((current) => !current)
            setSaved(false)
          }}
        >
          Debug: {debugEnabled ? 'On' : 'Off'}
        </button>

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
            {props.returnButtonLabel ?? 'Back to Menu'}
            </button>
        </div>
      </form>
    </section>
  )
}

export default OptionsScreen