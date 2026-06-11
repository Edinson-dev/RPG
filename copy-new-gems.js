const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/epinedas/.gemini/antigravity-ide/brain/691d7df2-74d7-470d-a017-50a4e657417d';
const destDir = path.join(__dirname, 'assets');

const filesToCopy = {
  'gem_red_3d_1781103347006.png': 'gem_red_new.png',
  'gem_blue_3d_1781103354288.png': 'gem_blue.png',
  'gem_green_3d_1781103363585.png': 'gem_green.png',
  'gem_yellow_3d_1781103373722.png': 'gem_yellow_new.png',
  'gem_purple_3d_1781103384322.png': 'gem_purple_new.png'
};

console.log('Copiando nuevas gemas 3D...');
for (const [srcName, destName] of Object.entries(filesToCopy)) {
  const srcPath = path.join(srcDir, srcName);
  const destPath = path.join(destDir, destName);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ Copiado ${destName} exitosamente.`);
  } else {
    console.log(`✗ No se encontró ${srcName}`);
  }
}
