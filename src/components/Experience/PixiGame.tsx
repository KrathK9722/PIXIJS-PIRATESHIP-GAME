import { useEffect, useRef } from 'react'
import { 
  Application, 
  Assets, 
  Container, 
  Graphics, 
  Sprite, 
  Texture 
} from 'pixi.js'
import {
  BULLET_RADIUS,
  MOVEMENT_CONFIG,
  ENEMY_HEIGHT,
  ENEMY_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MAX_HEALTH,
  PLAYER_WIDTH,
  ENEMY_MAX_HEALTH,
  ENEMY_SHOOT_INTERVAL_SECONDS,
} from './config/config'
import { createKeyboardInput } from './config/input'
import { updateSimulation } from './config/simulation'
import { formatTime } from './config/time'
import { createHudHealth } from './config/createHudHealth'
import type { ExplosionState, SimulationState } from '../../types/types'
import './PixiGame.css'
import { createHudCounter } from './config/createHudCounter'

const PLAYER_TEXTURE_URLS = Array.from(
  { length: 4 },
  (_, damageState) =>
    `/assets/kenney_piratePack/PNG/Default size/Ships/ship (${1 + damageState * 6}).png`,
)

type PixiGameProps = {
  matchDurationSeconds: number
  debugEnabled: boolean
  onTimeUpdate: (secondsRemaining: number) => void
  onMatchEnd: () => void
}

export function getRandomInteger(min: number, max: number): number {

  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

function createInitialSimulationState(matchDurationSeconds: number): SimulationState {
  return {
    player: {
      x: MOVEMENT_CONFIG.arenaWidth / 2,
      y: MOVEMENT_CONFIG.arenaHeight / 2,
      rotation: 0,
      health: PLAYER_MAX_HEALTH,
      alive: true,
      destroyed: false,
      shootCooldown: 0,
    },
    enemy: {
      x: MOVEMENT_CONFIG.arenaWidth / 2,
      y: 120,
      rotation: 0,
      health: ENEMY_MAX_HEALTH,
      boatColor: getRandomInteger(2,6),
      alive: true,
      shootCooldown: ENEMY_SHOOT_INTERVAL_SECONDS,
    },
    bullets: [],
    ripples: [],
    explosions: [],
    destructionParticles: [],
    score: 0,
    config: MOVEMENT_CONFIG,
    elapsedSeconds: 0,
    matchDurationSeconds,
    isFinished: false,
  }
}

function createPlayerSprite(texture: Texture): Sprite {
  const playerSprite = new Sprite(texture)
  playerSprite.anchor.set(0.5)
  playerSprite.width = PLAYER_WIDTH
  playerSprite.height = PLAYER_HEIGHT
  return playerSprite
}

function createPlayerHurtBoxPreview(): Graphics {
  return new Graphics()
    .rect(
      -PLAYER_WIDTH / 2,
      -PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT,
    )
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xff3333, width: 2 })
}

function createPlayerHitBoxPreview(): Graphics {
  return new Graphics()
    .roundRect(
      -PLAYER_WIDTH / 2,
      -PLAYER_HEIGHT / 2,
      PLAYER_WIDTH,
      PLAYER_HEIGHT, 24
    )
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xFFFF00, width: 2 })
}

function createEnemySprite(texture: Texture): Sprite {
  const enemySprite = new Sprite(texture)
  enemySprite.anchor.set(0.5)
  enemySprite.width = ENEMY_WIDTH
  enemySprite.height = ENEMY_HEIGHT
  return enemySprite
}

function createEnemyHurtBoxPreview(): Graphics {
  return new Graphics()
    .rect(
      -ENEMY_WIDTH / 2,
      -ENEMY_HEIGHT / 2,
      ENEMY_WIDTH,
      ENEMY_HEIGHT,
    )
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xff3333, width: 2 })
}

function createEnemyHitBoxPreview(): Graphics {
  return new Graphics()
    .roundRect(
      -ENEMY_WIDTH / 2,
      -ENEMY_HEIGHT / 2,
      ENEMY_WIDTH,
      ENEMY_HEIGHT, 24
    )
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xFFFF00, width: 2 })
}


function PixiGame(props: PixiGameProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const matchDurationSeconds = props.matchDurationSeconds
  const debugEnabled = props.debugEnabled
  const onTimeUpdate = props.onTimeUpdate
  const onMatchEnd = props.onMatchEnd
  const debugEnabledRef = useRef(debugEnabled)

  useEffect(() => {
    debugEnabledRef.current = debugEnabled
  }, [debugEnabled])

  useEffect(() => {
    let disposed = false
    let matchEndReported = false
    let lastReportedSeconds = matchDurationSeconds
    let app: Application | null = null
    let keyboardInput: ReturnType<typeof createKeyboardInput> | undefined

    async function initializePixi() {
      const host = hostRef.current

      if (host === null) {
        return
      }
      const state = createInitialSimulationState(matchDurationSeconds)

      if (state.enemy === null) {
        return
      }

      const enemyBoatColor = state.enemy.boatColor
      const enemyTextureURLs = Array.from(
        { length: 4 },
        (_, damageState) =>
          `/assets/kenney_piratePack/PNG/Default size/Ships/ship (${enemyBoatColor + damageState * 6}).png`,
      )

      const [
        playerTextures,
        counterPanelTexture,
        timeIconTexture,
        scoreIconTexture,
        healthFrameTexture,
        healthGreenTexture,
        healthAmberTexture,
        healthRedTexture,
        heartTexture,
        bulletTexture,
        enemyTextures,
        explosionTextures,
      ] = await Promise.all([
        Promise.all(PLAYER_TEXTURE_URLS.map((url) => Assets.load<Texture>(url))),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/counter_panel.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_time.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_score.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_frame.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_green.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_amber.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_red.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_heart.png'),
        Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Ship parts/cannonBall.png'),
        Promise.all(enemyTextureURLs.map((url) => Assets.load<Texture>(url))),
        Promise.all([
          Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Effects/explosion3.png'),
          Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Effects/explosion2.png'),
          Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Effects/explosion1.png'),
        ]),
      ])

      if (disposed) {
        return
      }

      const newApp = new Application()

      await newApp.init({
        width: MOVEMENT_CONFIG.arenaWidth,
        height: MOVEMENT_CONFIG.arenaHeight,
        background: 0x176b87,
        antialias: true,
      })

      if (disposed) {
        newApp.destroy({ removeView: true }, { children: true })
        return
      }

      app = newApp
      host.appendChild(newApp.canvas)

      // CONTAINER
      const worldContainer = new Container()
      newApp.stage.addChild(worldContainer)

      const shakeDuration = 0.25
      let shakeRemaining = 0
      let shakeStrength = 0
      const worldOriginX = worldContainer.x
      const worldOriginY = worldContainer.y

      function triggerScreenShake(strength: number) {
        shakeRemaining = shakeDuration
        shakeStrength = Math.max(shakeStrength, strength)
      }

      // CREATE WAVES
      const ripplesGraphics = new Graphics()
      worldContainer.addChild(ripplesGraphics)
      // CREATE BULLET HITBOXES
      const bulletHitBoxGraphics = new Graphics()
      worldContainer.addChild(bulletHitBoxGraphics)

      // CREATE DESTRUCTION PARTICLES
      const destructionParticlesGraphics = new Graphics()
      worldContainer.addChild(destructionParticlesGraphics)

      // CREATE PLAYER ON CANVAS
      const playerSprite = createPlayerSprite(playerTextures[0])
      const playerHurtBoxPreview = createPlayerHurtBoxPreview()
      const playerHitBoxPreview = createPlayerHitBoxPreview()
      const bulletSprites: Sprite[] = []
      keyboardInput = createKeyboardInput()

      worldContainer.addChild(playerSprite)
      worldContainer.addChild(playerHurtBoxPreview)
      worldContainer.addChild(playerHitBoxPreview)

      // CREATE ENEMY ON CANVAS
      const enemySprite = createEnemySprite(enemyTextures[0])
      const enemyHurtBoxPreview = createEnemyHurtBoxPreview()
      const enemyHitBoxPreview = createEnemyHitBoxPreview()
      enemyHurtBoxPreview.position.set(state.enemy.x, state.enemy.y)
      enemyHurtBoxPreview.rotation = state.enemy.rotation + Math.PI
      enemyHitBoxPreview.position.set(state.enemy.x, state.enemy.y)
      enemyHitBoxPreview.rotation = state.enemy.rotation + Math.PI
      worldContainer.addChild(enemySprite)
      worldContainer.addChild(enemyHurtBoxPreview)
      worldContainer.addChild(enemyHitBoxPreview)

      // CREATE TIMER ON CANVAS
      const timeCounter = createHudCounter(
        counterPanelTexture,
        timeIconTexture,
        formatTime(matchDurationSeconds),
      )

      timeCounter.container.position.set(
        MOVEMENT_CONFIG.arenaWidth - 24 - 160,
        16,
      )
      newApp.stage.addChild(timeCounter.container)
      
      const scoreCounter = createHudCounter(
        counterPanelTexture,
        scoreIconTexture,
        String(state.score),
      )

      // CREATE SCORE ON CANVAS
      scoreCounter.container.position.set(
        MOVEMENT_CONFIG.arenaWidth - 24 - 160 * 2 - 12,
        16,
      )
      newApp.stage.addChild(scoreCounter.container)
      let lastReportedScore = state.score
      // CREATE HEALTH BAR
      const healthCounter = createHudHealth(
        healthFrameTexture,
        heartTexture,
        {
          green: healthGreenTexture,
          amber: healthAmberTexture,
          red: healthRedTexture,
        },
        state.player.health,
        PLAYER_MAX_HEALTH,
      )
      healthCounter.container.position.set(24, 16)
      newApp.stage.addChild(healthCounter.container)
      let lastReportedPlayerHealth = state.player.health

      // CREATE EXPLOSIONS ON CANVAS
      const explosionSprites = new Map<ExplosionState, Sprite>()

      // RUN TIME
      newApp.ticker.add((ticker) => {
        if (state.isFinished) {
          if (!matchEndReported) {
            matchEndReported = true
            onMatchEnd()
          }
          return
        }

        // REAL TIME
        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05)

        // SAVE PLAYER AND ENEMY HEALTH BEFORE UPDATE
        const playerHealthBefore = state.player.health
        const enemyHealthBefore = state.enemy?.health
        
        updateSimulation(state, keyboardInput?.read() ?? {
          forward: false,
          turnLeft: false,
          turnRight: false,
          shoot: false,
          shootLeft: false,
          shootRight: false,
        }, deltaSeconds)
        
  
        const activeExplosions = new Set(state.explosions)

        // SCREEN SHAKE
        if (state.player.health < playerHealthBefore) {
          triggerScreenShake(state.player.health === 0 ? 12 : 4)
        }

        if (
          state.enemy !== null &&
          enemyHealthBefore !== undefined &&
          state.enemy.health < enemyHealthBefore
        ) {
          triggerScreenShake(state.enemy.health === 0 ? 12 : 4)
        }
        for (const [explosion, sprite] of explosionSprites) {
          if (!activeExplosions.has(explosion)) {
            sprite.destroy()
            explosionSprites.delete(explosion)
          }
        }

        shakeRemaining = Math.max(0, shakeRemaining - deltaSeconds)

        if (shakeRemaining > 0) {
          const intensity = shakeStrength * (shakeRemaining / shakeDuration)
          const offsetX = (Math.random() * 2 - 1) * intensity
          const offsetY = (Math.random() * 2 - 1) * intensity

          worldContainer.position.set(
            worldOriginX + offsetX,
            worldOriginY + offsetY,
          )
        } else {
          worldContainer.position.set(worldOriginX, worldOriginY)
          shakeStrength = 0
        }

        // EXPLOSION ANIMATION
        for (const explosion of state.explosions) {
          let sprite = explosionSprites.get(explosion)

          if (sprite === undefined) {
            sprite = new Sprite(explosionTextures[0])
            sprite.anchor.set(0.5)
            sprite.width = 48
            sprite.height = 48
            worldContainer.addChild(sprite)
            explosionSprites.set(explosion, sprite)
          }

          const frameIndex = Math.min(
            explosionTextures.length - 1,
            Math.floor(explosion.age / 0.12),
          )

          sprite.texture = explosionTextures[frameIndex]
          sprite.position.set(explosion.x, explosion.y)
        }

        ripplesGraphics.clear()

        // WAVE ANIMATION
        for (const ripple of state.ripples) {
          const progress = ripple.age / 0.5

          const radius = BULLET_RADIUS + progress * getRandomInteger(7,14)
          const alpha = 1 - progress

          ripplesGraphics
            .circle(ripple.x, ripple.y, radius)
            .stroke({
              color: 0xbdefff,
              width: 2,
              alpha,
            })
        }

        destructionParticlesGraphics.clear()

        // DESTRUCTION PARTICLES ANIMATION
        for (const particle of state.destructionParticles) {
          const progress = particle.age / 0.5

          const radius = state.config.enemyRadius + progress * getRandomInteger(7,14)
          const alpha = 1 - progress

          destructionParticlesGraphics
            .circle(particle.x, particle.y, radius)
            .stroke({
              color: 0x4208,
              width: 2,
              alpha,
            })
        }

        // ENEMY
        if (state.enemy !== null) {
          const damageState = Math.min(
            3,
            Math.max(
              0,
              Math.floor(
                (ENEMY_MAX_HEALTH - state.enemy.health) / (ENEMY_MAX_HEALTH / 4),
              ),
            ),
          )
          const damageTexture = enemyTextures[damageState]

          if (enemySprite.texture !== damageTexture) {
            enemySprite.texture = damageTexture
          }

          enemySprite.visible = true
          enemyHurtBoxPreview.visible = debugEnabledRef.current && state.enemy.alive
          enemyHitBoxPreview.visible = debugEnabledRef.current && state.enemy.alive

          if (state.enemy.alive) {
            enemySprite.position.set(state.enemy.x, state.enemy.y)
            enemySprite.rotation = state.enemy.rotation + Math.PI
            enemyHurtBoxPreview.position.set(state.enemy.x, state.enemy.y)
            enemyHitBoxPreview.position.set(state.enemy.x, state.enemy.y)
          }
        } else {
          enemySprite.visible = false
          enemyHurtBoxPreview.visible = false
          enemyHitBoxPreview.visible = false
        }

        // PLAYER
        playerSprite.position.set(state.player.x, state.player.y)
        playerSprite.rotation = state.player.rotation + Math.PI
        const playerDamageState = Math.min(
          3,
          Math.max(0, Math.floor((PLAYER_MAX_HEALTH - state.player.health) / 4)),
        )
        const playerDamageTexture = playerTextures[playerDamageState]

        if (playerSprite.texture !== playerDamageTexture) {
          playerSprite.texture = playerDamageTexture
        }

        playerSprite.visible = !state.player.destroyed

        playerHurtBoxPreview.position.set(state.player.x, state.player.y)
        playerHurtBoxPreview.rotation = state.player.rotation + Math.PI
        playerHurtBoxPreview.visible = debugEnabledRef.current && state.player.alive

        playerHitBoxPreview.position.set(state.player.x, state.player.y)
        playerHitBoxPreview.rotation = state.player.rotation + Math.PI
        playerHitBoxPreview.visible = debugEnabledRef.current && state.player.alive

        // DRAW BULLETS
        while (bulletSprites.length < state.bullets.length) {
          const sprite = new Sprite(bulletTexture)

          sprite.anchor.set(0.5)
          sprite.width = BULLET_RADIUS * 2
          sprite.height = BULLET_RADIUS * 2

          worldContainer.addChild(sprite)
          bulletSprites.push(sprite)
        }

        while (bulletSprites.length > state.bullets.length) {
          const sprite = bulletSprites.pop()

          if (sprite !== undefined) {
            sprite.destroy()
          }
        }

        for (let i = 0; i < state.bullets.length; i++) {
          const bullet = state.bullets[i]
          const sprite = bulletSprites[i]

          sprite.position.set(bullet.x, bullet.y)
          sprite.rotation = bullet.rotation
        }

        bulletHitBoxGraphics.clear()

        if (debugEnabledRef.current) {
          for (const bullet of state.bullets) {
            bulletHitBoxGraphics
              .circle(bullet.x, bullet.y, BULLET_RADIUS)
              .stroke({ color: 0x00ff00, width: 1 })
          }
        }
        
        // MATCH TIMER 
        const secondsRemaining = Math.max(
          0,
          Math.ceil(state.matchDurationSeconds - state.elapsedSeconds),
        )

        // SET VISUAL TIMER TO THE ACTUAL TIME
        if (secondsRemaining !== lastReportedSeconds) {
          lastReportedSeconds = secondsRemaining
          timeCounter.setValue(formatTime(secondsRemaining))
          onTimeUpdate(secondsRemaining)
        }
        // SET VISUAL SCORE TO THE ACTUAL SCORE
        if (state.score !== lastReportedScore) {
          lastReportedScore = state.score
          scoreCounter.setValue(String(state.score))
        }
        // SET VISUAL HEALTH TO THE ACTUAL HEALTH
        if (state.player.health !== lastReportedPlayerHealth) {
          lastReportedPlayerHealth = state.player.health
          healthCounter.setValue(state.player.health, PLAYER_MAX_HEALTH)
        }

        // FINISH MATCH
        if (state.isFinished && !matchEndReported) {
          matchEndReported = true
          onMatchEnd()
        }
      })
    }

    // Erro de inicialiação do canvas
    void initializePixi().catch((error: unknown) => {
      console.error('PixiJS initialization failed:', error)
    })

    // END PIXI CANVAS
    return () => {
      disposed = true
      keyboardInput?.destroy()
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [matchDurationSeconds, onTimeUpdate, onMatchEnd])

  return <div ref={hostRef} className="pixi-host" />
}

export default PixiGame
