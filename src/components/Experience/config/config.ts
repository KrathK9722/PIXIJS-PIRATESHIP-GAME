// ================
// INITIAL IMPORTS
// ================
import type { PlayerOptions } from '../../../types/types.ts'
import type { MovementConfig } from '../../../types/types.ts'

// ====================
// SET OPTION'S LIMITS
// ====================
export const OPTIONS_LIMITS = {
  durationMin: 60,
  durationMax: 180,
  spawnMin: 1,
  spawnMax: 15,
}

// ======================
// SET DEFAULT OPTIONS
// ======================
export const DEFAULT_OPTIONS: PlayerOptions = {
  matchDurationSeconds: 120,
  spawnIntervalSeconds: 4,
}

// ======================
// CHECK OPTION'S LIMITS
// ======================
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

// =================
// MOVEMENT STATS
// =================
export const MOVEMENT_CONFIG: MovementConfig = {
  arenaWidth: 960,
  arenaHeight: 540,
  playerRadius: 24,
  enemyRadius: 32,
  moveSpeed: 180,
  rotationSpeed: Math.PI,
}

export const BULLET_SPEED = 400
export const BULLET_RADIUS = 5
