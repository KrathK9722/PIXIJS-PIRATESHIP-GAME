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
  DEFAULT_OPTIONS,
  ENEMY_MAX_HEALTH,
  ENEMY_SHOOT_INTERVAL_SECONDS,
} from './config/config'
import { createKeyboardInput } from './config/input'
import { updateSimulation } from './config/simulation'
import { formatTime } from './config/time'
import { createHudHealth } from './config/createHudHealth'
import type { ExplosionState, MatchResult, SimulationState } from '../../types/types'
import './PixiGame.css'
import { createHudCounter } from './config/createHudCounter'
import { createIslandDisplay } from './config/createIslandDisplay'
import { ISLAND_TILE_IDS } from './config/island'
import { createRandomIslands } from './config/createRandomIslands'
import { getRandomInteger } from './config/random'

const PLAYER_TEXTURE_URLS = Array.from({ length: 4 },(_, damageState) =>
    `/assets/kenney_piratePack/PNG/Default size/Ships/ship (${1 + damageState * 6}).png`,
)

type PixiGameProps = {
  matchDurationSeconds: number
  spawnIntervalSeconds: number
  debugEnabled: boolean
  isPaused: boolean
  onPause: (paused: boolean) => void
  onTimeUpdate: (secondsRemaining: number) => void
  onMatchEnd: (result: MatchResult) => void
}

function createInitialSimulationState(
  matchDurationSeconds: number,
  spawnIntervalSeconds: number,
): SimulationState {
  // WHERE THE BOATS START (ISLANDS CAN'T BE PLACED ON TOP OF THESE POINTS)
  const playerStart = {
    x: MOVEMENT_CONFIG.arenaWidth / 2,
    y: MOVEMENT_CONFIG.arenaHeight / 2,
  }
  const firstEnemyStart = {
    x: 48,
    y: ENEMY_HEIGHT / 2 + 4,
  }

  return {
    player: {
      x: playerStart.x,
      y: playerStart.y,
      rotation: 0,
      health: PLAYER_MAX_HEALTH,
      alive: true,
      destroyed: false,
      shootCooldown: 0,
      deathElapsedSeconds: null,
    },
    enemies: [{
      id: 1,
      type: 'chaser',
      x: firstEnemyStart.x,
      y: firstEnemyStart.y,
      rotation: 0,
      health: ENEMY_MAX_HEALTH,
      boatColor: getRandomInteger(3, 6),
      alive: true,
      shootCooldown: ENEMY_SHOOT_INTERVAL_SECONDS,
      crashCooldown: 0,
      deathElapsedSeconds: null,
    }],
    islands: createRandomIslands(
      MOVEMENT_CONFIG.arenaWidth,
      MOVEMENT_CONFIG.arenaHeight,
      [playerStart, firstEnemyStart],
    ),
    nextEnemyId: 2,
    spawnElapsedSeconds: 0,
    spawnIntervalSeconds,
    bullets: [],
    ripples: [],
    explosions: [],
    destructionParticles: [],
    score: 0,
    config: MOVEMENT_CONFIG,
    elapsedSeconds: 0,
    matchDurationSeconds,
    isFinished: false,
    finishReason: null,
  }
}

function createMatchResult(
  state: SimulationState,
  matchDurationSeconds: number,
  spawnIntervalSeconds: number,
  debugEnabled: boolean,
): MatchResult {
  return {
    matchId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    playerId: 'local-player',
    completedAt: new Date().toISOString(),
    score: state.score,
    durationSeconds: Math.floor(state.elapsedSeconds),
    finishReason: state.finishReason ?? 'time',
    configuration: {
      ...DEFAULT_OPTIONS,
      matchDurationSeconds,
      spawnIntervalSeconds,
      debugEnabled,
    },
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
  const spawnIntervalSeconds = props.spawnIntervalSeconds
  const debugEnabled = props.debugEnabled
  const isPaused = props.isPaused
  const onPause = props.onPause
  const onTimeUpdate = props.onTimeUpdate
  const onMatchEnd = props.onMatchEnd
  const debugEnabledRef = useRef(debugEnabled)
  const isPausedRef = useRef(isPaused)
  const keyboardInputRef = useRef<ReturnType<typeof createKeyboardInput> | undefined>(undefined)

  useEffect(() => {
    debugEnabledRef.current = debugEnabled
  }, [debugEnabled])

  useEffect(() => {
    isPausedRef.current = isPaused

    if (isPaused) {
      keyboardInputRef.current?.clear()
    }
  }, [isPaused])

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
      const state = createInitialSimulationState(matchDurationSeconds, spawnIntervalSeconds)

      const enemyTextureColors = [2, 3, 4, 5, 6]

      const [
        playerTextures,
        counterPanelTexture,
        timeIconTexture,
        scoreIconTexture,
        pauseButtonNormalTexture,
        pauseButtonHoverTexture,
        pauseButtonPressedTexture,
        pauseIconTexture,
        healthFrameTexture,
        healthGreenTexture,
        healthAmberTexture,
        healthRedTexture,
        heartTexture,
        bulletTexture,
        enemyTextures,
        islandTileTextures,
        explosionTextures,
      ] = await Promise.all([
        Promise.all(PLAYER_TEXTURE_URLS.map((url) => Assets.load<Texture>(url))),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/counter_panel.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_time.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_score.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/controls/button_round_normal.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/controls/button_round_hover.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/controls/button_round_pressed.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/controls/icon_pause.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_frame.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_green.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_amber.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/health_fill_red.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_heart.png'),
        Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Ship parts/cannonBall.png'),
        Promise.all(enemyTextureColors.map((boatColor) =>
          Promise.all(Array.from(
            { length: 4 },
            (_, damageState) => Assets.load<Texture>(
              `/assets/kenney_piratePack/PNG/Default size/Ships/ship (${boatColor + damageState * 6}).png`,
            ),
          )),
        )),
        Promise.all(ISLAND_TILE_IDS.map((tileId) => Assets.load<Texture>(
          `/assets/kenney_piratePack/PNG/Default size/Tiles/tile_${String(tileId).padStart(2, '0')}.png`,
        ))),
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
      const islandTextureMap = new Map(
        ISLAND_TILE_IDS.map((tileId, index) => [tileId, islandTileTextures[index]]),
      )
      const { waterLayer, islandLayer } = createIslandDisplay(
        islandTextureMap,
        MOVEMENT_CONFIG.arenaWidth,
        MOVEMENT_CONFIG.arenaHeight,
        state.islands,
      )
      worldContainer.addChild(waterLayer)

      // CREATE WAVES (BETWEEN WATER AND ISLANDS SO THEY NEVER DRAW OVER LAND)
      const ripplesGraphics = new Graphics()
      worldContainer.addChild(ripplesGraphics)

      worldContainer.addChild(islandLayer)
      const islandCollisionPreview = new Graphics()
      // DRAW THE ISLAND HITBOX (ROUNDRECT) FOR DEBUG
      for (const island of state.islands) {
        islandCollisionPreview
          .roundRect(
            island.hitBox.x,
            island.hitBox.y,
            island.hitBox.width,
            island.hitBox.height,
            island.hitBox.cornerRadius,
          )
          .fill({ color: 0xff3030, alpha: 0.22 })
          .stroke({ color: 0xff3030, width: 2 })
      }
      islandCollisionPreview.visible = debugEnabledRef.current
      worldContainer.addChild(islandCollisionPreview)

      const shakeDuration = 0.25
      let shakeRemaining = 0
      let shakeStrength = 0
      const worldOriginX = worldContainer.x
      const worldOriginY = worldContainer.y

      function triggerScreenShake(strength: number) {
        shakeRemaining = shakeDuration
        shakeStrength = Math.max(shakeStrength, strength)
      }

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
      keyboardInputRef.current = keyboardInput

      worldContainer.addChild(playerSprite)
      worldContainer.addChild(playerHurtBoxPreview)
      worldContainer.addChild(playerHitBoxPreview)

      // CREATE ENEMY ON CANVAS
      const enemyViews = new Map<number, {
        sprite: Sprite
        hurtBox: Graphics
        hitBox: Graphics
        healthBar: Graphics
      }>()

      // CREATE TIMER ON CANVAS
      const timeCounter = createHudCounter(
        counterPanelTexture,
        timeIconTexture,
        formatTime(matchDurationSeconds),
      )

      timeCounter.container.position.set(
        MOVEMENT_CONFIG.arenaWidth - 24 - 160 - 48 - 12,
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
        MOVEMENT_CONFIG.arenaWidth - 24 - 160 * 2 - 48 - 12 * 2,
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

      const pauseButton = new Container()
      pauseButton.position.set(MOVEMENT_CONFIG.arenaWidth - 24 - 48, 16)
      pauseButton.eventMode = 'static'
      pauseButton.cursor = 'pointer'

      const pauseButtonBackground = new Sprite(pauseButtonNormalTexture)
      pauseButtonBackground.width = 48
      pauseButtonBackground.height = 48
      pauseButton.addChild(pauseButtonBackground)

      const pauseButtonIcon = new Sprite(pauseIconTexture)
      pauseButtonIcon.anchor.set(0.5)
      pauseButtonIcon.width = 24
      pauseButtonIcon.height = 24
      pauseButtonIcon.position.set(24, 24)
      pauseButton.addChild(pauseButtonIcon)

      pauseButton.on('pointerover', () => {
        pauseButtonBackground.texture = pauseButtonHoverTexture
      })
      pauseButton.on('pointerout', () => {
        pauseButtonBackground.texture = pauseButtonNormalTexture
      })
      pauseButton.on('pointerdown', () => {
        pauseButtonBackground.texture = pauseButtonPressedTexture
      })
      pauseButton.on('pointerup', () => {
        pauseButtonBackground.texture = pauseButtonHoverTexture
      })
      pauseButton.on('pointerupoutside', () => {
        pauseButtonBackground.texture = pauseButtonNormalTexture
      })
      pauseButton.on('pointertap', () => onPause(true))
      newApp.stage.addChild(pauseButton)

      // CREATE EXPLOSIONS ON CANVAS
      const explosionSprites = new Map<ExplosionState, Sprite>()

      // RUN TIME
      newApp.ticker.add((ticker) => {
        if (isPausedRef.current) {
          return
        }

        if (state.isFinished) {
          if (!matchEndReported) {
            matchEndReported = true
            onMatchEnd(createMatchResult(state, matchDurationSeconds, spawnIntervalSeconds, debugEnabledRef.current))
          }
          return
        }

        // REAL TIME
        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05)

        // SAVE PLAYER AND ENEMY HEALTH BEFORE UPDATE
        const playerHealthBefore = state.player.health
        const enemyHealthBefore = new Map(
          state.enemies.map((enemy) => [enemy.id, enemy.health]),
        )
        
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

        if (state.enemies.some((enemy) => {
          const previousHealth = enemyHealthBefore.get(enemy.id)
          return previousHealth !== undefined && enemy.health < previousHealth
        })) {
          triggerScreenShake(state.enemies.some((enemy) => enemyHealthBefore.has(enemy.id) && enemy.health === 0) ? 12 : 4)
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

          const radius = BULLET_RADIUS + progress * 14
          const alpha = 1 - progress

          ripplesGraphics
            .circle(ripple.x, ripple.y, radius)
            .stroke({
              color: 0x1b5e7a,
              width: 4,
              alpha: alpha * 0.6,
            })
            .circle(ripple.x, ripple.y, radius)
            .stroke({
              color: 0xffffff,
              width: 2,
              alpha,
            })
            // SMALLER INNER RING FOR A SPLASH LOOK
            .circle(ripple.x, ripple.y, radius * 0.5)
            .stroke({
              color: 0xffffff,
              width: 1.5,
              alpha: alpha * 0.8,
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

        // ENEMIES
        islandCollisionPreview.visible = debugEnabledRef.current
        const activeEnemyIds = new Set(state.enemies.map((enemy) => enemy.id))
        for (const [enemyId, view] of enemyViews) {
          if (activeEnemyIds.has(enemyId)) continue
          view.sprite.destroy()
          view.hurtBox.destroy()
          view.hitBox.destroy()
          view.healthBar.destroy()
          enemyViews.delete(enemyId)
        }

        for (const enemy of state.enemies) {
          let view = enemyViews.get(enemy.id)
          if (view === undefined) {
            view = {
              sprite: createEnemySprite(enemyTextures[enemy.boatColor - 2][0]),
              hurtBox: createEnemyHurtBoxPreview(),
              hitBox: createEnemyHitBoxPreview(),
              healthBar: new Graphics(),
            }
            worldContainer.addChild(view.sprite)
            worldContainer.addChild(view.hurtBox)
            worldContainer.addChild(view.hitBox)
            worldContainer.addChild(view.healthBar)
            enemyViews.set(enemy.id, view)
          }

          const damageState = Math.min(
            3,
            Math.max(
              0,
              Math.floor(
                (ENEMY_MAX_HEALTH - enemy.health) / (ENEMY_MAX_HEALTH / 4),
              ),
            ),
          )
          const enemyTextureSet = enemyTextures[enemy.boatColor - 2]
          const damageTexture = enemyTextureSet[damageState]

          if (view.sprite.texture !== damageTexture) {
            view.sprite.texture = damageTexture
          }

          view.sprite.visible = true
          view.sprite.position.set(enemy.x, enemy.y)
          view.sprite.rotation = enemy.rotation + Math.PI
          view.hurtBox.position.set(enemy.x, enemy.y)
          view.hurtBox.rotation = enemy.rotation + Math.PI
          view.hitBox.position.set(enemy.x, enemy.y)
          view.hitBox.rotation = enemy.rotation + Math.PI
          view.hurtBox.visible = debugEnabledRef.current && enemy.alive
          view.hitBox.visible = debugEnabledRef.current
          view.healthBar.clear()
          if (enemy.alive) {
            const healthRatio = Math.max(0, enemy.health / ENEMY_MAX_HEALTH)
            view.healthBar
              .roundRect(enemy.x - 23, enemy.y - ENEMY_HEIGHT / 2 - 14, 46, 6, 3)
              .fill({ color: 0x24120c, alpha: 0.9 })
              .roundRect(enemy.x - 22, enemy.y - ENEMY_HEIGHT / 2 - 13, 44 * healthRatio, 4, 2)
              .fill({ color: healthRatio > 0.5 ? 0x37c66b : healthRatio > 0.25 ? 0xe0ae36 : 0xdb4545 })
          }
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
          onMatchEnd(createMatchResult(state, matchDurationSeconds, spawnIntervalSeconds, debugEnabledRef.current))
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
      keyboardInputRef.current = undefined
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [matchDurationSeconds, spawnIntervalSeconds, onPause, onTimeUpdate, onMatchEnd])

  return <div ref={hostRef} className="pixi-host" />
}

export default PixiGame
