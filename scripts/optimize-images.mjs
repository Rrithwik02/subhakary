// One-off/rerunnable script to regenerate correctly-sized PWA/favicon assets
// and compressed site logos from their source files.
// Run: node scripts/optimize-images.mjs
import sharp from "sharp";
import path from "node:path";

const pub = (f) => path.resolve("public", f);
const asset = (f) => path.resolve("src/assets", f);

const LOGO_SOURCE = asset("logo.png"); // 1823x1920 source mark, used for icons

async function run() {
  // Favicon: reasonable single-size PNG (browsers downscale as needed)
  await sharp(LOGO_SOURCE)
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(pub("favicon.png"));

  // Standard "any" purpose PWA icons — transparent background, content fills frame
  for (const size of [192, 512]) {
    await sharp(LOGO_SOURCE)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(pub(`pwa-icon-${size}.png`));
  }

  // Maskable icons — need a safe zone (~80% of canvas) + opaque background
  // since OS masks crop to a shape and transparent edges look broken.
  for (const size of [192, 512]) {
    const contentSize = Math.round(size * 0.7);
    const resized = await sharp(LOGO_SOURCE)
      .resize(contentSize, contentSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: resized, gravity: "center" }])
      .png({ compressionLevel: 9 })
      .toFile(pub(`pwa-icon-maskable-${size}.png`));
  }

  // OG image stays as-is (already 1200x630, 208KB — reasonable), skip.

  // Compress the site logo files actually rendered in the UI (Navbar/Footer/Auth/etc.)
  const logoTargets = [
    { file: asset("logo.png"), maxHeight: 240 },
    { file: asset("logo-white.png"), maxHeight: 240 },
    { file: asset("logo-brown.png"), maxHeight: 240 },
  ];
  for (const { file, maxHeight } of logoTargets) {
    const meta = await sharp(file).metadata();
    if (!meta.height || meta.height <= maxHeight) continue;
    const buf = await sharp(file)
      .resize({ height: maxHeight })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    await sharp(buf).toFile(file);
  }

  console.log("Image optimization complete.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
