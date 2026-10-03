# Pirate Battle

A top-down 2D naval shooter built with **React**, **TypeScript (strict)** and **PixiJS v8**.
Sail between islands, sink enemy ships and score as many points as you can before the timer runs out.

**Live demo: https://pixijs-pirateship-game.vercel.app/** 

---

## Tech stack

| Responsibility        | Technology                      |
| --------------------- | ------------------------------- |
| Menus and interface   | React 19                        |
| Language              | TypeScript (strict mode)        |
| Game rendering        | PixiJS 8                        |
| Build tool            | Vite                            |
| Linting               | ESLint + typescript-eslint      |
| Ranking/history remote state | TanStack Query 5         |
| HTTP client           | Axios                           |
| API mocking           | MSW 3 (also runs in the published build) |

Playwright is installed, but there are no E2E tests yet (see [Project status](#project-status)).

---

## Getting started

### Requirements

- Node.js 20 or newer
- npm

### Setup

```bash
git clone https://github.com/KrathK9722/PIXIJS-PIRATESHIP-GAME.git
cd PIXIJS-PIRATESHIP-GAME
npm install
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`).

### Environment variables

None. The game runs entirely in the browser and needs no private services.

---

## Commands

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the development server with hot reload       |
| `npm run build`     | Type-check (`tsc -b`) and build for production     |
| `npm run preview`   | Serve the production build locally                 |
| `npm run lint`      | Run ESLint                                         |
| `npx tsc -b`        | Run only the TypeScript type check                 |

---

## Controls

| Action                 | Keyboard              |
| ---------------------- | --------------------- |
| Move forward           | `W` or `↑`            |
| Turn left              | `A` or `←`            |
| Turn right             | `D` or `→`            |
| Front shot (1 bullet)  | `Space`               |
| Left side volley (3)   | `Q`                   |
| Right side volley (3)  | `E`                   |
| Pause                  | Pause button (top-right of the arena) |

You can move and shoot at the same time. Holding a fire key does not auto-fire: each press fires once.

The game also **pauses automatically** when the window loses focus or the tab is hidden. Resuming requires clicking **Resume** in the pause menu.

---

## Gameplay

- **Player:** 12 health. Moves forward and rotates. Fires a front shot and three-bullet side volleys.
- **Chaser:** chases the player and explodes on contact, dealing 3 damage. A Chaser that explodes on the player **does not** award points.
- **Shooter:** approaches the player, keeps a preferred distance, and fires aimed shots when within range.
- **Enemy spawns:** enemies spawn off-screen and sail into the arena. Each spawn is picked at random between the two valid points farthest from the player, so there is no single spawn to camp. Shooters only fire after entering the arena.
- **Enemy avoidance:** enemies steer away from each other while chasing the player.
- **Enemy crashes:** when two enemies collide, each loses 1 health (with a 1 second cooldown between crashes). An enemy destroyed by a crash **does not** award points.
- **Islands:** block ships and projectiles.
- **Scoring:** each enemy destroyed by the player's shots is worth 1 point.
- **End of match:** when the timer reaches zero or the player's health reaches zero.
- **Visual damage:** ship sprites change as health drops. Health bars are shown above every ship.

---

## Gameplay configuration

All balancing values live in one typed file:
[`src/components/Experience/config/config.ts`](src/components/Experience/config/config.ts)

You can change these values there without touching the game systems:

| Constant                            | Default      | Meaning                                 |
| ----------------------------------- | ------------ | --------------------------------------- |
| `MOVEMENT_CONFIG.arenaWidth/Height` | 960 × 540    | Logical arena size                      |
| `MOVEMENT_CONFIG.moveSpeed`         | 180 px/s     | Player speed                            |
| `MOVEMENT_CONFIG.rotationSpeed`     | π rad/s      | Player turn speed                       |
| `PLAYER_MAX_HEALTH`                 | 12           | Player health                           |
| `ENEMY_MAX_HEALTH`                  | 3            | Enemy health                            |
| `ENEMY_CHASER_SPEED`                | 110 px/s     | Chaser speed                            |
| `ENEMY_SHOOTER_SPEED`               | 78 px/s      | Shooter speed                           |
| `ENEMY_SHOOTER_RANGE`               | 320 px       | Shooter attack range                    |
| `ENEMY_SHOOTER_PREFERRED_DISTANCE`  | 220 px       | Distance the Shooter tries to keep      |
| `ENEMY_SHOOT_INTERVAL_SECONDS`      | 1.5 s        | Shooter cooldown                        |
| `ENEMY_COLLISION_DAMAGE`            | 3            | Chaser explosion damage                 |
| `ENEMY_SPAWN_SAFE_DISTANCE`         | 220 px       | Minimum spawn distance from the player  |
| `ENEMY_SPAWN_OFFSCREEN_MARGIN`      | 64 px        | How far outside the arena enemies spawn |
| `ENEMY_AVOID_DISTANCE`              | 120 px       | Distance at which enemies avoid each other |
| `ENEMY_AVOID_STRENGTH`              | 1.5          | Avoidance strength compared to chasing  |
| `ENEMY_CRASH_DAMAGE`                | 1            | Damage each enemy takes in a crash      |
| `ENEMY_CRASH_COOLDOWN_SECONDS`      | 1 s          | Time before an enemy can take crash damage again |
| `BULLET_SPEED`                      | 400 px/s     | Projectile speed                        |

### Options screen

The **Options** screen exposes two player settings. They are validated and saved in `localStorage`, so they persist after a refresh.

| Option                | Default | Allowed range        |
| --------------------- | ------- | -------------------- |
| Game session time     | 120 s   | 60 – 180 s (integer) |
| Enemy spawn time      | 4 s     | 1 – 15 s             |
| Debug                 | Off     | On / Off             |


Each match takes a snapshot of the options when it starts. Changes only apply to the next match.

### Debug mode

Turn on **Debug** in the Options screen to see the collision shapes during a match:

| Color                  | Shape   | Meaning                                |
| ---------------------- | ------- | -------------------------------------- |
| Red rounded rectangle  | Islands | Area that blocks ships and projectiles |
| Red box                | Ships   | Hurtbox: area that takes damage        |
| Yellow capsule outline | Ships   | Hitbox: area used to push ships apart  |
| Green circle           | Bullets | Bullet hit area                        |

Like the other options, it is saved locally and applies when a new match starts.

### Local storage keys

| Key                              | Content                           |
| -------------------------------- | --------------------------------- |
| `pirate-battle.options.v1`       | Player options                    |
| `pirate-battle.latest-result.v1` | Result of the last finished match |
| `pirate-battle.pending-matches.v1` | Finished matches waiting to be registered on the server |
| `pirate-battle.mock-db.v1`       | Matches confirmed by the mock server (your ranking/history entries) |
| `pirate-battle.fixture-seed.v1`  | Seed used to generate the fake rival players |

To reset everything, clear these keys in your browser DevTools (**Application → Local Storage**). Clearing `pirate-battle.mock-db.v1` and `pirate-battle.pending-matches.v1` empties your ranking and history; clearing `pirate-battle.fixture-seed.v1` generates new rivals.

---

## Ranking and Match History

Open them with the **Ranking** and **Match History** buttons in the main menu.

- **Ranking:** only compares matches played with the **same configuration** as your current Options (shown at the top, e.g. `120 s · spawn 4 s`). Order: higher score, then shorter duration, then earlier date, then match ID, so ties always resolve the same way. Your entries are shown as **"You"** and highlighted.
- **Match History:** your matches, newest first, with date, score, duration and how the match ended.
- Both tabs are paginated and show loading, empty and error states (with **Try again**). They refresh every time they are opened and after a match is registered.

### Match registration

When a match ends, the result screen registers it automatically and shows its status (saving, saved or failed, with a **Retry** button).

- The match is queued in local storage **before** it is sent and only removed once the server confirms it. Failed matches are sent again when the game opens and when the browser gets its connection back, so they survive a refresh.
- Sending the same match again (repeated clicks, a retry after a timeout) never creates a duplicate: the server returns the existing record.
- You can start a new match while a registration is still pending.

### Mock API

The API is mocked with MSW in the browser, in development and in the published build. Rival players are generated from a seed that is drawn once per browser and saved in `pirate-battle.fixture-seed.v1`: each browser sees different rivals, but the ranking stays the same between refreshes. Write a known number to that key before loading the page to reproduce a dataset.

| Method | Route                                  | Description                                                        |
| ------ | -------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/ranking?durationSeconds=&spawnIntervalSeconds=&page=&pageSize=` | Paginated ranking for one configuration |
| GET    | `/api/players/:playerId/matches?page=&pageSize=` | Paginated match history of a player, newest first        |
| POST   | `/api/matches`                         | Registers a finished match. Idempotent by `matchId` (201 new, 200 existing) |

To simulate a failure, open DevTools → **Network** and choose **Offline**, then finish a match or open a tab. Configurable network scenarios (slow responses, timeouts, 4xx/5xx) are not implemented yet.

---

## Project structure

```
src/
├── main.tsx                      # Starts MSW, then renders the app inside the Query provider
├── App.tsx                       # Screen navigation and pending match sync
├── components/
│   ├── Experience/
│   │   ├── PixiGame.tsx          # PixiJS application, textures and rendering
│   │   └── config/
│   │       ├── config.ts         # Typed gameplay configuration
│   │       ├── simulation.ts     # Time-based game rules (movement, combat, spawns)
│   │       ├── input.ts          # Keyboard input
│   │       └── ...               # HUD, islands, time helpers
│   └── Levels/                   # React screens: MainMenu, Options, Game, Result,
│                                 # Ranking, MatchHistory (+ shared LeaderboardParts)
├── services/
│   ├── api.ts                    # Axios client and API calls
│   ├── queries.ts                # TanStack Query client, hooks and match registration
│   ├── pendingMatches.ts         # Queue of matches waiting to be registered
│   ├── player.ts                 # Local player ID and name
│   └── ...                       # Local storage for options and results
├── mocks/
│   ├── fixtures.ts               # Seeded fake rival players
│   ├── handlers.ts               # Mock REST API (ranking, history, register match)
│   └── browser.ts                # MSW worker setup
└── types/types.ts                # Shared types and API contracts
public/assets/                    # Game assets (see CREDITS.md)
public/mockServiceWorker.js       # MSW service worker (generated by `npx msw init public`)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the React/PixiJS integration, simulation loop and lifecycle decisions.

---

## Project status

This project was built within a limited time frame of two days, while I was learning TypeScript, React and PixiJS. Here is what is done and what is not.

### Done

- Main menu, Options, Game and Result screens
- Options validation and persistence after refresh
- Player movement, rotation, front shot and side volleys
- Chaser and Shooter enemies with spawn interval and safe spawn distance
- Off-screen enemy spawns, enemy avoidance and enemy-to-enemy collisions with crash damage
- Islands that block ships and projectiles
- Health bars, score, timer and visual ship damage
- Shot, explosion and destruction effects
- Time-based simulation (frame rate independent)
- Manual pause and automatic pause on focus loss or hidden tab
- Last match result saved locally
- Pixi application cleanup on unmount (works with React Strict Mode)
- Ranking and Match History tabs with pagination and loading, empty and error states (TanStack Query + Axios)
- Mock REST API with MSW, working in development and in the published build
- Automatic match registration with retries and a pending queue that survives refreshes, without duplicates

### Not implemented

- Touch controls for mobile
- Configurable network failure scenarios (slow, timeout, 4xx/5xx, out-of-order) and a scenario selector
- Playwright E2E tests and visual regression
- Performance profiling report

---

## Deployment

The game is deployed on **Vercel** as a static Vite site.

1. Push the repository to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project** and import the repository.
3. Vercel detects Vite automatically. Settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Click **Deploy**. Each new push to `main` redeploys automatically.

---

## Credits

Some assets were supplied by the challenge and others come from itch.io. See [CREDITS.md](CREDITS.md).
