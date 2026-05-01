import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const toothPath = path.resolve("assets/images/tooth.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 };
const BG_COLOR = { r: 207, g: 231, b: 255, alpha: 1 };

for (const size of ICON_SIZES) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(size * 0.78);
  const tooth = await sharp(toothPath).resize({ height: target, fit: "inside" }).toBuffer();
  const meta = await sharp(tooth).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);

  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(bg).composite([{ input: tooth, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

{
  const bg = await sharp({
    create: { width: SPLASH.width, height: SPLASH.height, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(SPLASH.width * 0.55);
  const tooth = await sharp(toothPath).resize({ width: target, fit: "inside" }).toBuffer();
  const meta = await sharp(tooth).metadata();
  const left = Math.round((SPLASH.width - meta.width) / 2);
  const top = Math.round((SPLASH.height - meta.height) / 2);

  const out = path.join(outDir, `splash-1170x2532.png`);
  await sharp(bg).composite([{ input: tooth, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}
