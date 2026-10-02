import { useEffect, useRef } from 'react'
import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js'
import { MOVEMENT_CONFIG } from './config'
import { createKeyboardInput } from './input'
import { updateSimulation } from './simulation'
import { formatTime } from './time'
import type { SimulationState } from './types'
import './PixiGame.css'
import { createHudCounter } from './hud/createHudCounter'

const PLAYER_TEXTURE_URL = '/assets/kenney_piratePack/PNG/Default size/Ships/ship (1).png'

type PixiGameProps = {
  matchDurationSeconds: number
  onTimeUpdate: (secondsRemaining: number) => void
  onMatchEnd: () => void
}

function createInitialSimulationState(matchDurationSeconds: number): SimulationState {
  return {
    player: {
      x: MOVEMENT_CONFIG.arenaWidth / 2,
      y: MOVEMENT_CONFIG.arenaHeight / 2,
      rotation: 0,
    },
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

      const [playerTexture, counterPanelTexture, timeIconTexture] =
        await Promise.all([
          Assets.load<Texture>(PLAYER_TEXTURE_URL),
          Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/counter_panel.png'),
          Assets.load<Texture>('/assets/jungleGaming/png/default/ui/hud/icon_time.png'),
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

      const state = createInitialSimulationState(matchDurationSeconds)
      const playerSprite = createPlayerSprite(playerTexture)
      const playerRadiusPreview = createPlayerRadiusPreview()
      keyboardInput = createKeyboardInput()

      newApp.stage.addChild(playerSprite)
      newApp.stage.addChild(playerRadiusPreview)

      const timeCounter = createHudCounter(
        counterPanelTexture,
        timeIconTexture,
        formatTime(matchDurationSeconds),
      )

      timeCounter.container.position.set(24, 16)
      newApp.stage.addChild(timeCounter.container)

      newApp.ticker.add((ticker) => {
        if (state.isFinished) {
          return
        }

        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05)

        updateSimulation(state, keyboardInput?.read() ?? {
          forward: false,
          turnLeft: false,
          turnRight: false,
        }, deltaSeconds)

        playerSprite.position.set(state.player.x, state.player.y)
        playerSprite.rotation = state.player.rotation + Math.PI
        playerRadiusPreview.position.set(state.player.x, state.player.y)

        const secondsRemaining = Math.max(
          0,
          Math.ceil(state.matchDurationSeconds - state.elapsedSeconds),
        )

        if (secondsRemaining !== lastReportedSeconds) {
          lastReportedSeconds = secondsRemaining
          timeCounter.setValue(formatTime(secondsRemaining))
          onTimeUpdate(secondsRemaining)
        }

        if (state.isFinished && !matchEndReported) {
          matchEndReported = true
          onMatchEnd()
        }
      })
    }

    void initializePixi().catch((error: unknown) => {
      console.error('PixiJS initialization failed:', error)
    })

    return () => {
      disposed = true
      keyboardInput?.destroy()
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [matchDurationSeconds, onTimeUpdate, onMatchEnd])

  return <div ref={hostRef} className="pixi-host" />
}

export default PixiGame