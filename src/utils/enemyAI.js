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
 * @param {Object} enemyStatus Estado actual del enemigo (ej: congelado)
 */
export const executeAdvancedEnemyTurn = (enemy, player, world, grid, enemyStatus, maxUnlockedWorld = 1) => {
  const updatedPlayer = { ...player };
  const updatedEnemy = { ...enemy };

  // Si el enemigo está congelado, pierde el turno
  if (enemyStatus?.type === 'Congelado') {
    return {
      actionDescription: `❄️ El enemigo está congelado y pierde su turno.`,
      updatedPlayer,
      updatedEnemy,
      recommendedMove: null,
      boardEffect: null,
    };
  }

  let actionDescription = '';
  let boardEffect = null;

  // Lógica modular infinita
  const rawWorldId = world?.id || 1;
  const worldId = ((rawWorldId - 1) % 12) + 1;
  const enemyEnergy = updatedEnemy.energy || 0;

  // --- MECÁNICA DE FASES (ENRAGE) ---
  const isPhase2 = updatedEnemy.hp <= updatedEnemy.maxHp / 2;
  const justEnteredPhase2 = isPhase2 && !updatedEnemy.phase2Active;

  if (justEnteredPhase2) {
    updatedEnemy.phase2Active = true;
    updatedEnemy.energy = 0; // Gasta su energía en enfurecerse
    switch (worldId) {
      case 1:
        updatedPlayer.shield = 0;
        actionDescription = `🔥 ¡ENFURECIDO! El Demonio de Lava entra en Fase 2. [Calor Extremo]: Derrite todo tu escudo.`;
        break;
      case 2:
        boardEffect = { type: 'lock', count: 5 };
        actionDescription = `⚡ ¡ENFURECIDO! El Kirin entra en Fase 2. [Sobrecarga]: Bloquea 5 gemas.`;
        break;
      case 3:
        updatedEnemy.shield = (updatedEnemy.shield || 0) + 50;
        actionDescription = `🪨 ¡ENFURECIDO! El Titán entra en Fase 2. [Piel de Diamante]: Gana 50 de Armadura.`;
        break;
      case 4:
        updatedPlayer.hp = Math.max(1, updatedPlayer.hp - 40);
        actionDescription = `🌌 ¡ENFURECIDO! El Avatar del Caos entra en Fase 2. [Colapso]: 40 Daño directo inevitable.`;
        break;
      default:
        updatedEnemy.shield = (updatedEnemy.shield || 0) + 30;
        actionDescription = `💢 ¡ENFURECIDO! El enemigo entra en Fase 2. Gana +30 de Armadura y aumenta su poder.`;
        break;
    }
    
    return {
      updatedEnemy,
      updatedPlayer,
      actionDescription,
      recommendedMove: null,
      boardEffect,
    };
  }

  const phaseMultiplier = updatedEnemy.phase2Active ? 1.5 : 1; // 50% más de daño en Fase 2

  let preferredColor = 'purple'; // Calaveras por defecto
  let prioritizeMatch4 = false;

  // --- ÁRBOL DE COMPORTAMIENTO TÁCTICO POR MUNDO ---
  switch (worldId) {
    case 1: // Demonio de Lava
      preferredColor = 'red'; // Prioriza Fuego
      if (enemyEnergy >= 3) {
        const baseDmg = Math.floor(15 * phaseMultiplier);
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🔥 Demonio activa [Lluvia de Magma] (-3 Energía). Causa ${baseDmg} de daño a tu defensa.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 Demonio acumula calor (+2 Energía).`;
      }
      break;

    case 2: // Kirin de Tormenta
      preferredColor = 'yellow'; // Prioriza Rayo
      prioritizeMatch4 = true;   // Busca combinaciones Match-4/5
      if (enemyEnergy >= 4) {
        const baseDmg = Math.floor(20 * phaseMultiplier);
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        actionDescription = `⚡ Kirin ejecuta [Tempestad EMP] (-4 Energía). Causa ${baseDmg} de daño y drena maná de tus cartas.`;
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 Kirin invoca relámpagos ganando +3 de Energía.`;
      }
      break;

    case 3: // Titán de Granito
      preferredColor = 'green'; // Prioriza Escudo/Defensa
      if (enemyEnergy >= 3) {
        const armorGained = 20;
        updatedEnemy.shield = (updatedEnemy.shield || 0) + armorGained;
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🪨 Titán de Granito activa [Prisión Terrestre] (+20 Armadura). Bloquea 2 gemas.`;
        boardEffect = { type: 'lock', count: 2 };
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 Titán se funde con la tierra ganando +2 de Energía.`;
      }
      break;

    case 4: // Vacío Cósmico (Avatar del Caos)
      preferredColor = 'purple'; // Prioriza Calaveras/Caos
      if (enemyEnergy >= 4) {
        const chaosDmg = 30;
        updatedPlayer.hp = Math.max(0, updatedPlayer.hp - chaosDmg);
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
        actionDescription = `🌌 Avatar de Caos ejecuta [Supernova del Vacío] infligiendo ${chaosDmg} daño puro directo a HP.`;
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 El Avatar absorbe la gravedad cósmica (+3 Energía).`;
      }
      break;

    case 5: // Monstruo Prismático
      preferredColor = 'blue'; // Cristalino
      if (enemyEnergy >= 3) {
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `💎 Monstruo Prismático lanza [Prisma Congelante] (-3 Energía). Congela 3 gemas en el tablero.`;
        boardEffect = { type: 'freeze', count: 3 };
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 El Monstruo refracta la luz circundante (+2 Energía).`;
      }
      break;

    case 6: // Señor del Viento
      preferredColor = 'yellow';
      if (enemyEnergy >= 3) {
        const baseDmg = 25;
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🌪️ Señor del Viento desata un [Ciclón Devastador] (-3 Energía). Daño infligido de ${baseDmg}.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 El Señor del Viento llama a las ráfagas celestiales (+2 Energía).`;
      }
      break;

    case 7: // Gargantúa Escarcha
      preferredColor = 'green';
      if (enemyEnergy >= 4) {
        const armorGained = 25;
        updatedEnemy.shield = (updatedEnemy.shield || 0) + armorGained;
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
        actionDescription = `❄️ Gargantúa Escarcha crea [Escudo Glaciar] (+25 Armadura) y congela 2 gemas.`;
        boardEffect = { type: 'freeze', count: 2 };
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 Gargantúa congela la humedad del aire (+2 Energía).`;
      }
      break;

    case 8: // Supremo del Caos
      preferredColor = 'purple';
      if (enemyEnergy >= 4) {
        const baseDmg = 45;
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= baseDmg) {
          updatedPlayer.shield -= baseDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (baseDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
        actionDescription = `👹 Supremo del Caos explota con una [Llamarada del Caos] (-4 Energía) infligiendo ${baseDmg} de daño destructivo.`;
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 El Supremo acumula pura entropía cósmica (+3 Energía).`;
      }
      break;

    case 9: // Desierto de Huesos (Faraón Maldito)
      preferredColor = 'green';
      if (enemyEnergy >= 3) {
        // Roba escudo y hace daño
        const stolenShield = Math.min(updatedPlayer.shield || 0, 30);
        updatedPlayer.shield = Math.max(0, (updatedPlayer.shield || 0) - stolenShield);
        updatedEnemy.shield = (updatedEnemy.shield || 0) + stolenShield;
        
        updatedPlayer.hp = Math.max(0, updatedPlayer.hp - 20); // Daño directo de maldición
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🐫 Faraón Maldito invoca [Maldición de Arena] (-3 Energía). Roba ${stolenShield} de escudo e inflige 20 de daño directo.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 El Faraón drena el calor del desierto (+2 Energía).`;
      }
      break;

    case 10: // Pantano Tóxico (Hidra Venenosa)
      preferredColor = 'green';
      if (enemyEnergy >= 3) {
        // Veneno masivo ignorando escudos
        const poisonDmg = 40;
        updatedPlayer.hp = Math.max(0, updatedPlayer.hp - poisonDmg); // Ignora escudos totalmente
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `🐍 Hidra Venenosa lanza [Lluvia Ácida] (-3 Energía). ¡${poisonDmg} de daño tóxico que ignora toda armadura!`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 La Hidra secreta más toxinas letales (+2 Energía).`;
      }
      break;

    case 11: // Ciudad Neón (Ciborg Renegado)
      preferredColor = 'yellow';
      if (enemyEnergy >= 4) {
        // Daño masivo de plasma
        const plasmaDmg = 80;
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= plasmaDmg) {
          updatedPlayer.shield -= plasmaDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (plasmaDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 4);
        actionDescription = `🤖 Ciborg Renegado dispara [Cañón de Riel Orbital] (-4 Energía) causando ${plasmaDmg} de daño catastrófico.`;
      } else {
        updatedEnemy.energy += 3;
        actionDescription = `🔋 El Ciborg sobrecarga sus baterías de fusión (+3 Energía).`;
      }
      break;

    case 12: // Reino Celestial (Serafín Supremo)
      preferredColor = 'blue';
      if (enemyEnergy >= 5) {
        // Curación extrema y daño de juicio
        updatedEnemy.hp = Math.min(updatedEnemy.maxHp, updatedEnemy.hp + 200);
        
        // Daño del juicio: te baja a 1 HP si no tienes escudo
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield < 50) {
          updatedPlayer.hp = 1;
          actionDescription = `👼 Serafín Supremo dicta [Juicio Final] (-5 Energía). Te curas poco, ¡su luz fulmina tus defensas dejándote a 1 HP!`;
        } else {
          updatedPlayer.shield = Math.max(0, playerShield - 150);
          actionDescription = `👼 Serafín Supremo dicta [Juicio Final] (-5 Energía). Tu escudo logró resistir parte de la furia divina (-150 Escudo).`;
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 5);
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 El Serafín canaliza luz pura del génesis (+2 Energía).`;
      }
      break;

    default:
      if (enemyEnergy >= 3) {
        const fallbackMultiplier = 1 + ((maxUnlockedWorld - 1) * 0.2);
        const fallbackDmg = Math.floor((15 + (worldId * 5)) * fallbackMultiplier); // Escala el daño base con el mundo
        const playerShield = updatedPlayer.shield || 0;
        if (playerShield >= fallbackDmg) {
          updatedPlayer.shield -= fallbackDmg;
        } else {
          updatedPlayer.shield = 0;
          updatedPlayer.hp = Math.max(0, updatedPlayer.hp - (fallbackDmg - playerShield));
        }
        updatedEnemy.energy = Math.max(0, enemyEnergy - 3);
        actionDescription = `💥 El enemigo desata un [Golpe Feroz] (-3 Energía). Inflige ${fallbackDmg} de daño.`;
      } else {
        updatedEnemy.energy += 2;
        actionDescription = `🔋 El enemigo acumula energía elemental (+2 Energía).`;
      }
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
    boardEffect,
  };
}

/**
 * Pronostica la siguiente intención del jefe.
 */
export const forecastBossIntent = (enemy, world, maxUnlockedWorld = 1) => {
  const rawWorldId = world?.id || 1;
  const worldId = ((rawWorldId - 1) % 12) + 1;
  const energy = enemy?.energy || 0;
  
  const isPhase2 = enemy?.hp <= enemy?.maxHp / 2;
  const justEnteredPhase2 = isPhase2 && !enemy?.phase2Active;
  
  if (justEnteredPhase2) {
    return { type: 'enrage', value: 'MAX', desc: '⚠️ ¡ENFURECIMIENTO! Ataque Masivo' };
  }

  const phaseMultiplier = isPhase2 ? 1.5 : 1;

  switch (worldId) {
    case 1:
      if (energy >= 3) return { type: 'attack', value: Math.floor(8 * phaseMultiplier), desc: `Lluvia de Magma: ${Math.floor(8 * phaseMultiplier)} Daño a Escudo/Vida` };
      return { type: 'energy', value: 2, desc: 'Acumular Calor: +2 Energía' };
    case 2:
      if (energy >= 4) return { type: 'attack', value: Math.floor(12 * phaseMultiplier), desc: `Tempestad EMP: ${Math.floor(12 * phaseMultiplier)} Daño y drena maná` };
      return { type: 'energy', value: 3, desc: 'Invocar Relámpagos: +3 Energía' };
    case 3:
      if (energy >= 3) return { type: 'defend', value: Math.floor(20 * phaseMultiplier), desc: `Piel de Piedra: +${Math.floor(20 * phaseMultiplier)} Armadura` };
      return { type: 'energy', value: 2, desc: 'Fundirse con la Tierra: +2 Energía' };
    case 4:
      if (energy >= 4) return { type: 'attack', value: Math.floor(16 * phaseMultiplier), desc: `Supernova del Vacío: ${Math.floor(16 * phaseMultiplier)} Daño Puro a HP` };
      return { type: 'energy', value: 3, desc: 'Absorber Gravedad: +3 Energía' };
    case 5:
      if (energy >= 3) return { type: 'debuff', value: 'Congelado', desc: 'Prisma Congelante: Aplica Congelamiento por 2 turnos' };
      return { type: 'energy', value: 2, desc: 'Refractar Luz: +2 Energía' };
    case 6:
      if (energy >= 3) return { type: 'attack', value: Math.floor(15 * phaseMultiplier), desc: `Ciclón Devastador: ${Math.floor(15 * phaseMultiplier)} Daño` };
      return { type: 'energy', value: 2, desc: 'Llamar a los Vientos: +2 Energía' };
    case 7:
      if (energy >= 4) return { type: 'defend', value: Math.floor(25 * phaseMultiplier), desc: `Escudo Glaciar: +${Math.floor(25 * phaseMultiplier)} Armadura` };
      return { type: 'energy', value: 2, desc: 'Acumular Escarcha: +2 Energía' };
    case 8:
      if (energy >= 4) return { type: 'attack', value: Math.floor(22 * phaseMultiplier), desc: `Llamarada del Caos: ${Math.floor(22 * phaseMultiplier)} Daño` };
      return { type: 'energy', value: 3, desc: 'Desatar Entropía: +3 Energía' };
    default:
      if (energy >= 3) {
        const fallbackMultiplier = 1 + ((maxUnlockedWorld - 1) * 0.2);
        const fallbackDmg = Math.floor((15 + (worldId * 5)) * fallbackMultiplier * phaseMultiplier);
        return { type: 'attack', value: fallbackDmg, desc: `Golpe Feroz: ${fallbackDmg} Daño` };
      }
      return { type: 'energy', value: 2, desc: 'Acumular Energía: +2 Energía' };
  }
}

/**
 * Función puente de compatibilidad con App.js
 */
export function calculateEnemyMove(enemyState, playerState) {
  return executeAdvancedEnemyTurn(enemyState, playerState, { id: 1 });
}
