import { describe, expect, it } from "vitest";

import { OFFLINE_CAP_MS } from "./config";
import {
  applyClick,
  createInitialState,
  flushSales,
  getSellPrice,
  simulateOffline,
  simulateProduction
} from "./engine";

describe("engine", () => {
  it("runs pipeline production end-to-end", () => {
    const state = createInitialState();
    simulateProduction(state, 10);

    expect(state.sellQueue).toBeGreaterThan(0);
    expect(state.dough).toBeGreaterThanOrEqual(0);
    expect(state.steamed).toBeGreaterThanOrEqual(0);
    expect(state.packed).toBeGreaterThanOrEqual(0);
  });

  it("flush sells integer units only", () => {
    const state = createInitialState();
    state.sellQueue = 12.8;
    const price = getSellPrice(state);

    const result = flushSales(state);

    expect(result.units).toBe(12);
    expect(result.earned).toBe(12 * price);
    expect(state.sellQueue).toBeCloseTo(0.8);
    expect(state.gold).toBe(30 + 12 * price);
  });

  it("caps offline simulation to 8 hours", () => {
    const state = createInitialState();
    const applied = simulateOffline(state, OFFLINE_CAP_MS * 2);

    expect(applied).toBe(OFFLINE_CAP_MS);
  });

  it("click adds dough and click count", () => {
    const state = createInitialState();
    applyClick(state);

    expect(state.dough).toBe(1);
    expect(state.totalClicks).toBe(1);
  });
});
