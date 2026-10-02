import { Container, Sprite, Text } from 'pixi.js'
import type { Texture } from 'pixi.js'

export function createHudCounter(
  panelTexture: Texture,
  iconTexture: Texture,
  initialValue: string,
) {
  const container = new Container()

  const background = new Sprite(panelTexture)
  background.width = 160
  background.height = 56
  container.addChild(background)

  const icon = new Sprite(iconTexture)
  icon.anchor.set(0.5)
  icon.width = 44
  icon.height = 44
  icon.position.set(28, 28)
  container.addChild(icon)

  const valueText = new Text({
    text: initialValue,
    style: {
      fontFamily: 'Arial',
      fontSize: 22,
      fontWeight: 'bold',
      fill: 0xffffff,
      stroke: { color: 0x102028, width: 3 },
    },
  })
  valueText.anchor.set(0, 0.5)
  valueText.position.set(62, 28)
  container.addChild(valueText)

  return {
    container,
    setValue(value: string) {
      valueText.text = value
    },
  }
}