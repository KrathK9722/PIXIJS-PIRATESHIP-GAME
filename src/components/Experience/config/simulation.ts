import type { BulletState, EnemyState, IslandState, MovementInput, RoundRectHitBox, SimulationState } from '../../../types/types'
import {
  BULLET_RADIUS, BULLET_SPEED, ENEMY_CHASER_SPEED, ENEMY_COLLISION_DAMAGE,
  ENEMY_HEIGHT, ENEMY_MAX_HEALTH, ENEMY_ROTATION_SPEED, ENEMY_SHOOTER_PREFERRED_DISTANCE,
  ENEMY_SHOOTER_RANGE, ENEMY_SHOOTER_SPEED, ENEMY_SHOOT_INTERVAL_SECONDS, ENEMY_WIDTH,
  ENEMY_SPAWN_OFFSCREEN_MARGIN, ENEMY_SPAWN_SAFE_DISTANCE, PLAYER_HEIGHT, PLAYER_WIDTH,
  ENEMY_AVOID_DISTANCE, ENEMY_AVOID_STRENGTH, ENEMY_CRASH_COOLDOWN_SECONDS, ENEMY_CRASH_DAMAGE,
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
    enemyPushShare = 0,
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
    player.x += normalX * overlap * (1 - enemyPushShare)
    player.y += normalY * overlap * (1 - enemyPushShare)
    enemy.x -= normalX * overlap * enemyPushShare
    enemy.y -= normalY * overlap * enemyPushShare
    return true
}


function wrapAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

function getClosestPointOnIslandCore(x: number, y: number, hitBox: RoundRectHitBox): Point {
  const coreLeft = hitBox.x + hitBox.cornerRadius
  const coreRight = hitBox.x + hitBox.width - hitBox.cornerRadius
  const coreTop = hitBox.y + hitBox.cornerRadius
  const coreBottom = hitBox.y + hitBox.height - hitBox.cornerRadius

  return {
    x: Math.max(coreLeft, Math.min(coreRight, x)),
    y: Math.max(coreTop, Math.min(coreBottom, y)),
  }
}

// CHECK IF A CIRCLE TOUCHES THE ISLAND HITBOX
export function circleOverlapsIsland(
  x: number,
  y: number,
  radius: number,
  island: IslandState,
): boolean {
  const closestPoint = getClosestPointOnIslandCore(x, y, island.hitBox)
  const distance = Math.hypot(x - closestPoint.x, y - closestPoint.y)
  return distance < radius + island.hitBox.cornerRadius
}

// CHECK IF A CIRCLE TOUCHES THE LAND OF ANY ISLAND
function circleOverlapsAnyIsland(
  x: number,
  y: number,
  radius: number,
  islands: IslandState[],
): boolean {
  for (const island of islands) {
    if (circleOverlapsIsland(x, y, radius, island)) return true
  }
  return false
}

// HOW MUCH A CIRCLE MUST MOVE TO GET OUT OF THE ISLAND
function getIslandPushForCircle(
  x: number,
  y: number,
  radius: number,
  island: IslandState,
): Point {
  const hitBox = island.hitBox
  const closestPoint = getClosestPointOnIslandCore(x, y, hitBox)
  const differenceX = x - closestPoint.x
  const differenceY = y - closestPoint.y
  const distance = Math.hypot(differenceX, differenceY)
  const minimumDistance = radius + hitBox.cornerRadius

  if (distance >= minimumDistance) {
    return { x: 0, y: 0 }
  }

  let normalX: number
  let normalY: number

  if (distance > 0.000001) {
    normalX = differenceX / distance
    normalY = differenceY / distance
  } else {
    // THE CIRCLE IS DEEP INSIDE THE ISLAND: PUSH IT AWAY FROM THE ISLAND CENTER
    const centerDifferenceX = x - (hitBox.x + hitBox.width / 2)
    const centerDifferenceY = y - (hitBox.y + hitBox.height / 2)
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
  return { x: normalX * overlap, y: normalY * overlap }
}

// PUSH THE BOAT CAPSULE OUT OF ALL ISLANDS
function pushBoatOutOfIslands(
  boat: { x: number; y: number; rotation: number },
  width: number,
  height: number,
  islands: IslandState[],
): void {
  const radius = width / 2
  const circlePositions = [0, 0.25, 0.5, 0.75, 1]

  // REPEAT A FEW TIMES BECAUSE ONE PUSH CAN LEAVE ANOTHER CIRCLE STILL A LITTLE INSIDE
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const island of islands) {
      const segment = getCapsuleSegment(boat, width, height)
      let biggestPush = { x: 0, y: 0 }

      for (const position of circlePositions) {
        const circleX = segment.start.x + (segment.end.x - segment.start.x) * position
        const circleY = segment.start.y + (segment.end.y - segment.start.y) * position
        const push = getIslandPushForCircle(circleX, circleY, radius, island)

        if (Math.hypot(push.x, push.y) > Math.hypot(biggestPush.x, biggestPush.y)) {
          biggestPush = push
        }
      }

      boat.x += biggestPush.x
      boat.y += biggestPush.y
    }
  }
}

// CLOSEST POINT OF A LINE TO ANOTHER POINT
function getClosestPointOnSegment(start: Point, end: Point, point: Point): Point {
  const segmentX = end.x - start.x
  const segmentY = end.y - start.y
  const lengthSquared = segmentX ** 2 + segmentY ** 2

  if (lengthSquared <= 0.000001) {
    return start
  }

  const amount = clamp01(
    ((point.x - start.x) * segmentX + (point.y - start.y) * segmentY) / lengthSquared,
  )
  return {
    x: start.x + segmentX * amount,
    y: start.y + segmentY * amount,
  }
}

// WHERE THE ENEMY SHOULD GO:
// IF AN ISLAND IS BETWEEN THE ENEMY AND THE PLAYER, GO TO A POINT BESIDE THE ISLAND
// OTHERWISE, GO STRAIGHT TO THE PLAYER
function getEnemyTarget(
  enemy: { x: number; y: number },
  player: { x: number; y: number },
  islands: IslandState[],
  arenaWidth: number,
  arenaHeight: number,
): Point {
  for (const island of islands) {
    const hitBox = island.hitBox
    const islandCenter = {
      x: hitBox.x + hitBox.width / 2,
      y: hitBox.y + hitBox.height / 2,
    }

    // IS THE ISLAND IN THE WAY
    const closestPointOnPath = getClosestPointOnSegment(enemy, player, islandCenter)
    const islandIsInTheWay = circleOverlapsIsland(
      closestPointOnPath.x,
      closestPointOnPath.y,
      ENEMY_WIDTH / 2,
      island,
    )
    if (!islandIsInTheWay) continue

    // DIRECTION TO THE PLAYER AND THE DIRECTION TO THE SIDE (90 DEGREES)
    const distanceToPlayer = Math.max(0.001, Math.hypot(player.x - enemy.x, player.y - enemy.y))
    const directionX = (player.x - enemy.x) / distanceToPlayer
    const directionY = (player.y - enemy.y) / distanceToPlayer
    const sideX = -directionY
    const sideY = directionX

    // CHOOSE THE SIDE OF THE ISLAND THAT IS CLOSER TO THE PATH
    const pathSide =
      (closestPointOnPath.x - islandCenter.x) * sideX +
      (closestPointOnPath.y - islandCenter.y) * sideY
    let side = pathSide >= 0 ? 1 : -1

    // HOW FAR FROM THE ISLAND CENTER THE ENEMY SHOULD PASS
    const islandRadius = Math.hypot(hitBox.width, hitBox.height) / 2
    const passDistance = islandRadius + ENEMY_HEIGHT / 2

    let targetX = islandCenter.x + sideX * side * passDistance
    let targetY = islandCenter.y + sideY * side * passDistance

    // IF THAT SIDE IS OUTSIDE THE ARENA USE THE OTHER SIDE
    const isOutsideArena = targetX < 0 || targetX > arenaWidth || targetY < 0 || targetY > arenaHeight
    if (isOutsideArena) {
      side = -side
      targetX = islandCenter.x + sideX * side * passDistance
      targetY = islandCenter.y + sideY * side * passDistance
    }

    return { x: targetX, y: targetY }
  }

  return { x: player.x, y: player.y }
}

// CHECK IF A POINT IS INSIDE THE BOAT HURTBOX
function pointInsideHurtBox(
  point: Point,
  boat: { x: number; y: number; rotation: number },
  width: number,
  height: number,
): boolean {
  const dx = point.x - boat.x
  const dy = point.y - boat.y
  const cos = Math.cos(boat.rotation)
  const sin = Math.sin(boat.rotation)

  const localX = dx * cos + dy * sin
  const localY = -dx * sin + dy * cos

  return Math.abs(localX) <= width / 2 && Math.abs(localY) <= height / 2
}

function getHurtBoxPoints(
  boat: { x: number; y: number; rotation: number },
  width: number,
  height: number,
): Point[] {
  const halfWidth = width / 2
  const halfHeight = height / 2
  const localPoints = [
    { x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight }, { x: -halfWidth, y: halfHeight },
    { x: 0, y: -halfHeight }, { x: halfWidth, y: 0 },
    { x: 0, y: halfHeight }, { x: -halfWidth, y: 0 },
  ]
  const cos = Math.cos(boat.rotation)
  const sin = Math.sin(boat.rotation)
  const worldPoints: Point[] = []

  for (const localPoint of localPoints) {
    worldPoints.push({
      x: boat.x + localPoint.x * cos - localPoint.y * sin,
      y: boat.y + localPoint.x * sin + localPoint.y * cos,
    })
  }
  return worldPoints
}

// CHECK IF THE PLAYER HURTBOX TOUCHES THE ENEMY HURTBOX (USED ONLY FOR DAMAGE)
function hurtBoxesOverlap(
  player: { x: number; y: number; rotation: number },
  enemy: { x: number; y: number; rotation: number },
): boolean {
  for (const point of getHurtBoxPoints(player, PLAYER_WIDTH, PLAYER_HEIGHT)) {
    if (pointInsideHurtBox(point, enemy, ENEMY_WIDTH, ENEMY_HEIGHT)) return true
  }
  for (const point of getHurtBoxPoints(enemy, ENEMY_WIDTH, ENEMY_HEIGHT)) {
    if (pointInsideHurtBox(point, player, PLAYER_WIDTH, PLAYER_HEIGHT)) return true
  }
  return false
}

function createEnemy(state: SimulationState, type: EnemyState['type']): EnemyState {
  const { arenaWidth, arenaHeight } = state.config
  // SPAWN POINTS ARE OUTSIDE THE VISIBLE ARENA
  const margin = ENEMY_SPAWN_OFFSCREEN_MARGIN
  const spawnPoints = [
    { x: 48, y: -margin }, { x: arenaWidth / 2, y: -margin }, { x: arenaWidth - 48, y: -margin },
    { x: -margin, y: arenaHeight / 2 }, { x: arenaWidth + margin, y: arenaHeight / 2 },
    { x: 48, y: arenaHeight + margin }, { x: arenaWidth / 2, y: arenaHeight + margin },
    { x: arenaWidth - 48, y: arenaHeight + margin },
  ]
  // THE POINT WHERE THE ENEMY ENTERS THE ARENA MUST NOT BE BLOCKED BY AN ISLAND
  const islandSafePoints = spawnPoints.filter((point) => {
    const entryX = Math.max(ENEMY_HEIGHT / 2, Math.min(arenaWidth - ENEMY_HEIGHT / 2, point.x))
    const entryY = Math.max(ENEMY_HEIGHT / 2, Math.min(arenaHeight - ENEMY_HEIGHT / 2, point.y))
    return !circleOverlapsAnyIsland(entryX, entryY, ENEMY_HEIGHT / 2, state.islands)
  })
  const safePoints = islandSafePoints.filter((point) =>
    Math.hypot(point.x - state.player.x, point.y - state.player.y) >= ENEMY_SPAWN_SAFE_DISTANCE,
  )
  const candidates = safePoints.length > 0
    ? safePoints
    : islandSafePoints.length > 0 ? islandSafePoints : spawnPoints
    
  // PICK RANDOMLY BETWEEN THE TWO FARTHEST POINTS 
  const distanceToPlayer = (point: { x: number; y: number }) =>
    Math.hypot(point.x - state.player.x, point.y - state.player.y)
  const farthestTwo = [...candidates]
    .sort((a, b) => distanceToPlayer(b) - distanceToPlayer(a))
    .slice(0, 2)
  const spawn = farthestTwo[Math.floor(Math.random() * farthestTwo.length)]

  return {
    id: state.nextEnemyId++,
    type,
    x: spawn.x,
    y: spawn.y,
    // START FACING THE ARENA CENTER SO IT SAILS STRAIGHT IN
    rotation: Math.atan2(arenaWidth / 2 - spawn.x, -(arenaHeight / 2 - spawn.y)),
    health: ENEMY_MAX_HEALTH,
    boatColor: type === 'shooter' ? 2 : Math.floor(Math.random() * 4) + 3,
    alive: true,
    shootCooldown: ENEMY_SHOOT_INTERVAL_SECONDS,
    crashCooldown: 0,
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

    // MOVE AND TURN FREELY THEN PUSH THE BOAT OUT IF IT WENT INTO AN ISLAND
    pushBoatOutOfIslands(player, PLAYER_WIDTH, PLAYER_HEIGHT, state.islands)
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

    // AIM AT THE PLAYER OR AT A POINT BESIDE THE ISLAND IF IT IS IN THE WAY
    const target = getEnemyTarget(enemy, player, state.islands, config.arenaWidth, config.arenaHeight)
    const isGoingAroundIsland = target.x !== player.x || target.y !== player.y

    // STEERING: DIRECTION TO THE TARGET + A PUSH AWAY FROM NEARBY ENEMIES (TRY NOT TO CRASH)
    const targetDistance = Math.max(0.001, Math.hypot(target.x - enemy.x, target.y - enemy.y))
    let steerX = (target.x - enemy.x) / targetDistance
    let steerY = (target.y - enemy.y) / targetDistance
    for (const other of state.enemies) {
      if (other === enemy || !other.alive) continue
      const awayX = enemy.x - other.x
      const awayY = enemy.y - other.y
      const otherDistance = Math.hypot(awayX, awayY)
      if (otherDistance >= ENEMY_AVOID_DISTANCE || otherDistance < 0.001) continue
      // THE CLOSER THE OTHER ENEMY IS, THE STRONGER THE PUSH (0 AT THE LIMIT, 1 WHEN TOUCHING)
      const closeness = 1 - otherDistance / ENEMY_AVOID_DISTANCE
      steerX += (awayX / otherDistance) * closeness * ENEMY_AVOID_STRENGTH
      steerY += (awayY / otherDistance) * closeness * ENEMY_AVOID_STRENGTH
    }
    const targetRotation = Math.atan2(steerX, -steerY)
    const rotationDelta = wrapAngle(targetRotation - enemy.rotation)
    enemy.rotation += Math.max(
      -ENEMY_ROTATION_SPEED * deltaSeconds,
      Math.min(ENEMY_ROTATION_SPEED * deltaSeconds, rotationDelta),
    )

    let movementDirection = 0
    if (enemy.type === 'chaser' || isGoingAroundIsland) {
      movementDirection = 1
    } else if (distance > ENEMY_SHOOTER_PREFERRED_DISTANCE + 12) {
      movementDirection = 1
    } else if (distance < ENEMY_SHOOTER_PREFERRED_DISTANCE - 30) {
      movementDirection = -1
    }

    const previousX = enemy.x
    const previousY = enemy.y
    const speed = enemy.type === 'chaser' ? ENEMY_CHASER_SPEED : ENEMY_SHOOTER_SPEED
    enemy.x += Math.sin(enemy.rotation) * speed * movementDirection * deltaSeconds
    enemy.y -= Math.cos(enemy.rotation) * speed * movementDirection * deltaSeconds
    pushBoatOutOfIslands(enemy, ENEMY_WIDTH, ENEMY_HEIGHT, state.islands)

    // KEEP ENEMIES IN THE ARENA AFTER GETTING INSIDE IT
    const minX = Math.min(config.enemyRadius, previousX)
    const maxX = Math.max(config.arenaWidth - config.enemyRadius, previousX)
    const minY = Math.min(config.enemyRadius, previousY)
    const maxY = Math.max(config.arenaHeight - config.enemyRadius, previousY)
    enemy.x = Math.max(minX, Math.min(maxX, enemy.x))
    enemy.y = Math.max(minY, Math.min(maxY, enemy.y))

    const isInsideArena = enemy.x >= 0 && enemy.x <= config.arenaWidth &&
      enemy.y >= 0 && enemy.y <= config.arenaHeight

    enemy.crashCooldown = Math.max(0, enemy.crashCooldown - deltaSeconds)

    if (enemy.type === 'shooter') {
      enemy.shootCooldown = Math.max(0, enemy.shootCooldown - deltaSeconds)
      // NO SHOOTING FROM OFF-SCREEN
      if (isInsideArena && distance <= ENEMY_SHOOTER_RANGE && enemy.shootCooldown <= 0) {
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

    // HURTBOX (RED) = DAMAGE - CHECKS IT BEFORE THE BOATS ARE PUSHED 
    const touchedHurtBox = hurtBoxesOverlap(player, enemy)

    // HITBOX (YELLOW CAPSULE) = COLLISION - ONLY PUSHES THE BOATS 
    separateBoatCapsules(player, enemy)

    if (touchedHurtBox && enemy.type === 'chaser') {
      damagePlayer(state, ENEMY_COLLISION_DAMAGE)
      destroyEnemy(state, enemy, false)
    }
  }

  // ENEMIES COLLIDE WITH EACH OTHER: BOTH ARE PUSHED HALF OF THE OVERLAP AND TAKE CRASH DAMAGE
  // ONLY ALIVE ENEMIES FULLY INSIDE THE ARENA (OFF-SCREEN ONES ARE STILL SAILING IN)
  const isFullyInsideArena = (enemy: EnemyState) =>
    enemy.x >= config.enemyRadius && enemy.x <= config.arenaWidth - config.enemyRadius &&
    enemy.y >= config.enemyRadius && enemy.y <= config.arenaHeight - config.enemyRadius
  const collidingEnemies = state.enemies.filter((enemy) => enemy.alive && isFullyInsideArena(enemy))
  for (let first = 0; first < collidingEnemies.length; first++) {
    for (let second = first + 1; second < collidingEnemies.length; second++) {
      const firstEnemy = collidingEnemies[first]
      const secondEnemy = collidingEnemies[second]
      // AN ENEMY DESTROYED BY AN EARLIER CRASH THIS FRAME NO LONGER COLLIDES
      if (!firstEnemy.alive || !secondEnemy.alive) continue
      const crashed = separateBoatCapsules(firstEnemy, secondEnemy, 0.5)
      if (!crashed) continue
      for (const crashedEnemy of [firstEnemy, secondEnemy]) {
        // COOLDOWN SO TOUCHING BOATS DON'T TAKE DAMAGE EVERY FRAME
        if (crashedEnemy.crashCooldown > 0) continue
        crashedEnemy.crashCooldown = ENEMY_CRASH_COOLDOWN_SECONDS
        crashedEnemy.health -= ENEMY_CRASH_DAMAGE
        // A CRASH IS NOT A PLAYER KILL, SO IT DOES NOT AWARD A POINT
        if (crashedEnemy.health <= 0) destroyEnemy(state, crashedEnemy, false)
      }
    }
  }
  // THE PUSH CAN MOVE AN ENEMY INTO AN ISLAND OR OUT OF THE ARENA, SO FIX IT
  for (const enemy of collidingEnemies) {
    pushBoatOutOfIslands(enemy, ENEMY_WIDTH, ENEMY_HEIGHT, state.islands)
    enemy.x = Math.max(config.enemyRadius, Math.min(config.arenaWidth - config.enemyRadius, enemy.x))
    enemy.y = Math.max(config.enemyRadius, Math.min(config.arenaHeight - config.enemyRadius, enemy.y))
  }

  // AN ENEMY CAN PUSH THE PLAYER INTO AN ISLAND, SO PUSH THE PLAYER OUT AGAIN
  pushBoatOutOfIslands(player, PLAYER_WIDTH, PLAYER_HEIGHT, state.islands)
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

    // BULLET HITS THE ISLAND HITBOX
    if (circleOverlapsAnyIsland(bullet.x, bullet.y, BULLET_RADIUS, state.islands)) {
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
