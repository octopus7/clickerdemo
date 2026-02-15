import "./style.css";

import {
  AUTO_SAVE_MS,
  FIXED_STEP_SECONDS,
  OFFLINE_CAP_MS,
  STAGE_LABELS
} from "./game/config";
import {
  applyClick,
  buyBrand,
  buyMachine,
  createInitialState,
  flushSales,
  getBrandCost,
  getMachineCost,
  getRates,
  getSellPrice,
  getTigerHireCost,
  hireTiger,
  simulateOffline,
  simulateProduction
} from "./game/engine";
import { formatDuration, formatNumber, formatRate } from "./game/format";
import { clearSave, loadGame, saveGame } from "./game/save";
import { STAGES, type GameState, type Stage } from "./game/types";

type OverlayType = "none" | "upgrades" | "stats";
type CheckpointEffectType = "shape" | "steam" | "pack" | "dispatch";

interface StageVisualCache {
  frame: number;
  workers: number;
}

const STAGE_ASSET: Record<Stage, string> = {
  dough: "/assets/cute-flat/stage-dough.svg",
  shape: "/assets/cute-flat/stage-shape.svg",
  steam: "/assets/cute-flat/stage-steam.svg",
  pack: "/assets/cute-flat/stage-pack.svg",
  dispatch: "/assets/cute-flat/stage-dispatch.svg"
};

const TIGER_FRAME_ASSET: Record<Stage, string[]> = {
  dough: [
    "/assets/cute-flat/tiger-dough-0.svg",
    "/assets/cute-flat/tiger-dough-1.svg",
    "/assets/cute-flat/tiger-dough-2.svg"
  ],
  shape: [
    "/assets/cute-flat/tiger-shape-0.svg",
    "/assets/cute-flat/tiger-shape-1.svg",
    "/assets/cute-flat/tiger-shape-2.svg"
  ],
  steam: [
    "/assets/cute-flat/tiger-steam-0.svg",
    "/assets/cute-flat/tiger-steam-1.svg",
    "/assets/cute-flat/tiger-steam-2.svg"
  ],
  pack: [
    "/assets/cute-flat/tiger-pack-0.svg",
    "/assets/cute-flat/tiger-pack-1.svg",
    "/assets/cute-flat/tiger-pack-2.svg"
  ],
  dispatch: [
    "/assets/cute-flat/tiger-dispatch-0.svg",
    "/assets/cute-flat/tiger-dispatch-1.svg",
    "/assets/cute-flat/tiger-dispatch-2.svg"
  ]
};

const STAGE_ITEM_CLASS: Record<Stage, string> = {
  dough: "belt-dough",
  shape: "belt-shape",
  steam: "belt-steam",
  pack: "belt-pack",
  dispatch: "belt-dispatch"
};

const STAGE_ORDER: Record<Stage, number> = {
  dough: 0,
  shape: 1,
  steam: 2,
  pack: 3,
  dispatch: 4
};

const CHECKPOINT_TYPES: CheckpointEffectType[] = ["shape", "steam", "pack", "dispatch"];

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
}

function mapStageToBuffer(state: GameState, stage: Stage): number {
  if (stage === "dough") {
    return state.dough;
  }
  if (stage === "shape") {
    return state.shaped;
  }
  if (stage === "steam") {
    return state.steamed;
  }
  if (stage === "pack") {
    return state.packed;
  }
  return state.sellQueue;
}

function popOnce(element: HTMLElement): void {
  element.classList.remove("pop");
  void element.offsetWidth;
  element.classList.add("pop");
}

const stageMetrics = byId<HTMLDivElement>("stage-metrics");
stageMetrics.innerHTML = STAGES.map(
  (stage) => `
    <article class="stage-card" id="card-${stage}">
      <div class="stage-head">
        <img class="stage-icon" src="${STAGE_ASSET[stage]}" alt="" />
        <p class="stage-title">${STAGE_LABELS[stage]}</p>
      </div>
      <p class="stage-value" id="stock-${stage}">0</p>
      <p class="stage-sub">처리속도 <span id="rate-${stage}">0/s</span></p>
      <p class="stage-sub">호랑이 <span id="tigers-${stage}">0</span> · 설비 Lv.<span id="machine-${stage}">0</span></p>
    </article>
  `
).join("");

const upgradeList = byId<HTMLDivElement>("upgrade-list");
upgradeList.innerHTML = STAGES.map(
  (stage) => `
    <article class="upgrade-row">
      <div class="upgrade-name-wrap">
        <img class="upgrade-badge" src="/assets/cute-flat/upgrade-tiger-badge.svg" alt="" />
        <div>
          <p class="upgrade-name">${STAGE_LABELS[stage]}</p>
          <p class="upgrade-sub">작업 라인 강화</p>
        </div>
      </div>
      <button id="hire-${stage}" class="small-button"></button>
      <button id="machine-btn-${stage}" class="small-button"></button>
    </article>
  `
).join("");

const stationRow = byId<HTMLDivElement>("station-row");
stationRow.innerHTML = STAGES.map(
  (stage) => `
    <article class="factory-station" id="station-${stage}">
      <div class="station-head">
        <img class="station-machine" src="${STAGE_ASSET[stage]}" alt="" />
        <div>
          <p class="station-name">${STAGE_LABELS[stage]}</p>
          <p class="station-meta">
            호랑이 <span id="station-tigers-${stage}">0</span> ·
            <span id="station-rate-${stage}">0/s</span>
          </p>
          <p class="station-meta">재고 <span id="station-stock-${stage}">0</span></p>
        </div>
      </div>
      <div class="station-workers" id="workers-${stage}"></div>
    </article>
  `
).join("");

const goldElement = byId<HTMLElement>("gold");
const offlineNote = byId<HTMLElement>("offline-note");
const clickButton = byId<HTMLButtonElement>("click-button");
const doughVisual = byId<HTMLElement>("dough-visual");
const clickCount = byId<HTMLElement>("click-count");
const queueElement = byId<HTMLElement>("sell-queue");
const flushButton = byId<HTMLButtonElement>("flush-button");
const flashMessageElement = byId<HTMLElement>("flash-message");
const brandButton = byId<HTMLButtonElement>("brand-button");
const brandLevel = byId<HTMLElement>("brand-level");
const saveButton = byId<HTMLButtonElement>("save-button");
const resetButton = byId<HTMLButtonElement>("reset-button");
const saveStatus = byId<HTMLElement>("save-status");

const statsToggleButton = byId<HTMLButtonElement>("stats-toggle");
const upgradesToggleButton = byId<HTMLButtonElement>("upgrades-toggle");
const upgradeCloseButton = byId<HTMLButtonElement>("upgrade-close");
const statsCloseButton = byId<HTMLButtonElement>("stats-close");
const overlayBackdrop = byId<HTMLDivElement>("overlay-backdrop");
const upgradeDrawer = byId<HTMLElement>("upgrade-drawer");
const statsModal = byId<HTMLElement>("stats-modal");
const factoryBelt = byId<HTMLElement>("factory-belt");
const beltItemsLayer = byId<HTMLElement>("belt-items-layer");
const checkpointElements = [
  byId<HTMLElement>("checkpoint-1"),
  byId<HTMLElement>("checkpoint-2"),
  byId<HTMLElement>("checkpoint-3"),
  byId<HTMLElement>("checkpoint-4")
];
const checkpointBurstLayers = [
  byId<HTMLElement>("checkpoint-burst-1"),
  byId<HTMLElement>("checkpoint-burst-2"),
  byId<HTMLElement>("checkpoint-burst-3"),
  byId<HTMLElement>("checkpoint-burst-4")
];

const stockElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`stock-${stage}`)])
) as Record<Stage, HTMLElement>;
const rateElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`rate-${stage}`)])
) as Record<Stage, HTMLElement>;
const tigerElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`tigers-${stage}`)])
) as Record<Stage, HTMLElement>;
const machineElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`machine-${stage}`)])
) as Record<Stage, HTMLElement>;
const cardElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`card-${stage}`)])
) as Record<Stage, HTMLElement>;
const hireButtons = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLButtonElement>(`hire-${stage}`)])
) as Record<Stage, HTMLButtonElement>;
const machineButtons = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLButtonElement>(`machine-btn-${stage}`)])
) as Record<Stage, HTMLButtonElement>;

const stationElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`station-${stage}`)])
) as Record<Stage, HTMLElement>;
const stationTigerElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`station-tigers-${stage}`)])
) as Record<Stage, HTMLElement>;
const stationRateElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`station-rate-${stage}`)])
) as Record<Stage, HTMLElement>;
const stationStockElements = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`station-stock-${stage}`)])
) as Record<Stage, HTMLElement>;
const stationWorkerRows = Object.fromEntries(
  STAGES.map((stage) => [stage, byId<HTMLElement>(`workers-${stage}`)])
) as Record<Stage, HTMLElement>;

const stageVisualCache = Object.fromEntries(
  STAGES.map((stage) => [stage, { frame: -1, workers: -1 } satisfies StageVisualCache])
) as Record<Stage, StageVisualCache>;

const loaded = loadGame();
let state = loaded.state;
const appliedOfflineMs = simulateOffline(state, loaded.offlineMs);

if (appliedOfflineMs > 0) {
  offlineNote.classList.remove("hidden");
  offlineNote.textContent = `오프라인 ${formatDuration(appliedOfflineMs / 1000)} 동안 떡공장이 돌아갔어요${
    loaded.wasCapped ? ` (최대 ${formatDuration(OFFLINE_CAP_MS / 1000)} 적용)` : ""
  }.`;
}

let flashMessage = "";
let flashUntil = 0;
let activeOverlay: OverlayType = "none";
let lastBeltRenderMs = -1;
let lastEffectRenderMs = -1;
const checkpointAccumulators = [0, 0, 0, 0];
const checkpointCooldowns = [0, 0, 0, 0];
const checkpointActiveTimers: Array<number | null> = [null, null, null, null];

function setFlash(message: string, durationMs = 1800): void {
  flashMessage = message;
  flashUntil = performance.now() + durationMs;
}

function syncOverlayUI(): void {
  const hasOverlay = activeOverlay !== "none";
  overlayBackdrop.classList.toggle("hidden", !hasOverlay);

  const upgradeOpen = activeOverlay === "upgrades";
  upgradeDrawer.classList.toggle("open", upgradeOpen);
  upgradeDrawer.setAttribute("aria-hidden", upgradeOpen ? "false" : "true");

  const statsOpen = activeOverlay === "stats";
  statsModal.classList.toggle("hidden", !statsOpen);
  statsModal.classList.toggle("open", statsOpen);
  statsModal.setAttribute("aria-hidden", statsOpen ? "false" : "true");
}

function openOverlay(type: OverlayType): void {
  activeOverlay = type;
  syncOverlayUI();
}

function closeOverlay(): void {
  if (activeOverlay === "none") {
    return;
  }
  activeOverlay = "none";
  syncOverlayUI();
}

function toggleOverlay(type: Exclude<OverlayType, "none">): void {
  if (activeOverlay === type) {
    closeOverlay();
    return;
  }
  openOverlay(type);
}

function renderWorkers(stage: Stage, rate: number, nowMs: number): void {
  const workerCount = Math.max(1, Math.min(5, state.tigers[stage]));
  const frameDurationMs = Math.max(120, 660 - Math.min(7, rate) * 65);
  const frame = Math.floor(nowMs / frameDurationMs) % 3;
  const cache = stageVisualCache[stage];

  if (cache.frame === frame && cache.workers === workerCount) {
    return;
  }

  stationWorkerRows[stage].innerHTML = Array.from({ length: workerCount }, (_, index) => {
    const frameIndex = (frame + index) % 3;
    const shift = (index % 2 === 0 ? -1 : 1) * (index * 1.2);
    return `<img class="worker-sprite" src="${TIGER_FRAME_ASSET[stage][frameIndex]}" alt="" style="transform: translateY(${shift}px);" />`;
  }).join("");

  cache.frame = frame;
  cache.workers = workerCount;
}

function calcBeltItemCount(buffer: number): number {
  if (buffer <= 0) {
    return 0;
  }
  return Math.max(1, Math.min(10, Math.floor(buffer / 22) + 1));
}

function renderBeltItems(rates: Record<Stage, number>, nowMs: number): void {
  if (lastBeltRenderMs >= 0 && nowMs - lastBeltRenderMs < 110) {
    return;
  }
  lastBeltRenderMs = nowMs;

  const nowSec = nowMs / 1000;
  let html = "";

  for (const stage of STAGES) {
    const buffer = mapStageToBuffer(state, stage);
    const itemCount = calcBeltItemCount(buffer);
    const stageIndex = STAGE_ORDER[stage];
    const stageSpan = 100 / STAGES.length;
    const segmentStart = stageIndex * stageSpan + 1.4;
    const segmentWidth = stageSpan - 2.2;
    const stageSpeed = Math.max(0.28, Math.min(1.3, rates[stage] / 4.2));

    for (let index = 0; index < itemCount; index += 1) {
      const base = (index / Math.max(1, itemCount)) * segmentWidth;
      const drift = (nowSec * stageSpeed * 13 + index * 2.3) % segmentWidth;
      const x = segmentStart + ((base + drift) % segmentWidth);
      const bob = index % 2 === 0 ? -2 : 2;
      html += `<span class="belt-item ${STAGE_ITEM_CLASS[stage]}" style="left:${x.toFixed(2)}%; transform: translateY(${bob}px);"></span>`;
    }
  }

  beltItemsLayer.innerHTML = html;
}

function spawnCheckpointParticles(index: number, intensity: number): void {
  const burstLayer = checkpointBurstLayers[index];
  const type = CHECKPOINT_TYPES[index];
  const particleCount = 4 + Math.min(6, Math.floor(intensity * 1.7));

  for (let i = 0; i < particleCount; i += 1) {
    const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
    const distance = 14 + Math.random() * 18 + intensity * 2;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    const particle = document.createElement("span");
    particle.className = `checkpoint-particle checkpoint-${type}`;
    particle.style.setProperty("--dx", `${dx.toFixed(1)}px`);
    particle.style.setProperty("--dy", `${dy.toFixed(1)}px`);
    particle.style.setProperty("--dur", `${Math.round(360 + Math.random() * 200)}ms`);
    particle.style.setProperty("--delay", `${Math.round(Math.random() * 45)}ms`);
    particle.style.setProperty("--size", `${(4 + Math.random() * 3).toFixed(1)}px`);
    burstLayer.appendChild(particle);

    particle.addEventListener(
      "animationend",
      () => {
        particle.remove();
      },
      { once: true }
    );
  }
}

function triggerCheckpointEffect(index: number, intensity: number): void {
  const checkpoint = checkpointElements[index];
  checkpoint.classList.remove("checkpoint-active");
  void checkpoint.offsetWidth;
  checkpoint.classList.add("checkpoint-active");

  const prevTimer = checkpointActiveTimers[index];
  if (prevTimer !== null) {
    window.clearTimeout(prevTimer);
  }
  checkpointActiveTimers[index] = window.setTimeout(() => {
    checkpoint.classList.remove("checkpoint-active");
    checkpointActiveTimers[index] = null;
  }, 230);

  spawnCheckpointParticles(index, intensity);
}

function updateCheckpointEffects(rates: Record<Stage, number>, deltaSeconds: number): void {
  const throughput = [rates.shape, rates.steam, rates.pack, rates.dispatch];
  const upstream = [state.dough, state.shaped, state.steamed, state.packed];

  for (let i = 0; i < 4; i += 1) {
    checkpointCooldowns[i] = Math.max(0, checkpointCooldowns[i] - deltaSeconds);

    if (throughput[i] <= 0.15 || upstream[i] <= 0.25) {
      continue;
    }

    checkpointAccumulators[i] += throughput[i] * deltaSeconds * 0.65;

    if (checkpointAccumulators[i] >= 1 && checkpointCooldowns[i] <= 0) {
      checkpointAccumulators[i] -= 1;
      triggerCheckpointEffect(i, throughput[i]);
      checkpointCooldowns[i] = Math.max(0.12, 0.52 / Math.max(0.65, throughput[i]));
    }
  }
}

function render(): void {
  const rates = getRates(state);
  const now = performance.now();
  const deltaEffectSeconds =
    lastEffectRenderMs < 0 ? 0 : Math.min(0.2, Math.max(0, (now - lastEffectRenderMs) / 1000));
  lastEffectRenderMs = now;
  if (now > flashUntil) {
    flashMessage = "";
  }

  goldElement.textContent = `${formatNumber(state.gold, 0)} 냥`;
  clickCount.textContent = `총 클릭 ${formatNumber(state.totalClicks, 0)}회`;
  queueElement.textContent = `${formatNumber(Math.floor(state.sellQueue), 0)} 개`;
  flashMessageElement.textContent = flashMessage;

  for (const stage of STAGES) {
    const buffer = mapStageToBuffer(state, stage);
    const rate = rates[stage];

    stockElements[stage].textContent = formatNumber(buffer, 1);
    rateElements[stage].textContent = formatRate(rate);
    tigerElements[stage].textContent = formatNumber(state.tigers[stage], 0);
    machineElements[stage].textContent = formatNumber(state.machineLevels[stage], 0);

    stationTigerElements[stage].textContent = formatNumber(state.tigers[stage], 0);
    stationRateElements[stage].textContent = formatRate(rate);
    stationStockElements[stage].textContent = formatNumber(buffer, 1);
    renderWorkers(stage, rate, now);
  }

  for (const stage of STAGES) {
    const tigerCost = getTigerHireCost(stage, state);
    hireButtons[stage].textContent = `+호랑이 (${formatNumber(tigerCost, 0)}냥)`;
    hireButtons[stage].disabled = state.gold < tigerCost;

    const machineCost = getMachineCost(stage, state);
    machineButtons[stage].textContent = `설비 강화 (${formatNumber(machineCost, 0)}냥)`;
    machineButtons[stage].disabled = state.gold < machineCost;
  }

  const brandCost = getBrandCost(state);
  brandButton.textContent = `브랜드 강화 (${formatNumber(brandCost, 0)}냥)`;
  brandButton.disabled = state.gold < brandCost;
  brandLevel.textContent = `브랜드 Lv.${state.brandLevel} · 판매 단가 ${formatNumber(getSellPrice(state), 1)}냥`;
  flushButton.disabled = state.sellQueue < 1;

  const flowRate = Math.max(0.18, rates.dispatch);
  factoryBelt.style.setProperty("--belt-speed", `${Math.max(0.45, 2.4 / flowRate).toFixed(2)}s`);
  updateCheckpointEffects(rates, deltaEffectSeconds);
  renderBeltItems(rates, now);
}

clickButton.addEventListener("click", () => {
  applyClick(state);
  popOnce(clickButton);
  popOnce(doughVisual);
  popOnce(stationElements.dough);
});

flushButton.addEventListener("click", () => {
  const result = flushSales(state);
  if (result.units > 0) {
    setFlash(`${formatNumber(result.units, 0)}개 판매, +${formatNumber(result.earned, 0)}냥`);
    popOnce(flushButton);
    popOnce(stationElements.dispatch);
  } else {
    setFlash("판매할 떡이 아직 없어요.");
  }
});

for (const stage of STAGES) {
  hireButtons[stage].addEventListener("click", () => {
    if (hireTiger(state, stage)) {
      setFlash(`${STAGE_LABELS[stage]} 호랑이 합류!`);
      popOnce(stationElements[stage]);
      popOnce(cardElements[stage]);
    }
  });

  machineButtons[stage].addEventListener("click", () => {
    if (buyMachine(state, stage)) {
      setFlash(`${STAGE_LABELS[stage]} 설비 강화 완료!`);
      popOnce(stationElements[stage]);
      popOnce(cardElements[stage]);
    }
  });
}

brandButton.addEventListener("click", () => {
  if (buyBrand(state)) {
    setFlash("브랜드 평판 상승! 판매 단가가 올랐어요.");
    popOnce(brandButton);
  }
});

saveButton.addEventListener("click", () => {
  saveGame(state);
  saveStatus.textContent = `수동 저장 완료 (${new Date().toLocaleTimeString()})`;
});

resetButton.addEventListener("click", () => {
  const ok = window.confirm("정말 초기화할까요? 저장 데이터가 삭제됩니다.");
  if (!ok) {
    return;
  }

  state = createInitialState();
  clearSave();
  saveGame(state);
  closeOverlay();
  setFlash("게임을 초기화했어요.");
  offlineNote.classList.add("hidden");
  saveStatus.textContent = "초기화 후 새 저장이 생성되었습니다.";
});

statsToggleButton.addEventListener("click", () => {
  toggleOverlay("stats");
});

upgradesToggleButton.addEventListener("click", () => {
  toggleOverlay("upgrades");
});

upgradeCloseButton.addEventListener("click", closeOverlay);
statsCloseButton.addEventListener("click", closeOverlay);
overlayBackdrop.addEventListener("click", closeOverlay);

statsModal.addEventListener("click", (event) => {
  if (event.target === statsModal) {
    closeOverlay();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOverlay();
  }
});

setInterval(() => {
  saveGame(state);
}, AUTO_SAVE_MS);

window.addEventListener("pagehide", () => {
  saveGame(state);
});

window.addEventListener("beforeunload", () => {
  saveGame(state);
});

let previous = performance.now();
let accumulator = 0;

function loop(now: number): void {
  const delta = Math.min((now - previous) / 1000, 1);
  previous = now;
  accumulator += delta;

  while (accumulator >= FIXED_STEP_SECONDS) {
    simulateProduction(state, FIXED_STEP_SECONDS);
    accumulator -= FIXED_STEP_SECONDS;
  }

  render();
  window.requestAnimationFrame(loop);
}

syncOverlayUI();
render();
window.requestAnimationFrame(loop);
