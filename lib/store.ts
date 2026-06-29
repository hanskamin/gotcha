"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, PlayerId } from "./types";
import {
  addPlayer as addPlayerFn,
  createPlayer,
  emptyState,
  recordGotcha as recordGotchaFn,
  removePlayer as removePlayerFn,
  reshuffle as reshuffleFn,
  startGame as startGameFn,
  undoLastGotcha as undoLastGotchaFn,
} from "./chain";

function now(): number {
  return Date.now();
}

interface GameActions {
  /** Replace the whole setup roster from a list of names (setup phase). */
  setRoster: (names: string[]) => void;
  /** Add a single player. Splices into the live loop if game is active. */
  addPlayer: (name: string) => void;
  /** Remove a player (dropout pre-game deletes; mid-game splices out). */
  removePlayer: (id: PlayerId) => void;
  /** Re-randomize the chain (setup only). */
  reshuffle: () => void;
  /** Start the game: assign chain + go active. */
  startGame: () => void;
  /** Log a gotcha by the killer (victim = killer's current target). */
  gotchaByKiller: (killerId: PlayerId) => void;
  /** Log a gotcha by the victim (back-derives the killer who hunts them). */
  gotchaByVictim: (victimId: PlayerId) => void;
  /** Undo the most recent gotcha. */
  undo: () => void;
  /** Reset everything to an empty setup. */
  newGame: () => void;
}

export type GameStore = GameState & GameActions;

const MAX_PLAYERS = 200;

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...emptyState(),

      setRoster: (names) =>
        set(() => {
          const t = now();
          const players = names
            .map((n) => n.trim())
            .filter((n) => n.length > 0)
            .slice(0, MAX_PLAYERS)
            .map((n) => createPlayer(n, t));
          return { phase: "setup", players, feed: [], winnerId: null };
        }),

      addPlayer: (name) =>
        set((s) => {
          if (s.players.length >= MAX_PLAYERS) return s;
          return addPlayerFn(s, name, now());
        }),

      removePlayer: (id) => set((s) => removePlayerFn(s, id, now())),

      reshuffle: () => set((s) => reshuffleFn(s)),

      startGame: () => set((s) => startGameFn(s)),

      gotchaByKiller: (killerId) =>
        set((s) => recordGotchaFn(s, killerId, now())),

      gotchaByVictim: (victimId) =>
        set((s) => {
          const hunter = s.players.find(
            (p) => p.status === "alive" && p.targetId === victimId
          );
          if (!hunter) return s;
          return recordGotchaFn(s, hunter.id, now());
        }),

      undo: () => set((s) => undoLastGotchaFn(s)),

      newGame: () => set(() => emptyState()),
    }),
    {
      name: "gotcha-game-v1",
      version: 1,
    }
  )
);
