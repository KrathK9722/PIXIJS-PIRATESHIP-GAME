import { DEFAULT_OPTIONS, validateOptions } from '../game/config'
import type { PlayerOptions } from '../game/types.ts'

const STORAGE_KEY = 'pirate-battle.options.v1'

export function loadOptions(): PlayerOptions {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (stored === null) {
      return { ...DEFAULT_OPTIONS }
    }

    const parsed: unknown = JSON.parse(stored)

    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_OPTIONS }
    }

    if (
      !('matchDurationSeconds' in parsed) ||
      !('spawnIntervalSeconds' in parsed) 
    ) {
      return { ...DEFAULT_OPTIONS }
    }

    if (
      typeof parsed.matchDurationSeconds !== 'number' ||
      typeof parsed.spawnIntervalSeconds !== 'number'
    ) {
      return { ...DEFAULT_OPTIONS }
    }

    const options: PlayerOptions = {
      matchDurationSeconds: parsed.matchDurationSeconds,
      spawnIntervalSeconds: parsed.spawnIntervalSeconds,
    }

    return validateOptions(options) === null? options: { ...DEFAULT_OPTIONS }
  } 

  catch {
    return { ...DEFAULT_OPTIONS }
  }
}

export function saveOptions(options: PlayerOptions): void {
  const error = validateOptions(options)

  if (error !== null) {
    throw new Error(error)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
}