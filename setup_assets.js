const fs = require('fs');
const https = require('https');
const path = require('path');
const Jimp = require('jimp');

const ASSETS_DIR = path.join(__dirname, 'assets');

async function processImages() {
  const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Verificando y convirtiendo ${files.length} imágenes a formato PNG real...`);
  
  for (const file of files) {
    const filePath = path.join(ASSETS_DIR, file);
    try {
      // Al leer y sobrescribir con Jimp, se asegura que el archivo tenga la firma real de PNG
      const image = await Jimp.read(filePath);
      await image.writeAsync(filePath);
      console.log(`✅ [Convertido a PNG real]: ${file}`);
    } catch (err) {
      console.log(`⚠️ No se pudo procesar ${file} (puede que ya sea válido o tenga otro formato).`);
    }
  }
}

function downloadBgm() {
  console.log('Descargando música de fondo épica (MP3)...');
  // Música libre de derechos para batallas épicas (Pixabay)
  const mp3Url = 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3?filename=epic-battle-music-1-105763.mp3';
  const dest = path.join(ASSETS_DIR, 'bgm.mp3');

  const file = fs.createWriteStream(dest);
  https.get(mp3Url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ bgm.mp3 descargado e implementado exitosamente.');
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('❌ Error descargando MP3:', err.message);
  });
}

async function main() {
  await processImages();
  downloadBgm();
}

main();
