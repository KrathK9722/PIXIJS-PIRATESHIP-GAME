# Kenney Pirate Pack Tile Reference

Source: `public/assets/kenney_piratePack/PNG/Default size/Tiles/`.
Each numbered image is a 64 × 64 tile. The numbers below refer to the file suffix in `tile_XX.png`.

## Sand shoreline and seabed

| Tile | Meaning |
| --- | --- |
| 1 | Upper-left sand corner |
| 2 | Upper sand edge |
| 3 | Upper-right sand corner  |
| 4 | Lower-right sand corner |
| 5 | Lower-left sand corner |
| 10 | Upper-left seabed-to-water corner |
| 11 | Upper seabed-to-water edge |
| 12 | Upper-right seabed-to-water corner |
| 17 | Left sand edge |
| 18 | Sand center |
| 19 | Right sand edge |
| 20 | Upper-right sand corner |
| 21 | Upper-left sand corner |
| 26 | Left seabed-to-water edge |
| 27 | Seabed center |
| 28 | Right seabed-to-water edge |
| 33 | Lower-left sand corner |
| 34 | Lower sand edge |
| 35 | Lower-right sand corner |
| 42 | Lower-left seabed-to-water corner |
| 43 | Lower seabed-to-water edge |
| 44 | Lower-right seabed-to-water corner |
| 58 | Lower-right seabed-to-water corner interior |
| 59 | Lower-left seabed-to-water corner interior|
| 68 | Sand center texture |
| 69 | Lower-right sand corner |
| 73 | Water texture |
| 74 | Upper-right seabed-to-water corner interior |
| 75 | Upper-left seabed-to-water corner interior |

## Grass shoreline and island interior

| Tile | Meaning |
| --- | --- |
| 6 | Upper-left sand-to-grass corner |
| 7 | Variation of tile 8 |
| 8 | Upper sand-to-grass edge |
| 9 | Upper-right sand-to-grass corner |
| 22 | Left sand-to-grass edge |
| 23 | Grass center |
| 24 | Grass center with sand specks |
| 25 | Right sand-to-grass edge |
| 36 | Sand-to-grass corner variation |
| 37 | Sand-to-grass diagonal corner variation |
| 38 | Left sand-to-grass edge |
| 39 | Grass center variation |
| 40 | Lower-right sand-to-grass corner |
| 41 | Right sand-to-grass edge |
| 52 | Sand-to-grass diagonal corner variation |
| 53 | Sand-to-grass diagonal corner variation |
| 54 | Lower-left sand-to-grass corner |
| 55 | Variation of tile 56 |
| 56 | Lower sand-to-grass edge |
| 57 | Lower-right sand-to-grass corner |
| 82 | Shipwreck on a grass-centered tile |
| 84 | Mast/ship detail on a grass-centered tile |
| 86 | Rock detail on a grass-centered tile |

## Rocks, plants, and landmarks

| Tile | Meaning |
| --- | --- |
| 49 | Small rock |
| 50 | Medium rock |
| 51 | Medium rock variation |
| 65 | Small rock variation |
| 66 | Medium rock variation |
| 67 | Small rock variation |
| 70 | Medium leaves |
| 71 | Large palm |
| 72 | Small palm or bush |
| 81 | Shipwreck on lower sand edge |
| 83 | Shipwreck with mast |
| 85 | Rock with grass detail |
| 87 | Small leaf |
| 88 | Three small leaves |

## First island layout

`src/components/Experience/config/island.ts` holds the visual tile matrices and the matching solid-cell mask. The first island is a 5 × 5 tile composition (320 × 320 logical pixels) at `(576, 128)`. It layers the seabed transition, a 3 × 3 sand-and-grass core, then the palm, foliage, rocks, and shipwreck. Tile 73 fills the water behind it.

The center 3 × 3 cells form the solid collision area. Ships use a circular approximation of their hull while moving against those cells; bullets use a swept segment check so they cannot pass through the island between frames. The seabed border is visual and remains navigable. Debug mode shows the solid cells as a translucent red overlay.
