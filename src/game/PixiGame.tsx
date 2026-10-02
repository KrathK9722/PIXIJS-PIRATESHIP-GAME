import { useEffect, useRef } from 'react'
import { Application, Assets, Graphics, Sprite, Texture } from 'pixi.js'
import { ISLANDS, MOVEMENT_CONFIG } from './config'
import { createKeyboardInput } from './input'
import { updateSimulation } from './simulation'

import type { SimulationState } from './types'
import './PixiGame.css'

const PLAYER_TEXTURE_URL = '/assets/png/default/ships/ship_1.png'

function PixiGame() {
  const hostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let disposed = false
    let app: Application | null = null
    const keyboardInput = createKeyboardInput()

    async function initializePixi() {
      const host = hostRef.current

      if (host === null) {
        return
      }

      const playerTexture = await Assets.load<Texture>(PLAYER_TEXTURE_URL)

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

      const state: SimulationState = {
        player: {
          x: MOVEMENT_CONFIG.arenaWidth / 2,
          y: MOVEMENT_CONFIG.arenaHeight / 2,
          rotation: 0,
        },
        config: MOVEMENT_CONFIG,
        islands: ISLANDS,
      }

      const playerSprite = new Sprite(playerTexture)
      playerSprite.anchor.set(0.5)
      playerSprite.width = 48
      playerSprite.height = 96
      newApp.stage.addChild(playerSprite)

      newApp.ticker.add((ticker) => {
        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.05)

        updateSimulation(state, keyboardInput.read(), deltaSeconds)

        playerSprite.position.set(state.player.x, state.player.y)
        playerSprite.rotation = state.player.rotation + Math.PI

        playerRadiusPreview.position.set(state.player.x, state.player.y)
      })
      const playerRadiusPreview = new Graphics()
      .circle(0, 0, MOVEMENT_CONFIG.playerRadius)
      .fill({ color: 0xff0000, alpha: 0.25 })
      .stroke({ color: 0xff3333, width: 2 })

      playerRadiusPreview.position.set(state.player.x, state.player.y)
      newApp.stage.addChild(playerRadiusPreview)

      for (const island of state.islands) {
        const islandGraphic = new Graphics()
        .circle(0, 0, island.radius)
        .fill({ color: 0x806b3d })
        .stroke({ color: 0x4d452e, width: 8 })

        islandGraphic.position.set(island.x, island.y)
        newApp.stage.addChild(islandGraphic)
      }
    }
    

    void initializePixi().catch((error: unknown) => {
      console.error('PixiJS initialization failed:', error)
    })
    
    return () => {
      disposed = true
      keyboardInput.destroy()
      app?.destroy({ removeView: true }, { children: true })
    }
  }, [])

  return <div ref={hostRef} className="pixi-host" />
}

export default PixiGame