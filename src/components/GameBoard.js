// ============================================================
//  GameBoard.js
//  Tablero táctico Match-3 para RPG de Fantasía Épica
//  Soporta animaciones nativas de swap, caída, combos (Match 4/5),
//  gemas de daño de calavera, climas elementales (Lava), IA visual
//  y efectos de rayo neón teledirigidos.
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';

const GRID_SIZE = 6;
const GEM_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const COLOR_MAP = {
  red: '#ef4444',     // Fuego / Llama
  blue: '#3b82f6',    // Hielo / Escudo
  green: '#10b981',   // Naturaleza / Espada
  yellow: '#eab308',  // Luz / Destellos
  purple: '#a855f7',  // Vacío / Calavera
};

const SHADOW_MAP = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  purple: '#a855f7',
};

const GEM_IMAGES = {
  red: require('../../assets/gem_red.png'),
  blue: require('../../assets/gem_blue.png'),
  green: require('../../assets/gem_green.png'),
  yellow: require('../../assets/gem_yellow.png'),
  purple: require('../../assets/gem_purple.png'),
};

const ICON_MAP = {
  red: '🔥',      // Flame
  blue: '🛡️',     // Shield
  green: '⚔️',    // Sword
  yellow: '✨',   // Sparkles
  purple: '💀',   // Skull
};

const SCREEN_W = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_W - 32, 400);
const CELL_SIZE = Math.floor(BOARD_WIDTH / GRID_SIZE);
const GEM_SIZE = CELL_SIZE - 6;

let idCounter = 999;
const generateRandomGem = (color = null) => ({
  id: `gem_${idCounter++}`,
  color: color || GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)],
  burned: false,
});

export default function GameBoard({
  grid,
  setGrid,
  currentTurn,
  actionPoints,
  currentWorld,
  onDirectDamage,
  onBonusActionPoint,
  onPlayerDamage,
  aiMove,
  onAiMoveComplete,
  onManaGained,
}) {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCounter, setTurnCounter] = useState(0);

  // Animaciones de escala para selección y combos
  const scaleAnims = useRef({}).current;
  // Animación del rayo
  const lightningOpacity = useRef(new Animated.Value(0)).current;
  const [lightningCoords, setLightningCoords] = useState(null);

  // Inicializar tablero si está vacío
  useEffect(() => {
    if (!grid || grid.length === 0) {
      let initialGrid = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        initialGrid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
          let gem;
          do {
            gem = generateRandomGem();
          } while (
            (c >= 2 && initialGrid[r][c - 1]?.color === gem.color && initialGrid[r][c - 2]?.color === gem.color) ||
            (r >= 2 && initialGrid[r - 1][c]?.color === gem.color && initialGrid[r - 2][c]?.color === gem.color)
          );
          initialGrid[r][c] = gem;
          scaleAnims[gem.id] = new Animated.Value(1);
        }
      }
      setGrid(initialGrid);
    }
  }, [grid]);

  // Asegurar que las nuevas gemas tengan animación registrada
  useEffect(() => {
    if (grid && grid.length > 0) {
      grid.forEach(row => row.forEach(cell => {
        if (cell && !scaleAnims[cell.id]) {
          scaleAnims[cell.id] = new Animated.Value(1);
        }
      }));
    }
  }, [grid]);

  // Efecto del Clima: Lava (Mundo 1) cada 3 turnos
  useEffect(() => {
    if (currentTurn === 'enemy' && currentWorld?.id === 1) {
      setTurnCounter(prev => {
        const next = prev + 1;
        if (next % 3 === 0) {
          setTimeout(() => {
            setGrid(prevGrid => {
              if (!prevGrid || prevGrid.length === 0) return prevGrid;
              const nextGrid = prevGrid.map(row => row.map(cell => ({ ...cell })));
              let burnedCount = 0;
              let attempts = 0;
              while (burnedCount < 2 && attempts < 50) {
                attempts++;
                const r = Math.floor(Math.random() * GRID_SIZE);
                const c = Math.floor(Math.random() * GRID_SIZE);
                if (nextGrid[r]?.[c] && !nextGrid[r][c].burned) {
                  nextGrid[r][c].burned = true;
                  burnedCount++;
                }
              }
              return nextGrid;
            });
          }, 500);
        }
        return next;
      });
    }
  }, [currentTurn, currentWorld]);

  // Escuchar movimientos de la IA y animarlos visualmente
  useEffect(() => {
    if (currentTurn === 'enemy' && aiMove && grid && grid.length > 0 && !isProcessing) {
      const { r1, c1, r2, c2 } = aiMove;
      
      // Simular retraso de pensamiento
      const timer = setTimeout(async () => {
        setIsProcessing(true);
        
        // 1. Resaltar gema 1
        const gem1 = grid[r1][c1];
        if (gem1 && scaleAnims[gem1.id]) {
          Animated.timing(scaleAnims[gem1.id], { toValue: 1.25, duration: 200, useNativeDriver: true }).start();
        }
        
        // 2. Ejecutar swap visual
        setTimeout(async () => {
          if (gem1 && scaleAnims[gem1.id]) {
            Animated.timing(scaleAnims[gem1.id], { toValue: 1, duration: 150, useNativeDriver: true }).start();
          }

          const nextGrid = grid.map(row => row.map(cell => ({ ...cell })));
          const temp = nextGrid[r1][c1];
          nextGrid[r1][c1] = nextGrid[r2][c2];
          nextGrid[r2][c2] = temp;

          const { hasMatches } = checkMatches(nextGrid);
          if (hasMatches) {
            setGrid(nextGrid);
            // Ejecutar la cascada y al finalizar notificar al turno
            await processCascades(nextGrid, true);
          } else {
            setIsProcessing(false);
            if (onAiMoveComplete) onAiMoveComplete({});
          }
        }, 300);

      }, 800);

      return () => clearTimeout(timer);
    }
  }, [aiMove, currentTurn, grid]);

  // Verificar combinaciones
  const checkMatches = useCallback((tempGrid) => {
    if (!tempGrid || tempGrid.length === 0) return { hasMatches: false, matches: [] };
    const matches = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
    let hasMatches = false;

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const color = tempGrid[r][c]?.color;
        if (color && tempGrid[r][c + 1]?.color === color && tempGrid[r][c + 2]?.color === color) {
          matches[r][c] = true;
          matches[r][c + 1] = true;
          matches[r][c + 2] = true;
          hasMatches = true;
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const color = tempGrid[r][c]?.color;
        if (color && tempGrid[r + 1][c]?.color === color && tempGrid[r + 2][c]?.color === color) {
          matches[r][c] = true;
          matches[r + 1][c] = true;
          matches[r + 2][c] = true;
          hasMatches = true;
        }
      }
    }

    return { hasMatches, matches };
  }, []);

  // Procesar cascada y relleno
  const processCascades = async (currentGrid, isAI = false) => {
    let activeGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));
    let cascading = true;
    let accumulatedMana = { red: 0, blue: 0, green: 0, yellow: 0, purple: 0 };

    while (cascading) {
      const { hasMatches, matches } = checkMatches(activeGrid);
      if (!hasMatches) {
        cascading = false;
        break;
      }

      // 1. Recopilar estadísticas del match (Maná, Daño, Combos)
      let totalMatchedGems = 0;
      let directDamageCount = 0;
      let containsBurnedGem = false;
      let maxComboLength = 3;
      let firstMatchCoords = null;

      // Escanear por filas/columnas para contar el tamaño del combo individual
      for (let r = 0; r < GRID_SIZE; r++) {
        let currentLen = 1;
        for (let c = 1; c < GRID_SIZE; c++) {
          if (matches[r][c] && matches[r][c - 1] && activeGrid[r][c]?.color === activeGrid[r][c - 1]?.color) {
            currentLen++;
            maxComboLength = Math.max(maxComboLength, currentLen);
          } else {
            currentLen = 1;
          }
        }
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        let currentLen = 1;
        for (let r = 1; r < GRID_SIZE; r++) {
          if (matches[r][c] && matches[r - 1][c] && activeGrid[r][c]?.color === activeGrid[r - 1][c]?.color) {
            currentLen++;
            maxComboLength = Math.max(maxComboLength, currentLen);
          } else {
            currentLen = 1;
          }
        }
      }

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (matches[r][c]) {
            const gem = activeGrid[r][c];
            if (gem) {
              accumulatedMana[gem.color]++;
              totalMatchedGems++;
              if (!firstMatchCoords) {
                firstMatchCoords = { x: c * CELL_SIZE + CELL_SIZE / 2, y: r * CELL_SIZE + CELL_SIZE / 2 };
              }
              if (gem.color === 'purple') {
                directDamageCount++;
              }
              if (gem.burned) {
                containsBurnedGem = true;
              }
            }
          }
        }
      }

      // Desatar Animación de Rayo de maná neón
      if (firstMatchCoords) {
        setLightningCoords(firstMatchCoords);
        Animated.sequence([
          Animated.timing(lightningOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
          Animated.timing(lightningOpacity, { toValue: 0, duration: 250, useNativeDriver: false }),
        ]).start();
      }

      // Notificar al padre sobre combos o daños inmediatos
      if (directDamageCount > 0 && onDirectDamage) {
        onDirectDamage(directDamageCount * 5);
      }

      if (maxComboLength >= 4 && onBonusActionPoint) {
        onBonusActionPoint();
      }

      if (containsBurnedGem && onPlayerDamage) {
        onPlayerDamage(10);
      }

      // 2. Animación de disolución (escala a 0)
      const shrinkAnims = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (matches[r][c]) {
            const gem = activeGrid[r][c];
            if (gem && scaleAnims[gem.id]) {
              shrinkAnims.push(
                Animated.timing(scaleAnims[gem.id], {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                })
              );
            }
          }
        }
      }

      if (shrinkAnims.length > 0) {
        await new Promise(resolve => {
          Animated.parallel(shrinkAnims).start(resolve);
        });
      }

      // 3. Caída de gemas
      const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      for (let c = 0; c < GRID_SIZE; c++) {
        let writeRow = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (!matches[r][c]) {
            newGrid[writeRow][c] = activeGrid[r][c];
            writeRow--;
          }
        }
        while (writeRow >= 0) {
          const gem = generateRandomGem();
          scaleAnims[gem.id] = new Animated.Value(0);
          newGrid[writeRow][c] = gem;
          writeRow--;
        }
      }

      activeGrid = newGrid;
      setGrid(activeGrid);

      // 4. Animar la aparición de las nuevas gemas
      const growAnims = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const gem = activeGrid[r][c];
          if (gem && scaleAnims[gem.id]) {
            growAnims.push(
              Animated.timing(scaleAnims[gem.id], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              })
            );
          }
        }
      }

      if (growAnims.length > 0) {
        await new Promise(resolve => {
          Animated.parallel(growAnims).start(resolve);
        });
      }
    }

    // Al final del cascade, notificar el maná ganado
    if (onManaGained) onManaGained(accumulatedMana);

    setIsProcessing(false);

    if (isAI && onAiMoveComplete) {
      onAiMoveComplete(accumulatedMana);
    }
  };

  const handleCellPress = async (r, c) => {
    if (currentTurn !== 'player' || actionPoints <= 0 || isProcessing) return;

    if (!selectedCell) {
      setSelectedCell({ r, c });
      const gem = grid[r][c];
      if (gem && scaleAnims[gem.id]) {
        Animated.timing(scaleAnims[gem.id], {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }
    } else {
      const { r: sr, c: sc } = selectedCell;
      const isAdjacent =
        (Math.abs(r - sr) === 1 && c === sc) ||
        (Math.abs(c - sc) === 1 && r === sr);

      const prevGem = grid[sr][sc];
      if (prevGem && scaleAnims[prevGem.id]) {
        Animated.timing(scaleAnims[prevGem.id], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }

      if (isAdjacent) {
        setIsProcessing(true);
        setSelectedCell(null);

        // Intentar Swap
        const nextGrid = grid.map(row => row.map(cell => ({ ...cell })));
        const temp = nextGrid[r][c];
        nextGrid[r][c] = nextGrid[sr][sc];
        nextGrid[sr][sc] = temp;

        const { hasMatches } = checkMatches(nextGrid);

        if (hasMatches) {
          setGrid(nextGrid);
          await processCascades(nextGrid, false);
        } else {
          setIsProcessing(false);
        }
      } else {
        setSelectedCell({ r, c });
        const gem = grid[r][c];
        if (gem && scaleAnims[gem.id]) {
          Animated.timing(scaleAnims[gem.id], {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      }
    }
  };

  // Estilos de tablero según el mundo
  const getWorldThemeStyle = () => {
    switch (currentWorld?.id) {
      case 1:
        return { borderColor: '#ea580c', backgroundColor: '#1c0803', shadowColor: '#ea580c' }; // Lava
      case 2:
        return { borderColor: '#0ea5e9', backgroundColor: '#02182b', shadowColor: '#0ea5e9' }; // Rayo
      case 3:
        return { borderColor: '#10b981', backgroundColor: '#041d12', shadowColor: '#10b981' }; // Piedra
      case 4:
        return { borderColor: '#a855f7', backgroundColor: '#0f051d', shadowColor: '#a855f7' }; // Vacío
      case 5:
        return { borderColor: '#ec4899', backgroundColor: '#1c0415', shadowColor: '#ec4899' }; // Cristal
      case 6:
        return { borderColor: '#38bdf8', backgroundColor: '#041d24', shadowColor: '#38bdf8' }; // Viento
      case 7:
        return { borderColor: '#67e8f9', backgroundColor: '#031726', shadowColor: '#67e8f9' }; // Glaciar
      case 8:
        return { borderColor: '#f43f5e', backgroundColor: '#1a0209', shadowColor: '#f43f5e' }; // Caos
      default:
        return { borderColor: '#374151', backgroundColor: '#11111a', shadowColor: '#374151' };
    }
  };

  const isLocked = currentTurn !== 'player' || actionPoints === 0;
  const theme = getWorldThemeStyle();

  return (
    <View style={[styles.container, isLocked ? styles.boardLocked : null, theme]}>
      {currentWorld?.bgImage && (
        <Image source={currentWorld.bgImage} style={{ ...StyleSheet.absoluteFillObject, opacity: 0.14 }} resizeMode="cover" />
      )}
      {grid && grid.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((gem, c) => {
            if (!gem) return null;
            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const gemScale = scaleAnims[gem.id] || 1;

            return (
              <TouchableOpacity
                key={gem.id}
                activeOpacity={0.8}
                disabled={isLocked || isProcessing}
                style={[
                  styles.cell,
                  isSelected ? styles.cellSelected : null,
                  gem.burned ? styles.cellBurned : null,
                ]}
                onPress={() => handleCellPress(r, c)}
              >
                <Animated.View
                  style={[
                    styles.gem,
                    {
                      transform: [{ scale: gemScale }],
                      shadowColor: SHADOW_MAP[gem.color] || '#000',
                    },
                  ]}
                >
                  <Image
                    source={GEM_IMAGES[gem.color]}
                    style={styles.gemImage}
                    resizeMode="contain"
                  />
                  {gem.burned && (
                    <View style={styles.burnedOverlay}>
                      <Text style={styles.burnedText}>🔥</Text>
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* VFX: Rayo Eléctrico de maná */}
      {lightningCoords && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lightningBolt,
            {
              left: lightningCoords.x,
              top: lightningCoords.y,
              opacity: lightningOpacity,
              // Animación de expansión neón
              transform: [
                {
                  scaleY: lightningOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.1, 10],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BOARD_WIDTH,
    height: BOARD_WIDTH,
    borderRadius: 16,
    borderWidth: 5,
    padding: 3,
    alignSelf: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.9,
    elevation: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  boardLocked: {
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    height: CELL_SIZE,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  cellSelected: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cellBurned: {
    borderWidth: 2,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },
  gem: {
    width: GEM_SIZE * 0.95,
    height: GEM_SIZE * 0.95,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    shadowOpacity: 0.85,
    elevation: 8,
  },
  gemImage: {
    width: '100%',
    height: '100%',
  },
  burnedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  burnedText: {
    fontSize: 20,
  },
  lightningBolt: {
    position: 'absolute',
    width: 6,
    height: 120,
    backgroundColor: '#fbbf24',
    borderRadius: 3,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 12,
    marginLeft: -3,
    marginTop: -60,
  },
});
