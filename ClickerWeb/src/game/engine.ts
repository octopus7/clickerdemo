import {
  BASE_SELL_PRICE,
  BASE_STAGE_RATE,
  BRAND_BASE_COST,
  BRAND_BONUS_PER_LEVEL,
  BRAND_COST_GROWTH,
  CLICK_DOUGH_GAIN,
  MACHINE_BASE_COST,
  MACHINE_BONUS_PER_LEVEL,
  MACHINE_COST_GROWTH,
  OFFLINE_CAP_MS,
  TIGER_BASE_COST,
  TIGER_COST_GROWTH
} from "./config";
import { STAGES, type GameState, type Stage } from "./types";

function sanitizeNumber(value: unknown, fallback = 0, min = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(value, min);
}

function sanitizeStageRecord(
  input: unknown,
  min: number,
  fallback: number
): Record<Stage, number> {
  const result = {} as Record<Stage, number>;
  const source = (input ?? {}) as Partial<Record<Stage, unknown>>;

  for (const stage of STAGES) {
    result[stage] = Math.floor(sanitizeNumber(source[stage], fallback, min));
  }

  return result;
}

export function createInitialState(): GameState {
  return {
    gold: 30,
    dough: 0,
    shaped: 0,
    steamed: 0,
    packed: 0,
    sellQueue: 0,
    tigers: {
      dough: 1,
      shape: 1,
      steam: 1,
      pack: 1,
      dispatch: 1
    },
    machineLevels: {
      dough: 0,
      shape: 0,
      steam: 0,
      pack: 0,
      dispatch: 0
    },
    brandLevel: 0,
    totalClicks: 0
  };
}

export function normalizeLoadedState(input: unknown): GameState {
  const fallback = createInitialState();
  const source = (input ?? {}) as Partial<GameState>;

  return {
    gold: sanitizeNumber(source.gold, fallback.gold, 0),
    dough: sanitizeNumber(source.dough, fallback.dough, 0),
    shaped: sanitizeNumber(source.shaped, fallback.shaped, 0),
    steamed: sanitizeNumber(source.steamed, fallback.steamed, 0),
    packed: sanitizeNumber(source.packed, fallback.packed, 0),
    sellQueue: sanitizeNumber(source.sellQueue, fallback.sellQueue, 0),
    tigers: sanitizeStageRecord(source.tigers, 1, 1),
    machineLevels: sanitizeStageRecord(source.machineLevels, 0, 0),
    brandLevel: Math.floor(sanitizeNumber(source.brandLevel, fallback.brandLevel, 0)),
    totalClicks: Math.floor(sanitizeNumber(source.totalClicks, fallback.totalClicks, 0))
  };
}

export function getStageMultiplier(state: GameState, stage: Stage): number {
  return 1 + state.machineLevels[stage] * MACHINE_BONUS_PER_LEVEL;
}

export function getStageRate(state: GameState, stage: Stage): number {
  return BASE_STAGE_RATE[stage] * state.tigers[stage] * getStageMultiplier(state, stage);
}

export function getRates(state: GameState): Record<Stage, number> {
  return {
    dough: getStageRate(state, "dough"),
    shape: getStageRate(state, "shape"),
    steam: getStageRate(state, "steam"),
    pack: getStageRate(state, "pack"),
    dispatch: getStageRate(state, "dispatch")
  };
}

export function getSellPrice(state: GameState): number {
  return BASE_SELL_PRICE * (1 + state.brandLevel * BRAND_BONUS_PER_LEVEL);
}

export function getTigerHireCost(stage: Stage, state: GameState): number {
  const currentCount = state.tigers[stage];
  return Math.ceil(TIGER_BASE_COST[stage] * TIGER_COST_GROWTH ** (currentCount - 1));
}

export function getMachineCost(stage: Stage, state: GameState): number {
  const level = state.machineLevels[stage];
  return Math.ceil(MACHINE_BASE_COST[stage] * MACHINE_COST_GROWTH ** level);
}

export function getBrandCost(state: GameState): number {
  return Math.ceil(BRAND_BASE_COST * BRAND_COST_GROWTH ** state.brandLevel);
}

export function hireTiger(state: GameState, stage: Stage): boolean {
  const cost = getTigerHireCost(stage, state);
  if (state.gold < cost) {
    return false;
  }

  state.gold -= cost;
  state.tigers[stage] += 1;
  return true;
}

export function buyMachine(state: GameState, stage: Stage): boolean {
  const cost = getMachineCost(stage, state);
  if (state.gold < cost) {
    return false;
  }

  state.gold -= cost;
  state.machineLevels[stage] += 1;
  return true;
}

export function buyBrand(state: GameState): boolean {
  const cost = getBrandCost(state);
  if (state.gold < cost) {
    return false;
  }

  state.gold -= cost;
  state.brandLevel += 1;
  return true;
}

export function applyClick(state: GameState): void {
  state.dough += CLICK_DOUGH_GAIN;
  state.totalClicks += 1;
}

export function simulateProduction(state: GameState, seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return;
  }

  const doughGain = getStageRate(state, "dough") * seconds;
  state.dough += doughGain;

  const shapedGain = Math.min(state.dough, getStageRate(state, "shape") * seconds);
  state.dough -= shapedGain;
  state.shaped += shapedGain;

  const steamedGain = Math.min(state.shaped, getStageRate(state, "steam") * seconds);
  state.shaped -= steamedGain;
  state.steamed += steamedGain;

  const packedGain = Math.min(state.steamed, getStageRate(state, "pack") * seconds);
  state.steamed -= packedGain;
  state.packed += packedGain;

  const dispatched = Math.min(state.packed, getStageRate(state, "dispatch") * seconds);
  state.packed -= dispatched;
  state.sellQueue += dispatched;
}

export function flushSales(state: GameState): { units: number; earned: number } {
  const units = Math.floor(state.sellQueue);
  if (units <= 0) {
    return { units: 0, earned: 0 };
  }

  state.sellQueue -= units;
  const earned = units * getSellPrice(state);
  state.gold += earned;
  return { units, earned };
}

export function simulateOffline(state: GameState, elapsedMs: number): number {
  const clampedMs = Math.max(0, Math.min(elapsedMs, OFFLINE_CAP_MS));
  let secondsLeft = clampedMs / 1000;

  while (secondsLeft > 0) {
    const step = Math.min(1, secondsLeft);
    simulateProduction(state, step);
    secondsLeft -= step;
  }

  return clampedMs;
}
