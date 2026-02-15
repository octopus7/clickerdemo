// ===== GAME CONFIGURATION =====
const CONFIG = {
    // Colors
    COLORS: {
        BG_TOP: '#c8ddf0',
        BG_BOTTOM: '#e8f0fe',
        FLOOR: '#d5dce4',
        FLOOR_GRID: '#cdd5dd',
        WALL_BACK: '#e0e8f0',
        WALL_SIDE: '#d0d8e2',
        BELT_SURFACE: '#8899aa',
        BELT_SIDE: '#667788',
        BELT_ROLLER: '#556677',
        BELT_LINE: '#99aabb',
        STATION_TOP: '#b8c8d8',
        STATION_FRONT: '#a0b0c0',
        SHADOW: 'rgba(0,0,0,0.08)',
    },
    RABBIT_COLORS: [
        { body: '#f5f0eb', ear: '#f0c0c0', name: 'white' },
        { body: '#c89060', ear: '#e0a070', name: 'brown' },
        { body: '#a0a0a8', ear: '#c0b0b8', name: 'gray' },
        { body: '#e8d8a0', ear: '#f0e0b0', name: 'cream' },
    ],
    // Rice cake types
    RICECAKE_TYPES: [
        { id: 'songpyeon', name: '송편', emoji: '🥟', color: '#e8e0d0', fillColor: '#8B4513', price: 10, unlocked: true },
        { id: 'injeolmi', name: '인절미', emoji: '🟫', color: '#f5e6c8', fillColor: '#d4a060', price: 15, unlocked: true },
        { id: 'gyeongdan', name: '경단', emoji: '🍡', color: '#f0e0e8', fillColor: '#d07080', price: 25, unlocked: false, unlockCost: 500 },
        { id: 'yakgwa', name: '약과', emoji: '🍪', color: '#e0b060', fillColor: '#c09030', price: 40, unlocked: false, unlockCost: 2000 },
        { id: 'jeolpyeon', name: '절편', emoji: '🌸', color: '#ffffff', fillColor: '#e090a0', price: 60, unlocked: false, unlockCost: 8000 },
    ],
    // Upgrades
    UPGRADES: [
        { id: 'speed', name: '벨트 속도', icon: '⚡', desc: '컨베이어 벨트 속도 증가', baseCost: 50, costMult: 1.8, maxLevel: 20, effect: 0.15 },
        { id: 'efficiency', name: '작업 효율', icon: '🔧', desc: '토끼들의 작업 속도 증가', baseCost: 80, costMult: 1.9, maxLevel: 15, effect: 0.12 },
        { id: 'value', name: '떡 품질', icon: '⭐', desc: '떡 하나당 가격 증가', baseCost: 120, costMult: 2.0, maxLevel: 20, effect: 0.2 },
        { id: 'auto', name: '자동 생산', icon: '🤖', desc: '자동으로 떡 생산 시작', baseCost: 200, costMult: 2.2, maxLevel: 10, effect: 0.1 },
        { id: 'multi', name: '더블 생산', icon: '✨', desc: '동시에 2개씩 생산할 확률', baseCost: 500, costMult: 2.5, maxLevel: 10, effect: 0.08 },
    ],
    // Production stages
    STAGES: ['반죽', '성형', '장식', '포장'],
    STAGE_EMOJIS: ['🫠', '🔨', '🎨', '📦'],
    // Timing
    BASE_BELT_SPEED: 0.4,
    BASE_WORK_TIME: 2000,
    AUTO_SPAWN_INTERVAL: 4000,
    // Layout
    BELT_Y_START: 0.42,
    BELT_HEIGHT: 30,
    STATION_SPACING: 0.2,
};

// ===== EASING FUNCTIONS =====
const Ease = {
    inOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    out: t => t * (2 - t),
    elastic: t => {
        const p = 0.4;
        return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    bounce: t => {
        if (t < 1 / 2.75) return 7.5625 * t * t;
        if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
};
