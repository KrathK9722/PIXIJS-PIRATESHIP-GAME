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

TanStack Query, Axios, MSW and Playwright are installed as dependencies but are **not integrated yet** (see [Project status](#project-status)).

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

To reset everything, clear these keys in your browser DevTools (**Application → Local Storage**).

---

## Project structure

```
src/
├── App.tsx                       # Screen navigation (menu, options, game, result)
├── components/
│   ├── Experience/
│   │   ├── PixiGame.tsx          # PixiJS application, textures and rendering
│   │   └── config/
│   │       ├── config.ts         # Typed gameplay configuration
│   │       ├── simulation.ts     # Time-based game rules (movement, combat, spawns)
│   │       ├── input.ts          # Keyboard input
│   │       └── ...               # HUD, islands, time helpers
│   └── Levels/                   # React screens: MainMenu, Options, Game, Result
├── services/                     # Local storage for options and results
├── mocks/                        # MSW handlers and fixtures (not implemented yet)
└── types/types.ts                # Shared types
public/assets/                    # Game assets (see CREDITS.md)
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

### Not implemented

- Touch controls for mobile
- Ranking and Match History tabs (TanStack Query + Axios)
- MSW mocks and network failure scenarios
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
