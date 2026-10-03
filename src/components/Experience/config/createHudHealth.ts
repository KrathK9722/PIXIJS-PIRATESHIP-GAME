import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { Texture } from 'pixi.js'

type HealthFillTextures = {
  green: Texture
  amber: Texture
  red: Texture
}

const HEALTH_FRAME_WIDTH = 256
const HEALTH_FRAME_HEIGHT = 48
const HEALTH_FRAME_X = 52
const HEALTH_FILL_INSET_X = 28
const HEALTH_FILL_WIDTH = 200

export function createHudHealth(
  frameTexture: Texture,
  heartTexture: Texture,
  fillTextures: HealthFillTextures,
  currentHealth: number,
  maxHealth: number,
) {
  const container = new Container()

  const heart = new Sprite(heartTexture)
  heart.width = HEALTH_FRAME_HEIGHT
  heart.height = HEALTH_FRAME_HEIGHT
  container.addChild(heart)

  const frame = new Sprite(frameTexture)
  frame.position.set(HEALTH_FRAME_X, 0)
  frame.width = HEALTH_FRAME_WIDTH
  frame.height = HEALTH_FRAME_HEIGHT
  container.addChild(frame)

  const fill = new Sprite(fillTextures.green)
  fill.position.set(HEALTH_FRAME_X, 0)
  fill.width = HEALTH_FRAME_WIDTH
  fill.height = HEALTH_FRAME_HEIGHT
  container.addChild(fill)

  const fillMask = new Graphics()
  fill.mask = fillMask
  container.addChild(fillMask)

  const valueText = new Text({
    text: '',
    style: {
      fontFamily: 'Arial',
      fontSize: 18,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x102028, width: 3 },
    },
  })
  valueText.anchor.set(0.5)
  valueText.position.set(
    HEALTH_FRAME_X + HEALTH_FRAME_WIDTH / 2,
    HEALTH_FRAME_HEIGHT / 2,
  )
  container.addChild(valueText)

  function setValue(health: number, healthMaximum: number) {
    const percentage = healthMaximum > 0
      ? Math.max(0, Math.min(1, health / healthMaximum))
      : 0

    fill.texture = percentage > 0.5
      ? fillTextures.green
      : percentage > 0.25
        ? fillTextures.amber
        : fillTextures.red
    fillMask.clear()
    fillMask
      .rect(
        HEALTH_FRAME_X + HEALTH_FILL_INSET_X,
        0,
        HEALTH_FILL_WIDTH * percentage,
        HEALTH_FRAME_HEIGHT,
      )
      .fill(0xffffff)
    valueText.text = `${Math.round(percentage * 100)}/100`
  }

  setValue(currentHealth, maxHealth)

  return {
    container,
    setValue,
  }
}