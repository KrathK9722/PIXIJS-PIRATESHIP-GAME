# Architecture

## Current Runtime Flow

1. `src/main.tsx` mounts `App` inside React `StrictMode`.
2. `src/App.tsx` owns the current screen state and renders the menu, options, game, or result screen.
3. Screen components own their interface and use callbacks passed by `App` for navigation.
4. `OptionsScreen` validates values with `src/game/config.ts` and persists them through `src/services/optionsStorage.ts` in browser local storage.
5. `GameScreen` renders `PixiGame`. `PixiGame` creates a PixiJS v8 `Application` in a React effect, attaches its canvas to a host element, and destroys it during cleanup.

## Intended Responsibilities

- React owns menus, forms, HUD, pause/results UI, and navigation. It should not update React state on every simulation frame.
- PixiJS owns the arena display, ships, projectiles, health indicators, and visual effects.
- `src/game/simulation.ts` will own deterministic gameplay updates; `src/game/input.ts` will translate keyboard/touch state into movement and attack input; `src/game/config.ts` will centralize tunable gameplay values.
- Axios and TanStack Query will own ranking/history requests and cache state. MSW will provide the REST handlers and fixtures used in development and tests.

These are target boundaries. The simulation, input, ranking/history API, Query hooks, and MSW handlers are not implemented yet.

## Persistence and Lifecycle

- Player options are stored locally under `pirate-battle.options.v1` and validated when loaded and saved.
- Each match should copy the current options into a match-start snapshot; this is not implemented yet.
- Pixi initialization is asynchronous. The effect cleanup marks initialization as disposed and destroys the application, supporting React StrictMode's development lifecycle.
- Match abandonment, pause/focus handling, entity/resource cleanup, and result persistence remain to be implemented.

## Validation and Gaps

- `npm run build` and `npm run lint` passed on 2026-10-02; strict TypeScript mode is enabled.
- Playwright is a dependency, but there is no Playwright configuration or E2E suite yet.
- Ranking/history screens and contracts, MSW scenarios, deploy configuration, performance profiling, and full keyboard/touch gameplay are pending.
