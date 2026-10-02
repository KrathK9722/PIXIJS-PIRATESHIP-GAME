export type PlayerState = {
  x: number
  y: number
  rotation: number
}

export type MovementInput = {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
}

export type MovementConfig = {
  arenaWidth: number
  arenaHeight: number
  playerRadius: number
  moveSpeed: number
  rotationSpeed: number
}

export type SimulationState = {
  player: PlayerState
  config: MovementConfig
  elapsedSeconds: number
  matchDurationSeconds: number
  isFinished: boolean
}

export type PlayerOptions = {
  matchDurationSeconds: number
  spawnIntervalSeconds: number
}
