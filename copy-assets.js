const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/epinedas/.gemini/antigravity-ide/brain/6f41dee5-5aec-4a10-ab27-b74f7704c40f';
const destDir = path.join(__dirname, 'assets');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const filesToCopy = {
    'red_dragon_art_1780664000485.png': 'red_dragon.png',
    'golem_art_1780664017894.png': 'golem.png',
    'griffin_art_1780664035184.png': 'griffin.png',
    'gem_red_1780664284268.png': 'gem_red.png',
    'gem_blue_1780664298205.png': 'gem_blue.png',
    'gem_green_1780664311442.png': 'gem_green.png',
    'gem_yellow_1780664324946.png': 'gem_yellow.png',
    'gem_purple_1780664341010.png': 'gem_purple.png',
    'volt_illusionist_1780664358075.png': 'volt_illusionist.png',
    'emerald_knight_1780664371646.png': 'emerald_knight.png',
    'geode_golem_1780664385819.png': 'geode_golem.png',
    'star_specter_1780664403183.png': 'star_specter.png',
    'ash_phoenix_1780664419705.png': 'ash_phoenix.png',
    'healing_sorcerer_1780664435762.png': 'healing_sorcerer.png',
    'bg_lava_1780664784866.png': 'bg_lava.png',
    'bg_lightning_1780664799206.png': 'bg_lightning.png',
    'app_icon_1780669307989.png': 'icon.png'
  };

  console.log('Starting asset copying process...');
  let copiedCount = 0;

  // 1. Copy generated assets
  for (const [srcName, destName] of Object.entries(filesToCopy)) {
    const srcPath = path.join(srcDir, srcName);
    const destPath = path.join(destDir, destName);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Copied ${srcName} -> assets/${destName}`);
      copiedCount++;
    } else {
      console.warn(`✗ Source file not found or not generated yet: ${srcName}`);
    }
  }

  // 2. Resolve missing background placeholders with valid PNG bytes (copies of red_dragon.png)
  const fallbacks = ['bg_stone.png', 'bg_cosmic.png'];
  const validFallbackSrc = path.join(destDir, 'red_dragon.png');
  
  if (fs.existsSync(validFallbackSrc)) {
    for (const file of fallbacks) {
      const destPath = path.join(destDir, file);
      fs.copyFileSync(validFallbackSrc, destPath);
      console.log(`✓ Created valid PNG metadata for assets/${file} using red_dragon.png bytes`);
      copiedCount++;
    }
  } else {
    console.error('Error: red_dragon.png not copied yet. Please run again once red_dragon.png is copied.');
  }

  console.log(`Done! Successfully copied/resolved ${copiedCount} assets.`);
} catch (err) {
  console.error('Error copying assets:', err);
}
