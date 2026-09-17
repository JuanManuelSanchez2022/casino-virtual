const { Jimp, intToRGBA } = require('jimp');
const path = require('path');
const fs = require('fs');

async function analyzeImage(imgPath) {
  const img = await Jimp.read(imgPath);
  
  const width = img.bitmap.width;
  const height = img.bitmap.height;
  const data = img.bitmap.data;
  
  const getPixel = (x, y) => {
    const idx = (y * width + x) * 4;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };
  
  const samples = {
    name: path.basename(imgPath),
    width: width,
    height: height,
    // Corners
    corners: {
      '0,0': getPixel(0, 0),
      'W-1,0': getPixel(width - 1, 0),
      '0,H-1': getPixel(0, height - 1),
      'W-1,H-1': getPixel(width - 1, height - 1),
    },
    // Center
    center: getPixel(Math.floor(width / 2), Math.floor(height / 2)),
    // Ring test points - horizontal line through center
    ringTestH: {
      'r10': getPixel(Math.floor(width / 2) + 10, Math.floor(height / 2)),
      'r50': getPixel(Math.floor(width / 2) + 50, Math.floor(height / 2)),
      'r100': getPixel(Math.floor(width / 2) + 100, Math.floor(height / 2)),
      'r150': getPixel(Math.floor(width / 2) + 150, Math.floor(height / 2)),
      'r190': getPixel(Math.floor(width / 2) + 190, Math.floor(height / 2)),
      'r199': getPixel(Math.floor(width / 2) + 199, Math.floor(height / 2)),
      'r200': getPixel(Math.floor(width / 2) + 200, Math.floor(height / 2)),
    },
    // Vertical line through center
    ringTestV: {
      'r50u': getPixel(Math.floor(width / 2), Math.floor(height / 2) - 50),
      'r100u': getPixel(Math.floor(width / 2), Math.floor(height / 2) - 100),
      'r150u': getPixel(Math.floor(width / 2), Math.floor(height / 2) - 150),
      'r190u': getPixel(Math.floor(width / 2), Math.floor(height / 2) - 190),
      'r50d': getPixel(Math.floor(width / 2), Math.floor(height / 2) + 50),
      'r100d': getPixel(Math.floor(width / 2), Math.floor(height / 2) + 100),
      'r150d': getPixel(Math.floor(width / 2), Math.floor(height / 2) + 150),
    }
  };
  
  return samples;
}

async function main() {
  const baseDir = 'C:/Users/Juan/casino-virtual/frontend/public/assets/games';
  const results = await Promise.all([
    analyzeImage(path.join(baseDir, 'ruleta-borde.png')),
    analyzeImage(path.join(baseDir, 'ruleta-centro.png')),
  ]);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
