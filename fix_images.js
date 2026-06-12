const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const imagesToFix = [
  'title_screen_bg.png',
  'hero_assassin.png',
  'hero_paladin.png',
  'hero_pyromancer.png'
];

const assetsDir = path.join(__dirname, 'assets');

async function fixImages() {
  console.log('Iniciando conversión de imágenes...');
  
  for (const imgName of imagesToFix) {
    const imgPath = path.join(assetsDir, imgName);
    
    if (!fs.existsSync(imgPath)) {
      console.log(`⚠️ Archivo no encontrado: ${imgName}`);
      continue;
    }

    try {
      console.log(`Procesando ${imgName}...`);
      // Leemos la imagen (esto decodifica cualquier formato raro, incluso si es webp)
      const image = await Jimp.read(imgPath);
      
      // La guardamos obligatoriamente como un PNG puro y estándar
      await image.writeAsync(imgPath);
      console.log(`✅ ${imgName} convertido y reparado con éxito.`);
    } catch (err) {
      console.error(`❌ Error procesando ${imgName}:`, err.message);
    }
  }
  
  console.log('¡Proceso terminado! Ya puedes compilar.');
}

fixImages();
