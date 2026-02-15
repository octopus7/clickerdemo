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

const STAGE_ASSET: Record<Stage, string> = {
  dough: "/assets/cute-flat/stage-dough.svg",
  steam: "/assets/cute-flat/stage-steam.svg",
  pack: "/assets/cute-flat/stage-pack.svg",
  dispatch: "/assets/cute-flat/stage-dispatch.svg"
};

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

const goldElement = byId<HTMLElement>("gold");
const offlineNote = byId<HTMLElement>("offline-note");
const clickButton = byId<HTMLButtonElement>("click-button");
const doughVisual = byId<HTMLElement>("dough-visual");
const clickCount = byId<HTMLElement>("click-count");
const queueElement = byId<HTMLElement>("sell-queue");
const flushButton = byId<HTMLButtonElement>("flush-button");
const flushFeedback = byId<HTMLElement>("flush-feedback");
const brandButton = byId<HTMLButtonElement>("brand-button");
const brandLevel = byId<HTMLElement>("brand-level");
const saveButton = byId<HTMLButtonElement>("save-button");
const resetButton = byId<HTMLButtonElement>("reset-button");
const saveStatus = byId<HTMLElement>("save-status");

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

function setFlash(message: string, durationMs = 1800): void {
  flashMessage = message;
  flashUntil = performance.now() + durationMs;
}

function render(): void {
  const rates = getRates(state);
  const now = performance.now();
  if (now > flashUntil) {
    flashMessage = "";
  }

  goldElement.textContent = `${formatNumber(state.gold, 0)} 냥`;
  clickCount.textContent = `총 클릭 ${formatNumber(state.totalClicks, 0)}회`;
  queueElement.textContent = `${formatNumber(Math.floor(state.sellQueue), 0)} 개`;

  for (const stage of STAGES) {
    stockElements[stage].textContent = formatNumber(mapStageToBuffer(state, stage), 1);
    rateElements[stage].textContent = formatRate(rates[stage]);
    tigerElements[stage].textContent = formatNumber(state.tigers[stage], 0);
    machineElements[stage].textContent = formatNumber(state.machineLevels[stage], 0);
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
  flushFeedback.textContent = flashMessage;
}

clickButton.addEventListener("click", () => {
  applyClick(state);
  popOnce(clickButton);
  popOnce(doughVisual);
  popOnce(cardElements.dough);
});

flushButton.addEventListener("click", () => {
  const result = flushSales(state);
  if (result.units > 0) {
    setFlash(`${formatNumber(result.units, 0)}개 판매, +${formatNumber(result.earned, 0)}냥`);
    popOnce(flushButton);
    popOnce(cardElements.dispatch);
  } else {
    setFlash("판매할 떡이 아직 없어요.");
  }
});

for (const stage of STAGES) {
  hireButtons[stage].addEventListener("click", () => {
    if (hireTiger(state, stage)) {
      setFlash(`${STAGE_LABELS[stage]} 호랑이 합류!`);
      popOnce(cardElements[stage]);
    }
  });

  machineButtons[stage].addEventListener("click", () => {
    if (buyMachine(state, stage)) {
      setFlash(`${STAGE_LABELS[stage]} 설비 강화 완료!`);
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
  setFlash("게임을 초기화했어요.");
  offlineNote.classList.add("hidden");
  saveStatus.textContent = "초기화 후 새 저장이 생성되었습니다.";
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

render();
window.requestAnimationFrame(loop);
