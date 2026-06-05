/**
 * enemyAI.js
 * 
 * Lógica de la Inteligencia Artificial Avanzada para los Jefes del juego.
 * Gestiona de forma autónoma el turno completo de los Jefes de cada mundo,
 * evaluando su energía, barra de vida y el tablero para recomendar movimientos.
 */

/**
 * Encuentra todas las gemas adyacentes que formen combinaciones.
 * Filtra según las preferencias elementales del jefe del mundo actual.
 */
function findAIRecommendedSwap(grid, preferredColor = null, prioritizeMatch4 = false) {
  const GRID_SIZE = grid.length;
  const tempGrid = grid.map(row => [...row]);

  // Auxiliar para buscar combinaciones en una grilla simulada
  const checkMatches = (g) => {
    const matches = new Set();
    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const color = g[r][c]?.color;
        if (!color) continue;
        let hLen = 1;
        while (c + hLen < GRID_SIZE && g[r][c + hLen]?.color === color) hLen++;
        if (hLen >= 3) {
          for (let k = 0; k < hLen; k++) matches.add(`${r},${c + k}`);
        }
      }
    }
    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE; r++) {
        const color = g[r][c]?.color;
        if (!color) continue;
        let vLen = 1;
        while (r + vLen < GRID_SIZE && g[r + vLen]?.[c]?.color === color) vLen++;
        if (vLen >= 3) {
          for (let k = 0; k < vLen; k++) matches.add(`${r + k},${c}`);
        }
      }
    }
    return matches;
  };

  let fallbackSwap = null;
  let preferredSwap = null;
  let match4Swap = null;

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // 1. Probar swap horizontal
      if (c + 1 < GRID_SIZE) {
        // Ejecutar swap simulado
        [tempGrid[r][c], tempGrid[r][c + 1]] = [tempGrid[r][c + 1], tempGrid[r][c]];
        const matches = checkMatches(tempGrid);
        
        // Determinar longitud e información del match
        let isMatch4 = false;
        let matchedColor = null;
        if (matches.size > 0) {
          const firstKey = Array.from(matches)[0];
          const [mr, mc] = firstKey.split(',').map(Number);
          matchedColor = tempGrid[mr][mc]?.color;
          isMatch4 = matches.size >= 4;
        }

        // Revertir swap simulado
        [tempGrid[r][c], tempGrid[r][c + 1]] = [tempGrid[r][c + 1], tempGrid[r][c]];

        if (matches.size > 0) {
          const swapMove = { r1: r, c1: c, r2: r, c2: c + 1 };
          if (isMatch4) match4Swap = swapMove;
          if (matchedColor === preferredColor) preferredSwap = swapMove;
          if (!fallbackSwap) fallbackSwap = swapMove;
        }
      }

      // 2. Probar swap vertical
      if (r + 1 < GRID_SIZE) {
        [tempGrid[r][c], tempGrid[r + 1][c]] = [tempGrid[r + 1][c], tempGrid[r][c]];
        const matches = checkMatches(tempGrid);
        
        let isMatch4 = false;
        let matchedColor = null;
        if (matches.size > 0) {
          const firstKey = Array.from(matches)[0];
          const [mr, mc] = firstKey.split(',').map(Number);
          matchedColor = tempGrid[mr][mc]?.color;
          isMatch4 = matches.size >= 4;
        }

        [tempGrid[r][c], tempGrid[r + 1][c]] = [tempGrid[r + 1][c], tempGrid[r][c]];

        if (matches.size > 0) {
          const swapMove = { r1: r, c1: c, r2: r + 1, c2: c };
          if (isMatch4) match4Swap = swapMove;
          if (matchedColor === preferredColor) preferredSwap = swapMove;
          if (!fallbackSwap) fallbackSwap = swapMove;
        }
      }
    }
  }

  // Devolver el mejor movimiento según la prioridad
  if (prioritizeMatch4 && match4Swap) return match4Swap;
  if (preferredSwap) return preferredSwap;
  return fallbackSwap;
}

/**
 * Función principal: ejecuta de forma avanzada y automatizada el turno de los jefes
 * 
 * @param {Object} enemyState Estado del enemigo
 * @param {Object} playerState Estado del jugador
 * @param {Object} currentWorld Información del mundo elemental actual
 * @param {Array} grid Matriz 6x6 actual del GameBoard
 */
export function executeAdvancedEnemyTurn(enemyState, playerState, currentWorld, grid = []) {
  const updatedEnemy = { ...enemyState };
  const updatedPlayer = { ...playerState };
  let actionDescription = '';

  const worldId = currentWorld?.id || 1;
  const enemyEnergy = updatedEnemy.energy || 0;

  let preferredColor = 'purple'; // Calaveras por defecto
  let prioritizeMatch4 = false;

  // --- ÁRBOL DE COMPORTAMIENTO TÁCTICO POR MUNDO ---
  switch (worldId) {
    case 1: // Demonio de Lava
      preferredColor = 'red'; // Prioriza Fuego
      if (enemyEnergy >= 3) {
        // Habilidad: Quemadura y Sabotaje
        const baseDmg = 8;
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🔥 Demonio activa [Lluvia de Magma] (-3 Energía). Daño infligido. Las gemas del tablero arden.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 Demonio acumula calor (+2 Energía). `;
      }
      break;

    case 2: // Kirin de Tormenta
      preferredColor = 'yellow'; // Prioriza Rayo
      prioritizeMatch4 = true;   // Busca combinaciones Match-4/5
      if (enemyEnergy >= 4) {
        // Habilidad: Pulso EMP y drenado de maná
        const baseDmg = 12;
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        
        // Drenado de maná al azar en la mano de cartas del jugador (limpia cargos)
        actionDescription = `⚡ Kirin ejecuta [Tempestad EMP] (-4 Energía). Causa ${baseDmg} de daño y drena maná de tus cartas.`;
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 Kirin invoca relámpagos ganando +3 de Energía. `;
      }
      break;

    case 3: // Titán de Granito
      preferredColor = 'green'; // Prioriza Escudo/Defensa
      if (enemyEnergy >= 3) {
        // Habilidad: Blindaje pesado
        const armorGained = 20;
        updatedEnemy.shield = (updatedEnemy.shield || 0) + armorGained;
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🪨 Titán de Granito activa [Piel de Piedra] (+20 Armadura). Se vuelve impenetrable.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 Titán se funde con la tierra ganando +2 de Energía. `;
      }
      break;

    case 4: // Vacío Cósmico (Avatar del Caos)
      preferredColor = 'purple'; // Prioriza Calaveras/Caos
      if (enemyEnergy >= 4) {
        const chaosDmg = 16;
        // Ignora escudo (Daño puro de vacío)
        updatedPlayer.hp = Math.max(0, updatedPlayer.hp - chaosDmg);
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
        actionDescription = `🌌 Avatar de Caos ejecuta [Supernova del Vacío] infligiendo ${chaosDmg} daño puro directo a HP.`;
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 El Avatar absorbe la gravedad cósmica (+3 Energía). `;
      }
      break;

    default:
      updatedEnemy.energy += 2;
      actionDescription = `🔋 El enemigo acumula energía elemental (+2 Energía).`;
      break;
  }

  // Encontrar movimiento recomendado para que el GameBoard lo anime
  let recommendedMove = null;
  if (grid && grid.length > 0) {
    recommendedMove = findAIRecommendedSwap(grid, preferredColor, prioritizeMatch4);
  }

  return {
    updatedEnemy,
    updatedPlayer,
    actionDescription,
    recommendedMove,
  };
}

/**
 * Función puente de compatibilidad con App.js
 */
export function calculateEnemyMove(enemyState, playerState) {
  return executeAdvancedEnemyTurn(enemyState, playerState, { id: 1 });
}
