import { useEffect, useRef } from 'react'
import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js'
import { BULLET_RADIUS, MOVEMENT_CONFIG } from './config/config'
import { createKeyboardInput } from './config/input'
import { updateSimulation } from './config/simulation'
import { formatTime } from './config/time'
import type { SimulationState } from '../../types/types'
import './PixiGame.css'
import { createHudCounter } from './config/createHudCounter'

const PLAYER_TEXTURE_URL = '/assets/kenney_piratePack/PNG/Default size/Ships/ship (1).png'

type PixiGameProps = {
  matchDurationSeconds: number
  onTimeUpdate: (secondsRemaining: number) => void
  onMatchEnd: () => void
}

function getRandomInteger(min: number, max: number): number {

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
      health: 10,
    },
    enemy: {
      x: MOVEMENT_CONFIG.arenaWidth / 2,
      y: 120,
      rotation: 0,
      health: 4,
      boatColor: getRandomInteger(2,6),
    },
    bullets: [],
    ripples: [],
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
  playerSprite.width = 48
  playerSprite.height = 96
  return playerSprite
}

function createPlayerRadiusPreview(): Graphics {
  return new Graphics()
    .circle(0, 0, MOVEMENT_CONFIG.playerRadius)
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xff3333, width: 2 })
}

function createEnemySprite(texture: Texture): Sprite {
  const enemySprite = new Sprite(texture)
  enemySprite.anchor.set(0.5)
  enemySprite.width = 48
  enemySprite.height = 96
  return enemySprite
}

function createEnemyRadiusPreview(): Graphics {
  return new Graphics()
    .circle(0, 0, MOVEMENT_CONFIG.enemyRadius)
    .fill({ color: 0xff0000, alpha: 0.25 })
    .stroke({ color: 0xff3333, width: 2 })
}


function PixiGame(props: PixiGameProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const matchDurationSeconds = props.matchDurationSeconds
  const onTimeUpdate = props.onTimeUpdate
  const onMatchEnd = props.onMatchEnd

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

      const enemyTextureURL =`/assets/kenney_piratePack/PNG/Default size/Ships/ship (${state.enemy.boatColor}).png`

      const [
        playerTexture,
        enemyTexture,
        counterPanelTexture,
        timeIconTexture,
        bulletTexture,
      ] = await Promise.all([
        Assets.load<Texture>(PLAYER_TEXTURE_URL),
        Assets.load<Texture>(enemyTextureURL),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/counter_panel.png'),
        Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_time.png'),
        Assets.load<Texture>('/assets/kenney_piratePack/PNG/Default size/Ship parts/cannonBall.png'),
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

      // CREATE WAVES
      const ripplesGraphics = new Graphics()
      newApp.stage.addChild(ripplesGraphics)

      // CREATE PLAYER ON CANVAS
      const playerSprite = createPlayerSprite(playerTexture)
      const playerRadiusPreview = createPlayerRadiusPreview()
      const bulletSprites: Sprite[] = []
      keyboardInput = createKeyboardInput()

      newApp.stage.addChild(playerSprite)
      newApp.stage.addChild(playerRadiusPreview)

      // CREATE ENEMY ON CANVAS
      const enemySprite = createEnemySprite(enemyTexture)
      const enemyRadiusPreview = createEnemyRadiusPreview()

      newApp.stage.addChild(enemySprite)
      newApp.stage.addChild(enemyRadiusPreview)

      // CREATE TIMER ON CANVAS
      const timeCounter = createHudCounter(
        counterPanelTexture,
        timeIconTexture,
        formatTime(matchDurationSeconds),
      )

      timeCounter.container.position.set(24, 16)
      newApp.stage.addChild(timeCounter.container)

      // RUN TIME
      newApp.ticker.add((ticker) => {
        if (state.isFinished) {
          return
        }

        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05)

        updateSimulation(state, keyboardInput?.read() ?? {
          forward: false,
          turnLeft: false,
          turnRight: false,
          shoot: false,
        }, deltaSeconds)
        
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

        // ENEMY
        if (state.enemy !== null) {
          enemySprite.visible = true
          enemyRadiusPreview.visible = true

          enemySprite.position.set(state.enemy.x, state.enemy.y)
          enemySprite.rotation = state.enemy.rotation + Math.PI

          enemyRadiusPreview.position.set(state.enemy.x, state.enemy.y)
        } else {
          enemySprite.visible = false
          enemyRadiusPreview.visible = false
        }

        // PLAYER
        playerSprite.position.set(state.player.x, state.player.y)
        playerSprite.rotation = state.player.rotation + Math.PI
        playerRadiusPreview.position.set(state.player.x, state.player.y)

        // DRAW BULLETS
        while (bulletSprites.length < state.bullets.length) {
          const sprite = new Sprite(bulletTexture)

          sprite.anchor.set(0.5)
          sprite.width = BULLET_RADIUS * 2
          sprite.height = BULLET_RADIUS * 2

          newApp.stage.addChild(sprite)
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
