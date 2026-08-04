import fs from 'fs';
import https from 'https';
import sharp from 'sharp';
import path from 'path';

const fileId = '1lOyHTwbVEM3oINpzlGwWFZtZKzByQzGi';
const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
const dest = path.resolve('public', 'source-icon.png');

https.get(url, (res) => {
  if (res.statusCode === 302 || res.statusCode === 303) {
    https.get(res.headers.location, (res2) => {
      const file = fs.createWriteStream(dest);
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        processImage();
      });
    });
  } else {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      processImage();
    });
  }
});

async function processImage() {
  const sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];
  const outDir = path.resolve('public', 'icons');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const size of sizes) {
    await sharp(dest)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(outDir, `icon-${size}.png`));
  }
  
  await sharp(dest)
    .resize(512, 512, { fit: 'contain', background: { r: 5, g: 92, b: 68, alpha: 1 } })
    .toFile(path.join(outDir, `icon-maskable-512.png`));
    
  await sharp(dest)
    .resize(192, 192, { fit: 'contain', background: { r: 5, g: 92, b: 68, alpha: 1 } })
    .toFile(path.join(outDir, `icon-maskable-192.png`));

  await sharp(dest)
    .resize(32, 32)
    .toFile(path.resolve('public', 'favicon.ico'));
    
  await sharp(dest)
    .resize(180, 180)
    .toFile(path.resolve('public', 'apple-touch-icon.png'));

  console.log("Icons generated successfully");
}
