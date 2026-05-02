import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const sourcePath = path.resolve("assets/images/turtle.png");
const outDir = path.resolve("public");
await fs.mkdir(outDir, { recursive: true });

const ICON_SIZES = [192, 512];
const SPLASH = { width: 1170, height: 2532 };
const BG_COLOR = { r: 116, g: 215, b: 239, alpha: 1 };

for (const size of ICON_SIZES) {
  const bg = await sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(size * 0.78);
  const source = await sharp(sourcePath).resize({ height: target, fit: "inside" }).toBuffer();
  const meta = await sharp(source).metadata();
  const left = Math.round((size - meta.width) / 2);
  const top = Math.round((size - meta.height) / 2);

  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(bg).composite([{ input: source, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}

{
  const bg = await sharp({
    create: { width: SPLASH.width, height: SPLASH.height, channels: 4, background: BG_COLOR }
  }).png().toBuffer();

  const target = Math.round(SPLASH.width * 0.55);
  const source = await sharp(sourcePath).resize({ width: target, fit: "inside" }).toBuffer();
  const meta = await sharp(source).metadata();
  const left = Math.round((SPLASH.width - meta.width) / 2);
  const top = Math.round((SPLASH.height - meta.height) / 2);

  const out = path.join(outDir, `splash-1170x2532.png`);
  await sharp(bg).composite([{ input: source, top, left }]).png().toFile(out);
  console.log(`  → ${path.relative(process.cwd(), out)}`);
}
