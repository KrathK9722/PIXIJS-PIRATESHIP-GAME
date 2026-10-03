import { Container, Sprite } from 'pixi.js'
import type { Texture } from 'pixi.js'
import type { IslandState } from '../../../types/types'
import {
  ISLAND_GRASS_TILES,
  ISLAND_SEABED_TILES,
  ISLAND_SAND_TILES,
  ISLAND_TILE_SIZE,
  WATER_TILE_ID,
} from './island'

type TileTextureMap = Map<number, Texture>

function addTileMatrix(
  parent: Container,
  matrix: Array<Array<number | null>>,
  textures: TileTextureMap,
  originX: number,
  originY: number,
): void {
  for (let row = 0; row < matrix.length; row++) {
    for (let column = 0; column < matrix[row].length; column++) {
      const tileId = matrix[row][column]
      if (tileId === null) continue

      const texture = textures.get(tileId)
      if (texture === undefined) {
        throw new Error(`Missing loaded island tile texture: ${tileId}`)
      }

      const sprite = new Sprite(texture)
      sprite.position.set(
        originX + column * ISLAND_TILE_SIZE,
        originY + row * ISLAND_TILE_SIZE,
      )
      parent.addChild(sprite)
    }
  }
}

export function createIslandDisplay(
  textures: TileTextureMap,
  arenaWidth: number,
  arenaHeight: number,
  islands: IslandState[],
): { waterLayer: Container; islandLayer: Container } {
  // WATER AND ISLANDS ARE SEPARATE LAYERS SO WATER EFFECTS (RIPPLES) CAN SIT BETWEEN THEM
  const waterLayer = new Container()
  const islandLayer = new Container()
  const water = textures.get(WATER_TILE_ID)

  if (water === undefined) {
    throw new Error(`Missing loaded water tile texture: ${WATER_TILE_ID}`)
  }

  const columns = Math.ceil(arenaWidth / ISLAND_TILE_SIZE)
  const rows = Math.ceil(arenaHeight / ISLAND_TILE_SIZE)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const waterTile = new Sprite(water)
      waterTile.position.set(column * ISLAND_TILE_SIZE, row * ISLAND_TILE_SIZE)
      waterLayer.addChild(waterTile)
    }
  }

  // DRAW EACH ISLAND LAYER BY LAYER (SEABED, SAND, GRASS AND DECORATION ON TOP)
  for (const island of islands) {
    addTileMatrix(islandLayer, ISLAND_SEABED_TILES, textures, island.x, island.y)
    addTileMatrix(islandLayer, ISLAND_SAND_TILES, textures, island.x, island.y)
    addTileMatrix(islandLayer, ISLAND_GRASS_TILES, textures, island.x, island.y)
    addTileMatrix(islandLayer, island.decorationTiles, textures, island.x, island.y)
  }

  return { waterLayer, islandLayer }
}
