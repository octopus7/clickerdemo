import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "assets", "cute-flat");

const files = {
  "bg-factory.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff7e8"/>
      <stop offset="100%" stop-color="#ffdcb0"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f3c89d"/>
      <stop offset="100%" stop-color="#dca97c"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <circle cx="220" cy="180" r="180" fill="#ffdcb8" opacity="0.6"/>
  <circle cx="1740" cy="220" r="220" fill="#ffc995" opacity="0.55"/>
  <rect y="740" width="1920" height="340" fill="url(#floor)"/>
  <rect x="120" y="300" width="1680" height="420" rx="46" fill="#fff6ea" stroke="#dfbb93" stroke-width="8"/>
  <rect x="180" y="360" width="280" height="300" rx="26" fill="#ffe9d0" stroke="#e6c49f" stroke-width="6"/>
  <rect x="500" y="360" width="300" height="300" rx="26" fill="#ffe9d0" stroke="#e6c49f" stroke-width="6"/>
  <rect x="840" y="360" width="320" height="300" rx="26" fill="#ffe9d0" stroke="#e6c49f" stroke-width="6"/>
  <rect x="1200" y="360" width="300" height="300" rx="26" fill="#ffe9d0" stroke="#e6c49f" stroke-width="6"/>
  <rect x="1550" y="360" width="220" height="300" rx="26" fill="#ffe9d0" stroke="#e6c49f" stroke-width="6"/>
  <rect x="220" y="420" width="200" height="40" rx="20" fill="#ef8d53"/>
  <rect x="560" y="420" width="180" height="40" rx="20" fill="#d57b45"/>
  <rect x="900" y="420" width="200" height="40" rx="20" fill="#c96a3a"/>
  <rect x="1260" y="420" width="180" height="40" rx="20" fill="#bc6034"/>
  <rect x="1568" y="420" width="150" height="40" rx="20" fill="#ac562e"/>
  <circle cx="1540" cy="860" r="120" fill="#eeb98a" opacity="0.5"/>
  <circle cx="350" cy="860" r="100" fill="#f7cfa8" opacity="0.5"/>
</svg>
`,
  "mascot-tiger.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <ellipse cx="256" cy="432" rx="170" ry="56" fill="#c99367" opacity="0.28"/>
  <circle cx="256" cy="218" r="160" fill="#f08a40"/>
  <ellipse cx="206" cy="104" rx="42" ry="52" fill="#f08a40"/>
  <ellipse cx="306" cy="104" rx="42" ry="52" fill="#f08a40"/>
  <ellipse cx="206" cy="112" rx="20" ry="24" fill="#ffd3b6"/>
  <ellipse cx="306" cy="112" rx="20" ry="24" fill="#ffd3b6"/>
  <circle cx="256" cy="236" r="98" fill="#fff4e7"/>
  <rect x="172" y="160" width="168" height="32" rx="16" fill="#2f2117"/>
  <rect x="182" y="168" width="58" height="16" rx="8" fill="#fff4e7"/>
  <rect x="272" y="168" width="58" height="16" rx="8" fill="#fff4e7"/>
  <circle cx="218" cy="228" r="10" fill="#2f2117"/>
  <circle cx="294" cy="228" r="10" fill="#2f2117"/>
  <path d="M256 242 L236 268 H276 Z" fill="#2f2117"/>
  <path d="M226 286 C236 304 276 304 286 286" stroke="#2f2117" stroke-width="8" fill="none" stroke-linecap="round"/>
  <rect x="188" y="328" width="136" height="90" rx="28" fill="#f7e5cf" stroke="#dfb88f" stroke-width="6"/>
  <rect x="212" y="344" width="88" height="18" rx="9" fill="#d4996a"/>
  <rect x="212" y="374" width="88" height="18" rx="9" fill="#d4996a"/>
  <circle cx="166" cy="264" r="20" fill="#ffb28f"/>
  <circle cx="346" cy="264" r="20" fill="#ffb28f"/>
</svg>
`,
  "click-dough.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <ellipse cx="256" cy="430" rx="170" ry="54" fill="#c99f69" opacity="0.3"/>
  <path d="M120 286 C120 194 188 142 256 142 C324 142 392 194 392 286 C392 354 330 400 256 400 C182 400 120 354 120 286 Z" fill="#fef0db" stroke="#d8b28d" stroke-width="12"/>
  <path d="M182 236 C198 218 228 210 256 210 C286 210 314 218 330 236" stroke="#e6c59e" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M172 286 C196 264 224 256 256 256 C290 256 318 264 342 286" stroke="#e6c59e" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M188 332 C210 314 236 306 256 306 C278 306 302 314 324 332" stroke="#e6c59e" stroke-width="10" fill="none" stroke-linecap="round"/>
  <circle cx="148" cy="220" r="22" fill="#ffd6b4"/>
  <circle cx="366" cy="210" r="18" fill="#ffd6b4"/>
  <circle cx="340" cy="356" r="14" fill="#ffd6b4"/>
</svg>
`,
  "stage-dough.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="10" y="22" width="108" height="84" rx="20" fill="#f7d8b4"/>
  <path d="M24 66 C24 44 44 32 64 32 C84 32 104 44 104 66 C104 84 88 98 64 98 C40 98 24 84 24 66 Z" fill="#fff2df" stroke="#ddb990" stroke-width="4"/>
  <circle cx="44" cy="66" r="5" fill="#eac7a2"/>
  <circle cx="84" cy="70" r="6" fill="#eac7a2"/>
</svg>
`,
  "stage-shape.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="12" y="24" width="104" height="80" rx="18" fill="#f5d2ae"/>
  <path d="M28 78 C28 58 46 46 64 46 C82 46 100 58 100 78 C100 92 86 102 64 102 C42 102 28 92 28 78 Z" fill="#ffe8ce" stroke="#dcb58e" stroke-width="4"/>
  <path d="M44 74 C50 68 58 64 64 64 C70 64 78 68 84 74" stroke="#e1bf98" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="51" cy="80" r="3" fill="#f2c9a0"/>
  <circle cx="77" cy="82" r="3" fill="#f2c9a0"/>
</svg>
`,
  "stage-steam.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="16" y="60" width="96" height="44" rx="16" fill="#e98e54"/>
  <rect x="24" y="48" width="80" height="18" rx="9" fill="#f6c197"/>
  <path d="M40 26 C34 34 34 42 40 48" stroke="#6d5441" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M64 18 C56 30 56 42 64 52" stroke="#6d5441" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M88 26 C82 34 82 42 88 48" stroke="#6d5441" stroke-width="7" fill="none" stroke-linecap="round"/>
</svg>
`,
  "stage-pack.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="18" y="26" width="92" height="82" rx="14" fill="#d6a777"/>
  <rect x="24" y="34" width="80" height="66" rx="10" fill="#f4dfc7"/>
  <rect x="58" y="34" width="12" height="66" fill="#dc8d57"/>
  <rect x="24" y="60" width="80" height="12" fill="#dc8d57"/>
  <circle cx="38" cy="48" r="4" fill="#fff4e8"/>
  <circle cx="90" cy="84" r="4" fill="#fff4e8"/>
</svg>
`,
  "stage-dispatch.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="10" y="52" width="68" height="34" rx="8" fill="#f08b40"/>
  <rect x="78" y="60" width="32" height="26" rx="6" fill="#e47832"/>
  <rect x="88" y="68" width="14" height="10" rx="2" fill="#b9e0f9"/>
  <circle cx="34" cy="94" r="12" fill="#4a3a30"/>
  <circle cx="34" cy="94" r="5" fill="#fff0d9"/>
  <circle cx="94" cy="94" r="12" fill="#4a3a30"/>
  <circle cx="94" cy="94" r="5" fill="#fff0d9"/>
  <rect x="16" y="58" width="18" height="10" rx="3" fill="#fff0d9"/>
</svg>
`,
  "coin-nyang.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="56" fill="#f2bf4f" stroke="#d7942f" stroke-width="8"/>
  <circle cx="64" cy="64" r="38" fill="#f8d579"/>
  <text x="64" y="74" text-anchor="middle" font-size="42" font-family="Trebuchet MS, sans-serif" font-weight="700" fill="#9f6a1f">냥</text>
</svg>
`,
  "upgrade-tiger-badge.svg": `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="42" fill="#ffe6cb" stroke="#d9b58d" stroke-width="5"/>
  <circle cx="48" cy="48" r="26" fill="#ef8a40"/>
  <circle cx="39" cy="43" r="4" fill="#2f2117"/>
  <circle cx="57" cy="43" r="4" fill="#2f2117"/>
  <path d="M48 48 L43 56 H53 Z" fill="#2f2117"/>
  <path d="M38 62 C42 66 54 66 58 62" stroke="#2f2117" stroke-width="4" fill="none" stroke-linecap="round"/>
</svg>
`
};

const TIGER_STAGE_STYLE = {
  dough: {
    band: "#f4dfc5",
    toolMain: "#ffe7c8",
    toolStroke: "#d8b18a"
  },
  shape: {
    band: "#f1d9be",
    toolMain: "#ffe0bd",
    toolStroke: "#cb9a71"
  },
  steam: {
    band: "#f6b591",
    toolMain: "#f29b61",
    toolStroke: "#b76034"
  },
  pack: {
    band: "#e3c3a2",
    toolMain: "#d5a77a",
    toolStroke: "#9e6b42"
  },
  dispatch: {
    band: "#ffd19f",
    toolMain: "#f0914b",
    toolStroke: "#985126"
  }
};

const TIGER_FRAMES = [
  { arm: 0, bob: 0, tail: 0, toolY: 0 },
  { arm: -6, bob: -2, tail: 3, toolY: -3 },
  { arm: 6, bob: 1, tail: -2, toolY: 2 }
];

function toolShape(stage, style, toolY) {
  if (stage === "dough") {
    return `<circle cx="158" cy="${120 + toolY}" r="10" fill="${style.toolMain}" stroke="${style.toolStroke}" stroke-width="3"/>`;
  }
  if (stage === "shape") {
    return `
      <path d="M146 ${122 + toolY} C146 ${112 + toolY} 155 ${106 + toolY} 160 ${106 + toolY} C165 ${106 + toolY} 174 ${112 + toolY} 174 ${122 + toolY} C174 ${129 + toolY} 168 ${134 + toolY} 160 ${134 + toolY} C152 ${134 + toolY} 146 ${129 + toolY} 146 ${122 + toolY} Z" fill="${style.toolMain}" stroke="${style.toolStroke}" stroke-width="3"/>
      <path d="M152 ${122 + toolY} C154 ${118 + toolY} 158 ${116 + toolY} 160 ${116 + toolY} C162 ${116 + toolY} 166 ${118 + toolY} 168 ${122 + toolY}" stroke="${style.toolStroke}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `;
  }
  if (stage === "steam") {
    return `
      <rect x="148" y="${110 + toolY}" width="22" height="14" rx="7" fill="${style.toolMain}" stroke="${style.toolStroke}" stroke-width="3"/>
      <path d="M154 ${106 + toolY} C151 ${102 + toolY} 151 ${98 + toolY} 154 ${95 + toolY}" stroke="${style.toolStroke}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M163 ${106 + toolY} C160 ${102 + toolY} 160 ${98 + toolY} 163 ${95 + toolY}" stroke="${style.toolStroke}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    `;
  }
  if (stage === "pack") {
    return `<rect x="148" y="${111 + toolY}" width="21" height="18" rx="3" fill="${style.toolMain}" stroke="${style.toolStroke}" stroke-width="3"/>`;
  }
  return `
    <rect x="146" y="${112 + toolY}" width="24" height="14" rx="3" fill="${style.toolMain}" stroke="${style.toolStroke}" stroke-width="3"/>
    <circle cx="152" cy="${130 + toolY}" r="3.5" fill="${style.toolStroke}"/>
    <circle cx="164" cy="${130 + toolY}" r="3.5" fill="${style.toolStroke}"/>
  `;
}

function createTigerWorkerFrame(stage, frameIndex) {
  const frame = TIGER_FRAMES[frameIndex];
  const style = TIGER_STAGE_STYLE[stage];
  const armOffset = frame.arm;
  const bob = frame.bob;
  const tool = toolShape(stage, style, frame.toolY);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <ellipse cx="96" cy="168" rx="56" ry="16" fill="#bc8a62" opacity="0.25"/>
  <g transform="translate(0 ${bob})">
    <path d="M44 122 C34 116 28 106 30 98 C34 103 42 106 50 106" fill="none" stroke="#9d5b32" stroke-width="6" stroke-linecap="round"/>
    <path d="M48 123 C36 114 30 103 33 93 C38 99 46 102 54 102" fill="none" stroke="#f08a40" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="96" cy="84" rx="46" ry="50" fill="#f08a40"/>
    <ellipse cx="72" cy="48" rx="14" ry="18" fill="#f08a40"/>
    <ellipse cx="120" cy="48" rx="14" ry="18" fill="#f08a40"/>
    <ellipse cx="72" cy="52" rx="6" ry="8" fill="#ffd3b6"/>
    <ellipse cx="120" cy="52" rx="6" ry="8" fill="#ffd3b6"/>
    <ellipse cx="96" cy="90" rx="28" ry="30" fill="#fff4e7"/>
    <rect x="66" y="64" width="60" height="12" rx="6" fill="#2f2117"/>
    <rect x="70" y="68" width="20" height="6" rx="3" fill="#fff4e7"/>
    <rect x="102" y="68" width="20" height="6" rx="3" fill="#fff4e7"/>
    <circle cx="82" cy="87" r="3.3" fill="#2f2117"/>
    <circle cx="110" cy="87" r="3.3" fill="#2f2117"/>
    <path d="M96 90 L90 99 H102 Z" fill="#2f2117"/>
    <path d="M84 104 C88 108 104 108 108 104" fill="none" stroke="#2f2117" stroke-width="3.2" stroke-linecap="round"/>
    <ellipse cx="72" cy="96" rx="6" ry="4" fill="#ffb28f"/>
    <ellipse cx="120" cy="96" rx="6" ry="4" fill="#ffb28f"/>

    <ellipse cx="${63 + armOffset}" cy="121" rx="12" ry="9" fill="#f08a40"/>
    <ellipse cx="${129 + armOffset}" cy="121" rx="12" ry="9" fill="#f08a40"/>

    <rect x="68" y="118" width="56" height="22" rx="10" fill="${style.band}" stroke="#d2ad87" stroke-width="3"/>
    <rect x="74" y="124" width="44" height="5" rx="2.5" fill="#cc9a73"/>

    <rect x="72" y="139" width="16" height="16" rx="7" fill="#f08a40"/>
    <rect x="104" y="139" width="16" height="16" rx="7" fill="#f08a40"/>
    <ellipse cx="80" cy="157" rx="14" ry="6" fill="#f5b47d"/>
    <ellipse cx="112" cy="157" rx="14" ry="6" fill="#f5b47d"/>

    ${tool}
  </g>
</svg>
`;
}

for (const stage of Object.keys(TIGER_STAGE_STYLE)) {
  for (let frameIndex = 0; frameIndex < 3; frameIndex += 1) {
    files[`tiger-${stage}-${frameIndex}.svg`] = createTigerWorkerFrame(stage, frameIndex);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([filename, content]) =>
      writeFile(join(OUT_DIR, filename), content, "utf8")
    )
  );
  console.log(`Generated ${Object.keys(files).length} cute-flat assets in ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
