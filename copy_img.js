const fs = require('fs');
try {
  fs.copyFileSync('C:\\Users\\epinedas\\.gemini\\antigravity-ide\\brain\\691d7df2-74d7-470d-a017-50a4e657417d\\title_screen_bg_1781277406596.png', 'd:\\RPG\\assets\\title_screen_bg.png');
  console.log('Copy successful');
} catch (e) {
  console.error('Copy failed:', e);
}
