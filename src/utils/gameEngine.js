// ============================================================
//  gameEngine.js
//  Motor de juego principal para el híbrido Match-3 + Cartas
//  Maneja el mazo de ejemplo, verificación de maná y ejecución
//  de efectos de cartas sobre los estados del jugador y enemigo.
// ============================================================

// ------------------------------------------------------------
// TIPOS DE CARTA disponibles en el juego
// ------------------------------------------------------------
// 'Ataque'  → Inflige daño directo al enemigo
// 'Defensa' → Añade escudo al jugador (absorbe daño)
// 'Hechizo' → Efectos especiales (daño + efectos secundarios,
//             curación, etc. — extensible a futuro)
// ------------------------------------------------------------

/**
 * @typedef {Object} ManaCost
 * Representa el coste de maná de una carta por color.
 * Los colores representan las gemas del tablero Match-3.
 * @property {number} [red]    - Maná de fuego (gemas rojas)
 * @property {number} [blue]   - Maná de agua (gemas azules)
 * @property {number} [green]  - Maná de naturaleza (gemas verdes)
 * @property {number} [yellow] - Maná de rayo (gemas amarillas)
 * @property {number} [purple] - Maná arcano (gemas púrpuras)
 */

/**
 * @typedef {Object} Card
 * Define la estructura completa de una carta del juego.
 * @property {string}   id          - Identificador único de la carta
 * @property {string}   name        - Nombre de la carta
 * @property {string}   type        - Tipo: 'Ataque' | 'Defensa' | 'Hechizo'
 * @property {ManaCost} manaCost    - Coste de maná requerido para jugarla
 * @property {number}   effectValue - Valor del efecto (daño o escudo)
 * @property {string}   description - Descripción del efecto para la UI
 */

/**
 * @typedef {Object} PlayerState
 * Estado actual del jugador.
 * @property {number} hp     - Puntos de vida actuales
 * @property {number} shield - Escudo activo (absorbe daño)
 * @property {Object} mana   - Maná disponible por color { red, blue, ... }
 */

/**
 * @typedef {Object} EnemyState
 * Estado actual del enemigo.
 * @property {number} hp     - Puntos de vida actuales
 * @property {number} shield - Escudo activo del enemigo
 */

// ============================================================
//  MAZO DE EJEMPLO (4 cartas)
//  En producción, este arreglo se cargaría desde una base de
//  datos o archivo JSON externo. Se mantiene aquí para pruebas.
// ============================================================

export const CARDS_DB = {
  dragon: {
    id: 'c1',
    name: 'Dragón de Picos Rojos',
    type: 'Ataque',
    manaCost: { red: 3 },
    effectValue: 12,
    description: 'Escupe fuego ancestral infligiendo 12 de daño crítico.',
  },
  golem: {
    id: 'c2',
    name: 'Gólem de Obsidiana',
    type: 'Defensa',
    manaCost: { purple: 3 },
    effectValue: 15,
    description: 'Pared de piedra viva que absorbe 15 de escudo.',
  },
  grifo: {
    id: 'c3',
    name: 'Grifo de Tormenta',
    type: 'Hechizo',
    manaCost: { blue: 2, yellow: 1 },
    effectValue: 8,
    description: 'Invoca un relámpago que drena energía e inflige 8 de daño mágico directo.',
  },
  fenix: {
    id: 'c4',
    name: 'Fénix de Ceniza',
    type: 'Ataque',
    manaCost: { red: 2, yellow: 2 },
    effectValue: 18,
    description: 'Desciende en llamas infligiendo 18 de daño.',
  },
  caballero: {
    id: 'c5',
    name: 'Caballero Maldito',
    type: 'Ataque',
    manaCost: { purple: 3, green: 1 },
    effectValue: 20,
    description: 'Corte maldito que desgarra al rival con 20 de daño.',
  },
  espectro: {
    id: 'c6',
    name: 'Espectro de Vacío',
    type: 'Hechizo',
    manaCost: { purple: 4 },
    effectValue: 15,
    description: 'Robo de alma directo infligiendo 15 de daño mágico.',
  },
};

// Mantenemos deck por defecto mapeado al mundo 1 para compatibilidad inicial
export const deck = [CARDS_DB.dragon, CARDS_DB.golem, CARDS_DB.grifo];

// ============================================================
//  FUNCIÓN: canPlayCard
// ============================================================

/**
 * Determina si el jugador tiene suficiente maná para jugar
 * una carta dada. Soporta cartas con costes multicolor.
 *
 * @param {Card}   card        - La carta que se desea jugar
 * @param {Object} playerMana  - Maná actual del jugador por color
 *                               Ej: { red: 5, blue: 2, green: 0 }
 * @returns {boolean} `true` si el jugador puede pagar el coste,
 *                    `false` en caso contrario.
 *
 * @example
 * const miMana = { red: 4, blue: 1 };
 * canPlayCard(deck[0], miMana); // → true  (red: 4 >= red: 3)
 * canPlayCard(deck[2], miMana); // → false (no tiene purple ni yellow)
 */
export function canPlayCard(card, playerMana) {
  // Validación defensiva: si los argumentos no son válidos, no se puede jugar
  if (!card || !card.manaCost || !playerMana) {
    console.warn('[canPlayCard] Argumentos inválidos recibidos:', { card, playerMana });
    return false;
  }

  // Iteramos sobre cada color requerido por la carta
  const costEntries = Object.entries(card.manaCost);

  for (const [color, requiredAmount] of costEntries) {
    // Maná disponible del jugador para este color (0 si no tiene ese color)
    const availableMana = playerMana[color] ?? 0;

    // Si el jugador no tiene suficiente maná de un solo color, falla
    if (availableMana < requiredAmount) {
      return false;
    }
  }

  // El jugador puede costear todos los colores requeridos
  return true;
}

// ============================================================
//  FUNCIÓN: executeCardEffect
// ============================================================

/**
 * Ejecuta el efecto de una carta sobre los estados del jugador
 * y del enemigo, devolviendo copias actualizadas de ambos estados.
 *
 * ⚠️ Esta función es PURA: no muta los estados originales.
 *    Siempre devuelve nuevos objetos para compatibilidad con
 *    el sistema de estado de React (useState / Redux).
 *
 * Lógica por tipo de carta:
 *  - 'Ataque'  → El daño se aplica primero al escudo enemigo.
 *                El excedente de daño penetra a sus HP.
 *  - 'Defensa' → El escudo se acumula sobre el escudo existente.
 *  - 'Hechizo' → Igual que 'Ataque', con daño mágico que ignora
 *                el escudo enemigo (daño directo a HP).
 *
 * @param {Card}        card        - La carta a ejecutar
 * @param {PlayerState} playerState - Estado actual del jugador
 * @param {EnemyState}  enemyState  - Estado actual del enemigo
 * @returns {{ newPlayerState: PlayerState, newEnemyState: EnemyState }}
 *          Nuevos estados inmutables tras aplicar el efecto.
 *
 * @example
 * const { newPlayerState, newEnemyState } = executeCardEffect(
 *   deck[0],                                    // Bola de Fuego (25 dmg)
 *   { hp: 100, shield: 0, mana: { red: 5 } },
 *   { hp: 80, shield: 10 }
 * );
 * // newEnemyState → { hp: 75, shield: 0 }  (10 escudo absorbido, 15 a HP)
 */
export function executeCardEffect(card, playerState, enemyState) {
  // --- Validación defensiva ---
  if (!card || !playerState || !enemyState) {
    console.error('[executeCardEffect] Argumentos inválidos:', { card, playerState, enemyState });
    // Devolvemos los estados sin cambios para no romper el juego
    return {
      newPlayerState: { ...playerState },
      newEnemyState: { ...enemyState },
    };
  }

  // Creamos copias superficiales para no mutar el estado original
  let newPlayerState = { ...playerState };
  let newEnemyState  = { ...enemyState };

  const { type, effectValue } = card;

  switch (type) {
    // ----------------------------------------------------------
    // ATAQUE: el daño golpea primero el escudo enemigo.
    // El daño sobrante se aplica a los HP del enemigo.
    // ----------------------------------------------------------
    case 'Ataque': {
      const currentEnemyShield = newEnemyState.shield ?? 0;
      const damageAfterShield  = Math.max(0, effectValue - currentEnemyShield);
      const shieldAfterDamage  = Math.max(0, currentEnemyShield - effectValue);

      newEnemyState = {
        ...newEnemyState,
        shield: shieldAfterDamage,
        // Los HP nunca bajan de 0 (condición de derrota manejada externamente)
        hp: Math.max(0, newEnemyState.hp - damageAfterShield),
      };
      break;
    }

    // ----------------------------------------------------------
    // DEFENSA: acumula escudo sobre el jugador.
    // Cap máximo estricto de 100 puntos de escudo.
    // ----------------------------------------------------------
    case 'Defensa': {
      const currentPlayerShield = newPlayerState.shield ?? 0;
      
      newPlayerState = {
        ...newPlayerState,
        shield: Math.min(100, currentPlayerShield + effectValue),
      };
      break;
    }

    // ----------------------------------------------------------
    // HECHIZO: daño mágico directo, ignora el escudo enemigo.
    // (Los hechizos penetran defensas físicas)
    // ----------------------------------------------------------
    case 'Hechizo': {
      newEnemyState = {
        ...newEnemyState,
        hp: Math.max(0, newEnemyState.hp - effectValue),
      };
      break;
    }

    // ----------------------------------------------------------
    // Tipo desconocido: registramos advertencia sin alterar estados
    // ----------------------------------------------------------
    default: {
      console.warn(
        `[executeCardEffect] Tipo de carta desconocido: "${type}". ` +
        'No se aplicó ningún efecto.'
      );
      break;
    }
  }

  return { newPlayerState, newEnemyState };
}
