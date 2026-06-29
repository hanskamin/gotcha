export type PlayerId = string;

export type PlayerStatus = "alive" | "out";

export interface Player {
  id: PlayerId;
  name: string;
  status: PlayerStatus;
  /** Who this player is hunting. Null only during setup or when game finished. */
  targetId: PlayerId | null;
  /** Number of successful gotchas. */
  kills: number;
  /** Who eliminated this player (null if still alive). */
  eliminatedById: PlayerId | null;
  /** Epoch ms when eliminated (null if still alive). */
  eliminatedAt: number | null;
  /** Epoch ms when added to the game. */
  joinedAt: number;
}

export interface EliminationEntry {
  killerId: PlayerId;
  victimId: PlayerId;
  /** Epoch ms when the gotcha was logged. */
  at: number;
  /**
   * The target the killer inherited from the victim at the moment of the kill.
   * Stored so undo can restore exact state even after later splices.
   */
  inheritedTargetId: PlayerId | null;
}

export type GamePhase = "setup" | "active" | "finished";

export interface GameState {
  phase: GamePhase;
  players: Player[];
  feed: EliminationEntry[];
  winnerId: PlayerId | null;
}
