const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/epinedas/.gemini/antigravity-ide/brain/691d7df2-74d7-470d-a017-50a4e657417d';
const destDir = path.join(__dirname, 'assets');

const filesToCopy = {
  'player_dragon_3d_1781103815209.png': 'player_avatar.png',
  'boss_lava_3d_1781103826200.png': 'boss_avatar.png',
  'victory_chest_3d_1781104439693.png': 'victory_chest.png',
  'epic_game_background_1781105323131.png': 'world_map_3d.png',
};

console.log('Copiando assets 3D...');
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
