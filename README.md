# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Pirate Battle

  Pirate Battle is a single-player, top-down naval shooter built with React, TypeScript, and PixiJS. This repository is an active prototype for the Pirate Battle game developer challenge.

  ## Current Status

  - The React menu can navigate to Options and the game screen.
  - Options validates match duration and enemy spawn interval, and saves them in local storage.
  - The game screen initializes and cleans up a PixiJS v8 canvas.
  - The canvas does not yet contain the gameplay simulation, ships, enemies, projectiles, collisions, or combat.
  - Ranking/history APIs, MSW scenarios, and Playwright E2E tests are not implemented yet. Playwright is installed, but no test configuration or test script is present.

  ## Requirements

  - Node.js compatible with the installed Vite version
  - npm

  Install dependencies from the lockfile:

  ```bash
  npm ci
  ```

  ## Commands

  ```bash
  npm run dev      # Start Vite development server with hot reload
  npm run build    # Type-check and create a production build
  npm run preview  # Preview the production build locally
  npm run lint     # Run ESLint
  ```

  The TypeScript application config enables `strict`. The production build passed with strict mode enabled on 2026-10-02.

  ## Options

  - Match duration: default 120 seconds; valid range 60-180 seconds.
  - Enemy spawn interval: default 4 seconds; valid range 1-15 seconds.
  - Saved options use browser local storage and apply to new matches.

  Gameplay controls are not implemented yet.

  ## Technology and Package Credits

  Direct dependencies and their declared package licenses:

  | Package | Purpose | Version | License |
  | --- | --- | ---: | --- |
  | [React](https://react.dev/) and [React DOM](https://react.dev/) | Menus and interface | 19.3.0 | MIT |
  | [TypeScript](https://www.typescriptlang.org/) | Application language and type checking | 6.0.3 | Apache-2.0 |
  | [Vite](https://vite.dev/) | Development server and production build | 8.3.2 | MIT |
  | [PixiJS](https://pixijs.com/) | 2D game rendering | 8.21.0 | MIT |
  | [TanStack Query](https://tanstack.com/query/latest) | Remote ranking/history state (integration pending) | 5.104.0 | MIT |
  | [Axios](https://axios-http.com/) | HTTP client (integration pending) | 1.20.0 | MIT |
  | [MSW](https://mswjs.io/) | Mock REST APIs (integration pending) | 3.0.1 | MIT |
  | [Playwright](https://playwright.dev/) | Browser E2E testing (tests pending) | 1.63.0 | Apache-2.0 |

  Versions and licenses above are from the installed direct package metadata. Review transitive dependency licenses separately before redistribution.

  ## Asset Credits

  See [CREDITS.md](CREDITS.md) for credits and sources for supplied game assets and the current favicon.

  ## Architecture

  See [ARCHITECTURE.md](ARCHITECTURE.md) for the current React/PixiJS boundary, persistence behavior, and implementation gaps.
