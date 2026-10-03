import type { BulletState, EnemyState, MovementInput, SimulationState } from '../../../types/types'
import {
  BULLET_RADIUS, BULLET_SPEED, ENEMY_CHASER_SPEED, ENEMY_COLLISION_DAMAGE,
  ENEMY_HEIGHT, ENEMY_MAX_HEALTH, ENEMY_ROTATION_SPEED, ENEMY_SHOOTER_PREFERRED_DISTANCE,
  ENEMY_SHOOTER_RANGE, ENEMY_SHOOTER_SPEED, ENEMY_SHOOT_INTERVAL_SECONDS, ENEMY_WIDTH,
  ENEMY_SPAWN_SAFE_DISTANCE, PLAYER_HEIGHT, PLAYER_WIDTH,
} from './config'

// DETECT BULLET HITS BOAT FUNCTION
function bulletHitsBoat(
    bullet: BulletState,
    boat: { x: number; y: number; rotation: number },
    width: number,
    height: number,
): boolean {
    const dx = bullet.x - boat.x
    const dy = bullet.y - boat.y
    const cos = Math.cos(boat.rotation)
    const sin = Math.sin(boat.rotation)

    const localX = dx * cos + dy * sin
    const localY = -dx * sin + dy * cos
    const halfWidth = width / 2
    const halfHeight = height / 2
    const closestX = Math.max(-halfWidth, Math.min(halfWidth, localX))
    const closestY = Math.max(-halfHeight, Math.min(halfHeight, localY))

    return Math.hypot(localX - closestX, localY - closestY) <= BULLET_RADIUS
}

// FIRE SIDE FUNCTION
function fireSideVolley(state: SimulationState, side: -1 | 1): void {
    const spread = (Math.random() - 0.5) * 0.2
    const player = state.player
    const sideAngle = player.rotation + side * Math.PI / 2
    const spawnDistance = PLAYER_WIDTH / 2 + BULLET_RADIUS
    const diagonalAngle = Math.PI / 6
    const spawnX =
        player.x + side * Math.cos(player.rotation) * spawnDistance
    const spawnY =
        player.y + side * Math.sin(player.rotation) * spawnDistance

    for (const angleOffset of [-diagonalAngle, 0, diagonalAngle]) {
        state.bullets.push({
            x: spawnX,
            y: spawnY,
            rotation: sideAngle + angleOffset + spread,
            lifeTime: 0,
            owner: 'player',
        })
    }
}

// POINT MADE FOR STORING 2D COORDINATES
type Point = { x: number; y: number }

// CLAMP FUNCTION (KEEPS VALUE BETWEEN 0 AND 1)
function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value))
}

// GET CAPSULE SEGMENT FUNCTION
function getCapsuleSegment(
    boat: { x: number; y: number; rotation: number },
    width: number,
    height: number,
): { start: Point; end: Point } {
    const radius = width / 2
    const halfSegment = Math.max(0, height / 2 - radius)
    const axisX = -Math.sin(boat.rotation)
    const axisY = Math.cos(boat.rotation)

    return {
        start: {
            x: boat.x - axisX * halfSegment,
            y: boat.y - axisY * halfSegment,
        },
        end: {
            x: boat.x + axisX * halfSegment,
            y: boat.y + axisY * halfSegment,
        },
    }
}

// GET CLOSEST POINTS BETWEEN TWO SEGMENTS 
function getClosestSegmentPoints(
    firstStart: Point,
    firstEnd: Point,
    secondStart: Point,
    secondEnd: Point,
): { first: Point; second: Point } {
    const firstDirection = {
        x: firstEnd.x - firstStart.x,
        y: firstEnd.y - firstStart.y,
    }
    const secondDirection = {
        x: secondEnd.x - secondStart.x,
        y: secondEnd.y - secondStart.y,
    }
    const betweenStarts = {
        x: firstStart.x - secondStart.x,
        y: firstStart.y - secondStart.y,
    }

    const firstLengthSquared =
        firstDirection.x ** 2 + firstDirection.y ** 2
    const secondLengthSquared =
        secondDirection.x ** 2 + secondDirection.y ** 2
    const directionDot =
        firstDirection.x * secondDirection.x +
        firstDirection.y * secondDirection.y
    const secondStartDot =
        secondDirection.x * betweenStarts.x +
        secondDirection.y * betweenStarts.y

    let firstAmount = 0
    let secondAmount = 0

    if (firstLengthSquared <= 0.000001) {
        secondAmount = clamp01(secondStartDot / secondLengthSquared)
    } else {
        const firstStartDot =
            firstDirection.x * betweenStarts.x +
            firstDirection.y * betweenStarts.y

        if (secondLengthSquared <= 0.000001) {
            firstAmount = clamp01(-firstStartDot / firstLengthSquared)
        } else {
            const denominator =
                firstLengthSquared * secondLengthSquared -
                directionDot ** 2

            firstAmount = denominator === 0
                ? 0
                : clamp01(
                    (directionDot * secondStartDot -
                        firstStartDot * secondLengthSquared) /
                    denominator,
                )

            secondAmount =
                (directionDot * firstAmount + secondStartDot) /
                secondLengthSquared

            if (secondAmount < 0) {
                secondAmount = 0
                firstAmount = clamp01(-firstStartDot / firstLengthSquared)
            } else if (secondAmount > 1) {
                secondAmount = 1
                firstAmount = clamp01(
                    (directionDot - firstStartDot) / firstLengthSquared,
                )
            }
        }
    }

    return {
        first: {
            x: firstStart.x + firstDirection.x * firstAmount,
            y: firstStart.y + firstDirection.y * firstAmount,
        },
        second: {
            x: secondStart.x + secondDirection.x * secondAmount,
            y: secondStart.y + secondDirection.y * secondAmount,
        },
    }
}

// SEPARETE BOATS CAPSULES FUNCTION
function separateBoatCapsules(
    player: { x: number; y: number; rotation: number },
    enemy: { x: number; y: number; rotation: number },
): boolean {
    const playerSegment = getCapsuleSegment(
        player,
        PLAYER_WIDTH,
        PLAYER_HEIGHT,
    )
    const enemySegment = getCapsuleSegment(
        enemy,
        ENEMY_WIDTH,
        ENEMY_HEIGHT,
    )
    const closestPoints = getClosestSegmentPoints(
        playerSegment.start,
        playerSegment.end,
        enemySegment.start,
        enemySegment.end,
    )

    const differenceX = closestPoints.first.x - closestPoints.second.x
    const differenceY = closestPoints.first.y - closestPoints.second.y
    const distance = Math.hypot(differenceX, differenceY)
    const minimumDistance = PLAYER_WIDTH / 2 + ENEMY_WIDTH / 2

    if (distance >= minimumDistance) {
        return false
    }

    let normalX: number
    let normalY: number

    if (distance > 0.000001) {
        normalX = differenceX / distance
        normalY = differenceY / distance
    } else {
        const centerDifferenceX = player.x - enemy.x
        const centerDifferenceY = player.y - enemy.y
        const centerDistance = Math.hypot(centerDifferenceX, centerDifferenceY)

        if (centerDistance > 0.000001) {
            normalX = centerDifferenceX / centerDistance
            normalY = centerDifferenceY / centerDistance
        } else {
            normalX = 1
            normalY = 0
        }
    }

    const overlap = minimumDistance - distance
    player.x += normalX * overlap
    player.y += normalY * overlap
    return true
}


function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function createEnemy(state: SimulationState, type: EnemyState['type']): EnemyState {
  const { arenaWidth, arenaHeight } = state.config
  const spawnPoints = [
    { x: 48, y: 48 }, { x: arenaWidth / 2, y: 40 }, { x: arenaWidth - 48, y: 48 },
    { x: 48, y: arenaHeight / 2 }, { x: arenaWidth - 48, y: arenaHeight / 2 },
    { x: 48, y: arenaHeight - 48 }, { x: arenaWidth / 2, y: arenaHeight - 40 },
    { x: arenaWidth - 48, y: arenaHeight - 48 },
  ]
  const safePoints = spawnPoints.filter((point) =>
    Math.hypot(point.x - state.player.x, point.y - state.player.y) >= ENEMY_SPAWN_SAFE_DISTANCE,
  )
  const candidates = safePoints.length > 0 ? safePoints : spawnPoints
  const spawn = candidates.reduce((farthest, point) =>
    Math.hypot(point.x - state.player.x, point.y - state.player.y) >
      Math.hypot(farthest.x - state.player.x, farthest.y - state.player.y) ? point : farthest,
  )

  return {
    id: state.nextEnemyId++,
    type,
    x: spawn.x,
    y: spawn.y,
    rotation: 0,
    health: ENEMY_MAX_HEALTH,
    boatColor: type === 'shooter' ? 2 : Math.floor(Math.random() * 4) + 3,
    alive: true,
    shootCooldown: ENEMY_SHOOT_INTERVAL_SECONDS,
    deathElapsedSeconds: null,
  }
}

function damagePlayer(state: SimulationState, damage: number): void {
  const player = state.player
  if (!player.alive) return
  player.health = Math.max(0, player.health - damage)
  if (player.health === 0) {
    player.alive = false
    player.deathElapsedSeconds = 0
    state.explosions.push({ x: player.x, y: player.y, age: 0 })
    state.destructionParticles.push({ x: player.x, y: player.y, age: 0 })
  }
}

function destroyEnemy(state: SimulationState, enemy: EnemyState, awardPoint: boolean): void {
  if (!enemy.alive) return
  enemy.alive = false
  enemy.health = 0
  enemy.deathElapsedSeconds = 0
  state.explosions.push({ x: enemy.x, y: enemy.y, age: 0 })
  state.destructionParticles.push({ x: enemy.x, y: enemy.y, age: 0 })
  if (awardPoint) state.score += 1
}

export function updateSimulation(
  state: SimulationState,
  input: MovementInput,
  deltaSeconds: number,
): void {
  if (state.isFinished) return

  state.elapsedSeconds = Math.min(state.elapsedSeconds + deltaSeconds, state.matchDurationSeconds)
  if (state.elapsedSeconds >= state.matchDurationSeconds) {
    state.isFinished = true
    state.finishReason = 'time'
    return
  }

  const { player, config } = state

  if (player.deathElapsedSeconds !== null) {
    const previousDeathElapsedSeconds = player.deathElapsedSeconds
    player.deathElapsedSeconds += deltaSeconds
    if (previousDeathElapsedSeconds < 0.45 && player.deathElapsedSeconds >= 0.45) {
      state.destructionParticles.push({ x: player.x, y: player.y, age: 0 })
    }
    if (player.deathElapsedSeconds >= 0.65) player.destroyed = true
    if (player.deathElapsedSeconds >= 0.95) {
      state.isFinished = true
      state.finishReason = 'player_destroyed'
      return
    }
  }

  for (let index = state.enemies.length - 1; index >= 0; index--) {
    const enemy = state.enemies[index]
    if (enemy.deathElapsedSeconds === null) continue
    const previousDeathElapsedSeconds = enemy.deathElapsedSeconds
    enemy.deathElapsedSeconds += deltaSeconds
    if (previousDeathElapsedSeconds < 0.45 && enemy.deathElapsedSeconds >= 0.45) {
      state.destructionParticles.push({ x: enemy.x, y: enemy.y, age: 0 })
    }
    if (enemy.deathElapsedSeconds >= 0.65) state.enemies.splice(index, 1)
  }

  if (player.alive) {
    const turnDirection = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0)
    player.rotation += turnDirection * config.rotationSpeed * deltaSeconds
    if (input.forward) {
      player.x += Math.sin(player.rotation) * config.moveSpeed * deltaSeconds
      player.y -= Math.cos(player.rotation) * config.moveSpeed * deltaSeconds
    }
    player.x = Math.max(config.playerRadius, Math.min(config.arenaWidth - config.playerRadius, player.x))
    player.y = Math.max(config.playerRadius, Math.min(config.arenaHeight - config.playerRadius, player.y))
    player.shootCooldown = Math.max(0, player.shootCooldown - deltaSeconds)

    if (player.shootCooldown <= 0) {
      if (input.shoot) {
        const distanceFromPlayer = PLAYER_HEIGHT / 2 + BULLET_RADIUS
        state.bullets.push({
          x: player.x + Math.sin(player.rotation) * distanceFromPlayer,
          y: player.y - Math.cos(player.rotation) * distanceFromPlayer,
          rotation: player.rotation + (Math.random() - 0.5) * 0.2,
          lifeTime: 0,
          owner: 'player',
        })
        player.shootCooldown = 0.5
      } else if (input.shootLeft || input.shootRight) {
        fireSideVolley(state, input.shootLeft ? -1 : 1)
        player.shootCooldown = 0.5
      }
    }
  }

  if (player.alive) {
    state.spawnElapsedSeconds += deltaSeconds
    while (state.spawnElapsedSeconds >= state.spawnIntervalSeconds) {
      state.spawnElapsedSeconds -= state.spawnIntervalSeconds
      const nextType = state.nextEnemyId % 2 === 0 ? 'shooter' : 'chaser'
      state.enemies.push(createEnemy(state, nextType))
    }
  }

  for (const enemy of state.enemies) {
    if (!enemy.alive) {
      if (player.alive && enemy.deathElapsedSeconds !== null) {
        separateBoatCapsules(player, enemy)
      }
      continue
    }
    if (!player.alive) continue
    const dx = player.x - enemy.x
    const dy = player.y - enemy.y
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    const targetRotation = Math.atan2(dx, -dy)
    const rotationDelta = wrapAngle(targetRotation - enemy.rotation)
    enemy.rotation += Math.max(
      -ENEMY_ROTATION_SPEED * deltaSeconds,
      Math.min(ENEMY_ROTATION_SPEED * deltaSeconds, rotationDelta),
    )

    let movementDirection = 0
    if (enemy.type === 'chaser') {
      movementDirection = 1
    } else if (distance > ENEMY_SHOOTER_PREFERRED_DISTANCE + 12) {
      movementDirection = 1
    } else if (distance < ENEMY_SHOOTER_PREFERRED_DISTANCE - 30) {
      movementDirection = -1
    }

    const speed = enemy.type === 'chaser' ? ENEMY_CHASER_SPEED : ENEMY_SHOOTER_SPEED
    enemy.x += Math.sin(enemy.rotation) * speed * movementDirection * deltaSeconds
    enemy.y -= Math.cos(enemy.rotation) * speed * movementDirection * deltaSeconds
    enemy.x = Math.max(config.enemyRadius, Math.min(config.arenaWidth - config.enemyRadius, enemy.x))
    enemy.y = Math.max(config.enemyRadius, Math.min(config.arenaHeight - config.enemyRadius, enemy.y))

    if (enemy.type === 'shooter') {
      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - deltaSeconds)
      if (distance <= ENEMY_SHOOTER_RANGE && enemy.shootCooldown <= 0) {
        state.bullets.push({
          x: enemy.x + Math.sin(enemy.rotation) * (ENEMY_HEIGHT / 2 + BULLET_RADIUS),
          y: enemy.y - Math.cos(enemy.rotation) * (ENEMY_HEIGHT / 2 + BULLET_RADIUS),
          rotation: enemy.rotation,
          lifeTime: 0,
          owner: 'enemy',
        })
        enemy.shootCooldown = ENEMY_SHOOT_INTERVAL_SECONDS
      }
    }

    if (separateBoatCapsules(player, enemy) && enemy.type === 'chaser') {
      damagePlayer(state, ENEMY_COLLISION_DAMAGE)
      destroyEnemy(state, enemy, false)
    }
  }

  player.x = Math.max(config.playerRadius, Math.min(config.arenaWidth - config.playerRadius, player.x))
  player.y = Math.max(config.playerRadius, Math.min(config.arenaHeight - config.playerRadius, player.y))

  for (let index = state.ripples.length - 1; index >= 0; index--) {
    state.ripples[index].age += deltaSeconds
    if (state.ripples[index].age >= 0.5) state.ripples.splice(index, 1)
  }
  for (let index = state.destructionParticles.length - 1; index >= 0; index--) {
    state.destructionParticles[index].age += deltaSeconds
    if (state.destructionParticles[index].age >= 0.5) state.destructionParticles.splice(index, 1)
  }
  for (let index = state.explosions.length - 1; index >= 0; index--) {
    state.explosions[index].age += deltaSeconds
    if (state.explosions[index].age >= 0.36) state.explosions.splice(index, 1)
  }

  for (let index = state.bullets.length - 1; index >= 0; index--) {
    const bullet = state.bullets[index]
    bullet.x += Math.sin(bullet.rotation) * BULLET_SPEED * deltaSeconds
    bullet.y -= Math.cos(bullet.rotation) * BULLET_SPEED * deltaSeconds
    bullet.lifeTime += deltaSeconds

    const outOfBounds = bullet.x < -BULLET_RADIUS || bullet.x > config.arenaWidth + BULLET_RADIUS ||
      bullet.y < -BULLET_RADIUS || bullet.y > config.arenaHeight + BULLET_RADIUS
    if (bullet.lifeTime >= 1 || outOfBounds) {
      state.ripples.push({ x: bullet.x, y: bullet.y, age: 0 })
      state.bullets.splice(index, 1)
      continue
    }

    if (bullet.owner === 'player') {
      const target = state.enemies.find((enemy) => enemy.alive &&
        bulletHitsBoat(bullet, enemy, ENEMY_WIDTH, ENEMY_HEIGHT))
      if (target) {
        state.bullets.splice(index, 1)
        target.health -= 1
        if (target.health <= 0) destroyEnemy(state, target, true)
      }
    } else if (player.alive && bulletHitsBoat(bullet, player, PLAYER_WIDTH, PLAYER_HEIGHT)) {
      state.bullets.splice(index, 1)
      damagePlayer(state, 1)
    }

  }
}
