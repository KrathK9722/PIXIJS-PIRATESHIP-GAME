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
- Enemies spawn using the saved spawn interval. Spawn types alternate between Shooter and Chaser. Spawns prefer arena edge positions at least 220 logical pixels from the player.
- Shooters move toward the player until they reach their preferred distance, then hold position or back away. They fire aimed projectiles inside a 320 pixel range, with a 1.5 second cooldown.
- The arena uses the Kenney 64 × 64 tile images. A 5 × 5 visual map layers seabed, sand, grass, and decorations; a matching solid-cell map blocks player/enemy movement and swept projectile paths. Debug mode overlays the solid cells.
- Each enemy has 3 health. Player projectiles remove one health; destroying an enemy awards one point. Shooter hulls use base sprite 2. Chasers choose base sprite 3 through 6. Both keep their hull color when switching to damage textures.
- Enemy entities live in `SimulationState.enemies`; Pixi maintains one reusable render view per entity and removes its display objects after the destruction animation.

## Persistence and Lifecycle

- Player options are stored locally under `pirate-battle.options.v1` and validated when loaded and saved.
- `GameScreen` snapshots player options when a match starts. The completed result includes match/player identifiers, completion time, score, effective duration, finish reason, and the configuration snapshot.
- The latest completed result is stored under `pirate-battle.latest-result.v1`; the result screen reports whether local persistence succeeded. Server history/ranking submission is not implemented yet.
- Pixi initialization is asynchronous. The effect cleanup marks initialization as disposed and destroys the application, supporting React StrictMode's development lifecycle.
- Manual pause, Pixi entity cleanup, and latest-result persistence are implemented. Automatic focus/visibility pause and match abandonment handling remain to be implemented.

## Validation and Gaps

- Strict TypeScript mode is enabled. `npm run build` passed after the current enemy-loop changes.
- Playwright is a dependency, but there is no Playwright configuration or E2E suite yet.
- Ranking/history screens and contracts, MSW scenarios, deploy configuration, performance profiling, and full keyboard/touch gameplay are pending.
