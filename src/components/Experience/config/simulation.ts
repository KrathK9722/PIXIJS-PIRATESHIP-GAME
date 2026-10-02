import type { MovementInput, SimulationState } from '../../../types/types'
import { BULLET_RADIUS, BULLET_SPEED} from './config'

export function updateSimulation(
    
  state: SimulationState,
  input: MovementInput,
  deltaSeconds: number,
): void {

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

    // PLAYER MOVEMENT
    const player = state.player
    const config = state.config

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

    if (input.shoot) {
        const distanceFromPlayer = 48 + BULLET_RADIUS
        const spread = (Math.random() - 0.5) * 0.2
        state.bullets.push({
            x: player.x + Math.sin(player.rotation) * distanceFromPlayer,
            y: player.y - Math.cos(player.rotation) * distanceFromPlayer,
            rotation: player.rotation + spread,
            lifeTime: 0,
        })
    }
    for (let i = state.ripples.length - 1; i >= 0; i--) {
        const ripple = state.ripples[i]

        ripple.age += deltaSeconds

        if (ripple.age >= 0.5) {
            state.ripples.splice(i, 1)
        }
    }
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
        const enemy = state.enemy
        if (enemy !== null) {
            const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y)
            if (distance <= BULLET_RADIUS + config.enemyRadius) {
                state.bullets.splice(i, 1)
                enemy.health -= 1
                if (enemy.health <= 0){
                    state.enemy = null
                    state.score += 1
                }
                continue
            }
        }

        if (
            bullet.x < -BULLET_RADIUS || bullet.x > config.arenaWidth + BULLET_RADIUS ||
            bullet.y < -BULLET_RADIUS || bullet.y > config.arenaHeight + BULLET_RADIUS
        ) {
            state.bullets.splice(i, 1)
        }
    }
}
