const fs = require('fs');
const path = require('path');

const filePath = 'd:/Proyectos Web Personales/RPG/App.js';
let content = fs.readFileSync(filePath, 'utf8');

// Target string to replace:
const target = `                triggerFloatingDamage(false, \`-\${dmg}\`, 'Hechizo');
                triggerComboVfx('💀 GOLPE DE CALAVERA 💀');
                setCombatLog(prev => \`💀 ¡Ataque de Calavera! Infliges \${dmg} daño directo.\`);

              styles.comboMsgContainer,`;

const replacement = `                triggerFloatingDamage(false, \`-\${dmg}\`, 'Hechizo');
                triggerComboVfx('💀 GOLPE DE CALAVERA 💀');
                setCombatLog(prev => \`💀 ¡Ataque de Calavera! Infliges \${dmg} daño directo.\`);
              }}
              onBonusActionPoint={() => {
                setActionPoints(prev => prev + 1);
                triggerShake(true);
                triggerShake(false);
                triggerComboVfx('🔥 ¡COMBO EXTRA +1 PA! 🔥');
                setCombatLog(prev => '🔥 ¡Combo Alineado! Ganas +1 PA extra.');
              }}
              onPlayerDamage={(dmg) => {
                setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
                triggerShake(true);
                triggerFloatingDamage(true, \`-\${dmg}\`, 'Ataque');
                setCombatLog(prev => \`⚠️ ¡Gema Quemada activada! Sufres \${dmg} de daño.\`);
              }}
            />
          </Animated.View>

          {/* Mensaje flotante de combos */}
          {comboMsg && (
            <Animated.View style={[
              styles.comboMsgContainer,`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Replaced GameBoard callbacks and closed tags successfully!');
} else {
  console.error('ERROR: Target string not found in App.js!');
}
