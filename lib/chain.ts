import type {
  EliminationEntry,
  GameState,
  Player,
  PlayerId,
} from "./types";

/** Injectable RNG so tests can be deterministic. Returns float in [0, 1). */
export type Rng = () => number;

const defaultRng: Rng = () => Math.random();

let idCounter = 0;
/** Generate a reasonably-unique player id without relying on Date/Math.random for ordering. */
export function makePlayerId(): string {
  idCounter += 1;
  return `p_${idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyState(): GameState {
  return { phase: "setup", players: [], feed: [], winnerId: null };
}

export function createPlayer(name: string, now: number): Player {
  return {
    id: makePlayerId(),
    name: name.trim(),
    status: "alive",
    targetId: null,
    kills: 0,
    eliminatedById: null,
    eliminatedAt: null,
    joinedAt: now,
  };
}

/** Shallow-immutable clone of state (players cloned individually). */
function clone(state: GameState): GameState {
  return {
    phase: state.phase,
    winnerId: state.winnerId,
    players: state.players.map((p) => ({ ...p })),
    feed: state.feed.map((e) => ({ ...e })),
  };
}

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.status === "alive");
}

function byId(state: GameState, id: PlayerId | null): Player | undefined {
  if (id == null) return undefined;
  return state.players.find((p) => p.id === id);
}

/** Fisher-Yates shuffle (pure — returns a new array). */
export function shuffle<T>(arr: readonly T[], rng: Rng = defaultRng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Wire all alive players into one circular hunting chain (A→B→…→A).
 * Out players keep targetId = null. Mutates the passed players in place.
 */
function wireChain(players: Player[], rng: Rng): void {
  const alive = players.filter((p) => p.status === "alive");
  if (alive.length <= 1) {
    alive.forEach((p) => (p.targetId = null));
    return;
  }
  const order = shuffle(alive, rng);
  order.forEach((p, i) => {
    p.targetId = order[(i + 1) % order.length].id;
  });
}

/**
 * Assign a fresh random circular chain over the current alive players.
 * Used at game start and on pre-game re-shuffle.
 */
export function assignChain(state: GameState, rng: Rng = defaultRng): GameState {
  const next = clone(state);
  wireChain(next.players, rng);
  return next;
}

/**
 * Re-shuffle the chain. Allowed during setup, or once the game is active but
 * before any elimination has happened (everyone still alive, empty feed).
 */
export function reshuffle(state: GameState, rng: Rng = defaultRng): GameState {
  const pristine =
    state.feed.length === 0 && state.players.every((p) => p.status === "alive");
  if (state.phase === "setup" || (state.phase === "active" && pristine)) {
    return assignChain(state, rng);
  }
  return state;
}

/** Move from setup → active, assigning the chain. Needs ≥ 2 players. */
export function startGame(state: GameState, rng: Rng = defaultRng): GameState {
  if (state.phase !== "setup") return state;
  if (alivePlayers(state).length < 2) return state;
  const next = assignChain(state, rng);
  next.phase = "active";
  next.winnerId = null;
  return next;
}

/** If exactly one player is alive, mark the game finished and crown them. */
function checkWinner(state: GameState): void {
  const alive = state.players.filter((p) => p.status === "alive");
  if (alive.length === 1 && state.phase === "active") {
    state.phase = "finished";
    state.winnerId = alive[0].id;
    // Winner naturally hunts themselves (they inherited a self-target). Leave
    // it intact so undo's pointer-swap can restore the loop cleanly.
  }
}

/**
 * Record a successful gotcha by `killerId` against their current target.
 * The killer inherits the victim's target, keeping the loop closed.
 */
export function recordGotcha(
  state: GameState,
  killerId: PlayerId,
  now: number
): GameState {
  if (state.phase !== "active") return state;
  const next = clone(state);
  const killer = byId(next, killerId);
  if (!killer || killer.status !== "alive") return state;
  const victim = byId(next, killer.targetId);
  // No valid victim, or killer already hunts themselves (sole survivor).
  if (!victim || victim.id === killer.id || victim.status !== "alive") {
    return state;
  }

  const inheritedTargetId = victim.targetId;

  // Killer inherits the victim's target.
  killer.targetId = inheritedTargetId;
  killer.kills += 1;

  // Victim is out.
  victim.status = "out";
  victim.eliminatedById = killer.id;
  victim.eliminatedAt = now;
  victim.targetId = null;

  next.feed.push({
    killerId: killer.id,
    victimId: victim.id,
    at: now,
    inheritedTargetId,
  });

  checkWinner(next);
  return next;
}

/**
 * Reverse the most recent gotcha. Robust to intervening splices: it re-inserts
 * the victim directly ahead of the killer in the current loop
 * (killer → victim → killer's-current-target).
 */
export function undoLastGotcha(state: GameState): GameState {
  if (state.feed.length === 0) return state;
  const next = clone(state);
  const entry = next.feed.pop() as EliminationEntry;
  const killer = byId(next, entry.killerId);
  const victim = byId(next, entry.victimId);
  if (!killer || !victim) return state;

  // Undo finish if this was the game-ending kill.
  if (next.phase === "finished") {
    next.phase = "active";
    next.winnerId = null;
  }

  // Re-insert victim between killer and whatever killer currently hunts.
  victim.status = "alive";
  victim.eliminatedById = null;
  victim.eliminatedAt = null;
  victim.targetId = killer.targetId;
  killer.targetId = victim.id;
  killer.kills = Math.max(0, killer.kills - 1);

  return next;
}

/**
 * Splice a brand-new player into the live loop (late arrival).
 * Inserts after a random alive anchor: anchor → newcomer → anchor's-old-target.
 */
export function addPlayer(
  state: GameState,
  name: string,
  now: number,
  rng: Rng = defaultRng
): GameState {
  const trimmed = name.trim();
  if (!trimmed) return state;
  const next = clone(state);
  const newcomer = createPlayer(trimmed, now);

  if (next.phase === "setup") {
    next.players.push(newcomer);
    return next;
  }
  if (next.phase !== "active") return state;

  const alive = next.players.filter((p) => p.status === "alive");
  next.players.push(newcomer);

  if (alive.length === 0) {
    newcomer.targetId = newcomer.id;
    return next;
  }
  const anchor = shuffle(alive, rng)[0];
  newcomer.targetId = anchor.targetId;
  anchor.targetId = newcomer.id;
  return next;
}

/**
 * Voluntary dropout (NOT a kill): remove an alive player from the loop.
 * Their hunter inherits their target. No kill credited, no feed entry.
 * The player is kept as `out` with eliminatedById = null to mark a dropout.
 */
export function removePlayer(
  state: GameState,
  id: PlayerId,
  now: number
): GameState {
  const next = clone(state);
  const leaver = byId(next, id);
  if (!leaver) return state;

  if (next.phase === "setup") {
    // Before the game starts, just drop them entirely.
    next.players = next.players.filter((p) => p.id !== id);
    return next;
  }

  if (leaver.status !== "alive") return state;

  const hunter = next.players.find(
    (p) => p.status === "alive" && p.targetId === id
  );
  if (hunter) hunter.targetId = leaver.targetId;

  leaver.status = "out";
  leaver.eliminatedById = null; // null killer == dropout
  leaver.eliminatedAt = now;
  leaver.targetId = null;

  checkWinner(next);
  return next;
}

/** True if the alive players form exactly one closed cycle. Used in tests. */
export function isOneClosedLoop(state: GameState): boolean {
  const alive = alivePlayers(state);
  if (alive.length === 0) return true;
  if (alive.length === 1) return true; // sole survivor: no target needed
  const start = alive[0];
  const aliveIds = new Set(alive.map((p) => p.id));
  let current: Player | undefined = start;
  for (let steps = 0; steps < alive.length; steps++) {
    if (!current || current.targetId == null) return false;
    if (!aliveIds.has(current.targetId)) return false;
    current = byId(state, current.targetId);
  }
  // After alive.length hops we must be back at the start.
  return current?.id === start.id;
}
