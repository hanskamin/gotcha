# gotcha

Tracking app for the summer-camp game **Gotcha**. Similar to "assassins,"
every player starts assigned another player as a target. A player must sneak up
behind their target and say "gotcha" to eliminate them and claim their target's
target as their next target. The chain keeps shrinking until only one player
remains.

This is an admin tracking tool: paste in your roster, get an instant view of
who is hunting whom, log eliminations in a couple of taps, and watch the game
play down to a champion — all with a sun-readable, retro-arcade look.

## Features

- **Roster setup** — paste up to 200 names (one per line); duplicate/blank names are flagged.
- **Single circular chain** — players are randomly wired into one hunting loop (A→B→…→A).
- **Log a Gotcha** — pick the hunter (victim is auto-derived as their current target), or pick the victim and the hunter is back-derived. The killer inherits the victim's target, keeping the loop closed.
- **Undo & corrections** — reverse the most recent gotcha; re-shuffle the chain before the first elimination.
- **Mid-game roster changes** — splice in late arrivals or remove dropouts without breaking the loop.
- **Live views** — Targets (who's hunting whom), Eliminated (who's out + who got them), a kill-count Leaderboard, and a timestamped Feed.
- **Winner celebration** — an animated game-over screen when one player is left standing.
- **Phone-first** and **light/daytime theme** so it stays readable outdoors in the sun.

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS (light retro-arcade theme, `Press Start 2P` pixel font)
- Framer Motion for animations
- Zustand + `persist` middleware → all state lives in the browser's `localStorage` (no backend, single device)

State is stored entirely in the browser, so the game lives on whatever device
the admin runs it on. There is no server, login, or database.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run start    # serve the production build
npm test         # run the chain-logic unit tests (Vitest)
```

## How the game logic works

The core of the app is a set of pure, unit-tested functions in
[`lib/chain.ts`](lib/chain.ts) that operate on an immutable `GameState`:

- `assignChain` / `reshuffle` — build one random circular hunting loop.
- `recordGotcha` — eliminate the hunter's target; the hunter inherits the victim's target.
- `undoLastGotcha` — exact inverse of the last gotcha (re-inserts the victim ahead of the hunter).
- `addPlayer` / `removePlayer` — splice players in/out of the live loop.

These are wired into a Zustand store ([`lib/store.ts`](lib/store.ts)) that
persists to `localStorage`. Run `npm test` to exercise loop integrity, gotcha
inheritance, undo, splicing, and winner detection.
