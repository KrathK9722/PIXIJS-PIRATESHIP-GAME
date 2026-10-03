export const ISLAND_TILE_SIZE = 64
export const WATER_TILE_ID = 73

// HOW MANY ISLANDS CAN APPEAR IN ONE MATCH
export const ISLAND_MIN_COUNT = 1
export const ISLAND_MAX_COUNT = 2

// MINIMUM DISTANCE BETWEEN THE ISLAND LAND AND WHERE THE BOATS START
export const ISLAND_SAFE_DISTANCE = 120

// CHANCE (0 TO 1) OF EACH LAND TILE GETTING A DECORATION
export const ISLAND_DECORATION_CHANCE = 0.5

// ISLAND HITBOX (ROUNDRECT THAT COVERS ONLY THE LAND, THE 3x3 TILES IN THE MIDDLE)
export const ISLAND_HITBOX_OFFSET = 64
export const ISLAND_HITBOX_SIZE = 192
export const ISLAND_HITBOX_CORNER_RADIUS = 48

// ROCKS (65, 66, 67) AND PLANTS (70, 71, 72, 87, 88)
export const ISLAND_DECORATION_TILE_IDS = [65, 66, 67, 70, 71, 72, 87, 88]

export const ISLAND_SEABED_TILES: Array<Array<number | null>> = [
  [10, 11, 11, 11, 12],
  [26, 27, 27, 27, 28],
  [26, 27, 27, 27, 28],
  [26, 27, 27, 27, 28],
  [42, 43, 43, 43, 44],
]

export const ISLAND_SAND_TILES: Array<Array<number | null>> = [
  [null, null, null, null, null],
  [null, 1, 2, 3, null],
  [null, 17, 18, 19, null],
  [null, 33, 34, 35, null],
  [null, null, null, null, null],
]

export const ISLAND_GRASS_TILES: Array<Array<number | null>> = [
  [null, null, null, null, null],
  [null, 6, 8, 9, null],
  [null, 22, 24, 25, null],
  [null, 54, 56, 57, null],
  [null, null, null, null, null],
]

// TRUE = LAND 
export const ISLAND_SOLID_TILES: boolean[][] = [
  [false, false, false, false, false],
  [false, true, true, true, false],
  [false, true, true, true, false],
  [false, true, true, true, false],
  [false, false, false, false, false],
]

export const ISLAND_TILE_IDS = [...new Set([
  WATER_TILE_ID,
  ...ISLAND_SEABED_TILES.flat(),
  ...ISLAND_SAND_TILES.flat(),
  ...ISLAND_GRASS_TILES.flat(),
  ...ISLAND_DECORATION_TILE_IDS,
].filter((tileId): tileId is number => tileId !== null))]
