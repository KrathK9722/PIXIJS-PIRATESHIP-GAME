export type PlayerState = {
  x: number
  y: number
  rotation: number
  health: number
}

export type EnemyState = {
  x: number
  y: number
  rotation: number
  health: number
  boatColor: number
}

export type BulletState = {
  x: number
  y: number
  rotation: number
  lifeTime: number
}

export type MovementInput = {
  shoot: boolean
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
}

export type MovementConfig = {
  arenaWidth: number
  arenaHeight: number
  playerRadius: number
  enemyRadius: number
  moveSpeed: number
  rotationSpeed: number
}

export type SimulationState = {
  player: PlayerState
  config: MovementConfig
  enemy: EnemyState | null
  bullets: BulletState[]
  ripples: RippleState[]
  score: number
  elapsedSeconds: number
  matchDurationSeconds: number
  isFinished: boolean
}

export type PlayerOptions = {
  matchDurationSeconds: number
  spawnIntervalSeconds: number
}

export type RippleState = {
  x: number
  y: number
  age: number
}