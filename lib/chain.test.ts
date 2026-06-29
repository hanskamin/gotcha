import { describe, expect, it } from "vitest";
import {
  addPlayer,
  alivePlayers,
  createPlayer,
  emptyState,
  isOneClosedLoop,
  recordGotcha,
  removePlayer,
  startGame,
  undoLastGotcha,
  type Rng,
} from "./chain";
import type { GameState } from "./types";

/** Deterministic RNG: identity shuffle (rng() = 0 picks j=0 each step). */
const zeroRng: Rng = () => 0;

function setupWith(names: string[]): GameState {
  const s = emptyState();
  s.players = names.map((n, i) => createPlayer(n, i));
  return s;
}

function alive(state: GameState) {
  return alivePlayers(state).map((p) => p.name);
}

describe("startGame / assignChain", () => {
  it("forms exactly one closed loop", () => {
    const s = startGame(setupWith(["A", "B", "C", "D", "E"]));
    expect(s.phase).toBe("active");
    expect(isOneClosedLoop(s)).toBe(true);
  });

  it("everyone hunts someone else and is hunted exactly once", () => {
    const s = startGame(setupWith(["A", "B", "C", "D"]));
    const targets = s.players.map((p) => p.targetId);
    // No self-targets.
    expect(s.players.every((p) => p.targetId !== p.id)).toBe(true);
    // Each player is targeted exactly once.
    expect(new Set(targets).size).toBe(s.players.length);
  });

  it("refuses to start with fewer than 2 players", () => {
    const s = startGame(setupWith(["A"]));
    expect(s.phase).toBe("setup");
  });
});

describe("recordGotcha", () => {
  it("killer inherits victim's target and loop stays closed", () => {
    let s = startGame(setupWith(["A", "B", "C", "D", "E"]), zeroRng);
    const killer = alivePlayers(s)[0];
    const victimId = killer.targetId!;
    const victimTarget = s.players.find((p) => p.id === victimId)!.targetId;

    s = recordGotcha(s, killer.id, 1000);

    const killerAfter = s.players.find((p) => p.id === killer.id)!;
    expect(killerAfter.targetId).toBe(victimTarget);
    expect(killerAfter.kills).toBe(1);
    expect(s.players.find((p) => p.id === victimId)!.status).toBe("out");
    expect(s.feed).toHaveLength(1);
    expect(isOneClosedLoop(s)).toBe(true);
  });

  it("ignores a gotcha from a dead or invalid killer", () => {
    let s = startGame(setupWith(["A", "B", "C"]), zeroRng);
    const before = JSON.stringify(s);
    s = recordGotcha(s, "nope", 1);
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("winner detection", () => {
  it("crowns the sole survivor when two remain and one strikes", () => {
    let s = startGame(setupWith(["A", "B"]), zeroRng);
    const killer = alivePlayers(s)[0];
    s = recordGotcha(s, killer.id, 1);
    expect(s.phase).toBe("finished");
    expect(s.winnerId).toBe(killer.id);
    expect(alive(s)).toHaveLength(1);
  });

  it("plays a 5-player game down to one winner with a closed loop throughout", () => {
    let s = startGame(setupWith(["A", "B", "C", "D", "E"]), zeroRng);
    let guard = 0;
    while (s.phase === "active" && guard++ < 20) {
      expect(isOneClosedLoop(s)).toBe(true);
      const killer = alivePlayers(s)[0];
      s = recordGotcha(s, killer.id, guard);
    }
    expect(s.phase).toBe("finished");
    expect(alive(s)).toHaveLength(1);
    expect(s.winnerId).not.toBeNull();
  });
});

describe("undoLastGotcha", () => {
  it("is a true inverse of a single gotcha", () => {
    const start = startGame(setupWith(["A", "B", "C", "D"]), zeroRng);
    const killer = alivePlayers(start)[0];

    const after = recordGotcha(start, killer.id, 100);
    const undone = undoLastGotcha(after);

    // Targets restored for everyone, kills restored, all alive again.
    expect(alive(undone).sort()).toEqual(["A", "B", "C", "D"]);
    expect(undone.feed).toHaveLength(0);
    expect(isOneClosedLoop(undone)).toBe(true);
    const sortedTargets = (st: GameState) =>
      st.players
        .map((p) => `${p.name}->${st.players.find((q) => q.id === p.targetId)?.name}`)
        .sort();
    expect(sortedTargets(undone)).toEqual(sortedTargets(start));
    expect(undone.players.every((p) => p.kills === 0)).toBe(true);
  });

  it("reverts a game-ending kill back to active", () => {
    let s = startGame(setupWith(["A", "B"]), zeroRng);
    const killer = alivePlayers(s)[0];
    s = recordGotcha(s, killer.id, 1);
    expect(s.phase).toBe("finished");
    s = undoLastGotcha(s);
    expect(s.phase).toBe("active");
    expect(s.winnerId).toBeNull();
    expect(alive(s)).toHaveLength(2);
    expect(isOneClosedLoop(s)).toBe(true);
  });
});

describe("addPlayer (mid-game splice)", () => {
  it("inserts a newcomer while keeping a single closed loop", () => {
    let s = startGame(setupWith(["A", "B", "C", "D"]), zeroRng);
    s = addPlayer(s, "LATE", 500, zeroRng);
    expect(alive(s)).toContain("LATE");
    expect(alivePlayers(s)).toHaveLength(5);
    expect(isOneClosedLoop(s)).toBe(true);
  });
});

describe("removePlayer (dropout)", () => {
  it("splices out an alive player, no kill credited, loop stays closed", () => {
    let s = startGame(setupWith(["A", "B", "C", "D"]), zeroRng);
    const leaver = alivePlayers(s)[1];
    s = removePlayer(s, leaver.id, 700);
    const removed = s.players.find((p) => p.id === leaver.id)!;
    expect(removed.status).toBe("out");
    expect(removed.eliminatedById).toBeNull(); // dropout marker
    expect(s.players.every((p) => p.kills === 0)).toBe(true);
    expect(isOneClosedLoop(s)).toBe(true);
    expect(alivePlayers(s)).toHaveLength(3);
  });

  it("deletes a player entirely during setup", () => {
    let s = setupWith(["A", "B", "C"]);
    const target = s.players[1];
    s = removePlayer(s, target.id, 0);
    expect(s.players).toHaveLength(2);
    expect(s.players.find((p) => p.id === target.id)).toBeUndefined();
  });
});
