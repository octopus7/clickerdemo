export const STAGES = ["dough", "steam", "pack", "dispatch"] as const;

export type Stage = (typeof STAGES)[number];

export interface GameState {
  gold: number;
  dough: number;
  steamed: number;
  packed: number;
  sellQueue: number;
  tigers: Record<Stage, number>;
  machineLevels: Record<Stage, number>;
  brandLevel: number;
  totalClicks: number;
}

export interface SavePayload {
  version: number;
  lastSeenAt: number;
  state: GameState;
}
