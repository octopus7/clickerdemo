import type { Stage } from "./types";

export const SAVE_KEY = "tiger-tteok-clicker-save-v1";
export const SAVE_VERSION = 1;
export const AUTO_SAVE_MS = 5_000;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export const FIXED_STEP_SECONDS = 0.1;
export const CLICK_DOUGH_GAIN = 1;

export const STAGE_LABELS: Record<Stage, string> = {
  dough: "반죽",
  shape: "빚기",
  steam: "찜",
  pack: "포장",
  dispatch: "출하"
};

export const STAGE_ICONS: Record<Stage, string> = {
  dough: "🥣",
  shape: "🥟",
  steam: "♨️",
  pack: "📦",
  dispatch: "🚛"
};

export const BASE_STAGE_RATE: Record<Stage, number> = {
  dough: 1.35,
  shape: 1.08,
  steam: 0.94,
  pack: 0.82,
  dispatch: 0.72
};

export const TIGER_BASE_COST: Record<Stage, number> = {
  dough: 22,
  shape: 32,
  steam: 44,
  pack: 58,
  dispatch: 78
};

export const TIGER_COST_GROWTH = 1.28;

export const MACHINE_BASE_COST: Record<Stage, number> = {
  dough: 64,
  shape: 82,
  steam: 98,
  pack: 128,
  dispatch: 170
};

export const MACHINE_COST_GROWTH = 1.46;
export const MACHINE_BONUS_PER_LEVEL = 0.18;

export const BASE_SELL_PRICE = 6;
export const BRAND_BASE_COST = 230;
export const BRAND_COST_GROWTH = 1.65;
export const BRAND_BONUS_PER_LEVEL = 0.2;
