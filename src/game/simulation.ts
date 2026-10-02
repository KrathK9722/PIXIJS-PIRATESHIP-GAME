import type { MovementInput, SimulationState } from './types'

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
}