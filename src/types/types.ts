export type PlayerState = {
  x: number
  y: number
  rotation: number
  health: number
  alive: boolean
  destroyed: boolean
  shootCooldown: number
  deathElapsedSeconds: number | null
}

export type EnemyState = {
  id: number
  type: EnemyType
  x: number
  y: number
  rotation: number
  health: number
  boatColor: number
  alive: boolean
  shootCooldown: number
  crashCooldown: number
  deathElapsedSeconds: number | null
}

export type EnemyType = 'chaser' | 'shooter'

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
  islands: IslandState[]
  enemies: EnemyState[]
  nextEnemyId: number
  spawnElapsedSeconds: number
  spawnIntervalSeconds: number
  bullets: BulletState[]
  ripples: RippleState[]
  explosions: ExplosionState[]
  destructionParticles: DestructionParticleState[]
  score: number
  elapsedSeconds: number
  matchDurationSeconds: number
  isFinished: boolean
  finishReason: MatchFinishReason | null
}

export type IslandState = {
  x: number
  y: number
  hitBox: RoundRectHitBox
  decorationTiles: Array<Array<number | null>>
}

export type RoundRectHitBox = {
  x: number
  y: number
  width: number
  height: number
  cornerRadius: number
}

export type MatchFinishReason = 'time' | 'player_destroyed'

export type MatchResult = {
  matchId: string
  playerId: string
  completedAt: string
  score: number
  durationSeconds: number
  finishReason: MatchFinishReason
  configuration: PlayerOptions
}

// ===========================================
// RANKING AND MATCH HISTORY API CONTRACTS
// ===========================================

// A MATCH STORED BY THE (MOCKED) SERVER
export type MatchRecord = MatchResult & {
  playerName: string
}

// ONE ROW OF THE RANKING. RANK IS THE POSITION INSIDE THE WHOLE SORTED LIST, NOT THE PAGE
export type RankingEntry = {
  rank: number
  matchId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  completedAt: string
}

// A PAGE OF RESULTS (page STARTS AT 1)
export type Page<T> = {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// POST /api/matches BODY AND RESPONSE
export type SubmitMatchRequest = MatchResult & {
  playerName: string
}

export type SubmitMatchResponse = {
  record: MatchRecord
  // FALSE WHEN THE MATCH WAS ALREADY REGISTERED (A RESEND), SO NOTHING WAS DUPLICATED
  created: boolean
}

export type ApiError = {
  message: string
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
