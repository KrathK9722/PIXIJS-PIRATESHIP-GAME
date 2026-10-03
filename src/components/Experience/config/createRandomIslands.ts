import type { IslandState } from '../../../types/types'
import {
  ISLAND_DECORATION_CHANCE,
  ISLAND_DECORATION_TILE_IDS,
  ISLAND_HITBOX_CORNER_RADIUS,
  ISLAND_HITBOX_OFFSET,
  ISLAND_HITBOX_SIZE,
  ISLAND_MAX_COUNT,
  ISLAND_MIN_COUNT,
  ISLAND_SAFE_DISTANCE,
  ISLAND_SOLID_TILES,
  ISLAND_TILE_SIZE,
} from './island'
import { getRandomInteger } from './random'
import { circleOverlapsIsland } from './simulation'

// HOW MANY RANDOM POSITIONS WE TRY FOR EACH ISLAND BEFORE GIVING UP
const MAX_PLACEMENT_ATTEMPTS = 50

// CREATE RANDOM DECORATION ONLY ON LAND TILES
function createRandomDecorationTiles(): Array<Array<number | null>> {
  const decorationTiles: Array<Array<number | null>> = []

  for (let row = 0; row < ISLAND_SOLID_TILES.length; row++) {
    const decorationRow: Array<number | null> = []

    for (let column = 0; column < ISLAND_SOLID_TILES[row].length; column++) {
      const isLand = ISLAND_SOLID_TILES[row][column]

      if (isLand && Math.random() < ISLAND_DECORATION_CHANCE) {
        const randomIndex = getRandomInteger(0, ISLAND_DECORATION_TILE_IDS.length - 1)
        decorationRow.push(ISLAND_DECORATION_TILE_IDS[randomIndex])
      } else {
        decorationRow.push(null)
      }
    }

    decorationTiles.push(decorationRow)
  }

  return decorationTiles
}

// CHECK IF TWO ISLANDS (WHOLE 5x5 SQUARE) ARE ON TOP OF EACH OTHER
function islandsOverlap(firstIsland: IslandState, secondIsland: IslandState): boolean {
  const islandWidth = ISLAND_SOLID_TILES[0].length * ISLAND_TILE_SIZE
  const islandHeight = ISLAND_SOLID_TILES.length * ISLAND_TILE_SIZE

  const firstIsLeftOfSecond = firstIsland.x + islandWidth <= secondIsland.x
  const firstIsRightOfSecond = firstIsland.x >= secondIsland.x + islandWidth
  const firstIsAboveSecond = firstIsland.y + islandHeight <= secondIsland.y
  const firstIsBelowSecond = firstIsland.y >= secondIsland.y + islandHeight

  return !(firstIsLeftOfSecond || firstIsRightOfSecond || firstIsAboveSecond || firstIsBelowSecond)
}

// CREATE 1 TO 2 ISLANDS IN RANDOM PLACES
export function createRandomIslands(
  arenaWidth: number,
  arenaHeight: number,
  protectedPoints: Array<{ x: number; y: number }>,
): IslandState[] {
  const islands: IslandState[] = []
  const islandCount = getRandomInteger(ISLAND_MIN_COUNT, ISLAND_MAX_COUNT)

  // LAST COLUMN AND ROW WHERE THE WHOLE ISLAND STILL FITS INSIDE THE ARENA
  const maxColumn = Math.floor(arenaWidth / ISLAND_TILE_SIZE) - ISLAND_SOLID_TILES[0].length
  const maxRow = Math.floor(arenaHeight / ISLAND_TILE_SIZE) - ISLAND_SOLID_TILES.length

  for (let islandNumber = 0; islandNumber < islandCount; islandNumber++) {
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const islandX = getRandomInteger(0, maxColumn) * ISLAND_TILE_SIZE
      const islandY = getRandomInteger(0, maxRow) * ISLAND_TILE_SIZE
      const newIsland: IslandState = {
        x: islandX,
        y: islandY,
        hitBox: {
          x: islandX + ISLAND_HITBOX_OFFSET,
          y: islandY + ISLAND_HITBOX_OFFSET,
          width: ISLAND_HITBOX_SIZE,
          height: ISLAND_HITBOX_SIZE,
          cornerRadius: ISLAND_HITBOX_CORNER_RADIUS,
        },
        decorationTiles: createRandomDecorationTiles(),
      }

      // DON'T PUT LAND ON TOP OF WHERE A BOAT STARTS
      let isNearProtectedPoint = false
      for (const point of protectedPoints) {
        if (circleOverlapsIsland(point.x, point.y, ISLAND_SAFE_DISTANCE, newIsland)) {
          isNearProtectedPoint = true
        }
      }

      // DON'T PUT ONE ISLAND ON TOP OF ANOTHER
      let isOverAnotherIsland = false
      for (const island of islands) {
        if (islandsOverlap(newIsland, island)) {
          isOverAnotherIsland = true
        }
      }

      if (!isNearProtectedPoint && !isOverAnotherIsland) {
        islands.push(newIsland)
        break
      }
    }
  }

  return islands
}
