import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const SRC_DIR = join(process.cwd(), "public", "assets", "cute-flat");
const OUT_DIR = join(process.cwd(), "public", "assets", "i2i-png");

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const jobs = [
  { input: "bg-factory.svg", output: "bg-factory.png", width: 1920, height: 1080 },
  { input: "click-dough.svg", output: "click-dough.png", width: 512, height: 512 },
  { input: "mascot-tiger.svg", output: "mascot-tiger.png", width: 384, height: 384 },
  { input: "stage-dough.svg", output: "stage-dough.png", width: 128, height: 128 },
  { input: "stage-shape.svg", output: "stage-shape.png", width: 128, height: 128 },
  { input: "stage-steam.svg", output: "stage-steam.png", width: 128, height: 128 },
  { input: "stage-pack.svg", output: "stage-pack.png", width: 128, height: 128 },
  { input: "stage-dispatch.svg", output: "stage-dispatch.png", width: 128, height: 128 },
  { input: "coin-nyang.svg", output: "coin-nyang.png", width: 128, height: 128 },
  { input: "upgrade-tiger-badge.svg", output: "upgrade-tiger-badge.png", width: 96, height: 96 }
];

async function exportOne({ input, output, width, height }) {
  const sourcePath = join(SRC_DIR, input);
  const targetPath = join(OUT_DIR, output);

  await sharp(sourcePath, { density: 384 })
    .resize({
      width,
      height,
      fit: "contain",
      background: TRANSPARENT
    })
    .ensureAlpha()
    .png({
      compressionLevel: 9,
      quality: 100,
      palette: false
    })
    .toFile(targetPath);
}

async function verifyMetadata() {
  for (const job of jobs) {
    const targetPath = join(OUT_DIR, job.output);
    const meta = await sharp(targetPath).metadata();
    if (meta.width !== job.width || meta.height !== job.height) {
      throw new Error(
        `Unexpected size for ${job.output}: got ${meta.width}x${meta.height}, expected ${job.width}x${job.height}`
      );
    }
    if (!meta.hasAlpha) {
      throw new Error(`PNG without alpha channel: ${job.output}`);
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const job of jobs) {
    await exportOne(job);
  }

  await verifyMetadata();
  console.log(`Exported ${jobs.length} PNG files to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
