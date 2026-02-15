import { OFFLINE_CAP_MS, SAVE_KEY, SAVE_VERSION } from "./config";
import { createInitialState, normalizeLoadedState } from "./engine";
import type { GameState, SavePayload } from "./types";

interface LoadResult {
  state: GameState;
  offlineMs: number;
  wasCapped: boolean;
}

export function loadGame(now = Date.now()): LoadResult {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return { state: createInitialState(), offlineMs: 0, wasCapped: false };
    }

    const parsed = JSON.parse(raw) as Partial<SavePayload>;
    if (parsed.version !== SAVE_VERSION || !parsed.state) {
      return { state: createInitialState(), offlineMs: 0, wasCapped: false };
    }

    const state = normalizeLoadedState(parsed.state);
    const lastSeenAt =
      typeof parsed.lastSeenAt === "number" && Number.isFinite(parsed.lastSeenAt)
        ? parsed.lastSeenAt
        : now;
    const elapsed = Math.max(0, now - lastSeenAt);
    const offlineMs = Math.min(elapsed, OFFLINE_CAP_MS);

    return { state, offlineMs, wasCapped: elapsed > OFFLINE_CAP_MS };
  } catch {
    return { state: createInitialState(), offlineMs: 0, wasCapped: false };
  }
}

export function saveGame(state: GameState, now = Date.now()): void {
  const payload: SavePayload = {
    version: SAVE_VERSION,
    lastSeenAt: now,
    state
  };

  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage can fail on some private modes or quota exhaustion.
  }
}

export function clearSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
