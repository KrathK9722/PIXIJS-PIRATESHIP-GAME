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
  debugEnabled: false,
}

// ======================
// CHECK OPTION'S LIMITS
// ======================
export function validateOptions(options: PlayerOptions): string | null {
  const duration = options.matchDurationSeconds
  const spawn = options.spawnIntervalSeconds

  if (typeof options.debugEnabled !== 'boolean') {
    return 'Debug option must be enabled or disabled.'
  }

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
  enemyRadius: 24,
  moveSpeed: 180,
  rotationSpeed: Math.PI,
}

export const PLAYER_WIDTH = 48
export const PLAYER_HEIGHT = 96
export const PLAYER_MAX_HEALTH = 12
export const ENEMY_WIDTH = 48
export const ENEMY_HEIGHT = 96
export const ENEMY_MAX_HEALTH = 3
export const ENEMY_SHOOT_INTERVAL_SECONDS = 1.5
export const ENEMY_SPAWN_SAFE_DISTANCE = 220
export const ENEMY_CHASER_SPEED = 110
export const ENEMY_SHOOTER_SPEED = 78
export const ENEMY_SHOOTER_RANGE = 320
export const ENEMY_SHOOTER_PREFERRED_DISTANCE = 220
export const ENEMY_ROTATION_SPEED = Math.PI * 0.8
export const ENEMY_COLLISION_DAMAGE = 3
export const BULLET_SPEED = 400
export const BULLET_RADIUS = 5
