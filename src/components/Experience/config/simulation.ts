import type { BulletState, MovementInput, SimulationState } from '../../../types/types'
import {BULLET_RADIUS,BULLET_SPEED,ENEMY_HEIGHT,ENEMY_SHOOT_INTERVAL_SECONDS,ENEMY_WIDTH,PLAYER_HEIGHT,PLAYER_WIDTH,} from './config'

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
): void {
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
        return
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
}


export async function updateSimulation(
    
  state: SimulationState,
  input: MovementInput,
  deltaSeconds: number,
): Promise<void> {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let canShoot = true;

    // MATCH DURATION
    if (state.isFinished) {
        return
    }

    state.elapsedSeconds = Math.min(
        state.elapsedSeconds + deltaSeconds,
        state.matchDurationSeconds,
    )

    if (state.elapsedSeconds >= state.matchDurationSeconds) {
        state.isFinished = true
        return
    }

    const player = state.player
    const config = state.config

    // PLAYER MOVEMENT
    if (player.alive) {
        const turnDirection =
            (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0)

        player.rotation += turnDirection * config.rotationSpeed * deltaSeconds

        if (input.forward) {
            player.x += Math.sin(player.rotation) * config.moveSpeed * deltaSeconds
            player.y -= Math.cos(player.rotation) * config.moveSpeed * deltaSeconds
        }

        player.x = Math.max(
            config.playerRadius,
            Math.min(config.arenaWidth - config.playerRadius, player.x),
        )

        player.y = Math.max(
            config.playerRadius,
            Math.min(config.arenaHeight - config.playerRadius, player.y),
        )

        player.shootCooldown = Math.max(
            0,
        player.shootCooldown - deltaSeconds,
        )

        if (input.shoot && player.shootCooldown <= 0) {
            canShoot = false;
            const distanceFromPlayer = PLAYER_HEIGHT / 2 + BULLET_RADIUS
            const spread = (Math.random() - 0.5) * 0.2
            state.bullets.push({
                x: player.x + Math.sin(player.rotation) * distanceFromPlayer,
                y: player.y - Math.cos(player.rotation) * distanceFromPlayer,
                rotation: player.rotation + spread,
                lifeTime: 0,
                owner: 'player',
            })
            player.shootCooldown = 0.5
        }
        else if (input.shootLeft && player.shootCooldown <= 0) {
            canShoot = false;
            fireSideVolley(state, -1)
            player.shootCooldown = 0.5
        }
        else if (input.shootRight && player.shootCooldown <= 0) {
            canShoot = false;
            fireSideVolley(state, 1)
            player.shootCooldown = 0.5
        }
    }

    // SEPARATE BOATS 
    if (player.alive && state.enemy?.alive) {
    separateBoatCapsules(player, state.enemy)

    player.x = Math.max(
        config.playerRadius,
        Math.min(config.arenaWidth - config.playerRadius, player.x),
    )

    player.y = Math.max(
        config.playerRadius,
        Math.min(config.arenaHeight - config.playerRadius, player.y),
    )
    }

    // ENEMY SHOOTING
    const enemy = state.enemy
    if (enemy?.alive && player.alive) {
        enemy.shootCooldown -= deltaSeconds

        if (enemy.shootCooldown <= 0) {
            const directionX = player.x - enemy.x
            const directionY = player.y - enemy.y

            state.bullets.push({
                x: enemy.x,
                y: enemy.y,
                rotation: Math.atan2(directionX, -directionY),
                lifeTime: 0,
                owner: 'enemy',
            })
            enemy.shootCooldown = ENEMY_SHOOT_INTERVAL_SECONDS
        }
    }

    // RIPPLES
    for (let i = state.ripples.length - 1; i >= 0; i--) {
        const ripple = state.ripples[i]

        ripple.age += deltaSeconds

        if (ripple.age >= 0.5) {
            state.ripples.splice(i, 1)
        }
    }

    // DESTRUCTION PARTICLES
    for (let i = state.destructionParticles.length - 1; i >= 0; i--) {
        const particle = state.destructionParticles[i]

        particle.age += deltaSeconds

        if (particle.age >= 0.5) {
            state.destructionParticles.splice(i, 1)
        }
    }

    // EXPLOSIONS
    for (let i = state.explosions.length - 1; i >= 0; i--) {
        const explosion = state.explosions[i]
        explosion.age += deltaSeconds

        if (explosion.age >= 0.36) {
            state.explosions.splice(i, 1)
        }
    }

    // BULLETS
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i]
        bullet.x += Math.sin(bullet.rotation) * BULLET_SPEED * deltaSeconds
        bullet.y -= Math.cos(bullet.rotation) * BULLET_SPEED * deltaSeconds
        bullet.lifeTime += deltaSeconds

        if (bullet.lifeTime >= 1) {
            state.ripples.push({
                x: bullet.x,
                y: bullet.y,
                age: 0,
            })

            state.bullets.splice(i, 1)
            continue
        }
        if (bullet.owner === 'player') {
            const targetEnemy = state.enemy

            if (
                targetEnemy?.alive &&
                bulletHitsBoat(bullet, targetEnemy, ENEMY_WIDTH, ENEMY_HEIGHT)
            ) {
                state.bullets.splice(i, 1)
                targetEnemy.health -= 1
                if (targetEnemy.health <= 0) {
                    targetEnemy.alive = false
                    state.explosions.push({
                        x: targetEnemy.x,
                        y: targetEnemy.y,
                        age: 0,
                    })
                    state.destructionParticles.push({
                        x: targetEnemy.x,
                        y: targetEnemy.y,
                        age: 0,
                    })
                    state.score += 1
                    await wait(450);
                    state.destructionParticles.push({
                        x: targetEnemy.x,
                        y: targetEnemy.y,
                        age: 0,
                    })
                    await wait(200);
                    state.enemy = null
                }
                continue
            }
        } else if (player.alive && bulletHitsBoat(bullet, player, PLAYER_WIDTH, PLAYER_HEIGHT)) {
            state.bullets.splice(i, 1)
            player.health -= 1

            if (player.health <= 0) {
                player.health = 0
                player.alive = false
                state.explosions.push({
                    x: player.x,
                    y: player.y,
                    age: 0,
                })
                state.destructionParticles.push({
                    x: player.x,
                    y: player.y,
                    age: 0,
                })
                await wait(450)
                state.destructionParticles.push({
                    x: player.x,
                    y: player.y,
                    age: 0,
                })
                await wait(200)
                player.destroyed = true
                await wait(300)
                state.isFinished = true
            }
            continue
        }

        if (
            bullet.x < -BULLET_RADIUS || bullet.x > config.arenaWidth + BULLET_RADIUS ||
            bullet.y < -BULLET_RADIUS || bullet.y > config.arenaHeight + BULLET_RADIUS
        ) {
            state.bullets.splice(i, 1)
        }
    }
}
