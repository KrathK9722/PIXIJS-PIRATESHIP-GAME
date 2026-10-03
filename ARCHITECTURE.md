# Architecture

## Current Runtime Flow

1. `src/main.tsx` mounts `App` inside React `StrictMode`.
2. `src/App.tsx` owns the current screen state and renders the menu, options, game, or result screen.
3. Screen components own their interface and use callbacks passed by `App` for navigation.
4. `OptionsScreen` validates values with `src/components/Experience/config/config.ts` and persists them through `src/services/optionsStorage.ts` in browser local storage.
5. `GameScreen` renders `PixiGame`. `PixiGame` creates a PixiJS v8 `Application` in a React effect, attaches its canvas to a host element, and destroys it during cleanup.

## Intended Responsibilities

- React owns menus, forms, HUD, pause/results UI, and navigation. It should not update React state on every simulation frame.
- PixiJS owns the arena display, ships, projectiles, health indicators, and visual effects.
- `src/components/Experience/config/simulation.ts` owns time based gameplay updates; `input.ts` translates keyboard state into movement and attack input; `config.ts` centralizes movement, combat, enemy, and player option values.
- Axios and TanStack Query will own ranking/history requests and cache state. MSW will provide the REST handlers and fixtures used in development and tests.

The ranking/history API, Query hooks, and MSW handlers are not implemented yet.

## Current Combat Loop

- The simulation advances using elapsed seconds from the Pixi ticker, capped to 50 ms per update. A paused match skips simulation updates, so movement, spawn time, and weapon cooldowns freeze together.
- The player can move, turn, fire forward, and fire a three-projectile side volley. Projectiles expire after one second or when they leave the arena.
- A Chaser begins each match and moves toward the player. It explodes on hull contact, deals 3 damage, and awards no points.
- Enemies spawn using the saved spawn interval. Spawn types alternate between Shooter and Chaser.
- Spawn points are eight positions outside the visible arena (`ENEMY_SPAWN_OFFSCREEN_MARGIN` beyond each edge). A point is valid when the place where the enemy enters the arena is not blocked by an island and the point is at least `ENEMY_SPAWN_SAFE_DISTANCE` (220) from the player. The two valid points farthest from the player are kept and one is picked at random, so the player cannot camp a single spawn.
- A new enemy starts facing the arena center. While it is still off-screen, the arena limit only stops it from moving further out; the limit tightens as it sails in, until it is fully inside and clamped like any other ship. Shooters do not fire while off-screen.
- Enemy steering combines the direction to the target (the player, or a point beside an island in the way) with a push away from every other alive enemy closer than `ENEMY_AVOID_DISTANCE`. The push grows as the other enemy gets closer and is scaled by `ENEMY_AVOID_STRENGTH`.
- Enemies also collide with each other. After movement, each pair of alive enemies fully inside the arena is separated with the same capsule test used for the player (`separateBoatCapsules`), but each enemy takes half of the push. A crash removes `ENEMY_CRASH_DAMAGE` health from both enemies, guarded by a per-enemy `crashCooldown` so touching ships do not take damage every frame. A crash kill awards no points. Enemies are pushed back out of islands and into the arena afterwards.
- Shooters move toward the player until they reach their preferred distance, then hold position or back away. They fire aimed projectiles inside a 320 pixel range, with a 1.5 second cooldown.
- The arena uses the Kenney 64 × 64 tile images. Islands are placed at random positions at the start of each match, away from the player and first enemy spawn. Each island layers seabed, sand, grass and random decorations, and uses a rounded-rectangle hitbox that blocks ships and projectiles. Debug mode overlays the island hitboxes.
- Draw order inside the world container is: water, ripples, islands, then bullets, ships and effects. `createIslandDisplay` returns the water and island tiles as two separate layers so water effects such as bullet ripples never draw over land.
- Each enemy has 3 health. Player projectiles remove one health; destroying an enemy awards one point. Shooter hulls use base sprite 2. Chasers choose base sprite 3 through 6. Both keep their hull color when switching to damage textures.
- Enemy entities live in `SimulationState.enemies`; Pixi maintains one reusable render view per entity and removes its display objects after the destruction animation.

## Persistence and Lifecycle

- Player options are stored locally under `pirate-battle.options.v1` and validated when loaded and saved.
- `GameScreen` snapshots player options when a match starts. The completed result includes match/player identifiers, completion time, score, effective duration, finish reason, and the configuration snapshot.
- The latest completed result is stored under `pirate-battle.latest-result.v1`; the result screen reports whether local persistence succeeded. Server history/ranking submission is not implemented yet.
- Pixi initialization is asynchronous. The effect cleanup marks initialization as disposed and destroys the application, supporting React StrictMode's development lifecycle.
- Manual pause, automatic pause when the window loses focus or the tab is hidden, Pixi entity cleanup, and latest-result persistence are implemented. Match abandonment handling remains to be implemented.

## Validation and Gaps

- Strict TypeScript mode is enabled. `npm run build` passes after the current enemy-loop changes.
- The game is deployed on Vercel as a static Vite site.
- Playwright is a dependency, but there is no Playwright configuration or E2E suite yet.
- Ranking/history screens and contracts, MSW scenarios, performance profiling, and touch controls are pending.
