export type PlayerState = {
  x: number
  y: number
  rotation: number
  health: number
  alive: boolean
  destroyed: boolean
  shootCooldown: number
}

export type EnemyState = {
  x: number
  y: number
  rotation: number
  health: number
  boatColor: number
  alive: boolean
  shootCooldown: number
}

export type BulletState = {
  x: number
  y: number
  rotation: number
  lifeTime: number
  owner: 'player' | 'enemy'
}

export type MovementInput = {
  shoot: boolean
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  shootLeft: boolean
  shootRight: boolean
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
  explosions: ExplosionState[]
  destructionParticles: DestructionParticleState[]
  score: number
  elapsedSeconds: number
  matchDurationSeconds: number
  isFinished: boolean
}

export type PlayerOptions = {
  matchDurationSeconds: number
  spawnIntervalSeconds: number
  debugEnabled: boolean
}

export type RippleState = {
  x: number
  y: number
  age: number
}

export type ExplosionState = {
  x: number
  y: number
  age: number
}

export type DestructionParticleState = {
  x: number
  y: number
  age: number
}