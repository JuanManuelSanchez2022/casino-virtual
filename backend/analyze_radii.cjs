const { Jimp, intToRGBA } = require('jimp');
const path = require('path');

async function analyzeImage(imgPath) {
  const img = await Jimp.read(imgPath);
  const width = img.bitmap.width;
  const height = img.bitmap.height;
  const data = img.bitmap.data;
  
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  
  const getPixel = (x, y) => {
    const idx = (y * width + x) * 4;
    if (idx < 0 || idx >= data.length - 3) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: data[idx], g: data[idx+1], b: data[idx+2], a: data[idx+3] };
  };
  
  function getRadiusAtAngle(angleDeg) {
    const rad = angleDeg * Math.PI / 180;
    const x = Math.cos(rad);
    const y = Math.sin(rad);
    
    let borderOuterRadius = null;
    let borderInnerRadius = null;
    
    for (let r = 0; r < Math.max(width, height); r++) {
      const px = cx + Math.round(r * x);
      const py = cy + Math.round(r * y);
      const pixel = getPixel(px, py);
      
      if (pixel.a === 0 && borderOuterRadius !== null) {
        if (borderInnerRadius === null) {
          borderInnerRadius = r;
        }
      } else if (pixel.a > 0 && borderOuterRadius === null) {
        borderOuterRadius = r;
        borderInnerRadius = null;
      }
    }
    
    return { outer: borderOuterRadius, inner: borderInnerRadius };
  }
  
  // Sample 8 directions
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const results = {};
  
  for (const angle of angles) {
    results[`angle_${angle}`] = getRadiusAtAngle(angle);
  }
  
  // Also check what's in the center - scan radius at angle 0 (horizontal right)
  const scan = [];
  for (let r = 0; r <= Math.floor(width / 2); r++) {
    const pixel = getPixel(cx + r, cy);
    scan.push({ r, ...pixel });
  }
  
  return {
    name: path.basename(imgPath),
    width,
    height,
    cx, cy,
    radii: results,
    scanHorizontal: scan.filter(p => p.r % 10 === 0).map(p => ({
      r: p.r, r: p.r, a: p.a,
      color: `${p.r},${p.g},${p.b}`
    }))
  };
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
