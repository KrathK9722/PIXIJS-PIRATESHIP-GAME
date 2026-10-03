# Architecture

## Current Runtime Flow

1. `src/main.tsx` starts the MSW worker first, so the first API requests are already mocked. If the worker cannot start, a warning is logged and the game still opens; only ranking and history fail. It then mounts `App` inside React `StrictMode` and a TanStack `QueryClientProvider`.
2. `src/App.tsx` owns the current screen state and renders the menu, options, game, result, ranking, or match history screen. On startup and on the browser `online` event it resends matches left in the pending queue.
3. Screen components own their interface and use callbacks passed by `App` for navigation.
4. `OptionsScreen` validates values with `src/components/Experience/config/config.ts` and persists them through `src/services/optionsStorage.ts` in browser local storage.
5. `GameScreen` renders `PixiGame`. `PixiGame` creates a PixiJS v8 `Application` in a React effect, attaches its canvas to a host element, and destroys it during cleanup.

## Responsibilities

- React owns menus, forms, HUD, pause/results UI, ranking/history screens, and navigation. It does not update React state on every simulation frame.
- PixiJS owns the arena display, ships, projectiles, health indicators, and visual effects.
- `src/components/Experience/config/simulation.ts` owns time based gameplay updates; `input.ts` translates keyboard state into movement and attack input; `config.ts` centralizes movement, combat, enemy, and player option values.
- Axios (`src/services/api.ts`) performs the ranking/history requests. TanStack Query (`src/services/queries.ts`) owns their cache, retries, refetching, and match registration. MSW (`src/mocks/`) provides the REST handlers and fixtures used in development and in the published build.

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

## Ranking and Match History

### Contracts

All API types live in `src/types/types.ts`:

- `MatchRecord`: a stored match. It is the `MatchResult` (match ID, player ID, completion date, score, effective duration, finish reason, configuration snapshot) plus `playerName`.
- `RankingEntry`: one ranking row. `rank` is the position in the whole sorted list, not in the page.
- `Page<T>`: `items`, `page` (starting at 1), `pageSize`, `totalItems`, `totalPages`.
- `SubmitMatchRequest` / `SubmitMatchResponse`: the `POST /api/matches` body and answer. `created` is `false` when the match already existed.
- `ApiError`: `{ message }`, returned with 4xx responses.

The game is single-player, so the local player has a fixed ID (`local-player`) and name (`You`) in `src/services/player.ts`.

### Mock API (MSW)

- `src/mocks/handlers.ts` implements `GET /api/ranking`, `GET /api/players/:playerId/matches` and `POST /api/matches`. The same handlers are meant to be shared by development, tests and the demo.
- Data is the union of fixed fixtures and the matches the player registered, which are stored under `pirate-battle.mock-db.v1` so confirmed records survive a refresh and appear in both tabs.
- Fixtures (`src/mocks/fixtures.ts`) are 25 rival players with 5 matches each, generated by a seeded random number generator (Mulberry32). The seed is drawn once per browser and saved under `pirate-battle.fixture-seed.v1`: different browsers see different rivals, while the ranking stays stable between refreshes. Tests can write a known seed to that key to get a reproducible dataset.
- The ranking only includes matches with the requested configuration (duration and spawn interval) and is sorted deterministically: higher score, shorter duration, earlier date, then match ID.
- `POST /api/matches` validates the body (400 when invalid) and is idempotent by `matchId`: a new match returns 201, a resend returns 200 with the existing record.

### Client and cache

- `api.ts` creates an Axios client with `baseURL: '/api'` and an 8 second timeout. `isRetryableError` treats timeouts, connection failures and 5xx responses as retryable; 4xx responses are not retried.
- `queries.ts` configures the `QueryClient`: up to 2 retries for retryable errors and a 30 second `staleTime`.
- `useRanking(configuration, page)` and `useMatchHistory(page)` use one query key per page (`queryKeys`), pass TanStack's `signal` to Axios so requests that are no longer needed are cancelled, and use `keepPreviousData` so the previous page stays visible while the next one loads. A late answer for an old page is stored under its own key and never replaces the page on screen.
- `refetchOnMount: 'always'` refreshes both tabs every time they are opened. A background refetch shows "Updating…"; a failed refetch keeps the cached data on screen with a notice.

### Match registration and pending recovery

1. When a match ends, `App` saves the latest result and adds the match to the pending queue (`src/services/pendingMatches.ts`, key `pirate-battle.pending-matches.v1`) **before** anything is sent, so closing the page mid-request does not lose it.
2. `ResultScreen` sends it with the `useSubmitMatch` mutation and shows the status (saving, saved, failed with **Retry**, or rejected).
3. `registerMatch` keeps a map of requests in flight by `matchId`. Sending the same match while a request is running (repeated clicks, React StrictMode effects, startup sync) reuses that request.
4. On success the match is removed from the queue and the `ranking` and `match-history` queries are invalidated, so both tabs show it. On a 4xx error the match is removed too, because the server will never accept it. On a retryable error it stays queued.
5. `App` resends every queued match on startup and on the `online` event. Because the server is idempotent, a retry after a timeout that was actually saved recovers the existing record instead of duplicating it.

Registration runs outside the combat screen, so API failures never block playing, the options, or starting a new match.

## Persistence and Lifecycle

- Player options are stored locally under `pirate-battle.options.v1` and validated when loaded and saved.
- `GameScreen` snapshots player options when a match starts. The completed result includes match/player identifiers, completion time, score, effective duration, finish reason, and the configuration snapshot.
- The latest completed result is stored under `pirate-battle.latest-result.v1`; the result screen reports whether local persistence succeeded.
- Ranking/history data uses `pirate-battle.pending-matches.v1` (matches waiting to be registered), `pirate-battle.mock-db.v1` (matches confirmed by the mock server) and `pirate-battle.fixture-seed.v1` (rival players seed).
- Pixi initialization is asynchronous. The effect cleanup marks initialization as disposed and destroys the application, supporting React StrictMode's development lifecycle.
- Manual pause, automatic pause when the window loses focus or the tab is hidden, Pixi entity cleanup, and latest-result persistence are implemented. Match abandonment handling remains to be implemented.

## Validation and Gaps

- Strict TypeScript mode is enabled. `npm run build` passes.
- The game is deployed on Vercel as a static Vite site; `public/mockServiceWorker.js` is committed so the mock API also works there.
- Playwright is a dependency, but there is no Playwright configuration or E2E suite yet.
- Configurable network failure scenarios (slow, variable latency, out-of-order responses, timeout, 4xx/5xx) and a scenario selector are pending. Failures can currently be reproduced with the browser's offline mode.
- Performance profiling and touch controls are pending.
