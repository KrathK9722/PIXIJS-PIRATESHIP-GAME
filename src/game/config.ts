import type { PlayerOptions } from '../game/types.ts'
import type { MovementConfig } from './types'

export const OPTIONS_LIMITS = {
  durationMin: 60,
  durationMax: 180,
  spawnMin: 1,
  spawnMax: 15,
}

export const DEFAULT_OPTIONS: PlayerOptions = {
  matchDurationSeconds: 120,
  spawnIntervalSeconds: 4,
}

export function validateOptions(options: PlayerOptions): string | null {
  const duration = options.matchDurationSeconds
  const spawn = options.spawnIntervalSeconds

  if (
    !Number.isInteger(duration) 
    || duration < OPTIONS_LIMITS.durationMin 
    || duration > OPTIONS_LIMITS.durationMax
  ) {
    return 'Match duration must be a number between 60 and 180 seconds.'
  }

  if (
    !Number.isFinite(spawn) 
    || spawn < OPTIONS_LIMITS.spawnMin 
    || spawn > OPTIONS_LIMITS.spawnMax
  ) {
    return 'Spawn interval must be between 1 and 15 seconds.'
  }

  return null
}