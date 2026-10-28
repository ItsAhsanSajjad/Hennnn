const sharp = require('sharp');

async function main() {
  const w = 512;
  const h = 512;

  // Let's create an elliptical radial mask that feathers out smoothly before the edges
  // Center (256, 250), radiusX: 200, radiusY: 200
  const maskSvg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="48%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="1" />
          <stop offset="68%" stop-color="#fff" stop-opacity="1" />
          <stop offset="85%" stop-color="#fff" stop-opacity="0.6" />
          <stop offset="98%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#vignette)" />
    </svg>
  `;

  const eggBuffer = await sharp('d:/pak_hen/pakhen/pakhen/public/dashboard/daily-harvest-egg.jpg')
    .resize(w, h, { fit: 'contain' })
    .toBuffer();

  const maskBuffer = await sharp(Buffer.from(maskSvg)).png().toBuffer();

  const maskedEgg = await sharp(eggBuffer)
    .ensureAlpha()
    .composite([{ input: maskBuffer, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Create deep navy background (#071E28)
  const navyBg = await sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 7, g: 30, b: 40, alpha: 1 }
    }
  }).png().toBuffer();

  await sharp(navyBg)
    .composite([{ input: maskedEgg }])
    .png()
    .toFile('d:/pak_hen/pakhen/pakhen/public/dashboard/daily-harvest-egg-navy.png');

  await sharp(navyBg)
    .composite([{ input: maskedEgg }])
    .webp({ quality: 92 })
    .toFile('d:/pak_hen/pakhen/pakhen/public/dashboard/daily-harvest-egg-navy.webp');

  console.log('Successfully created daily-harvest-egg-navy.webp!');
}

main().catch(console.error);
