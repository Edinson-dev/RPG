// ============================================================
//  App.js
//  Código raíz unificado con sistemas de campaña (4 mundos),
//  tienda mística, gestión de mazo activo (3 cartas),
//  lógica avanzada de PA, combos Match-4/5 y daño de calaveras.
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  Modal,
  Image,
  Platform,
  TextInput,
} from 'react-native';

import GameBoard from './src/components/GameBoard';
import { executeCardEffect } from './src/utils/gameEngine';
import { executeAdvancedEnemyTurn, forecastBossIntent } from './src/utils/enemyAI';

// Helper: fuente elegíante multiplataforma
const FONT_TITLE = Platform.select({ web: "'Cinzel Decorative', 'Cinzel', serif", default: 'serif' });
const FONT_UI = Platform.select({ web: "'Rajdhani', sans-serif", default: 'sans-serif' });
const FONT_HUD = Platform.select({ web: "'Orbitron', monospace", default: 'monospace' });
const FONT_MEDIEVAL = Platform.select({ web: "'MedievalSharp', cursive", default: 'serif' });


// ============================================================
//  BASE DE DATOS GLOBAL DE CARTAS (POOL)
// ============================================================
const CARDS_POOL = {
  c1: { id: 'c1', name: 'Dragón de Picos', type: 'Ataque', manaCost: { red: 3 }, totalCost: 3, effectValue: 12, description: 'Escupe fuego ancestral infligiendo 12 de daño físico.', image: require('./assets/red_dragon.png') },
  c2: { id: 'c2', name: 'Gólem de Obsidiana', type: 'Defensa', manaCost: { purple: 3 }, totalCost: 3, effectValue: 15, description: 'Pared de piedra viva que proporciona 15 de escudo.', image: require('./assets/golem.png') },
  c3: { id: 'c3', name: 'Grifo de Tormenta', type: 'Ataque', manaCost: { yellow: 3 }, totalCost: 3, effectValue: 15, description: 'Garras electrificadas que infligen 15 de daño físico.', image: require('./assets/griffin.png') },
  c4: { id: 'c4', name: 'Ilusionista de Voltios', type: 'Hechizo', manaCost: { blue: 3 }, totalCost: 3, effectValue: 10, description: 'Drena energía e inflige 10 de daño mágico directo.', image: require('./assets/volt_illusionist.png') },
  c5: { id: 'c5', name: 'Caballero Esmeralda', type: 'Defensa', manaCost: { green: 3 }, totalCost: 3, effectValue: 20, description: 'Escudo forestal bendito que otorga 20 de escudo.', image: require('./assets/emerald_knight.png') },
  c6: { id: 'c6', name: 'Gólem de Geoda', type: 'Ataque', manaCost: { purple: 3 }, totalCost: 3, effectValue: 15, description: 'Golpe pesado que machaca al rival con 15 de daño.', image: require('./assets/geode_golem.png') },
  c7: { id: 'c7', name: 'Espectro Estelar', type: 'Hechizo', manaCost: { purple: 3 }, totalCost: 3, effectValue: 18, description: 'Haz del cosmos que inflige 18 de daño mágico puro.', image: require('./assets/star_specter.png') },
  
  // Cartas del mundo 3 y 4
  c10: { id: 'c10', name: 'Martillo de Granito', type: 'Ataque', manaCost: { purple: 3 }, totalCost: 3, effectValue: 18, description: 'Machaca al rival con granito puro infligiendo 18 de daño.', image: require('./assets/geode_golem.png') },
  c11: { id: 'c11', name: 'Sello de Éter', type: 'Defensa', manaCost: { blue: 3 }, totalCost: 3, effectValue: 22, description: 'Barrera arcana que genera 22 de escudo mágico.', image: require('./assets/volt_illusionist.png') },
  c12: { id: 'c12', name: 'Lluvia de Centellas', type: 'Hechizo', manaCost: { yellow: 3 }, totalCost: 3, effectValue: 15, description: 'Tormenta eléctrica que causa 15 de daño de rayos.', image: require('./assets/griffin.png') },
  c13: { id: 'c13', name: 'Oráculo del Caos', type: 'Hechizo', manaCost: { purple: 3 }, totalCost: 3, effectValue: 20, description: 'Distorsión psíquica que inflige 20 de daño cósmico.', image: require('./assets/star_specter.png') },
  c14: { id: 'c14', name: 'Llamarada Solar', type: 'Ataque', manaCost: { red: 3 }, totalCost: 3, effectValue: 19, description: 'Explosión de calor que quema al oponente con 19 de daño.', image: require('./assets/red_dragon.png') },
  c15: { id: 'c15', name: 'Escudo Volcánico', type: 'Defensa', manaCost: { red: 3 }, totalCost: 3, effectValue: 25, description: 'Escudo de magma que otorga 25 de escudo al portador.', image: require('./assets/golem.png') },
  
  // Cartas del mundo 5
  c16: { id: 'c16', name: 'Ciclón de Chispas', type: 'Hechizo', manaCost: { yellow: 3 }, totalCost: 3, effectValue: 16, description: 'Vendaval eléctrico que causa 16 de daño directo.', image: require('./assets/griffin.png') },
  c17: { id: 'c17', name: 'Guardián Pétreo', type: 'Defensa', manaCost: { green: 3 }, totalCost: 3, effectValue: 24, description: 'Efigie protectora de piedra que otorga 24 de escudo.', image: require('./assets/emerald_knight.png') },
  c18: { id: 'c18', name: 'Vórtice Estelar', type: 'Ataque', manaCost: { purple: 3 }, totalCost: 3, effectValue: 20, description: 'Torbellino espacial que golpea al rival con 20 de daño.', image: require('./assets/star_specter.png') },
  c19: { id: 'c19', name: 'Báculo Sagrado', type: 'Hechizo', manaCost: { green: 3 }, totalCost: 3, effectValue: 15, description: 'Restauración bendita de 15 puntos de salud/escudo.', image: require('./assets/healing_sorcerer.png') },
  c20: { id: 'c20', name: 'Espada de Plasma', type: 'Ataque', manaCost: { blue: 3 }, totalCost: 3, effectValue: 18, description: 'Corte de energía pura que inflige 18 de daño de plasma.', image: require('./assets/volt_illusionist.png') },

  // Nuevas cartas generadas para mundos 6, 7 y 8
  c21: { id: 'c21', name: 'Trueno Sagrado', type: 'Hechizo', manaCost: { yellow: 3 }, totalCost: 3, effectValue: 22, description: 'Rayo celestial que fulmina al oponente por 22 de daño.', image: require('./assets/griffin.png') },
  c22: { id: 'c22', name: 'Pared de Glaciar', type: 'Defensa', manaCost: { blue: 3 }, totalCost: 3, effectValue: 30, description: 'Bloque de hielo eterno que proporciona 30 de escudo.', image: require('./assets/volt_illusionist.png') },
  c23: { id: 'c23', name: 'Fénix Ancestral', type: 'Ataque', manaCost: { red: 3 }, totalCost: 3, effectValue: 24, description: 'Golpe ígneo legendario que inflige 24 de daño.', image: require('./assets/ash_phoenix.png') },
  c24: { id: 'c24', name: 'Martillo Sísmico', type: 'Ataque', manaCost: { green: 3 }, totalCost: 3, effectValue: 25, description: 'Impacto terrestre demoledor que inflige 25 de daño físico.', image: require('./assets/geode_golem.png') },
  c25: { id: 'c25', name: 'Espejo Cósmico', type: 'Defensa', manaCost: { purple: 3 }, totalCost: 3, effectValue: 28, description: 'Escudo astral reflectante que otorga 28 de defensa.', image: require('./assets/star_specter.png') },
  c26: { id: 'c26', name: 'Tormenta de Ceniza', type: 'Hechizo', manaCost: { red: 3 }, totalCost: 3, effectValue: 20, description: 'Granizada de cenizas abrasadoras que causa 20 de daño.', image: require('./assets/ash_phoenix.png') },
  c27: { id: 'c27', name: 'Brote Silvestre', type: 'Defensa', manaCost: { green: 3 }, totalCost: 3, effectValue: 22, description: 'Lianas curativas del bosque que otorgan 22 de escudo.', image: require('./assets/emerald_knight.png') },
  c28: { id: 'c28', name: 'Nova Estelar', type: 'Hechizo', manaCost: { purple: 3 }, totalCost: 3, effectValue: 26, description: 'Explosión de supernova que inflige 26 de daño mágico.', image: require('./assets/star_specter.png') },
  c29: { id: 'c29', name: 'Corte Rápido', type: 'Ataque', manaCost: { yellow: 3 }, totalCost: 3, effectValue: 16, description: 'Estocada fugaz que causa 16 de daño físico inmediato.', image: require('./assets/griffin.png') },
  c30: { id: 'c30', name: 'Luz de Guía', type: 'Defensa', manaCost: { blue: 3 }, totalCost: 3, effectValue: 21, description: 'Resplandor sagrado que provee 21 de escudo espiritual.', image: require('./assets/healing_sorcerer.png') },

  // Cartas exclusivas de la tienda
  c8: { id: 'c8', name: 'Fénix de Ceniza', type: 'Ataque', manaCost: { red: 3 }, totalCost: 3, effectValue: 22, description: 'Desciende en llamas infligiendo 22 de daño masivo.', price: 200, image: require('./assets/ash_phoenix.png') },
  c9: { id: 'c9', name: 'Hechicero Curativo', type: 'Defensa', manaCost: { green: 3 }, totalCost: 3, effectValue: 25, description: 'Luz sagrada que sana o restaura 25 puntos de HP/Escudo.', price: 150, image: require('./assets/healing_sorcerer.png') },
};

// ============================================================
//  BASE DE DATOS DE MUNDOS ELEMENTALES
// ============================================================
const WORLDS = [
  {
    id: 1,
    name: 'Arena de Lava',
    bgColor: '#1c0803',
    bgImage: require('./assets/bg_lava.png'),
    vignetteColor: 'rgba(239, 68, 68, 0.2)',
    boardShadowColor: '#ea580c',
    enemyName: 'Demonio de Asberos',
    enemyHp: 120,
    enemyEmoji: '🌋',
    enemyType: 'DEMON',
  },
  {
    id: 2,
    name: 'Templo del Rayo',
    bgColor: '#02182b',
    bgImage: require('./assets/bg_lightning.png'),
    vignetteColor: 'rgba(14, 165, 233, 0.2)',
    boardShadowColor: '#0ea5e9',
    enemyName: 'Kirin Ancestral',
    enemyHp: 150,
    enemyEmoji: '⚡',
    enemyType: 'CYBER',
  },
  {
    id: 3,
    name: 'Cripta de Piedra',
    bgColor: '#041d12',
    bgImage: require('./assets/bg_stone.png'),
    vignetteColor: 'rgba(16, 185, 129, 0.2)',
    boardShadowColor: '#10b981',
    enemyName: 'Titán de Granito',
    enemyHp: 180,
    enemyEmoji: '🪨',
    enemyType: 'DEMON',
  },
  {
    id: 4,
    name: 'Vacío Cósmico',
    bgColor: '#0f051d',
    bgImage: require('./assets/bg_cosmic.png'),
    vignetteColor: 'rgba(168, 85, 247, 0.2)',
    boardShadowColor: '#a855f7',
    enemyName: 'Avatar del Caos',
    enemyHp: 220,
    enemyEmoji: '🌌',
    enemyType: 'CYBER',
  },
  {
    id: 5,
    name: 'Abismo de Cristal',
    bgColor: '#1c0415',
    bgImage: require('./assets/bg_cosmic.png'),
    vignetteColor: 'rgba(236, 72, 153, 0.2)',
    boardShadowColor: '#ec4899',
    enemyName: 'Monstruo Prismático',
    enemyHp: 250,
    enemyEmoji: '💎',
    enemyType: 'CYBER',
  },
  {
    id: 6,
    name: 'Cumbre del Viento',
    bgColor: '#041d24',
    bgImage: require('./assets/bg_lightning.png'),
    vignetteColor: 'rgba(56, 189, 248, 0.2)',
    boardShadowColor: '#38bdf8',
    enemyName: 'Señor del Viento',
    enemyHp: 280,
    enemyEmoji: '🌪️',
    enemyType: 'CYBER',
  },
  {
    id: 7,
    name: 'Glaciar Eterno',
    bgColor: '#031726',
    bgImage: require('./assets/bg_stone.png'),
    vignetteColor: 'rgba(103, 232, 249, 0.2)',
    boardShadowColor: '#67e8f9',
    enemyName: 'Gargantúa Escarcha',
    enemyHp: 320,
    enemyEmoji: '❄️',
    enemyType: 'DEMON',
  },
  {
    id: 8,
    name: 'Faro del Caos',
    bgColor: '#1a0209',
    bgImage: require('./assets/bg_lava.png'),
    vignetteColor: 'rgba(244, 63, 94, 0.2)',
    boardShadowColor: '#f43f5e',
    enemyName: 'Supremo del Caos',
    enemyHp: 400,
    enemyEmoji: '👹',
    enemyType: 'DEMON',
  }
];

// Mazos únicos por mundo (cards que el enemigo tiene boca abajo + deck inicial jugador)
const WORLD_DECKS = {
  1: { playerDeck: ['c1', 'c2', 'c3'], enemyCards: 4 },    // Lava
  2: { playerDeck: ['c3', 'c4', 'c5'], enemyCards: 5 },    // Rayo
  3: { playerDeck: ['c10', 'c11', 'c12'], enemyCards: 5 }, // Piedra
  4: { playerDeck: ['c13', 'c14', 'c15'], enemyCards: 6 }, // Cósmico
  5: { playerDeck: ['c16', 'c17', 'c18'], enemyCards: 6 }, // Cristal
  6: { playerDeck: ['c21', 'c22', 'c23'], enemyCards: 6 }, // Viento
  7: { playerDeck: ['c24', 'c25', 'c26'], enemyCards: 7 }, // Glaciar
  8: { playerDeck: ['c27', 'c28', 'c30'], enemyCards: 8 }, // Caos
};

const SCREEN_W = Dimensions.get('window').width;
const BOARD_WIDTH = Math.min(SCREEN_W - 32, 400);


// ============================================================
//  COMPONENTE AUXILIAR: AvatarCard (con barras animadas)
// ============================================================
function AvatarCard({ name, isPlayer, hp, maxHp, shield, energy, maxEnergy, shakeAnim, floatingDamage, flashAnim, emojiOverride, status, bossIntent }) {
  const barColor = isPlayer ? '#10b981' : '#e11d48';
  const emoji = emojiOverride || (isPlayer ? '\uD83D\uDC32' : '\uD83E\uDD16');

  // Barra animada de vida
  const animatedHp = useRef(new Animated.Value(hp)).current;
  useEffect(() => {
    Animated.timing(animatedHp, {
      toValue: hp,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [hp]);

  const hpPercent = animatedHp.interpolate({
    inputRange: [0, maxHp],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  // Color de barra seún salud
  const barColorAnim = animatedHp.interpolate({
    inputRange: [0, maxHp * 0.25, maxHp * 0.6, maxHp],
    outputRange: ['#ef4444', '#f97316', '#eab308', barColor],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.avatarContainer,
        isPlayer ? styles.avatarPlayer : styles.avatarEnemy,
        {
          transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10] }) }],
          backgroundColor: flashAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0,0,0,0)', isPlayer ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)']
          })
        }
      ]}
    >
      <View style={[styles.avatarFrame, isPlayer ? { borderColor: '#fbbf24' } : { borderColor: '#e11d48' }]}>
        <Text style={styles.avatarEmoji}>{emoji}</Text>

        {floatingDamage && (
          <Animated.View style={[
            styles.floatingDamageContainer,
            { transform: [{ translateY: floatingDamage.animY }], opacity: floatingDamage.animOpacity }
          ]}>
            <Text style={[
              styles.floatingDamageText,
              { color: floatingDamage.type === 'Defensa' ? '#10b981' : '#ef4444' },
              floatingDamage.isCrit && { color: '#fbbf24', fontSize: 30, fontWeight: '900', textShadowColor: '#b45309', textShadowRadius: 8 }
            ]}>
              {floatingDamage.value}
            </Text>
            {floatingDamage.isCrit && (
              <Text style={{ fontSize: 8, fontFamily: FONT_HUD, color: '#fbbf24', fontWeight: 'bold', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 3 }}>
                ¡CRÍTICO! 🔥
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      <Text style={styles.avatarName} numberOfLines={1}>{name}</Text>

      <View style={styles.statsRow}>
        <Text style={styles.statText}>❤️ {Math.ceil(hp)}</Text>
        <Text style={styles.statText}>🛡️ {Math.ceil(shield)}</Text>
      </View>

      {/* Barra animada */}
      <View style={styles.barBg}>
        <Animated.View style={[styles.barFill, { width: hpPercent, backgroundColor: barColorAnim }]} />
        {/* Brillo interior */}
        <Animated.View style={[styles.barGlow, { width: hpPercent, backgroundColor: barColorAnim, opacity: 0.4 }]} />
      </View>

      {/* Estado Alterado Activo */}
      {status && (
        <View style={styles.statusBadgeContainer}>
          <Text style={[
            styles.statusBadgeText,
            status.type === 'Quemado' ? styles.statusQuemado :
            status.type === 'Congelado' ? styles.statusCongelado :
            styles.statusEnvenenado
          ]}>
            {status.type === 'Quemado' ? '🌋 Quemado' :
             status.type === 'Congelado' ? '❄️ Congelado' :
             '🟢 Envenenado'} ({status.duration}t)
          </Text>
        </View>
      )}

      {!isPlayer && maxEnergy > 0 && (
        <View style={styles.energyRow}>
          {Array.from({ length: maxEnergy }).map((_, i) => (
            <View key={i} style={[styles.energyDot, i < energy ? styles.energyDotActive : null]} />
          ))}
        </View>
      )}

      {!isPlayer && bossIntent && (
        <View style={styles.bossIntentContainer}>
          <Text style={styles.bossIntentLabel}>Siguiente Acción:</Text>
          <View style={styles.bossIntentBadge}>
            <Text style={styles.bossIntentText}>
              {bossIntent.type === 'attack' ? '⚔️' :
               bossIntent.type === 'defend' ? '🛡️' :
               bossIntent.type === 'heal' ? '💚' :
               bossIntent.type === 'debuff' ? '🧪' : '⚡'} {bossIntent.desc}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ============================================================
//  COMPONENTE PRINCIPAL: App
// ============================================================
// ============================================================
//  COMPONENTE: Mazo boca abajo del enemigo
// ============================================================
function EnemyDeckDisplay({ cardCount, worldColor }) {
  const floatAnims = useRef(
    Array.from({ length: cardCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    floatAnims.forEach((anim, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(anim, { toValue: -4, duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.enemyDeckRow}>
      {Array.from({ length: cardCount }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.enemyCardBack,
            {
              marginLeft: i > 0 ? -18 : 0,
              transform: [
                { translateY: floatAnims[i] },
                { rotate: `${(i - Math.floor(cardCount / 2)) * 4}deg` },
              ],
              borderColor: worldColor,
              zIndex: i,
            },
          ]}
        >
          <View style={styles.enemyCardBackInner}>
            <Text style={styles.enemyCardBackIcon}>🎴</Text>
          </View>
          <View style={[styles.enemyCardBackShine, { backgroundColor: worldColor }]} />
        </Animated.View>
      ))}
    </View>
  );
}

// Web Audio Synth Player for self-contained SFX
const playSfx = (type) => {
  if (Platform.OS !== 'web') return;
  if (window.sfxEnabled === false) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'match') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
    } else if (type === 'attack') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'cardPlay') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      if (ctx.createBiquadFilter) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + 0.5);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'victory') {
      const now = ctx.currentTime;
      const freqs = [261.63, 329.63, 392.00, 523.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        osc.frequency.setValueAtTime(freq * 1.5, now + 0.4);
        gain.gain.setValueAtTime(0.08, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + 0.85);
      });
    }
  } catch (e) {
    console.log('Web Audio context blocked', e);
  }
};

const WORLD_REWARDS = {
  1: 'c8',  // Fénix de Ceniza
  2: 'c9',  // Hechicero Curativo
  3: 'c6',  // Gólem de Geoda
  4: 'c7',  // Espectro Estelar
  5: 'c19', // Báculo Sagrado
  6: 'c20', // Espada de Plasma
  7: 'c29', // Corte Rápido
  8: 'c8',  // Fénix de Ceniza
};

const borderColorsByWorld = {
  1: '#ea580c', // Fuego
  2: '#0ea5e9', // Rayo
  3: '#10b981', // Piedra
  4: '#a855f7', // Vacío
  5: '#ec4899', // Cristal
  6: '#38bdf8', // Viento
  7: '#67e8f9', // Glaciar
  8: '#f43f5e', // Caos
};

const getPipColor = (color) => ({ red: '#ef4444', blue: '#0ea5e9', green: '#10b981', yellow: '#eab308', purple: '#a855f7' }[color] || '#ccc');
const getCardEmoji = (type) => ({ 'Ataque': '🗡️', 'Defensa': '🛡️', 'Hechizo': '✨' }[type] || '🎴');
const getCardTypeColor = (type) => ({ 'Ataque': '#ef4444', 'Defensa': '#10b981', 'Hechizo': '#a855f7' }[type] || '#ccc');
const getCardRarity = (cardId) => {
  if (['c8', 'c23', 'c28'].includes(cardId)) return 'legendario';
  if (['c1', 'c5', 'c7', 'c9', 'c15', 'c25'].includes(cardId)) return 'epico';
  if (['c2', 'c3', 'c4', 'c6', 'c11', 'c13', 'c18', 'c20', 'c22', 'c24'].includes(cardId)) return 'raro';
  return 'comun';
};

const getRarityColor = (rarity) => ({
  legendario: '#fbbf24',
  epico: '#a855f7',
  raro: '#0ea5e9',
  comun: 'rgba(255,255,255,0.08)'
}[rarity] || 'rgba(255,255,255,0.08)');

export default function App() {
  // --- NAVEGACIÓN Y ECONOMÍA ---
  const [gameState, setGameState] = useState('intro'); // 'intro' | 'level_selection' | 'shop' | 'deck_management' | 'combat'
  const [maxUnlockedWorld, setMaxUnlockedWorld] = useState(1);
  const [gold, setGold] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // Mazo activo y Colección del Jugador
  const [collection, setCollection] = useState(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19', 'c20', 'c21', 'c22', 'c23', 'c24', 'c25', 'c26', 'c27', 'c28', 'c29', 'c30']); // Cartas compradas/desbloqueadas

  // 5 Mazos del Jugador
  const [playerDecks, setPlayerDecks] = useState([
    { id: 1, name: 'Mazo Ígneo 🌋', cards: ['c1', 'c2', 'c3'] },
    { id: 2, name: 'Mazo Trueno ⚡', cards: ['c3', 'c4', 'c5'] },
    { id: 3, name: 'Mazo Granito 🪨', cards: ['c10', 'c11', 'c12'] },
    { id: 4, name: 'Mazo Vacío 🌌', cards: ['c13', 'c14', 'c15'] },
    { id: 5, name: 'Mazo Glaciar ❄️', cards: ['c21', 'c22', 'c23'] },
  ]);
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  const activeDeck = playerDecks[activeDeckIndex].cards;
  const setActiveDeck = (newCards) => {
    setPlayerDecks(prev => {
      return prev.map((d, idx) => {
        if (idx === activeDeckIndex) {
          return { ...d, cards: typeof newCards === 'function' ? newCards(d.cards) : newCards };
        }
        return d;
      });
    });
  };

  const [renamingDeckIndex, setRenamingDeckIndex] = useState(null);
  const [tempDeckName, setTempDeckName] = useState('');
  const [sfxEnabled, setSfxEnabled] = useState(true);

  // Sincronizar estado global de SFX
  useEffect(() => {
    window.sfxEnabled = sfxEnabled;
  }, [sfxEnabled]);

  // Estatus de banner animado de turno
  const [showTurnBanner, setShowTurnBanner] = useState(null); // null | 'player' | 'enemy'
  const turnBannerScale = useRef(new Animated.Value(0)).current;
  const turnBannerOpacity = useRef(new Animated.Value(0)).current;

  // Pulso de vida baja
  const lowHpPulse = useRef(new Animated.Value(0)).current;

  // Brillo holográfico de cartas
  const shineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false
      })
    ).start();
  }, []);

  const shineAnimInterpolated = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-180, 180]
  });

  // Estados alterados del combate
  const [playerStatus, setPlayerStatus] = useState(null); // null | { type: 'Quemado' | 'Congelado' | 'Envenenado', duration: number }
  const [enemyStatus, setEnemyStatus] = useState(null); // null | { type: 'Quemado' | 'Congelado' | 'Envenenado', duration: number }

  // Mensaje flotante de combos
  const [comboMsg, setComboMsg] = useState(null);
  const comboMsgScale = useRef(new Animated.Value(0.5)).current;
  const comboMsgOpacity = useRef(new Animated.Value(0)).current;
  const comboMsgY = useRef(new Animated.Value(0)).current;

  const triggerComboVfx = (msg) => {
    setComboMsg(msg);
    comboMsgScale.setValue(0.5);
    comboMsgOpacity.setValue(1);
    comboMsgY.setValue(0);
    Animated.parallel([
      Animated.spring(comboMsgScale, { toValue: 1.4, friction: 3, tension: 120, useNativeDriver: true }),
      Animated.timing(comboMsgY, { toValue: -65, duration: 750, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(comboMsgOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
      ])
    ]).start(() => {
      setComboMsg(null);
    });
  };

  // Selección de cartas de la mano
  const [selectedHandIndex, setSelectedHandIndex] = useState(null);

  const [lootCard, setLootCard] = useState(null); // Carta ganada en victoria


  // Mundo de combate actual
  const [currentWorldIndex, setCurrentWorldIndex] = useState(0);
  const currentWorld = WORLDS[currentWorldIndex] || WORLDS[0];

  // --- ESTADOS DE COMBATE ---
  const [actionPoints, setActionPoints] = useState(3);
  const [turn, setTurn] = useState('player');
  const [player, setPlayer] = useState({ hp: 100, maxHp: 100, shield: 20 });
  const [enemy, setEnemy] = useState({ name: '', hp: 100, maxHp: 100, shield: 0, energy: 0, type: 'DEMON' });
  const [hand, setHand] = useState([]);
  const [combatLog, setCombatLog] = useState('');
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState('idle'); // 'idle' | 'showing' | 'transitioning'

  // Resetear selección cuando cambie el turno
  useEffect(() => {
    setSelectedHandIndex(null);
  }, [turn]);

  // Animaciones de victoria
  const victoryScale = useRef(new Animated.Value(0)).current;
  const victoryOpacity = useRef(new Animated.Value(0)).current;
  const victoryTitleY = useRef(new Animated.Value(-60)).current;
  const victoryRotateY = useRef(new Animated.Value(180)).current; // 3D flip rotation
  const star1Rot = useRef(new Animated.Value(0)).current;
  const star2Rot = useRef(new Animated.Value(0)).current;
  const star3Rot = useRef(new Animated.Value(0)).current;
  const nextWorldSlide = useRef(new Animated.Value(300)).current;
  const nextWorldOpacity = useRef(new Animated.Value(0)).current;

  // --- COMPORTAMIENTO DE IA VISUAL Y GRID ---
  const [grid, setGrid] = useState([]);
  const [currentAiMove, setCurrentAiMove] = useState(null);
  const pendingAiUpdate = useRef(null);

  // --- ANIMACIONES Y VFX ---
  const playerShake = useRef(new Animated.Value(0)).current;
  const enemyShake = useRef(new Animated.Value(0)).current;
  const playerFlash = useRef(new Animated.Value(0)).current;
  const enemyFlash = useRef(new Animated.Value(0)).current;

  const spellAnimX = useRef(new Animated.Value(0)).current;
  const spellScale = useRef(new Animated.Value(0.5)).current; // Dynamic spell scaling
  const spellOpacity = useRef(new Animated.Value(0)).current;
  const [activeSpellColor, setActiveSpellColor] = useState('#ef4444');

  const playerPopupY = useRef(new Animated.Value(0)).current;
  const playerPopupOpacity = useRef(new Animated.Value(0)).current;
  const enemyPopupY = useRef(new Animated.Value(0)).current;
  const enemyPopupOpacity = useRef(new Animated.Value(0)).current;

  const [playerDamageVal, setPlayerDamageVal] = useState(null);
  const [enemyDamageVal, setEnemyDamageVal] = useState(null);

  // VFX cinematográfico de ataque
  const [attackVfx, setAttackVfx] = useState(null); // { color, fromPlayer }
  
  // --- NUEVAS CARACTERÍSTICAS PREMIUM ---
  const screenTransitionAnim = useRef(new Animated.Value(0)).current;
  const [bossIntent, setBossIntent] = useState(null);
  const [specialOfferId, setSpecialOfferId] = useState(null);
  const [specialOfferDiscount, setSpecialOfferDiscount] = useState(0);
  const [isCriticalDamage, setIsCriticalDamage] = useState(false);

  const refreshSpecialOffer = () => {
    const shopCards = Object.values(CARDS_POOL).filter(c => c.price);
    const unownedShopCards = shopCards.filter(c => !collection.includes(c.id));
    const targetPool = unownedShopCards.length > 0 ? unownedShopCards : shopCards;
    if (targetPool.length > 0) {
      const randomCard = targetPool[Math.floor(Math.random() * targetPool.length)];
      const discountPct = (Math.floor(Math.random() * 6) * 5 + 20) / 100; // 0.20 a 0.45
      setSpecialOfferId(randomCard.id);
      setSpecialOfferDiscount(discountPct);
    }
  };

  const changeGameState = (newScreen) => {
    if (newScreen === 'shop') {
      refreshSpecialOffer();
    }
    Animated.timing(screenTransitionAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setGameState(newScreen);
      Animated.timing(screenTransitionAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  // Actualizar pronóstico de intención al iniciar turno del jugador
  useEffect(() => {
    if (gameState === 'combat' && turn === 'player' && enemy && currentWorld) {
      const intent = forecastBossIntent(enemy, currentWorld);
      setBossIntent(intent);
    }
  }, [turn, gameState, enemy, currentWorld]);

  const shockwaveAnim = useRef(new Animated.Value(0)).current;
  const shockwaveOpacity = useRef(new Animated.Value(0)).current;
  const impactFlash = useRef(new Animated.Value(0)).current;
  const particle1X = useRef(new Animated.Value(0)).current;
  const particle1Y = useRef(new Animated.Value(0)).current;
  const particle2X = useRef(new Animated.Value(0)).current;
  const particle2Y = useRef(new Animated.Value(0)).current;
  const particle3X = useRef(new Animated.Value(0)).current;
  const particle3Y = useRef(new Animated.Value(0)).current;
  const particle4X = useRef(new Animated.Value(0)).current;
  const particle4Y = useRef(new Animated.Value(0)).current;
  const particle5X = useRef(new Animated.Value(0)).current;
  const particle5Y = useRef(new Animated.Value(0)).current;
  const particleOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones de pantalla de intro
  const introLogoScale = useRef(new Animated.Value(0.3)).current;
  const introLogoOpacity = useRef(new Animated.Value(0)).current;
  const introSubY = useRef(new Animated.Value(40)).current;
  const introSubOpacity = useRef(new Animated.Value(0)).current;
  const introBtnOpacity = useRef(new Animated.Value(0)).current;
  const introBgRot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (gameState !== 'intro') return;
    // Animar el logo de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.spring(introLogoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(introLogoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(introSubY, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        Animated.timing(introSubOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(introBtnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    // Rotación continua del fondo de intro
    Animated.loop(
      Animated.timing(introBgRot, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, [gameState]);

  // Efecto para animar el Banner de Turno
  useEffect(() => {
    if (gameState !== 'combat') return;
    setShowTurnBanner(turn);
    turnBannerScale.setValue(0.2);
    turnBannerOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(turnBannerScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
        Animated.timing(turnBannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(650),
      Animated.parallel([
        Animated.timing(turnBannerScale, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(turnBannerOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ])
    ]).start(() => {
      setShowTurnBanner(null);
    });
  }, [turn, gameState]);

  // Efecto para animar el pulso de la viñeta de peligro (vida baja < 25%)
  useEffect(() => {
    if (gameState !== 'combat') {
      lowHpPulse.setValue(0);
      return;
    }
    const isLow = player.hp / player.maxHp <= 0.25;
    if (isLow && player.hp > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(lowHpPulse, { toValue: 0.8, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(lowHpPulse, { toValue: 0.2, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: false })
        ])
      ).start();
    } else {
      Animated.timing(lowHpPulse, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  }, [player.hp, player.maxHp, gameState]);

  // --- PROCESAMIENTO DE ESTADOS ALTERADOS AL CAMBIAR EL TURNO ---
  useEffect(() => {
    if (gameState !== 'combat' || player.hp <= 0 || enemy.hp <= 0) return;

    if (turn === 'player') {
      let dmg = 0;
      let logMsg = '';
      let activePA = 3;

      if (playerStatus) {
        const type = playerStatus.type;
        const nextDuration = playerStatus.duration - 1;

        if (type === 'Quemado') {
          dmg = 6;
          logMsg = '🌋 ¡Sufres 6 de daño por Quemadura!';
        } else if (type === 'Envenenado') {
          dmg = 4;
          logMsg = '🟢 ¡Sufres 4 de daño por Veneno directo!';
        } else if (type === 'Congelado') {
          activePA = 2;
          logMsg = '❄️ ¡Estás Congelado! Solo inicias con 2 PA.';
        }

        if (dmg > 0) {
          setPlayer(prev => ({ ...prev, hp: Math.max(0, prev.hp - dmg) }));
          triggerShake(true);
          triggerFloatingDamage(true, `-${dmg}`, 'Ataque');
        }

        triggerComboVfx(logMsg);
        setCombatLog(prev => `⚔️ Tu Turno. ${logMsg}`);
        setPlayerStatus(nextDuration <= 0 ? null : { ...playerStatus, duration: nextDuration });
      } else {
        setCombatLog('⚔️ Tu Turno. ¡Elige tu movimiento!');
      }

      setActionPoints(activePA);

    } else if (turn === 'enemy') {
      let dmg = 0;
      let logMsg = '';

      if (enemyStatus) {
        const type = enemyStatus.type;
        const nextDuration = enemyStatus.duration - 1;

        if (type === 'Quemado') {
          dmg = 8;
          logMsg = '🌋 ¡El enemigo sufre 8 de daño por Quemadura!';
        } else if (type === 'Envenenado') {
          dmg = 6;
          logMsg = '🟢 ¡El enemigo sufre 6 de daño por Veneno!';
        } else if (type === 'Congelado') {
          logMsg = '❄️ ¡El enemigo está Congelado y aletargado!';
        }

        if (dmg > 0) {
          setEnemy(prev => {
            const nextHp = Math.max(0, prev.hp - dmg);
            if (nextHp <= 0) {
              setTimeout(() => triggerVictoryAnimation(), 800);
            }
            return { ...prev, hp: nextHp };
          });
          triggerShake(false);
          triggerFloatingDamage(false, `-${dmg}`, 'Hechizo');
        }

        triggerComboVfx(logMsg);
        setCombatLog(prev => `🤖 Turno Enemigo. ${logMsg}`);
        setEnemyStatus(nextDuration <= 0 ? null : { ...enemyStatus, duration: nextDuration });
      }
    }
  }, [turn, gameState]);

  // Calor ambiental pulsante para la arena
  const envPulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(envPulseAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
        Animated.timing(envPulseAnim, { toValue: 0.4, duration: 1500, useNativeDriver: false })
      ])
    ).start();
  }, []);

  // --- COMPRAR CARTA EN LA TIENDA ---
  const handleBuyCard = (cardId, price) => {
    if (gold < price) {
      alert('¡No tienes suficiente oro!');
      return;
    }
    setGold(prev => prev - price);
    setCollection(prev => [...prev, cardId]);
  };

  // --- EQUIPAR/DESEQUIPAR EN DECK MANAGEMENT ---
  const handleToggleEquipCard = (cardId) => {
    if (activeDeck.includes(cardId)) {
      // Remover (Mínimo 1)
      if (activeDeck.length === 1) return;
      setActiveDeck(prev => prev.filter(id => id !== cardId));
    } else {
      // Añadir (Máximo 3)
      if (activeDeck.length >= 3) {
        alert('Solo puedes equipar hasta 3 cartas.');
        return;
      }
      setActiveDeck(prev => [...prev, cardId]);
    }
  };

  // --- INICIAR COMBATE EN UN MUNDO ---
  const handleSelectWorld = (index, forceUnlock = false) => {
    if (!forceUnlock && WORLDS[index].id > maxUnlockedWorld) return;
    if (activeDeck.length !== 3) {
      alert('Debes tener exactamente 3 cartas equipadas en tu mazo activo para combatir.');
      changeGameState('deck_management');
      return;
    }

    setCurrentWorldIndex(index);
    const targetWorld = WORLDS[index];

    // Cargar estadísticas y cartas equipadas (escala con nivel)
    const maxHpBonus = (level - 1) * 15;
    const baseMaxHp = 100 + maxHpBonus;
    const startingShield = 20 + (level - 1) * 5;
    setPlayer({ hp: baseMaxHp, maxHp: baseMaxHp, shield: startingShield });
    
    const initialEnemy = {
      name: targetWorld.enemyName,
      hp: targetWorld.enemyHp,
      maxHp: targetWorld.enemyHp,
      shield: 0,
      energy: 3,
      type: targetWorld.enemyType,
    };
    setEnemy(initialEnemy);
    
    // Pronosticar intención inicial del jefe
    const initialIntent = forecastBossIntent(initialEnemy, targetWorld);
    setBossIntent(initialIntent);

    setHand(activeDeck.map(id => ({ ...CARDS_POOL[id], charge: 0 })));
    setPlayerStatus(null);
    setEnemyStatus(null);
    setActionPoints(3);
    setTurn('player');
    setCombatLog(`⚔️ Has entrado a: ${targetWorld.name}. ¡Derrota al jefe!`);
    setShowVictoryModal(false);
    changeGameState('combat');
  };

  // --- FX: SACUDIDAS Y TEXTOS FLOTANTES ---
  const triggerShake = (isTargetPlayer) => {
    const targetAnim = isTargetPlayer ? playerShake : enemyShake;
    Animated.sequence([
      Animated.timing(targetAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
      Animated.timing(targetAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const triggerSpellProjectile = (isPlayerAttacking, color = '#ef4444', onComplete) => {
    playSfx('attack');
    setActiveSpellColor(color);
    const flashAnimRef = isPlayerAttacking ? playerFlash : enemyFlash;

    // Flash del atacante
    Animated.sequence([
      Animated.timing(flashAnimRef, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(flashAnimRef, { toValue: 0, duration: 250, useNativeDriver: false })
    ]).start();

    // Proyectil principal y escala
    spellAnimX.setValue(isPlayerAttacking ? -140 : 140);
    spellScale.setValue(0.4);
    spellOpacity.setValue(1);

    Animated.timing(spellScale, {
      toValue: 1.8,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    // VFX de partículas de impacto
    const px = isPlayerAttacking ? 100 : -100;
    particle1X.setValue(px);
    particle1Y.setValue(0);
    particle2X.setValue(px);
    particle2Y.setValue(0);
    particle3X.setValue(px);
    particle3Y.setValue(0);
    particle4X.setValue(px);
    particle4Y.setValue(0);
    particle5X.setValue(px);
    particle5Y.setValue(0);
    particleOpacity.setValue(0);
    shockwaveAnim.setValue(0);
    shockwaveOpacity.setValue(0);
    setAttackVfx({ color, fromPlayer: isPlayerAttacking });

    let called = false;
    const safeComplete = () => {
      if (called) return;
      called = true;
      spellOpacity.setValue(0);
      if (onComplete) onComplete();
    };

    const safetyTimeout = setTimeout(safeComplete, 800);

    Animated.timing(spellAnimX, {
      toValue: isPlayerAttacking ? 140 : -140,
      duration: 350,
      easing: Easing.in(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      clearTimeout(safetyTimeout);
      spellOpacity.setValue(0);

      // Al impactar: flash + onda expansiva + partículas
      const targetFlash = isPlayerAttacking ? enemyFlash : playerFlash;
      Animated.parallel([
        // Flash de impacto
        Animated.sequence([
          Animated.timing(targetFlash, { toValue: 1, duration: 60, useNativeDriver: false }),
          Animated.timing(targetFlash, { toValue: 0, duration: 300, useNativeDriver: false }),
        ]),
        // Onda expansiva
        Animated.sequence([
          Animated.timing(shockwaveOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(shockwaveAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(shockwaveOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]),
        // Partículas
        Animated.sequence([
          Animated.timing(particleOpacity, { toValue: 1, duration: 50, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(particle1X, { toValue: (isPlayerAttacking ? 1 : -1) * 35, duration: 500, useNativeDriver: true }),
            Animated.timing(particle1Y, { toValue: -45, duration: 500, useNativeDriver: true }),
            Animated.timing(particle2X, { toValue: (isPlayerAttacking ? 1 : -1) * -25, duration: 500, useNativeDriver: true }),
            Animated.timing(particle2Y, { toValue: -60, duration: 500, useNativeDriver: true }),
            Animated.timing(particle3X, { toValue: (isPlayerAttacking ? 1 : -1) * 55, duration: 500, useNativeDriver: true }),
            Animated.timing(particle3Y, { toValue: -30, duration: 500, useNativeDriver: true }),
            Animated.timing(particle4X, { toValue: (isPlayerAttacking ? 1 : -1) * -45, duration: 500, useNativeDriver: true }),
            Animated.timing(particle4Y, { toValue: -15, duration: 500, useNativeDriver: true }),
            Animated.timing(particle5X, { toValue: (isPlayerAttacking ? 1 : -1) * 20, duration: 500, useNativeDriver: true }),
            Animated.timing(particle5Y, { toValue: -75, duration: 500, useNativeDriver: true }),
            Animated.timing(particleOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => {
        setAttackVfx(null);
        safeComplete();
      });
    });
  };

  const triggerFloatingDamage = (isTargetPlayer, value, type) => {
    const targetY = isTargetPlayer ? playerPopupY : enemyPopupY;
    const targetOpacity = isTargetPlayer ? playerPopupOpacity : enemyPopupOpacity;

    const numericVal = Math.abs(parseInt(value.replace(/[^0-9]/g, '')) || 0);
    const isCrit = numericVal >= 20;

    if (isTargetPlayer) setPlayerDamageVal({ value, type, isCrit });
    else setEnemyDamageVal({ value, type, isCrit });

    if (isCrit) {
      playSfx('victory');
      triggerShake(!isTargetPlayer);
      triggerShake(!isTargetPlayer);
    }

    targetY.setValue(10);
    targetOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(targetY, { toValue: -50, duration: 1000, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(targetOpacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start(() => {
      if (isTargetPlayer) setPlayerDamageVal(null);
      else setEnemyDamageVal(null);
    });
  };

  // --- AUTOMATIZACIÓN DE IA ENEMIGA (Árbol de Comportamiento por Mundo) ---
  const handleAiMoveComplete = useCallback(() => {
    if (!pendingAiUpdate.current) return;
    const { actionDescription, updatedPlayer, updatedEnemy } = pendingAiUpdate.current;
    pendingAiUpdate.current = null;
    setCurrentAiMove(null);

    // Aplicar estados al jugador según el mundo con 40% de probabilidad
    if (Math.random() < 0.4) {
      if ([1, 8].includes(currentWorld.id)) {
        setPlayerStatus({ type: 'Quemado', duration: 2 });
      } else if ([2, 7].includes(currentWorld.id)) {
        setPlayerStatus({ type: 'Congelado', duration: 2 });
      } else if ([3, 5, 6].includes(currentWorld.id)) {
        setPlayerStatus({ type: 'Envenenado', duration: 2 });
      }
    }

    const oldPlayerHp = player.hp;
    const oldPlayerShield = player.shield;
    const totalDamageReceived = (oldPlayerHp + oldPlayerShield) - (updatedPlayer.hp + (updatedPlayer.shield || 0));

    const spellColorByWorld = {
      1: '#ef4444',  // Lava → Rojo
      2: '#0ea5e9',  // Tormenta → Azul Eléctrico
      3: '#10b981',  // Piedra → Verde
      4: '#a855f7',  // Vacío → Púrpura
    };
    const bossSpellColor = spellColorByWorld[currentWorld.id] || '#a855f7';

    setCombatLog(actionDescription);

    if (totalDamageReceived > 0) {
      triggerSpellProjectile(false, bossSpellColor, () => {
        setPlayer(updatedPlayer);
        setEnemy(updatedEnemy);
        triggerShake(true);
        triggerFloatingDamage(true, `-${totalDamageReceived}`, 'Ataque');
        if (updatedPlayer.hp <= 0) return;
        setActionPoints(3);
        setTurn('player');
      });
    } else {
      setPlayer(updatedPlayer);
      setEnemy(updatedEnemy);
      setActionPoints(3);
      setTurn('player');
    }
  }, [player, enemy, currentWorld]);

  useEffect(() => {
    if (gameState !== 'combat' || turn !== 'enemy' || player.hp <= 0 || enemy.hp <= 0) return;

    const timer = setTimeout(() => {
      // Usamos la IA avanzada pasando el mundo actual y el tablero real para calcular movimientos reales
      const { actionDescription, updatedPlayer, updatedEnemy, recommendedMove } = executeAdvancedEnemyTurn(
        enemy,
        player,
        currentWorld,
        grid
      );

      pendingAiUpdate.current = { actionDescription, updatedPlayer, updatedEnemy };

      if (recommendedMove && enemyStatus?.type !== 'Congelado') {
        // Enviar coordenadas del swap a GameBoard para que lo anime en el tablero
        setCurrentAiMove(recommendedMove);
      } else {
        // Ejecutar de inmediato sin swap si el tablero no lo requiere o está congelado
        handleAiMoveComplete();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, gameState, grid]);

  // --- ANIMACIÓN DE VICTORIA (debe estar antes que handlePlayCard) ---
  const triggerVictoryAnimation = useCallback(() => {
    // Sonido de victoria
    playSfx('victory');

    // Procesar recompensas de XP, Niveles y Loot de cartas
    const gainedXp = 65;
    let newXp = xp + gainedXp;
    let nextLevel = level;
    const xpNeeded = level * 100;
    let leveledUp = false;
    
    if (newXp >= xpNeeded) {
      newXp = newXp - xpNeeded;
      nextLevel += 1;
      leveledUp = true;
    }
    
    setXp(newXp);
    setLevel(nextLevel);

    // Calcular recompensa de carta (loot)
    const rewardCardId = WORLD_REWARDS[currentWorld.id];
    if (rewardCardId) {
      setLootCard(CARDS_POOL[rewardCardId]);
      if (!collection.includes(rewardCardId)) {
        setCollection(prev => [...prev, rewardCardId]);
      }
    } else {
      setLootCard(null);
    }

    setShowVictoryModal(true);
    setVictoryPhase('showing');
    victoryScale.setValue(0);
    victoryOpacity.setValue(0);
    victoryTitleY.setValue(-60);
    victoryRotateY.setValue(180); // Start flipped
    star1Rot.setValue(0);
    star2Rot.setValue(0);
    star3Rot.setValue(0);
    nextWorldSlide.setValue(300);
    nextWorldOpacity.setValue(0);

    // Secuencia de entrada
    Animated.sequence([
      Animated.parallel([
        Animated.spring(victoryScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.timing(victoryOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(victoryTitleY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.spring(victoryRotateY, { toValue: 0, bounciness: 12, speed: 8, useNativeDriver: true }), // 3D flip spring
      ]),
      Animated.parallel([
        Animated.loop(Animated.timing(star1Rot, { toValue: 1, duration: 3000, useNativeDriver: true })),
        Animated.loop(Animated.timing(star2Rot, { toValue: 1, duration: 4000, useNativeDriver: true })),
        Animated.loop(Animated.timing(star3Rot, { toValue: 1, duration: 2500, useNativeDriver: true })),
      ]),
    ]).start();

    // Mostrar el próximo mundo después de 1.5s
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(nextWorldSlide, { toValue: 0, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(nextWorldOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1500);

    if (leveledUp) {
      alert(`🎉 ¡SUBIDA DE NIVEL! Ahora eres Nivel ${nextLevel}. Tus estadísticas máximas han aumentado.`);
    }
  }, [xp, level, collection, currentWorld]);

  // --- LÓGICA: ABSORCIÓN DE MANÁ DEL TABLERO ---
  // NOTA: El daño de Calaveras y combos Match-4/5 son manejados DIRECTAMENTE por GameBoard
  // a través de onDirectDamage y onBonusActionPoint. Aquí solo gestionamos el maná para cartas.
  const handleManaGained = useCallback((gained) => {
    if (turn !== 'player' || actionPoints <= 0) return;

    const totalManaGained = Object.values(gained).reduce((sum, val) => sum + val, 0);
    if (totalManaGained <= 0) return;

    // Jugar/absorber sonido
    playSfx('match');

    // --- Aplicar Combos Elementales Pasivos ---
    let passiveDamage = 0;
    let passiveShield = 0;
    let passiveHeal = 0;

    if (gained.red > 0) passiveDamage += gained.red * 2;
    if (gained.blue > 0) passiveShield += gained.blue * 3;
    if (gained.green > 0) passiveHeal += gained.green * 2;

    if (passiveDamage > 0) {
      setEnemy(prev => {
        const nextHp = Math.max(0, prev.hp - passiveDamage);
        if (nextHp <= 0) setTimeout(() => triggerVictoryAnimation(), 800);
        return { ...prev, hp: nextHp };
      });
      triggerShake(false);
      triggerFloatingDamage(false, `-${passiveDamage}`, 'Hechizo');
    }
    if (passiveShield > 0) {
      setPlayer(prev => ({ ...prev, shield: Math.min(100, prev.shield + passiveShield) }));
      triggerFloatingDamage(true, `+${passiveShield}`, 'Defensa');
    }
    if (passiveHeal > 0) {
      setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + passiveHeal) }));
      triggerFloatingDamage(true, `+${passiveHeal}`, 'Defensa');
    }

    // Cada match en el tablero consume 1 PA
    const newPA = actionPoints - 1;
    setActionPoints(newPA);

    // Distribuir el maná ganado para cargar las cartas en mano
    setHand(prevHand => {
      const nextHand = prevHand.map(c => ({ ...c }));
      let remainingMana = totalManaGained;
      let targetCardName = '';
      let addedMana = 0;

      for (let i = 0; i < nextHand.length; i++) {
        const card = nextHand[i];
        const needed = card.totalCost - card.charge;
        if (needed > 0) {
          const toAdd = Math.min(remainingMana, needed);
          card.charge += toAdd;
          remainingMana -= toAdd;
          if (toAdd > 0) {
            targetCardName = card.name;
            addedMana += toAdd;
          }
        }
        if (remainingMana <= 0) break;
      }

      if (targetCardName) {
        setCombatLog(`⚡ Absorbes ${totalManaGained} gemas → [${targetCardName}] +${addedMana} maná. (-1 PA)`);
      }
      return nextHand;
    });

    // Pasar turno automáticamente si se agotaron los PA
    if (newPA <= 0) {
      setTimeout(() => setTurn('enemy'), 1000);
    }
  }, [turn, actionPoints]);

  // --- LÓGICA: JUGAR CARTA DE LA MANO ---
  const handlePlayCard = useCallback((card) => {
    if (turn !== 'player') return;
    
    if (actionPoints <= 0) {
      setCombatLog('⚠️ No te quedan Puntos de Acción (PA) para lanzar cartas.');
      return;
    }

    if (card.charge < card.totalCost) {
      setCombatLog('⚠️ La carta aún no está completamente cargada de maná.');
      return;
    }

    // Consumir 1 PA y sonar
    playSfx('cardPlay');
    const newPA = actionPoints - 1;
    setActionPoints(newPA);

    const oldEnemyHp = enemy.hp;
    const oldEnemyShield = enemy.shield;

    // Ejecutar el efecto de la carta (Cap a 100 de escudo manejado en gameEngine)
    const { newPlayerState, newEnemyState } = executeCardEffect(card, player, enemy);

    setHand(prevHand => prevHand.map(c => c.id === card.id ? { ...c, charge: 0 } : c));
    setSelectedHandIndex(null);

    // Aplicar estados alterados según el id/elemento de la carta
    if (['c1', 'c8', 'c14', 'c23', 'c26'].includes(card.id)) {
      setEnemyStatus({ type: 'Quemado', duration: 2 });
    } else if (['c4', 'c11', 'c20', 'c22', 'c30'].includes(card.id)) {
      setEnemyStatus({ type: 'Congelado', duration: 2 });
    } else if (['c5', 'c17', 'c19', 'c27'].includes(card.id)) {
      setEnemyStatus({ type: 'Envenenado', duration: 2 });
    }

    let log = `⚔️ Lanzas [${card.name}] (-1 PA). `;
    if (card.type === 'Ataque') log += `Inflige ${card.effectValue} de daño.`;
    if (card.type === 'Defensa') log += `Ganas +${card.effectValue} de escudo.`;
    if (card.type === 'Hechizo') log += `Dmg mágico directo de ${card.effectValue}.`;
    setCombatLog(log);

    const finishCardPlay = () => {
      setPlayer(newPlayerState);
      setEnemy(newEnemyState);

      if (card.type === 'Defensa') {
        triggerFloatingDamage(true, `+${card.effectValue}`, 'Defensa');
      } else {
        const totalDamageDone = (oldEnemyHp + oldEnemyShield) - (newEnemyState.hp + (newEnemyState.shield || 0));
        if (totalDamageDone > 0) {
          triggerShake(false);
          triggerFloatingDamage(false, `-${totalDamageDone}`, card.type);
        }
      }

      if (newEnemyState.hp <= 0) {
        setTimeout(() => triggerVictoryAnimation(), 800);
      } else if (newPA <= 0) {
        setTimeout(() => setTurn('enemy'), 1000);
      }
    };

    if (card.type !== 'Defensa') {
      const spellColor = card.type === 'Hechizo' ? '#fbbf24' : '#ef4444';
      triggerSpellProjectile(true, spellColor, finishCardPlay);
    } else {
      finishCardPlay();
    }
  }, [turn, player, enemy, actionPoints, triggerVictoryAnimation]);

  const handleEndTurn = useCallback(() => {
    if (turn !== 'player' || enemy.hp <= 0 || player.hp <= 0) return;
    setActionPoints(0);
    setCombatLog('⏩ Turno pasado. El enemigo prepara su contraataque...');
    setTurn('enemy');
  }, [turn, player, enemy]);

  const handleClaimVictory = useCallback((action) => {
    const newGold = 150;
    setGold(prev => prev + newGold);
    const nextIdx = currentWorldIndex + 1;
    if (currentWorld.id === maxUnlockedWorld && maxUnlockedWorld < WORLDS.length) {
      setMaxUnlockedWorld(prev => prev + 1);
    }
    setShowVictoryModal(false);
    setVictoryPhase('idle');

    if (action === 'next' && nextIdx < WORLDS.length) {
      // Ir directo al siguiente mundo con mazo correspondiente
      const nextWorldDecks = WORLD_DECKS[WORLDS[nextIdx].id];
      if (nextWorldDecks) setActiveDeck(nextWorldDecks.playerDeck);
      setTimeout(() => handleSelectWorld(nextIdx, true), 100);
    } else if (action === 'shop') {
      changeGameState('shop');
    } else {
      changeGameState('level_selection');
    }
  }, [currentWorldIndex, currentWorld, maxUnlockedWorld]);

  const handleRetryCampaign = () => {
    handleSelectWorld(currentWorldIndex);
  };

  const heroFloating = playerDamageVal ? { value: playerDamageVal.value, type: playerDamageVal.type, animY: playerPopupY, animOpacity: playerPopupOpacity } : null;
  const enemyFloating = enemyDamageVal ? { value: enemyDamageVal.value, type: enemyDamageVal.type, animY: enemyPopupY, animOpacity: enemyPopupOpacity } : null;

  // ============================================================
  //  INTERFAZ: PANTALLA DE INTRO ÉPICA
  // ============================================================
  if (gameState === 'intro') {
    const bgRotDeg = introBgRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
      <SafeAreaView style={styles.introRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#000" />

        {/* Fondo giratorio */}
        <Animated.View style={[styles.introBgWheel, { transform: [{ rotate: bgRotDeg }] }]}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={[styles.introBgRay, { transform: [{ rotate: `${i * 45}deg` }] }]} />
          ))}
        </Animated.View>

        {/* Círculo de resplandor central */}
        <View style={styles.introGlowCircle} />

        {/* Logo principal */}
        <Animated.View style={[styles.introLogoContainer, {
          opacity: introLogoOpacity,
          transform: [{ scale: introLogoScale }]
        }]}>
          <Text style={styles.introLogoEmoji}>⚔️</Text>
          <Text style={styles.introLogoTitle}>REALM</Text>
          <Text style={styles.introLogoSubtitle}>OF ELEMENTS</Text>
          <View style={styles.introDivider} />
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: introSubOpacity, transform: [{ translateY: introSubY }] }}>
          <Text style={styles.introTagline}>Match Gems • Cast Spells • Conquer Worlds</Text>
        </Animated.View>

        {/* Botón de inicio */}
        <Animated.View style={{ opacity: introBtnOpacity, marginTop: 40 }}>
          <TouchableOpacity
            onPress={() => changeGameState('level_selection')}
            style={styles.introStartBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.introStartBtnText}>⚡ INICIAR AVENTURA</Text>
          </TouchableOpacity>
          <Text style={styles.introVersionText}>v1.0 — RPG Match-3 Cards</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: SELECCIÓN DE NIVELES (OVERWORLD)
  // ============================================================
  if (gameState === 'level_selection') {
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <View style={styles.selectionHeader}>
          <View>
            <Text style={styles.selectionHeaderTitle}>✨ CAMPAÑA ELEMENTAL ✨</Text>
            <Text style={styles.xpText}>NIVEL {level} • XP {xp}/{level * 100}</Text>
          </View>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              onPress={() => {
                setSfxEnabled(prev => !prev);
                playSfx('match');
              }}
              style={styles.soundToggleBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.soundToggleText}>{sfxEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
            <Text style={styles.goldBadgeText}>🪙 {gold} Oro</Text>
          </View>
        </View>

        <View style={styles.navBar}>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
            <Text style={styles.navBtnText}>🗺️ Reino</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeGameState('shop')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🛒 Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeGameState('deck_management')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🎴 Mazo ({activeDeck.length}/3)</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.selectionScroll}>
          <Text style={styles.selectionInstructions}>
            Desafía a los jefes elementales. Mover gemas y jugar cartas consume 1 PA.
          </Text>

          <View style={styles.mapPathContainer}>
            {/* Línea conectora del camino RPG */}
            <View style={styles.mapConnectorLine} />

            {WORLDS.map((w, idx) => {
              const isLocked = w.id > maxUnlockedWorld;
              const isCurrent = w.id === maxUnlockedWorld;
              const borderThemeColor = borderColorsByWorld[w.id] || '#444';
              
              // Alineación alternada para simular un sendero curvo de mapa de rol
              const alignSelf = idx % 2 === 0 ? 'flex-start' : 'flex-end';
              const sideMargin = idx % 2 === 0 ? { marginLeft: 10 } : { marginRight: 10 };

              return (
                <View key={w.id} style={[styles.mapNodeWrapper, { alignSelf }, sideMargin]}>
                  {/* Punto indicador de la ruta */}
                  <View style={[styles.mapNodeDot, { backgroundColor: isLocked ? '#1f2937' : borderThemeColor }]} />
                  
                  <TouchableOpacity
                    disabled={isLocked}
                    onPress={() => handleSelectWorld(idx)}
                    activeOpacity={0.85}
                    style={[
                      styles.worldCard,
                      { borderColor: borderThemeColor, shadowColor: borderThemeColor },
                      isLocked ? styles.worldCardLocked : styles.worldCardUnlocked,
                      isCurrent ? styles.worldCardCurrent : null,
                    ]}
                  >
                    {w.bgImage && (
                      <Image source={w.bgImage} style={styles.worldCardBg} resizeMode="cover" />
                    )}
                    
                    {/* Badge del estado del mundo */}
                    <View style={[styles.worldStatusBadge, { backgroundColor: isLocked ? 'rgba(0,0,0,0.8)' : isCurrent ? borderThemeColor : 'rgba(16,185,129,0.8)' }]}>
                      <Text style={styles.worldStatusBadgeText}>
                        {isLocked ? '🔒 BLOQUEADO' : isCurrent ? '⚔️ ACTUAL' : '✓ COMPLETADO'}
                      </Text>
                    </View>

                    <View style={styles.worldCardHeader}>
                      <Text style={styles.worldCardEmoji}>{w.enemyEmoji}</Text>
                      <Text style={styles.worldCardName}>{w.name}</Text>
                    </View>
                    <View style={styles.worldCardDivider} />
                    <View style={styles.worldCardBody}>
                      <Text style={styles.worldCardJefe}>Jefe: {w.enemyName}</Text>
                      <Text style={styles.worldCardHp}>Vida: ❤️ {w.enemyHp} HP</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: TIENDA MÍSTICA (SHOP)
  // ============================================================
  if (gameState === 'shop') {
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionHeaderTitle}>🛒 TIENDA MÍSTICA</Text>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              onPress={() => {
                setSfxEnabled(prev => !prev);
                playSfx('match');
              }}
              style={styles.soundToggleBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.soundToggleText}>{sfxEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
            <Text style={styles.goldBadgeText}>🪙 {gold} Oro</Text>
          </View>
        </View>

        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => changeGameState('level_selection')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🗺️ Reino</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
            <Text style={styles.navBtnText}>🛒 Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeGameState('deck_management')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🎴 Mazo ({activeDeck.length}/3)</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.shopScroll}>
          <Text style={styles.selectionInstructions}>Adquiere hechizos y guerreros para potenciar tu mazo de combate.</Text>
          
          <View style={styles.shopGrid}>
            {Object.values(CARDS_POOL).map(card => {
              if (!card.price) return null;
              const isOwned = collection.includes(card.id);
              const rarity = getCardRarity(card.id);

              const isOffer = card.id === specialOfferId;
              const discountMultiplier = isOffer ? (1 - specialOfferDiscount) : 1;
              const finalPrice = Math.floor(card.price * discountMultiplier);

              return (
                <View key={card.id} style={[styles.shopItemCard, { borderColor: getRarityColor(rarity) }]}>
                  {isOffer && !isOwned && (
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>⚡ OFERTA -{Math.round(specialOfferDiscount * 100)}% ⚡</Text>
                    </View>
                  )}

                  <View style={styles.shopItemHeader}>
                    <Text style={styles.shopItemEmoji}>{getCardEmoji(card.type)}</Text>
                    <Text style={styles.shopItemName}>{card.name}</Text>
                  </View>
                  {card.image && (
                    <Image source={typeof card.image === 'number' ? card.image : { uri: card.image }} style={styles.shopCardImage} resizeMode="cover" />
                  )}
                  <Text style={styles.shopItemDesc}>{card.description}</Text>
                  <Text style={[styles.shopItemType, { color: getCardTypeColor(card.type) }]}>
                    {card.type.toUpperCase()} (VAL: {card.effectValue})
                  </Text>

                  {isOwned ? (
                    <View style={styles.shopBoughtBadge}>
                      <Text style={styles.shopBoughtText}>✓ ADQUIRIDA</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleBuyCard(card.id, finalPrice)}
                      style={styles.shopBuyBtn}
                    >
                      <Text style={styles.shopBuyBtnText}>
                        🪙 COMPRAR por {finalPrice} {isOffer && <Text style={{ textDecorationLine: 'line-through', fontSize: 7, opacity: 0.7 }}>({card.price})</Text>}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: GESTIÓN DEL MAZO (DECK MANAGEMENT)
  // ============================================================
  if (gameState === 'deck_management') {
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionHeaderTitle}>🎴 GESTIÓN DE MAZOS</Text>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              onPress={() => {
                setSfxEnabled(prev => !prev);
                playSfx('match');
              }}
              style={styles.soundToggleBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.soundToggleText}>{sfxEnabled ? '🔊' : '🔇'}</Text>
            </TouchableOpacity>
            <Text style={styles.deckCountText}>{activeDeck.length} / 3 EQUIPADAS</Text>
          </View>
        </View>

        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => changeGameState('level_selection')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🗺️ Reino</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => changeGameState('shop')} style={styles.navBtn}>
            <Text style={styles.navBtnText}>🛒 Tienda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navBtn, styles.navBtnActive]}>
            <Text style={styles.navBtnText}>🎴 Mazo ({activeDeck.length}/3)</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.deckScroll}>
          {/* Selector de 5 Mazos */}
          <View style={styles.deckSelectorContainer}>
            <Text style={styles.deckSectionLabel}>ELIGE TU CONFIGURACIÓN DE MAZO (5 MAZOS):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deckSelectorScroll}>
              {playerDecks.map((d, idx) => (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => {
                    setActiveDeckIndex(idx);
                    playSfx('cardPlay');
                  }}
                  style={[
                    styles.deckTabBtn,
                    idx === activeDeckIndex ? styles.deckTabBtnActive : null
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.deckTabBtnText, idx === activeDeckIndex ? styles.deckTabBtnTextActive : null]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.deckRenameRow}>
              <Text style={styles.deckEditingLabel}>
                Mazo actual: <Text style={styles.deckEditingName}>{playerDecks[activeDeckIndex].name}</Text>
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setTempDeckName(playerDecks[activeDeckIndex].name);
                  setRenamingDeckIndex(activeDeckIndex);
                }}
                style={styles.renameBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.renameBtnText}>✏️ Cambiar Nombre</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.selectionInstructions}>
            Selecciona exactamente 3 cartas de tu colección para equipar en tu mazo activo.
          </Text>

          <View style={styles.deckGrid}>
            {collection.map(cardId => {
              const card = CARDS_POOL[cardId];
              const isEquipped = activeDeck.includes(cardId);
              const rarity = getCardRarity(cardId);

              return (
                <TouchableOpacity
                  key={cardId}
                  activeOpacity={0.8}
                  onPress={() => handleToggleEquipCard(cardId)}
                  style={[
                    styles.deckItemCard,
                    isEquipped ? styles.deckItemEquipped : styles.deckItemUnequipped,
                    { borderColor: getRarityColor(rarity) }
                  ]}
                >

                  <View style={styles.deckItemHeader}>
                    <Text style={styles.deckItemEmoji}>{getCardEmoji(card.type)}</Text>
                    <Text style={styles.deckItemName}>{card.name}</Text>
                  </View>
                  {card.image && (
                    <Image source={typeof card.image === 'number' ? card.image : { uri: card.image }} style={styles.deckCardImage} resizeMode="cover" />
                  )}
                  <Text style={styles.deckItemDesc}>{card.description}</Text>
                  <Text style={[styles.deckItemType, { color: getCardTypeColor(card.type) }]}>
                    {card.type.toUpperCase()} ({card.effectValue})
                  </Text>
                  <View style={[styles.equipIndicator, isEquipped ? styles.equipActive : styles.equipInactive]}>
                    <Text style={styles.equipText}>{isEquipped ? '✓ EQUIPADA' : 'EQUIPAR'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Modal para renombrar mazo */}
        <Modal
          visible={renamingDeckIndex !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setRenamingDeckIndex(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.renameModalCard}>
              <Text style={styles.renameModalTitle}>🛡️ Renombrar Mazo 🛡️</Text>
              <Text style={styles.renameModalSubtitle}>Escribe el nuevo nombre para tu mazo de combate:</Text>
              
              <TextInput
                style={styles.renameInput}
                value={tempDeckName}
                onChangeText={setTempDeckName}
                placeholder="Nombre del mazo..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={20}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  onPress={() => setRenamingDeckIndex(null)}
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (!tempDeckName.trim()) {
                      alert('El nombre no puede estar vacío');
                      return;
                    }
                    setPlayerDecks(prev => {
                      return prev.map((d, idx) => {
                        if (idx === renamingDeckIndex) {
                          return { ...d, name: tempDeckName.trim() };
                        }
                        return d;
                      });
                    });
                    setRenamingDeckIndex(null);
                    playSfx('match');
                  }}
                  style={[styles.modalBtn, styles.modalBtnSave]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalBtnSaveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: COMBATE ACTIVO (COMBAT)
  // ============================================================
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: currentWorld.bgColor }]}>
      <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
      {currentWorld.bgImage && (
        <Image source={currentWorld.bgImage} style={styles.backgroundImage} resizeMode="cover" />
      )}
      {/* Viñeta de sombra interna */}
      <View pointerEvents="none" style={[styles.lavaVignette, { borderColor: currentWorld.vignetteColor }]} />
      {/* Viñeta de peligro de vida baja */}
      <Animated.View pointerEvents="none" style={[styles.dangerVignette, { opacity: lowHpPulse }]} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* HUD SUPERIOR */}
        <View style={styles.hudSection}>
          {/* === VFX CINEMATOGRÁFICO DE ATAQUE === */}
          {/* Proyectil principal */}
          <Animated.View style={[styles.spellProjectile, {
            opacity: spellOpacity,
            backgroundColor: activeSpellColor,
            shadowColor: activeSpellColor,
            transform: [
              { translateX: spellAnimX },
              { scale: spellScale }
            ]
          }]}>
            <View style={[styles.spellCore, { backgroundColor: activeSpellColor }]} />
          </Animated.View>

          {/* Partículas de impacto */}
          {attackVfx && (
            <>
              <Animated.View style={[styles.impactParticle, {
                backgroundColor: attackVfx.color,
                shadowColor: attackVfx.color,
                opacity: particleOpacity,
                transform: [{ translateX: particle1X }, { translateY: particle1Y }]
              }]} />
              <Animated.View style={[styles.impactParticle, styles.impactParticleSm, {
                backgroundColor: attackVfx.color,
                shadowColor: attackVfx.color,
                opacity: particleOpacity,
                transform: [{ translateX: particle2X }, { translateY: particle2Y }]
              }]} />
              <Animated.View style={[styles.impactParticle, styles.impactParticleLg, {
                backgroundColor: '#ffffff',
                shadowColor: attackVfx.color,
                opacity: particleOpacity,
                transform: [{ translateX: particle3X }, { translateY: particle3Y }]
              }]} />
              <Animated.View style={[styles.impactParticle, styles.impactParticleSm, {
                backgroundColor: attackVfx.color,
                shadowColor: '#ffffff',
                opacity: particleOpacity,
                transform: [{ translateX: particle4X }, { translateY: particle4Y }]
              }]} />
              <Animated.View style={[styles.impactParticle, {
                backgroundColor: '#ffffff',
                shadowColor: attackVfx.color,
                opacity: particleOpacity,
                transform: [{ translateX: particle5X }, { translateY: particle5Y }]
              }]} />
              {/* Onda expansiva */}
              <Animated.View style={[styles.shockwave, {
                borderColor: attackVfx.color,
                opacity: shockwaveOpacity,
                transform: [{ scale: shockwaveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3] }) }]
              }]} />
            </>
          )}

          <View style={styles.hud3Cols}>
            {/* Jugador */}
            <View style={styles.hudColSide}>
              <AvatarCard
                name="SR. DRAGÓN"
                isPlayer={true}
                hp={player.hp}
                maxHp={player.maxHp}
                shield={player.shield}
                shakeAnim={playerShake}
                floatingDamage={heroFloating}
                flashAnim={playerFlash}
                status={playerStatus}
              />
            </View>

            {/* Turno y PA */}
            <View style={styles.hudColCenter}>
              <Text style={styles.worldTitle}>✦ {currentWorld.name.toUpperCase()} ✦</Text>
              {currentWorld.id === 1 && <Text style={styles.worldDescriptor}>🌋 Terreno de Magma (Fuego quema gemas)</Text>}
              {currentWorld.id === 2 && <Text style={styles.worldDescriptor}>⚡ Tormenta de Rayos (IA busca combos)</Text>}
              {currentWorld.id === 3 && <Text style={styles.worldDescriptor}>🪨 Cripta de Granito (IA busca defensas)</Text>}
              {currentWorld.id === 4 && <Text style={styles.worldDescriptor}>🌌 Vacío Cósmico (IA hace daño puro)</Text>}
              
              <View style={styles.turnIndicator}>
                <Text style={[styles.turnText, { color: turn === 'player' ? '#10b981' : '#ef4444' }]}>
                  {turn === 'player' ? '⚔️ TU TURNO' : '🤖 TURNO RIVAL'}
                </Text>
              </View>

              <View style={styles.paContainer}>
                <Text style={styles.paText}>
                  ✨ PA: {'⭐'.repeat(Math.max(0, actionPoints))}{'❌'.repeat(Math.max(0, 3 - actionPoints))}
                </Text>
              </View>

              <Text style={styles.combatLog} numberOfLines={3}>
                {combatLog}
              </Text>
            </View>

            {/* Jefe */}
            <View style={styles.hudColSide}>
              <AvatarCard
                name={enemy.name}
                isPlayer={false}
                hp={enemy.hp}
                maxHp={enemy.maxHp}
                shield={enemy.shield}
                energy={enemy.energy ?? 0}
                maxEnergy={6}
                shakeAnim={enemyShake}
                floatingDamage={enemyFloating}
                flashAnim={enemyFlash}
                emojiOverride={currentWorld.enemyEmoji}
                status={enemyStatus}
                bossIntent={bossIntent}
              />
            </View>
          </View>
        </View>

        {/* ESCENARIO DE COMBATE 3D */}
        <View style={styles.boardScene}>
          {/* Base de Plataforma 3D para efecto de profundidad */}
          <View style={[styles.boardPlatformBase, { backgroundColor: currentWorld.boardShadowColor, opacity: 0.15 }]} />
          
          <Animated.View style={[
            styles.boardWrapper, 
            { 
              shadowColor: currentWorld.boardShadowColor,
              shadowOpacity: envPulseAnim, 
              borderColor: envPulseAnim.interpolate({
                inputRange: [0.4, 1],
                outputRange: ['transparent', currentWorld.boardShadowColor]
              }),
              transform: [
                { perspective: 1000 },
                { rotateX: '15deg' },
                { scaleY: 0.94 },
                { scaleX: 0.96 }
              ]
            }
          ]}>
            <GameBoard 
              grid={grid}
              setGrid={setGrid}
              onManaGained={handleManaGained} 
              currentTurn={turn} 
              actionPoints={actionPoints} 
              currentWorld={currentWorld}
              aiMove={currentAiMove}
              onAiMoveComplete={handleAiMoveComplete}
              onDirectDamage={(dmg) => {
                setEnemy(prev => {
                  const nextHp = Math.max(0, prev.hp - dmg);
                  if (nextHp <= 0) {
                    setTimeout(() => triggerVictoryAnimation(), 800);
                  }
                  return { ...prev, hp: nextHp };
                });
                triggerShake(false);
                triggerFloatingDamage(false, `-${dmg}`, 'Hechizo');
                triggerComboVfx('💀 GOLPE DE CALAVERA 💀');
                setCombatLog(prev => `💀 ¡Ataque de Calavera! Infliges ${dmg} daño directo.`);
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
                triggerFloatingDamage(true, `-${dmg}`, 'Ataque');
                setCombatLog(prev => `⚠️ ¡Gema Quemada activada! Sufres ${dmg} de daño.`);
              }}
            />
          </Animated.View>

          {/* Mensaje flotante de combos */}
          {comboMsg && (
            <Animated.View style={[
              styles.comboMsgContainer,
              {
                opacity: comboMsgOpacity,
                transform: [
                  { scale: comboMsgScale },
                  { translateY: comboMsgY }
                ]
              }
            ]} pointerEvents="none">
              <Text style={styles.comboMsgText}>{comboMsg}</Text>
            </Animated.View>
          )}
        </View>

        {/* MAZO BOCA ABAJO DEL ENEMIGO */}
        <View style={styles.enemyDeckSection}>
          <Text style={styles.enemyDeckLabel}>🤖 {enemy.name} — Mazo</Text>
          <EnemyDeckDisplay
            cardCount={WORLD_DECKS[currentWorld.id]?.enemyCards || 4}
            worldColor={currentWorld.boardShadowColor}
          />
        </View>

        {/* COLA DE CASTEO (MANO) */}
        <View style={styles.handSection}>
          <View style={styles.handHeader}>
            <Text style={styles.handTitle}>🎴 CARTAS EQUIPADAS (Mano activa)</Text>
            <TouchableOpacity onPress={handleEndTurn} style={styles.endTurnBtn} disabled={turn !== 'player'}>
              <Text style={styles.endTurnText}>PASAR TURNO</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
            {hand.map((card, idx) => {
              const isReady = card.charge >= card.totalCost;
              const progress = Math.min(100, (card.charge / card.totalCost) * 100);
              const cardDisabled = actionPoints <= 0 || turn !== 'player';
              const isSelected = selectedHandIndex === idx;
              const rarity = getCardRarity(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.8}
                  disabled={cardDisabled}
                  style={[
                    styles.cardContainer,
                    isReady ? styles.cardReady : null,
                    cardDisabled ? styles.cardContainerDisabled : null,
                    isSelected ? styles.cardSelected : null,
                    { borderColor: getRarityColor(rarity) }
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      handlePlayCard(card);
                    } else {
                      setSelectedHandIndex(idx);
                      playSfx('cardPlay');
                    }
                  }}
                >

                  <View style={styles.cardManaRow}>
                    {Object.entries(card.manaCost).map(([color, amount]) => (
                      <View key={color} style={[styles.manaPip, { backgroundColor: getPipColor(color) }]}>
                        <Text style={styles.manaPipText}>{amount}</Text>
                      </View>
                    ))}
                  </View>

                  {card.image ? (
                    <Image source={typeof card.image === 'number' ? card.image : { uri: card.image }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.cardEmoji}>{getCardEmoji(card.type)}</Text>
                    </View>
                  )}
                  
                  <View style={styles.cardChargeBarBg}>
                    <View style={[styles.cardChargeBarFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.chargeText}>MANÁ: {card.charge}/{card.totalCost}</Text>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                    <Text style={[styles.cardType, { color: getCardTypeColor(card.type) }]}>
                      {card.type.toUpperCase()} ({card.effectValue})
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={3}>{card.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      {/* PANTALLA DE VICTORIA ANIMADA */}
      <Modal visible={showVictoryModal} transparent animationType="none">
        <View style={styles.victoryOverlay}>
          {/* Fondo de partículas giratorias */}
          <Animated.Text style={[styles.victoryStar, styles.victoryStarTL, {
            transform: [{ rotate: star1Rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
          }]}>✨</Animated.Text>
          <Animated.Text style={[styles.victoryStar, styles.victoryStarTR, {
            transform: [{ rotate: star2Rot.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }]
          }]}>⭐</Animated.Text>
          <Animated.Text style={[styles.victoryStar, styles.victoryStarBL, {
            transform: [{ rotate: star3Rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
          }]}>🌟</Animated.Text>
          <Animated.Text style={[styles.victoryStar, styles.victoryStarBR, {
            transform: [{ rotate: star1Rot.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }]
          }]}>✨</Animated.Text>

          <Animated.View style={[styles.victoryCard, {
            opacity: victoryOpacity,
            transform: [
              { scale: victoryScale },
              { perspective: 1000 },
              { rotateY: victoryRotateY.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }) }
            ]
          }]}>
            {/* Título */}
            <Animated.View style={{ transform: [{ translateY: victoryTitleY }] }}>
              <Text style={styles.victoryEmoji}>{currentWorld.enemyEmoji}</Text>
              <Text style={styles.victoryTitle}>¡VICTORIA!</Text>
              <Text style={styles.victoryWorldName}>{currentWorld.name.toUpperCase()} CONQUISTADO</Text>
            </Animated.View>

            {/* Recompensas */}
            <View style={[styles.victoryRewardsBox, { borderColor: currentWorld.boardShadowColor }]}>
              <Text style={styles.victoryRewardRow}>💰 +150 Monedas de Oro</Text>
              <Text style={styles.victoryRewardRow}>⭐ Nivel completado</Text>
            </View>

            {/* Carta Recompensa (Loot) */}
            {lootCard && (
              <View style={styles.lootCardAwardContainer}>
                <Text style={styles.lootCardAwardLabel}>🎁 ¡CARTA OBTENIDA!</Text>
                <View style={[styles.cardContainer, styles.cardReady, { transform: [{ rotate: '2deg' }], alignSelf: 'center', marginVertical: 8, shadowColor: currentWorld.boardShadowColor }]}>
                  <View style={styles.cardManaRow}>
                    {Object.entries(lootCard.manaCost).map(([color, amount]) => (
                      <View key={color} style={[styles.manaPip, { backgroundColor: getPipColor(color) }]}>
                        <Text style={styles.manaPipText}>{amount}</Text>
                      </View>
                    ))}
                  </View>
                  {lootCard.image ? (
                    <Image source={typeof lootCard.image === 'number' ? lootCard.image : { uri: lootCard.image }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Text style={styles.cardEmoji}>{getCardEmoji(lootCard.type)}</Text>
                    </View>
                  )}
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>{lootCard.name}</Text>
                    <Text style={[styles.cardType, { color: getCardTypeColor(lootCard.type) }]}>
                      {lootCard.type.toUpperCase()} ({lootCard.effectValue})
                    </Text>
                    <Text style={styles.cardDesc} numberOfLines={3}>{lootCard.description}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Próximo mundo */}
            {currentWorldIndex < WORLDS.length - 1 ? (
              <Animated.View style={[styles.nextWorldPreview, {
                opacity: nextWorldOpacity,
                transform: [{ translateX: nextWorldSlide }]
              }]}>
                <Text style={styles.nextWorldLabel}>➡️ SIGUIENTE MUNDO</Text>
                <Text style={styles.nextWorldEmoji}>{WORLDS[currentWorldIndex + 1].enemyEmoji}</Text>
                <Text style={styles.nextWorldName}>{WORLDS[currentWorldIndex + 1].name}</Text>
                <Text style={styles.nextWorldEnemy}>Jefe: {WORLDS[currentWorldIndex + 1].enemyName}</Text>
              </Animated.View>
            ) : (
              <Animated.View style={[styles.nextWorldPreview, {
                opacity: nextWorldOpacity,
                transform: [{ translateX: nextWorldSlide }]
              }]}>
                <Text style={styles.nextWorldName}>🏆 ¡CAMPAÑA COMPLETADA!</Text>
              </Animated.View>
            )}

            {/* Botones */}
            <View style={styles.victoryBtnsCol}>
              {currentWorldIndex < WORLDS.length - 1 && (
                <TouchableOpacity
                  onPress={() => handleClaimVictory('next')}
                  style={[styles.victoryBtn, { backgroundColor: currentWorld.boardShadowColor }]}
                >
                  <Text style={styles.victoryBtnText}>⚔️ IR AL SIGUIENTE MUNDO</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleClaimVictory('shop')}
                style={[styles.victoryBtn, { backgroundColor: '#8b5cf6' }]}
              >
                <Text style={styles.victoryBtnText}>🛒 IR A LA TIENDA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleClaimVictory('map')}
                style={[styles.victoryBtn, { backgroundColor: '#374151' }]}
              >
                <Text style={styles.victoryBtnText}>🗺️ MAPA DE REINOS</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL DERROTA */}
      <Modal visible={!showVictoryModal && player.hp <= 0} transparent animationType="fade">
        <View style={styles.overlay}>
          <Text style={[styles.overlayTitle, { color: '#ef4444' }]}>💀 HAS CAÍDO</Text>
          <Text style={styles.overlaySub}>{enemy.name} te ha eliminado de la zona.</Text>
          
          <View style={styles.defeatButtons}>
            <TouchableOpacity onPress={handleRetryCampaign} style={[styles.overlayBtn, { marginRight: 10 }]}>
              <Text style={styles.overlayBtnText}>🔄 REINTENTAR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeGameState('level_selection')} style={[styles.overlayBtn, { borderColor: '#4b5563' }]}>
              <Text style={[styles.overlayBtnText, { color: '#9ca3af' }]}>🗺️ REGRESAR AL MAPA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Banner de Turno Flotante */}
      {showTurnBanner && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.turnBannerCentering}>
            <Animated.View style={[
              styles.turnBannerOverlay,
              {
                opacity: turnBannerOpacity,
                transform: [{ scale: turnBannerScale }],
                borderColor: showTurnBanner === 'player' ? '#fbbf24' : '#ef4444',
                shadowColor: showTurnBanner === 'player' ? '#fbbf24' : '#ef4444',
              }
            ]}>
              <Text style={[styles.turnBannerText, showTurnBanner === 'player' ? styles.turnBannerTextPlayer : styles.turnBannerTextEnemy]}>
                {showTurnBanner === 'player' ? '⚔️ ¡TU TURNO! ⚔️' : '💀 TURNO ENEMIGO 💀'}
              </Text>
            </Animated.View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
// ============================================================
//  HOJA DE ESTILOS PREMIUM
// ============================================================
const styles = StyleSheet.create({
  selectionRoot: { flex: 1, backgroundColor: '#0a0a0f' },
  selectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2d',
    backgroundColor: '#0a0a12',
  },
  selectionHeaderTitle: { color: '#fbbf24', fontFamily: FONT_TITLE, fontSize: 15, fontWeight: 'bold', letterSpacing: 2 },
  xpText: { color: '#64748b', fontSize: 10, fontFamily: FONT_HUD, marginTop: 2 },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center' },
  goldBadgeText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 13, fontFamily: FONT_HUD },
  deckCountText: { color: '#10b981', fontWeight: 'bold', fontSize: 12, fontFamily: FONT_HUD },

  navBar: { flexDirection: 'row', backgroundColor: '#0a0a12', paddingVertical: 2, borderBottomWidth: 1, borderBottomColor: '#1e1e2d' },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  navBtnActive: { borderBottomWidth: 2, borderBottomColor: '#fbbf24' },
  navBtnText: { color: '#cbd5e1', fontFamily: FONT_UI, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  selectionScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  selectionInstructions: { color: '#64748b', fontSize: 11, fontFamily: FONT_UI, textAlign: 'center', marginVertical: 16, lineHeight: 16 },

  // Mapa en camino RPG
  mapPathContainer: {
    position: 'relative',
    paddingVertical: 30,
    width: '100%',
    paddingHorizontal: 10,
  },
  mapConnectorLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 6,
    marginLeft: -3,
    backgroundColor: '#1e1b4b',
    borderRadius: 3,
    borderColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1,
    zIndex: 1,
  },
  mapNodeWrapper: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    zIndex: 5,
  },
  mapNodeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#0a0a0f',
    backgroundColor: '#3b82f6',
    position: 'absolute',
    left: '58.8%', // Center line intersection point
    marginLeft: -8,
    zIndex: 10,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 0.8,
  },
  worldCard: {
    width: '82%',
    backgroundColor: '#0c0c16',
    borderRadius: 16,
    borderWidth: 1.5,
    borderBottomWidth: 6,
    borderRightWidth: 4,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.5,
    elevation: 10,
  },
  worldCardCurrent: {
    borderColor: '#fbbf24',
    borderBottomColor: '#d97706',
    borderRightColor: '#d97706',
    shadowColor: '#fbbf24',
    shadowRadius: 20,
    shadowOpacity: 0.8,
  },
  worldCardBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
    borderRadius: 14,
  },
  worldCardLocked: { opacity: 0.35 },
  worldCardUnlocked: { opacity: 1 },
  worldStatusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 15,
  },
  worldStatusBadgeText: {
    color: '#fff',
    fontSize: 7.5,
    fontWeight: 'bold',
    fontFamily: FONT_HUD,
    letterSpacing: 0.5,
  },
  worldCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 60 },
  worldCardEmoji: { fontSize: 26, marginRight: 10 },
  worldCardName: { color: '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: FONT_TITLE, flexShrink: 1 },
  worldCardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 8 },
  worldCardBody: { gap: 4 },
  worldCardJefe: { color: '#f87171', fontSize: 10.5, fontWeight: 'bold', fontFamily: FONT_UI },
  worldCardHp: { color: '#64748b', fontSize: 9.5, fontFamily: FONT_HUD },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  lockText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD },

  // Tienda
  shopScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  shopGrid: { gap: 16 },
  shopItemCard: {
    backgroundColor: '#0d0d1a', borderRadius: 14, borderWidth: 1,
    borderColor: '#1e293b', padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, shadowOpacity: 0.4,
  },
  shopItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  shopItemEmoji: { fontSize: 26, marginRight: 8 },
  shopItemName: { color: '#f1f5f9', fontSize: 15, fontWeight: 'bold', fontFamily: FONT_TITLE },
  shopItemDesc: { color: '#64748b', fontSize: 11, fontFamily: FONT_UI, marginBottom: 8, lineHeight: 16 },
  shopItemType: { fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD, marginBottom: 12 },
  shopBuyBtn: { backgroundColor: '#fbbf24', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  shopBuyBtnText: { color: '#000', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 11, letterSpacing: 1 },
  shopBoughtBadge: { backgroundColor: '#1e293b', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  shopBoughtText: { color: '#64748b', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 11 },

  // Mazo
  deckScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  deckGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14 },
  deckItemCard: { width: '47%', borderRadius: 14, borderWidth: 2, padding: 12, marginBottom: 4 },
  deckItemEquipped: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: '#10b981' },
  deckItemUnequipped: { backgroundColor: '#0d0d1a', borderColor: '#1e293b' },
  deckItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  deckItemEmoji: { fontSize: 22, marginRight: 6 },
  deckItemName: { color: '#f1f5f9', fontSize: 12, fontWeight: 'bold', fontFamily: FONT_TITLE, flexShrink: 1 },
  deckItemDesc: { color: '#64748b', fontSize: 10, fontFamily: FONT_UI, marginBottom: 6, lineHeight: 14 },
  deckItemType: { fontSize: 9, fontWeight: 'bold', fontFamily: FONT_HUD, marginBottom: 10 },
  equipIndicator: { paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  equipActive: { backgroundColor: '#10b981' },
  equipInactive: { backgroundColor: '#1e293b' },
  equipText: { color: '#fff', fontSize: 9, fontWeight: 'bold', fontFamily: FONT_HUD },

  // Combate
  root: { flex: 1, backgroundColor: '#030008' },
  scroll: { flexGrow: 1, backgroundColor: 'transparent', paddingBottom: Platform.OS === 'android' ? 20 : 40 },
  lavaVignette: { ...StyleSheet.absoluteFillObject, borderWidth: 20, zIndex: 1, borderRadius: 0 },
  hudSection: {
    backgroundColor: 'rgba(5,5,18,0.92)',
    borderBottomWidth: 1,
    borderColor: 'rgba(251,191,36,0.2)',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    zIndex: 10,
    overflow: 'visible',
  },
  hud3Cols: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hudColSide: { width: '31%' },
  hudColCenter: { width: '36%', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  worldTitle: { color: '#fbbf24', fontFamily: FONT_TITLE, fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2, textAlign: 'center' },
  worldDescriptor: { color: '#64748b', fontFamily: FONT_UI, fontSize: 8, textAlign: 'center', marginBottom: 5 },
  turnIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: 5,
  },
  turnText: { fontFamily: FONT_HUD, fontSize: 9, fontWeight: 'bold' },
  paContainer: {
    backgroundColor: 'rgba(10,10,25,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    marginBottom: 5,
  },
  paText: { color: '#ffffff', fontFamily: FONT_HUD, fontSize: 9, fontWeight: 'bold' },
  combatLog: { color: '#64748b', fontFamily: FONT_UI, fontSize: 9, textAlign: 'center', lineHeight: 12, minHeight: 32 },
  
  avatarContainer: {
    backgroundColor: 'rgba(10,10,25,0.95)',
    borderRadius: 12,
    padding: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    elevation: 6,
  },
  avatarPlayer: { borderColor: '#10b981' },
  avatarEnemy: { borderColor: '#e11d48' },
  avatarFrame: {
    width: 46, height: 46, borderRadius: 8, borderWidth: 2,
    backgroundColor: '#0d0d1a', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 5, position: 'relative',
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, shadowOpacity: 0.4,
  },
  avatarEmoji: { fontSize: 26 },
  avatarName: { color: '#e2e8f0', fontSize: 9, fontWeight: 'bold', textAlign: 'center', marginBottom: 3, fontFamily: FONT_UI },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  statText: { color: '#cbd5e1', fontSize: 9, fontFamily: FONT_HUD },
  barBg: { height: 7, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'visible', marginBottom: 3, position: 'relative' },
  barFill: { height: '100%', borderRadius: 4 },
  barGlow: { position: 'absolute', top: 2, left: 0, height: 3, borderRadius: 2 },
  energyRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 2, gap: 2 },
  energyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#1e293b' },
  energyDotActive: { backgroundColor: '#eab308', shadowColor: '#fef08a', shadowOpacity: 1, shadowRadius: 3 },
  
  floatingDamageContainer: { position: 'absolute', zIndex: 50, top: -10, left: -10 },
  floatingDamageText: { fontSize: 22, fontWeight: '900', fontFamily: FONT_HUD, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },

  bossIntentContainer: {
    marginTop: 6,
    alignItems: 'center',
    width: '100%',
  },
  bossIntentLabel: {
    fontSize: 7,
    fontFamily: FONT_HUD,
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 1,
  },
  bossIntentBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: '#e11d48',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    width: '100%',
  },
  bossIntentText: {
    fontSize: 8,
    fontFamily: FONT_MEDIEVAL,
    color: '#fca5a5',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05050a',
    zIndex: 99999,
  },

  offerBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#eab308',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 10,
    shadowColor: '#eab308',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  offerBadgeText: {
    color: '#000',
    fontFamily: FONT_HUD,
    fontSize: 7,
    fontWeight: 'bold',
  },

  // Proyectil y VFX de ataque
  spellProjectile: {
    position: 'absolute', top: 36, left: '50%', width: 24, height: 24, borderRadius: 12,
    zIndex: 200, marginLeft: -12, shadowOpacity: 1, shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }, elevation: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  spellCore: { width: 10, height: 10, borderRadius: 5, opacity: 0.6 },
  impactParticle: {
    position: 'absolute', top: 40, left: '50%', width: 10, height: 10, borderRadius: 5,
    zIndex: 199, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  impactParticleSm: { width: 6, height: 6, borderRadius: 3 },
  impactParticleLg: { width: 14, height: 14, borderRadius: 7 },
  shockwave: {
    position: 'absolute', top: 28, left: '50%', marginLeft: -30,
    width: 60, height: 60, borderRadius: 30, borderWidth: 3,
    zIndex: 198,
  },
  
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  boardScene: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    zIndex: 5,
  },
  boardPlatformBase: {
    position: 'absolute',
    bottom: -15,
    width: BOARD_WIDTH + 8,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    transform: [{ rotateX: '65deg' }],
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 16,
    shadowOpacity: 0.85,
    elevation: 12,
  },
  boardWrapper: {
    width: '100%',
    borderWidth: 3,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    shadowOpacity: 1,
    elevation: 15,
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
  },
  
  // Mazo boca abajo del enemigo
  enemyDeckSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enemyDeckLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  enemyDeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
  },
  enemyCardBack: {
    width: 34,
    height: 48,
    borderRadius: 6,
    borderWidth: 2,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    shadowOpacity: 0.5,
    overflow: 'hidden',
  },
  enemyCardBackInner: {
    width: '80%',
    height: '80%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemyCardBackIcon: { fontSize: 16, opacity: 0.5 },
  enemyCardBackShine: {
    position: 'absolute', top: 0, right: 0, width: 10, height: '100%',
    opacity: 0.08, borderTopRightRadius: 6, borderBottomRightRadius: 6,
  },

  handSection: { paddingHorizontal: 14, paddingTop: 8 },
  handHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  handTitle: { color: '#94a3b8', fontSize: 9, fontFamily: FONT_HUD, letterSpacing: 1 },
  endTurnBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#334155', elevation: 4,
  },
  endTurnText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD, letterSpacing: 1 },

  cardsScroll: { paddingRight: 16 },
  cardContainer: {
    width: 144,
    backgroundColor: 'rgba(10,15,30,0.88)',
    borderRadius: 14, padding: 10, marginRight: 10,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', elevation: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowRadius: 14, shadowOpacity: 0.5,
  },
  cardContainerDisabled: { opacity: 0.4 },
  cardReady: {
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.9,
    shadowRadius: 18, elevation: 14, borderWidth: 2,
  },
  cardManaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 7 },
  manaPip: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  manaPipText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  cardImage: { height: 72, borderRadius: 8, marginBottom: 7, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardImagePlaceholder: { height: 72, backgroundColor: '#0f172a', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  shopCardImage: { height: 100, borderRadius: 10, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deckCardImage: { height: 80, borderRadius: 8, marginBottom: 8, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardEmoji: { fontSize: 30 },
  cardChargeBarBg: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, marginBottom: 4 },
  cardChargeBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 2 },
  chargeText: { color: '#64748b', fontSize: 8, fontFamily: FONT_HUD, textAlign: 'right', marginBottom: 5 },
  cardInfo: { flex: 1 },
  cardName: { color: '#f1f5f9', fontSize: 11, fontWeight: 'bold', marginBottom: 2, fontFamily: FONT_UI },
  cardType: { fontSize: 9, fontWeight: 'bold', fontFamily: FONT_HUD, marginBottom: 3 },
  cardDesc: { color: '#64748b', fontSize: 8, lineHeight: 12, fontFamily: FONT_UI },

  // Modales
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  overlayTitle: { fontFamily: FONT_TITLE, fontSize: 26, fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10, marginBottom: 12 },
  overlaySub: { color: '#94a3b8', fontSize: 12, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  defeatButtons: { flexDirection: 'row', marginTop: 10, gap: 10 },
  overlayBtn: { backgroundColor: '#0f172a', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ef4444' },
  overlayBtnText: { color: '#ef4444', fontFamily: FONT_HUD, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },

  // Pantalla de victoria
  victoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  victoryStar: {
    position: 'absolute',
    fontSize: 36,
    opacity: 0.7,
  },
  victoryStarTL: { top: 60, left: 20 },
  victoryStarTR: { top: 60, right: 20 },
  victoryStarBL: { bottom: 100, left: 20 },
  victoryStarBR: { bottom: 100, right: 20 },
  victoryCard: {
    width: '92%',
    backgroundColor: 'rgba(15,15,30,0.98)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(251,191,36,0.5)',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    shadowOpacity: 0.6,
    elevation: 20,
  },
  victoryEmoji: { fontSize: 56, textAlign: 'center', marginBottom: 6 },
  victoryTitle: {
    fontSize: 30, fontWeight: '900', color: '#fbbf24', fontFamily: FONT_TITLE,
    textAlign: 'center',
    textShadowColor: 'rgba(251,191,36,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
    letterSpacing: 3, marginBottom: 4,
  },
  victoryWorldName: {
    fontSize: 10, fontWeight: 'bold', color: 'rgba(255,255,255,0.5)',
    fontFamily: FONT_HUD, textAlign: 'center', letterSpacing: 2, marginBottom: 14,
  },
  victoryRewardsBox: {
    width: '100%',
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  victoryRewardRow: {
    color: '#fbbf24', fontFamily: FONT_HUD, fontSize: 13, fontWeight: 'bold',
  },
  lootCardAwardContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  lootCardAwardLabel: {
    color: '#34d399',
    fontFamily: FONT_MEDIEVAL,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  nextWorldPreview: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextWorldLabel: {
    color: '#9ca3af',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  nextWorldEmoji: { fontSize: 32, marginBottom: 2 },
  nextWorldName: {
    color: '#ffffff', fontSize: 14, fontWeight: '900',
    fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 2,
  },
  nextWorldEnemy: { color: '#ef4444', fontSize: 10, fontFamily: FONT_UI, fontWeight: 'bold' },
  victoryBtnsCol: { width: '100%', gap: 8 },
  victoryBtn: {
    width: '100%', paddingVertical: 13, borderRadius: 10, alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, shadowOpacity: 0.5,
  },
  victoryBtnText: { color: '#fff', fontFamily: FONT_HUD, fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },

  // Legacy (victoria modal viejo)
  lootContainer: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  lootTitleSuccess: { fontFamily: FONT_TITLE, fontSize: 24, fontWeight: 'bold', color: '#fbbf24', marginBottom: 10 },
  rewardsBox: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 30, width: '80%' },
  rewardItem: { color: '#fbbf24', fontFamily: FONT_HUD, fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  rewardCard: { color: '#f87171', fontFamily: FONT_UI, fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  rewardCardName: { color: '#ffffff', fontFamily: FONT_TITLE, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  continueBtn: { backgroundColor: '#ea580c', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10 },
  continueBtnText: { color: '#ffffff', fontFamily: FONT_HUD, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  victoryButtons: { flexDirection: 'row', gap: 10 },

  // ============================================================
  //  PANTALLA DE INTRO ÉPICA
  // ============================================================
  introRoot: {
    flex: 1,
    backgroundColor: '#030008',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  introBgWheel: {
    position: 'absolute',
    width: 700,
    height: 700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introBgRay: {
    position: 'absolute',
    width: 2,
    height: 350,
    backgroundColor: 'rgba(120,40,200,0.12)',
    top: 0,
    transformOrigin: 'bottom center',
  },
  introGlowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(120,40,200,0.25)',
    shadowColor: '#7828c8',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 60,
    shadowOpacity: 0.6,
  },
  introLogoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  introLogoEmoji: {
    fontSize: 72,
    marginBottom: 8,
    textShadowColor: '#7828c8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  introLogoTitle: {
    fontFamily: FONT_TITLE,
    fontSize: 56,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 10,
    textShadowColor: 'rgba(120,40,200,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
  },
  introLogoSubtitle: {
    fontFamily: FONT_HUD,
    fontSize: 16,
    fontWeight: '400',
    color: '#a78bfa',
    letterSpacing: 8,
    marginTop: -4,
  },
  introDivider: {
    width: 180,
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.4)',
    marginTop: 12,
  },
  introTagline: {
    fontFamily: FONT_UI,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textAlign: 'center',
  },
  introStartBtn: {
    backgroundColor: 'rgba(120,40,200,0.85)',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.6)',
    alignItems: 'center',
    shadowColor: '#7828c8',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 12,
  },
  introStartBtnText: {
    color: '#ffffff',
    fontFamily: FONT_MEDIEVAL,
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  introVersionText: {
    color: 'rgba(255,255,255,0.2)',
    fontFamily: FONT_UI,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 1,
  },
  
  // ============================================================
  //  NUEVOS ESTILOS: SONIDO Y MAZOS MÚLTIPLES
  // ============================================================
  soundToggleBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginRight: 10,
  },
  soundToggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT_HUD,
  },
  deckSelectorContainer: {
    backgroundColor: '#0d0d18',
    borderColor: '#1e1e2f',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  deckSectionLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontFamily: FONT_HUD,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  deckSelectorScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  deckTabBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  deckTabBtnActive: {
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderColor: '#fbbf24',
  },
  deckTabBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: FONT_UI,
    fontWeight: 'bold',
  },
  deckTabBtnTextActive: {
    color: '#fbbf24',
  },
  deckRenameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  deckEditingLabel: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: FONT_UI,
  },
  deckEditingName: {
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  renameBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  renameBtnText: {
    color: '#e2e8f0',
    fontSize: 10,
    fontFamily: FONT_HUD,
  },

  // Modal de renombrado
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  renameModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0f0f1c',
    borderWidth: 2,
    borderColor: '#fbbf24',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.3,
  },
  renameModalTitle: {
    fontFamily: FONT_TITLE,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbbf24',
    marginBottom: 8,
    textAlign: 'center',
  },
  renameModalSubtitle: {
    fontFamily: FONT_UI,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  renameInput: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT_UI,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalBtnCancelText: {
    color: '#cbd5e1',
    fontFamily: FONT_HUD,
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalBtnSave: {
    backgroundColor: '#fbbf24',
  },
  modalBtnSaveText: {
    color: '#000',
    fontFamily: FONT_HUD,
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Turn Banner Styles
  turnBannerCentering: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  turnBannerOverlay: {
    width: '100%',
    maxWidth: 340,
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.8,
    elevation: 10,
  },
  turnBannerText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: FONT_MEDIEVAL,
    letterSpacing: 2,
    textAlign: 'center',
  },
  turnBannerTextPlayer: {
    color: '#fbbf24',
    textShadowColor: 'rgba(251,191,36,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  turnBannerTextEnemy: {
    color: '#ef4444',
    textShadowColor: 'rgba(239,68,68,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Danger Vignette for Low HP
  dangerVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 8,
    borderColor: '#ef4444',
    backgroundColor: 'transparent',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.85,
    elevation: 8,
  },

  // Combo Floating Messages
  comboMsgContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.8,
    elevation: 12,
    zIndex: 100,
  },
  comboMsgText: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: FONT_HUD,
    textAlign: 'center',
    textShadowColor: 'rgba(251,191,36,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Selected Card in Hand
  cardSelected: {
    transform: [{ translateY: -14 }, { scale: 1.08 }],
    borderColor: '#fbbf24',
    borderWidth: 2,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 18,
    shadowOpacity: 0.9,
    elevation: 14,
  },

  // Holographic Foil glare sweep effect
  holographicShine: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    zIndex: 5,
  },

  // Active status/debuff badges under health bar
  statusBadgeContainer: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'center',
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: FONT_HUD,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusQuemado: {
    color: '#f97316',
    textShadowColor: 'rgba(249, 115, 22, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statusCongelado: {
    color: '#0ea5e9',
    textShadowColor: 'rgba(14, 165, 233, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  statusEnvenenado: {
    color: '#22c55e',
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

