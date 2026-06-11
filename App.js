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
  Vibration,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

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

  // --- EXPANSIÓN MÍTICA (30 CARTAS DE LATE-GAME) ---
  c31: { id: 'c31', name: 'Excalibur Ígnea', type: 'Ataque', manaCost: { red: 5 }, totalCost: 5, effectValue: 60, description: 'Corte que incinera la armadura enemiga (60 dmg).', price: 600, image: require('./assets/red_dragon.png') },
  c32: { id: 'c32', name: 'Muro del Coloso', type: 'Defensa', manaCost: { green: 5 }, totalCost: 5, effectValue: 75, description: 'Defensa absoluta. Otorga 75 de escudo inquebrantable.', price: 550, image: require('./assets/golem.png') },
  c33: { id: 'c33', name: 'Lanza Relámpago', type: 'Hechizo', manaCost: { yellow: 4 }, totalCost: 4, effectValue: 55, description: 'Rayo perforante directo al corazón (55 dmg).', price: 650, image: require('./assets/griffin.png') },
  c34: { id: 'c34', name: 'Supernova', type: 'Hechizo', manaCost: { purple: 6 }, totalCost: 6, effectValue: 90, description: 'Explosión de estrella masiva (90 dmg mágico).', price: 1200, image: require('./assets/star_specter.png') },
  c35: { id: 'c35', name: 'Cero Absoluto', type: 'Ataque', manaCost: { blue: 5 }, totalCost: 5, effectValue: 65, description: 'Congela las moléculas enemigas (65 dmg).', price: 700, image: require('./assets/volt_illusionist.png') },
  c36: { id: 'c36', name: 'Fénix Renacido', type: 'Defensa', manaCost: { red: 6 }, totalCost: 6, effectValue: 85, description: 'Regeneración mitológica. (85 de escudo).', price: 1000, image: require('./assets/ash_phoenix.png') },
  c37: { id: 'c37', name: 'Terremoto Mayor', type: 'Hechizo', manaCost: { green: 5 }, totalCost: 5, effectValue: 60, description: 'Sacude la tierra. (60 dmg mágico directo).', price: 600, image: require('./assets/geode_golem.png') },
  c38: { id: 'c38', name: 'Agujero Negro', type: 'Ataque', manaCost: { purple: 7 }, totalCost: 7, effectValue: 120, description: 'Destruye el espacio-tiempo. (120 de daño).', price: 1800, image: require('./assets/star_specter.png') },
  c39: { id: 'c39', name: 'Armadura Astral', type: 'Defensa', manaCost: { yellow: 4 }, totalCost: 4, effectValue: 50, description: 'Coraza tejida de constelaciones (50 escudo).', price: 500, image: require('./assets/healing_sorcerer.png') },
  c40: { id: 'c40', name: 'Espada de Leviatán', type: 'Ataque', manaCost: { blue: 4 }, totalCost: 4, effectValue: 55, description: 'Filo impregnado del abismo marino (55 dmg).', price: 600, image: require('./assets/volt_illusionist.png') },
  c41: { id: 'c41', name: 'Aliento de Dragón', type: 'Hechizo', manaCost: { red: 4 }, totalCost: 4, effectValue: 50, description: 'Fuego puro que derrite rocas (50 dmg).', price: 550, image: require('./assets/red_dragon.png') },
  c42: { id: 'c42', name: 'Bosque Protector', type: 'Defensa', manaCost: { green: 4 }, totalCost: 4, effectValue: 60, description: 'Invoca un bosque entero de defensa (60 escudo).', price: 580, image: require('./assets/emerald_knight.png') },
  c43: { id: 'c43', name: 'Juicio Divino', type: 'Hechizo', manaCost: { yellow: 5 }, totalCost: 5, effectValue: 70, description: 'Sentencia de los dioses del rayo (70 dmg).', price: 850, image: require('./assets/griffin.png') },
  c44: { id: 'c44', name: 'Devorador de Almas', type: 'Ataque', manaCost: { purple: 5 }, totalCost: 5, effectValue: 75, description: 'Arranca la vitalidad enemiga (75 dmg).', price: 900, image: require('./assets/star_specter.png') },
  c45: { id: 'c45', name: 'Barrera de Diamante', type: 'Defensa', manaCost: { blue: 6 }, totalCost: 6, effectValue: 100, description: 'El material más duro del universo (100 escudo).', price: 1500, image: require('./assets/volt_illusionist.png') },
  c46: { id: 'c46', name: 'Lluvia de Meteoros', type: 'Ataque', manaCost: { red: 5 }, totalCost: 5, effectValue: 65, description: 'Rocas espaciales en llamas (65 dmg).', price: 750, image: require('./assets/geode_golem.png') },
  c47: { id: 'c47', name: 'Manto de Gea', type: 'Defensa', manaCost: { green: 6 }, totalCost: 6, effectValue: 90, description: 'La Madre Tierra te protege (90 escudo).', price: 1200, image: require('./assets/emerald_knight.png') },
  c48: { id: 'c48', name: 'Rayo Aniquilador', type: 'Hechizo', manaCost: { yellow: 6 }, totalCost: 6, effectValue: 85, description: 'Descarga inmensa de energía pura (85 dmg).', price: 1100, image: require('./assets/griffin.png') },
  c49: { id: 'c49', name: 'Filo del Vacío', type: 'Ataque', manaCost: { purple: 6 }, totalCost: 6, effectValue: 88, description: 'Cuchilla de antimateria (88 dmg).', price: 1150, image: require('./assets/star_specter.png') },
  c50: { id: 'c50', name: 'Tsunami de Éter', type: 'Hechizo', manaCost: { blue: 5 }, totalCost: 5, effectValue: 70, description: 'Ola mágica destructora (70 dmg mágico).', price: 850, image: require('./assets/volt_illusionist.png') },
  c51: { id: 'c51', name: 'Cenizas Fénix', type: 'Ataque', manaCost: { red: 4 }, totalCost: 4, effectValue: 48, description: 'Quema con restos de ave mítica (48 dmg).', price: 500, image: require('./assets/ash_phoenix.png') },
  c52: { id: 'c52', name: 'Escudo Milenario', type: 'Defensa', manaCost: { green: 5 }, totalCost: 5, effectValue: 80, description: 'Protección con 1000 años de historia (80 escudo).', price: 950, image: require('./assets/geode_golem.png') },
  c53: { id: 'c53', name: 'Prisma Solar', type: 'Hechizo', manaCost: { yellow: 5 }, totalCost: 5, effectValue: 72, description: 'Concentra la luz de una estrella (72 dmg).', price: 880, image: require('./assets/griffin.png') },
  c54: { id: 'c54', name: 'Espíritu de Nebulosa', type: 'Defensa', manaCost: { purple: 5 }, totalCost: 5, effectValue: 75, description: 'Cuerpo etéreo e invulnerable (75 escudo).', price: 900, image: require('./assets/star_specter.png') },
  c55: { id: 'c55', name: 'Lanza de Hielo', type: 'Ataque', manaCost: { blue: 4 }, totalCost: 4, effectValue: 52, description: 'Estalactita afilada como bisturí (52 dmg).', price: 520, image: require('./assets/volt_illusionist.png') },
  c56: { id: 'c56', name: 'Ira del Volcán', type: 'Hechizo', manaCost: { red: 5 }, totalCost: 5, effectValue: 78, description: 'Erupción mágica en todo el tablero (78 dmg).', price: 950, image: require('./assets/red_dragon.png') },
  c57: { id: 'c57', name: 'Aura Esmeralda', type: 'Defensa', manaCost: { green: 5 }, totalCost: 5, effectValue: 70, description: 'Luz de gemas que cura y escuda (70 escudo).', price: 800, image: require('./assets/emerald_knight.png') },
  c58: { id: 'c58', name: 'Destello Crítico', type: 'Ataque', manaCost: { yellow: 4 }, totalCost: 4, effectValue: 60, description: 'Ataque tan rápido que es invisible (60 dmg).', price: 650, image: require('./assets/griffin.png') },
  c59: { id: 'c59', name: 'Colapso Cuántico', type: 'Hechizo', manaCost: { purple: 7 }, totalCost: 7, effectValue: 150, description: 'La carta más fuerte de la historia. (150 dmg).', price: 2500, image: require('./assets/star_specter.png') },
  c60: { id: 'c60', name: 'Égida Absoluta', type: 'Defensa', manaCost: { blue: 7 }, totalCost: 7, effectValue: 150, description: 'Invulnerabilidad casi divina (150 escudo).', price: 2500, image: require('./assets/healing_sorcerer.png') },
};

// ============================================================
//  BASE DE DATOS DE RELIQUIAS Y POCIONES
// ============================================================
const RELICS_POOL = {
  r1: { id: 'r1', name: 'Corazón de Hierro', description: 'Otorga +20 HP Máximo permanentemente.', emoji: '❤️', price: 150 },
  r2: { id: 'r2', name: 'Escudo Anciano', description: 'Inicias cada combate con +15 Escudo.', emoji: '🛡️', price: 200 },
  r3: { id: 'r3', name: 'Reloj de Arena', description: 'Inicias cada combate con +1 Punto de Acción extra (PA).', emoji: '⌛', price: 300 },
  r_mage: { id: 'r_mage', name: 'Vampirismo Mágico', description: 'Cura 10% del daño no bloqueado que infliges al enemigo.', emoji: '🧛', price: null },
  r_paladin: { id: 'r_paladin', name: 'Égida Sagrada', description: 'Inicias cada combate con +10 Escudo y curas 5 HP al ganar.', emoji: '🌟', price: null },
  r_assassin: { id: 'r_assassin', name: 'Paso Sombrío', description: 'Inicias cada combate con +1 Punto de Acción extra.', emoji: '💨', price: null },
  r4: { id: 'r4', name: 'Cáliz del Rey', description: 'Te curas 15 HP al vencer un combate.', emoji: '🍷', price: 250 },
  r5: { id: 'r5', name: 'Moneda de la Suerte', description: 'Ganas un 20% más de oro en cada victoria.', emoji: '💰', price: 220 },
};

const POTIONS_POOL = {
  p1: { id: 'p1', name: 'Poción de Vida', description: 'Restaura 50 HP al instante (Sin costo de PA).', emoji: '❤️', price: 50, type: 'heal' },
  p2: { id: 'p2', name: 'Poción de Escudo', description: 'Otorga 30 de Escudo de inmediato (Sin costo de PA).', emoji: '🛡️', price: 40, type: 'shield' },
  p3: { id: 'p3', name: 'Elixir Rápido', description: 'Te otorga +1 PA este turno.', emoji: '⚡', price: 80, type: 'energy' },
};

// ============================================================
//  BASE DE DATOS DE EVENTOS
// ============================================================
const EVENTS_POOL = [
  {
    id: 'e1',
    title: 'El Altar de Sangre',
    text: 'Encuentras un altar antiguo manchado de sangre seca. Una voz susurra en tu mente: "Ofréceme tu vitalidad y te otorgaré poder terrenal".',
    options: [
      { text: 'Sacrificar 20 HP por 150 🪙', effect: { hpChange: -20, goldChange: 150 }, type: 'danger' },
      { text: 'Alejarse lentamente', effect: {}, type: 'neutral' }
    ]
  },
  {
    id: 'e2',
    title: 'El Mercader Misterioso',
    text: 'Una figura encapuchada te ofrece un trato rápido: intercambiar oro por un objeto mágico permanente.',
    options: [
      { text: 'Pagar 50 🪙 por Reliquia Aleatoria', effect: { goldChange: -50, getRelic: true }, type: 'buy' },
      { text: 'Rechazar la oferta', effect: {}, type: 'neutral' }
    ]
  },
  {
    id: 'e3',
    title: 'La Fuente Luminosa',
    text: 'Un manantial de agua brillante y cristalina. Beber de ella parece restaurar heridas graves, pero dejar caer una moneda atrae más vitalidad.',
    options: [
      { text: 'Beber agua (+40 HP)', effect: { hpChange: 40 }, type: 'heal' },
      { text: 'Tirar moneda (-20 🪙, +15 HP Máx)', effect: { goldChange: -20, maxHpChange: 15 }, type: 'upgrade' }
    ]
  },
  {
    id: 'e4',
    title: 'Cofre Enredado',
    text: 'Ves un cofre atrapado entre enredaderas espinosas. Puedes intentar abrirlo a la fuerza sufriendo daño o usar oro para pagar un extractor local.',
    options: [
      { text: 'Forzar apertura (-15 HP, gana Reliquia)', effect: { hpChange: -15, getRelic: true }, type: 'danger' },
      { text: 'Pagar extractor (-100 🪙, gana Reliquia)', effect: { goldChange: -100, getRelic: true }, type: 'buy' },
      { text: 'Dejarlo en paz', effect: {}, type: 'neutral' }
    ]
  }
];


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
    enemyHp: 300,
    enemyEmoji: '🌋',
    enemyType: 'DEMON'
  },
  {
    id: 2,
    name: 'Templo del Rayo',
    bgColor: '#02182b',
    bgImage: require('./assets/bg_lightning.png'),
    vignetteColor: 'rgba(14, 165, 233, 0.2)',
    boardShadowColor: '#0ea5e9',
    enemyName: 'Kirin Ancestral',
    enemyHp: 450,
    enemyEmoji: '⚡',
    enemyType: 'CYBER'
  },
  {
    id: 3,
    name: 'Cripta de Piedra',
    bgColor: '#041d12',
    bgImage: require('./assets/bg_stone.png'),
    vignetteColor: 'rgba(16, 185, 129, 0.2)',
    boardShadowColor: '#10b981',
    enemyName: 'Titán de Granito',
    enemyHp: 600,
    enemyEmoji: '🪨',
    enemyType: 'DEMON'
  },
  {
    id: 4,
    name: 'Vacío Cósmico',
    bgColor: '#0f051d',
    bgImage: require('./assets/bg_cosmic.png'),
    vignetteColor: 'rgba(168, 85, 247, 0.2)',
    boardShadowColor: '#a855f7',
    enemyName: 'Avatar del Caos',
    enemyHp: 800,
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
    enemyHp: 1000,
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
    enemyHp: 1300,
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
    enemyHp: 1600,
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
    enemyHp: 2500,
    enemyEmoji: '👹',
    enemyType: 'DEMON',
  },
  {
    id: 9,
    name: 'Desierto de Huesos',
    bgColor: '#1a1402',
    bgImage: require('./assets/bg_stone.png'),
    vignetteColor: 'rgba(217, 119, 6, 0.2)',
    boardShadowColor: '#d97706',
    enemyName: 'Faraón Maldito',
    enemyHp: 3000,
    enemyEmoji: '🐫',
    enemyType: 'DEMON',
  },
  {
    id: 10,
    name: 'Pantano Tóxico',
    bgColor: '#021a08',
    bgImage: require('./assets/bg_stone.png'),
    vignetteColor: 'rgba(34, 197, 94, 0.2)',
    boardShadowColor: '#22c55e',
    enemyName: 'Hidra Venenosa',
    enemyHp: 3800,
    enemyEmoji: '🐍',
    enemyType: 'DEMON',
  },
  {
    id: 11,
    name: 'Neo-Ciudad Neón',
    bgColor: '#05021a',
    bgImage: require('./assets/bg_lightning.png'),
    vignetteColor: 'rgba(59, 130, 246, 0.2)',
    boardShadowColor: '#3b82f6',
    enemyName: 'Ciborg Renegado',
    enemyHp: 4800,
    enemyEmoji: '🤖',
    enemyType: 'CYBER',
  },
  {
    id: 12,
    name: 'Reino Celestial',
    bgColor: '#1a1811',
    bgImage: require('./assets/bg_cosmic.png'),
    vignetteColor: 'rgba(250, 204, 21, 0.2)',
    boardShadowColor: '#facc15',
    enemyName: 'Serafín Supremo',
    enemyHp: 6000,
    enemyEmoji: '👼',
    enemyType: 'CYBER',
  }
];

// Mazos únicos por mundo (cards que el enemigo tiene boca abajo + deck inicial jugador)
const WORLD_DECKS = {
  1: { playerDeck: ['c1', 'c2', 'c3'], name: "Mazo Ígneo Base" }, // Lava
  2: { playerDeck: ['c4', 'c5', 'c6'], name: "Mazo Tormenta" }, // Rayo
  3: { playerDeck: ['c10', 'c11', 'c32'], name: "Mazo de Granito" }, // Piedra
  4: { playerDeck: ['c13', 'c14', 'c34'], name: "Mazo del Vacío" }, // Cósmico
  5: { playerDeck: ['c16', 'c17', 'c45'], name: "Mazo Diamante" }, // Cristal
  6: { playerDeck: ['c21', 'c22', 'c48'], name: "Mazo Huracán" }, // Viento
  7: { playerDeck: ['c24', 'c35', 'c55'], name: "Mazo Glaciar" }, // Glaciar
  8: { playerDeck: ['c38', 'c59', 'c60'], name: "Mazo Supremo" }, // Caos
  9: { playerDeck: ['c37', 'c47', 'c52'], name: "Mazo Terremoto" }, // Huesos
  10: { playerDeck: ['c42', 'c57', 'c60'], name: "Mazo Antídoto" }, // Pantano
  11: { playerDeck: ['c33', 'c48', 'c58'], name: "Mazo Neón" }, // Cyberpunk
  12: { playerDeck: ['c34', 'c59', 'c60'], name: "Mazo Deidad" }, // Celestial
};

const HERO_CLASSES = [
  {
    id: 'mage',
    name: 'Píromante Místico',
    emoji: '🧙‍♂️',
    color: '#f43f5e',
    desc: 'Maestro del fuego. Inicia con poca vida pero un mazo devastador.',
    startHp: 75,
    startShield: 10,
    startDeck: ['c1', 'c3', 'c47'], // 3 cartas: Ataques de fuego
    relic: 'r_mage',
    image: require('./assets/hero_pyromancer.png')
  },
  {
    id: 'paladin',
    name: 'Paladín de Luz',
    emoji: '🛡️',
    color: '#fbbf24',
    desc: 'Guerrero sagrado. Alta vitalidad y defensas impenetrables.',
    startHp: 120,
    startShield: 30,
    startDeck: ['c2', 'c10', 'c11'], // 3 cartas: Escudos y golpes
    relic: 'r_paladin',
    image: require('./assets/hero_paladin.png')
  },
  {
    id: 'assassin',
    name: 'Asesino Sombrío',
    emoji: '🗡️',
    color: '#10b981',
    desc: 'Letal y rápido. Mazo enfocado en veneno continuo.',
    startHp: 90,
    startShield: 15,
    startDeck: ['c14', 'c42', 'c60'], // 3 cartas: Letales
    relic: 'r_assassin',
    image: require('./assets/hero_assassin.png')
  }
];

const SCREEN_W = Dimensions.get('window').width;
const SCREEN_H = Dimensions.get('window').height;
const BOARD_WIDTH = Math.min(SCREEN_W - 32, SCREEN_H * 0.32, 280);


// ============================================================
//  COMPONENTE AUXILIAR: AvatarCard (con barras animadas)
// ============================================================
function AvatarCard({ name, isPlayer, hp, maxHp, shield, energy, maxEnergy, shakeAnim, floatingDamage, flashAnim, emojiOverride, image, status, bossIntent, isHorizontal = false }) {
  const barColor = isPlayer ? '#10b981' : '#e11d48';
  const emoji = emojiOverride || (isPlayer ? '\uD83D\uDC32' : '\uD83E\uDD16');

  // Animación de respiración / flote 3D
  const idleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(idleAnim, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(idleAnim, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

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

  if (isHorizontal) {
    return (
      <Animated.View
        style={[
          styles.avatarHorizontalContainer,
          {
            transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10] }) }],
            backgroundColor: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(0,0,0,0)', isPlayer ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)']
            })
          }
        ]}
      >
        <View style={{ flexDirection: isPlayer ? 'row' : 'row-reverse', alignItems: 'center', width: '100%' }}>
          {/* Avatar Area */}
          <View style={[styles.avatarFrameHorizontal, isPlayer ? { borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.05)' } : { borderColor: '#e11d48', backgroundColor: 'rgba(225,29,72,0.05)' }]}>
            <Animated.View style={{
                transform: [
                  { translateY: idleAnim.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
                  { scale: idleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }) }
                ],
                width: 50, height: 50, alignItems: 'center', justifyContent: 'center'
            }}>
              {image ? (
                <Image source={typeof image === 'number' ? image : { uri: image }} style={{ width: '100%', height: '100%', borderRadius: 25 }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 36 }}>{emoji}</Text>
              )}
            </Animated.View>
            {floatingDamage && (
              <Animated.View style={[
                styles.floatingDamageContainer,
                { transform: [{ translateY: floatingDamage.animY }], opacity: floatingDamage.animOpacity }
              ]}>
                <Text style={[
                  styles.floatingDamageText,
                  { color: floatingDamage.type === 'Defensa' ? '#10b981' : '#ef4444', fontFamily: FONT_HUD },
                  floatingDamage.isCrit && { color: '#fbbf24', fontSize: 30, fontWeight: '900', textShadowColor: '#b45309', textShadowRadius: 8 }
                ]}>
                  {floatingDamage.value}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Info Area */}
          <View style={[styles.avatarInfoHorizontal, isPlayer ? { marginLeft: 12 } : { marginRight: 12, alignItems: 'flex-end' }]}>
            <View style={[styles.statsRowHorizontal, isPlayer ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' }]}>
              <Text style={[styles.statText, { fontFamily: FONT_HUD, fontSize: 13, marginRight: isPlayer ? 10 : 0, marginLeft: isPlayer ? 0 : 10 }]}>❤️ {Math.ceil(hp)}</Text>
              <Text style={[styles.statText, { fontFamily: FONT_HUD, fontSize: 13 }]}>🛡️ {Math.ceil(shield)}</Text>
            </View>

            <View style={styles.barBgHorizontal}>
              <Animated.View style={[styles.barFill, { width: hpPercent, backgroundColor: barColorAnim }]} />
              <Animated.View style={[styles.barGlow, { width: hpPercent, backgroundColor: barColorAnim, opacity: 0.4 }]} />
            </View>
            
            {/* Nombre movido MÁS ABAJO de la barra de vida */}
            <Text style={[styles.avatarNameHorizontal, { fontFamily: FONT_TITLE, marginTop: 4, marginBottom: 0, opacity: 0.8, fontSize: 10 }]} numberOfLines={1}>{name}</Text>

            {/* Energía y Boss Intent */}
            {!isPlayer && maxEnergy > 0 && (
              <View style={[styles.energyRow, { justifyContent: 'flex-end', marginTop: 4 }]}>
                {Array.from({ length: maxEnergy }).map((_, i) => (
                  <View key={i} style={[styles.energyDot, i < energy ? styles.energyDotActive : null]} />
                ))}
              </View>
            )}
            {!isPlayer && bossIntent && (
              <View style={[styles.bossIntentContainer, { alignItems: 'flex-end', marginTop: 4 }]}>
                <View style={[styles.bossIntentBadge, { width: 'auto' }]}>
                  <Text style={styles.bossIntentText}>
                    {bossIntent.type === 'attack' ? '⚔️' :
                     bossIntent.type === 'defend' ? '🛡️' :
                     bossIntent.type === 'heal' ? '💚' :
                     bossIntent.type === 'debuff' ? '🧪' : '⚡'} {bossIntent.desc}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.avatarContainer,
        isPlayer ? styles.avatarPlayer : styles.avatarEnemy,
        {
          transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [-10, 0, 10] }) }],
        }
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFillObject, { borderRadius: 16, backgroundColor: flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0,0,0,0)', isPlayer ? 'rgba(251,191,36,0.4)' : 'rgba(239,68,68,0.4)']
      })}]} pointerEvents="none" />
      <View style={[styles.avatarFrame, isPlayer ? { borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.05)' } : { borderColor: '#e11d48', backgroundColor: 'rgba(225,29,72,0.05)' }]}>
        <Animated.View style={{
            transform: [
              { translateY: idleAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) },
              { scale: idleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] }) }
            ],
            width: 55, height: 55, alignItems: 'center', justifyContent: 'center'
        }}>
          {image ? (
            <Image source={typeof image === 'number' ? image : { uri: image }} style={{ width: '100%', height: '100%', borderRadius: 27.5 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 40 }}>{emoji}</Text>
          )}
        </Animated.View>

        {floatingDamage && (
          <Animated.View style={[
            styles.floatingDamageContainer,
            { transform: [{ translateY: floatingDamage.animY }], opacity: floatingDamage.animOpacity }
          ]}>
            <Text style={[
              styles.floatingDamageText,
              { color: floatingDamage.type === 'Defensa' ? '#10b981' : '#ef4444', fontFamily: FONT_HUD },
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

      <Text style={[styles.avatarName, { fontFamily: FONT_TITLE, fontSize: 13, letterSpacing: 1 }]} numberOfLines={1}>{name}</Text>

      <View style={styles.statsRow}>
        <Text style={[styles.statText, { fontFamily: FONT_HUD, fontSize: 12 }]}>❤️ {Math.ceil(hp)}</Text>
        <Text style={[styles.statText, { fontFamily: FONT_HUD, fontSize: 12 }]}>🛡️ {Math.ceil(shield)}</Text>
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
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      if (ctx.createBiquadFilter) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        osc.connect(filter);
        filter.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
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

const generateProceduralMap = (worldId) => {
  const map = [];
  map[4] = [{ id: 'f4_1', type: 'boss', next: [] }];
  
  const f3Types = ['campfire', 'shop', 'elite'];
  map[3] = [
    { id: 'f3_1', type: f3Types[Math.floor(Math.random() * f3Types.length)], next: ['f4_1'] },
    { id: 'f3_2', type: f3Types[Math.floor(Math.random() * f3Types.length)], next: ['f4_1'] }
  ];

  const randomType = () => {
    const r = Math.random();
    if (r < 0.40) return 'combat';
    if (r < 0.55) return 'elite';
    if (r < 0.70) return 'shop';
    if (r < 0.85) return 'event';
    return 'campfire';
  };

  map[2] = [
    { id: 'f2_1', type: randomType(), next: ['f3_1'] },
    { id: 'f2_2', type: randomType(), next: ['f3_1', 'f3_2'] },
    { id: 'f2_3', type: randomType(), next: ['f3_2'] }
  ];

  map[1] = [
    { id: 'f1_1', type: 'combat', next: ['f2_1', 'f2_2'] },
    { id: 'f1_2', type: 'combat', next: ['f2_2', 'f2_3'] }
  ];

  map[0] = [
    { id: 'f0_1', type: 'start', next: ['f1_1'] },
    { id: 'f0_2', type: 'start', next: ['f1_2'] }
  ];

  return map;
};

// ============================================================
//  PANTALLA DE SELECCIÓN DE HÉROE (PREMIUM 3D CAROUSEL)
// ============================================================
const HeroSelectionScreen = ({ onSelect, screenTransitionAnim }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const itemWidth = Dimensions.get('window').width * 0.82;
  const itemSpacer = (Dimensions.get('window').width - itemWidth) / 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05050a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
      
      {/* Background Effect */}
      <View style={{ ...StyleSheet.absoluteFillObject, opacity: 0.3, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: Dimensions.get('window').width * 1.5, height: Dimensions.get('window').width * 1.5, borderRadius: Dimensions.get('window').width, backgroundColor: '#3b82f6', opacity: 0.1, transform: [{ scaleY: 2 }] }} />
      </View>

      <View style={{ marginTop: 50, alignItems: 'center', marginBottom: 20 }}>
        <Text style={[styles.introLogoTitle, { fontSize: 34, letterSpacing: 6, textShadowColor: '#fbbf24', textShadowRadius: 15 }]}>ELIGE TU CAMINO</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, fontFamily: FONT_UI, letterSpacing: 2, marginTop: 5, textTransform: 'uppercase' }}>El multiverso necesita un campeón</Text>
      </View>

      <Animated.FlatList
        data={HERO_CLASSES}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: itemSpacer, alignItems: 'center' }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * itemWidth,
            index * itemWidth,
            (index + 1) * itemWidth
          ];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.85, 1.05, 0.85], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
          const translateY = scrollX.interpolate({ inputRange, outputRange: [40, 0, 40], extrapolate: 'clamp' });

          return (
            <View style={{ width: itemWidth, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{
                width: '100%',
                height: Dimensions.get('window').height * 0.65,
                transform: [{ scale }, { translateY }],
                opacity,
              }}>
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={() => onSelect(item)}
                  style={{ flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: item.color, backgroundColor: '#0f172a', shadowColor: item.color, shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}
                >
                  <Image source={item.image} style={{ ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }} resizeMode="cover" />
                  
                  {/* Glassmorphism Gradient Overlay */}
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', backgroundColor: 'rgba(5, 5, 15, 0.85)', padding: 20, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 28, marginRight: 10, textShadowColor: item.color, textShadowRadius: 10 }}>{item.emoji}</Text>
                      <Text style={{ color: '#fff', fontSize: 22, fontFamily: FONT_TITLE, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 10 }}>{item.name}</Text>
                    </View>
                    
                    <Text style={{ color: '#cbd5e1', fontSize: 13, fontFamily: FONT_UI, lineHeight: 18, marginBottom: 15 }}>{item.desc}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' }}>
                        <Text style={{ color: '#fca5a5', fontSize: 13, fontFamily: FONT_HUD, fontWeight: 'bold' }}>❤️ {item.startHp}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.5)' }}>
                        <Text style={{ color: '#93c5fd', fontSize: 13, fontFamily: FONT_HUD, fontWeight: 'bold' }}>🛡️ {item.startShield}</Text>
                      </View>
                    </View>

                    <View style={{ width: '100%', backgroundColor: item.color, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: item.color, shadowOpacity: 0.8, shadowRadius: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '900', fontFamily: FONT_HUD, letterSpacing: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 5 }}>ELEGIR CAMPEÓN</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

// ============================================================
//  PANTALLA DE TRANSICIÓN CINEMATOGRÁFICA (SLAY THE SPIRE STYLE)
// ============================================================
const ActTransitionScreen = ({ worldIndex, onComplete }) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  const actNumber = worldIndex + 1;
  const nextWorldName = WORLDS[worldIndex % WORLDS.length]?.name || 'Reino Desconocido';
  
  const transitionTexts = [
    `Has conquistado la Arena de Lava...\nEl calor abrasador queda atrás.\nAhora, las tormentas te aguardan en el Acto ${actNumber}.`,
    `El Templo del Rayo ha caído en silencio...\nTu voluntad es inquebrantable.\nPero la piedra no sangra. Avanza al Acto ${actNumber}.`,
    `La Cripta de Piedra se desmorona...\nEl vacío llama a tu nombre.\nAdéntrate en la oscuridad del Acto ${actNumber}.`,
    `El Vacío Cósmico no pudo devorarte...\nLa luz se refracta en tu horizonte.\nBienvenido al Acto ${actNumber}.`
  ];
  
  const fullText = transitionTexts[(worldIndex - 1) % transitionTexts.length] || `Un jefe ha caído...\nPero tu viaje no tiene fin.\nPrepárate para el Acto ${actNumber}: ${nextWorldName}.`;

  const walkAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Animación del personaje caminando por la pantalla oscura
    Animated.timing(walkAnim, {
      toValue: Dimensions.get('window').width + 100,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();

    // Efecto Typewriter
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, index + 1));
      index++;
      if (index > fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 45); // Velocidad de escritura

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#030008', justifyContent: 'center', alignItems: 'center', padding: 30 }}>
      <StatusBar barStyle="light-content" backgroundColor="#030008" />
      
      <Animated.Image 
        source={require('./assets/player_avatar.png')}
        style={{
          position: 'absolute',
          bottom: '25%',
          width: 80,
          height: 80,
          transform: [{ translateX: walkAnim }],
          opacity: 0.7,
          tintColor: '#000' // Silhouette effect
        }}
        resizeMode="contain"
      />
      <Animated.Image 
        source={require('./assets/player_avatar.png')}
        style={{
          position: 'absolute',
          bottom: '25%',
          width: 80,
          height: 80,
          transform: [{ translateX: walkAnim }],
          opacity: 0.3
        }}
        resizeMode="contain"
      />

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ 
          color: '#e2e8f0', 
          fontSize: 16, 
          fontFamily: FONT_MEDIEVAL, 
          textAlign: 'center', 
          lineHeight: 32,
          letterSpacing: 1.5,
          textShadowColor: 'rgba(255,255,255,0.3)',
          textShadowRadius: 10
        }}>
          {text}
        </Text>
      </View>

      {!isTyping && (
        <TouchableOpacity 
          style={{ position: 'absolute', bottom: 40, padding: 15, borderBottomWidth: 1, borderColor: '#64748b' }}
          onPress={onComplete}
        >
          <Text style={{ color: '#94a3b8', fontFamily: FONT_HUD, fontSize: 12, letterSpacing: 2 }}>[ TOCA PARA CONTINUAR ]</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================
//  TUTORIAL MODAL
// ============================================================
const TutorialModal = ({ visible, onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '¡Bienvenido al Multiverso!',
      text: 'Este es un juego táctico híbrido. Tu objetivo es derrotar a los jefes de los 12 mundos escalando pisos en el mapa.',
      emoji: '🌍'
    },
    {
      title: 'El Tablero Match-3',
      text: 'Durante el combate, deberás juntar 3 o más gemas del mismo color para generar Maná para tus cartas. Cada movimiento consume 1 Punto de Acción (PA).',
      emoji: '🧩'
    },
    {
      title: 'Cartas y Energía',
      text: 'Usa el maná recolectado para jugar cartas de tu mano. Las cartas también consumen 1 PA al jugarse. Cuando te quedes sin PA, tu turno terminará automáticamente.',
      emoji: '🎴'
    },
    {
      title: 'Las Intenciones del Jefe',
      text: 'A diferencia de ti, el Jefe se mueve por IA. En la parte superior verás sus intenciones. ¡Observa lo que va a hacer y defiéndete con escudo si planea atacar!',
      emoji: '👁️'
    }
  ];

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#1e293b', borderWidth: 2, borderColor: '#3b82f6', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' }}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>{steps[step].emoji}</Text>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 12 }}>{steps[step].title}</Text>
          <Text style={{ color: '#94a3b8', fontSize: 15, fontFamily: FONT_UI, textAlign: 'center', lineHeight: 22, marginBottom: 30 }}>{steps[step].text}</Text>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            {step > 0 ? (
              <TouchableOpacity onPress={() => setStep(step - 1)} style={{ padding: 12 }}>
                <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>ANTERIOR</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 80 }} />}

            {step < steps.length - 1 ? (
              <TouchableOpacity onPress={() => setStep(step + 1)} style={{ backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>SIGUIENTE</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>¡A JUGAR!</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 6 }}>
            {steps.map((_, i) => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === step ? '#3b82f6' : '#334155' }} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
//  INVENTORY MODAL
// ============================================================
const InventoryModal = ({ visible, onClose, relics, collection }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#6366f1', borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: FONT_TITLE }}>🎒 MOCHILA TÁCTICA</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: '#fbbf24', fontSize: 16, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 10 }}>TUS RELIQUIAS ({relics.length})</Text>
            {relics.length === 0 ? (
              <Text style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', marginBottom: 20 }}>No tienes reliquias.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {relics.map(id => {
                  const relic = RELICS_POOL[id];
                  if (!relic) return null;
                  return (
                    <View key={id} style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, width: '48%', flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, marginRight: 8 }}>{relic.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{relic.name}</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10 }}>{relic.desc}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={{ color: '#60a5fa', fontSize: 16, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 10 }}>COLECCIÓN DE CARTAS ({collection.length})</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {collection.map(id => {
                const card = CARDS_POOL[id];
                if (!card) return null;
                const rColor = getRarityColor(getCardRarity(id));
                return (
                  <View key={id} style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: rColor, borderWidth: 1, padding: 8, borderRadius: 8, alignItems: 'center', width: 80 }}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{getCardEmoji(card.type)}</Text>
                    <Text style={{ color: '#fff', fontSize: 9, textAlign: 'center' }} numberOfLines={2}>{card.name}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
//  CUSTOM ALERT MODAL
// ============================================================
const CustomAlertModal = ({ visible, message, onConfirm }) => {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#3b82f6', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350, alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowRadius: 15, shadowOpacity: 0.5 }}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontFamily: FONT_UI, textAlign: 'center', lineHeight: 24, marginBottom: 24 }}>
            {message}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#3b82f6', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' }}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: FONT_HUD, letterSpacing: 1 }}>ACEPTAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
//  TUTORIAL MODAL (ONBOARDING)
// ============================================================
const CombatTutorialModal = ({ step, onNext, onSkip }) => {
  if (step === 0) return null;

  const getStepContent = () => {
    switch(step) {
      case 1: return {
        title: "¡Bienvenido al Combate!",
        text: "Arriba verás a tu enemigo y su Próxima Acción (⚔️ Atacar, 🛡️ Defender, etc). ¡El combate es por turnos!",
        emoji: "🤖"
      };
      case 2: return {
        title: "Tus Puntos de Acción (PA)",
        text: "Cada turno tienes 3 PA (⭐). Tocar una carta de tu mano consume PA y desata su efecto sobre el enemigo o sobre ti mismo.",
        emoji: "🎴"
      };
      case 3: return {
        title: "El Tablero Elemento",
        text: "Juntar 3 gemas te otorga Maná (necesario para las cartas más fuertes). \nLas espadas (⚔️) hacen daño directo y los escudos (🛡️) te protegen.",
        emoji: "💎"
      };
      case 4: return {
        title: "¡Combos Épicos!",
        text: "Si logras juntar 4 o 5 gemas iguales, ¡ganarás un TURNO EXTRA (+1 PA)! Usa esto a tu favor para dominar a los jefes.",
        emoji: "🔥"
      };
      default: return null;
    }
  };

  const content = getStepContent();
  if (!content) return null;

  return (
    <Modal transparent animationType="fade" visible={true}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#0f172a', borderWidth: 2, borderColor: '#fbbf24', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350, alignItems: 'center', shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, shadowOpacity: 0.6 }}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>{content.emoji}</Text>
          <Text style={{ color: '#fbbf24', fontSize: 20, fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 12 }}>{content.title}</Text>
          <Text style={{ color: '#fff', fontSize: 14, fontFamily: FONT_UI, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            {content.text}
          </Text>
          
          <View style={{ flexDirection: 'row', width: '100%', gap: 10 }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={onSkip}
            >
              <Text style={{ color: '#94a3b8', fontWeight: 'bold', fontFamily: FONT_HUD }}>SALTAR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ flex: 2, backgroundColor: '#fbbf24', paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              onPress={onNext}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontFamily: FONT_HUD }}>{step === 4 ? '¡ENTENDIDO!' : 'SIGUIENTE'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress dots */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 15 }}>
            {[1, 2, 3, 4].map(s => (
              <View key={s} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s === step ? '#fbbf24' : '#334155' }} />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

function GameApp() {
  // Sobrescribir el alert nativo para que use nuestro CustomAlertModal
  const alert = (message) => {
    if (globalThis.setCustomAlert) {
      globalThis.setCustomAlert({ message });
    } else {
      console.log(message);
    }
  };

  // --- NAVEGACIÓN Y ECONOMÍA ---
  const [gameState, setGameState] = useState('intro'); // 'intro' | 'level_selection' | 'shop' | 'deck_management' | 'combat'
  const [maxUnlockedWorld, setMaxUnlockedWorld] = useState(1);
  const [gold, setGold] = useState(100);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // Mapa Roguelike
  const [actMap, setActMap] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [completedNodes, setCompletedNodes] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    if (actMap.length === 0) {
      setActMap(generateProceduralMap(maxUnlockedWorld));
    }
  }, [maxUnlockedWorld, actMap.length]);

  // Mazo activo y Colección del Jugador
  const [collection, setCollection] = useState(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15', 'c16', 'c17', 'c18', 'c19', 'c20', 'c21', 'c22', 'c23', 'c24', 'c25', 'c26', 'c27', 'c28', 'c29', 'c30']); // Cartas compradas/desbloqueadas
  
  // Reliquias y Pociones
  const [relics, setRelics] = useState([]);
  const [potions, setPotions] = useState([]);

  
  // Forja (Upgrades)
  const [cardUpgrades, setCardUpgrades] = useState({}); // ej: { 'c1': 1, 'c2': 2 }
  
  const getUpgradedCard = useCallback((cardId) => {
    const baseCard = CARDS_POOL[cardId];
    if (!baseCard) return null;
    const level = cardUpgrades[cardId] || 0;
    
    // Escalar daño base un 20% por cada mundo desbloqueado después del primero
    const worldMultiplier = 1 + ((maxUnlockedWorld - 1) * 0.20);
    const scaledBaseEffect = Math.floor(baseCard.effectValue * worldMultiplier);

    // Cada nivel suma +3 de efecto extra
    const upgradedEffect = scaledBaseEffect + (level * 3);
    const upgradedName = level > 0 ? `${baseCard.name} +${level}` : baseCard.name;
    
    return {
      ...baseCard,
      effectValue: upgradedEffect,
      name: upgradedName,
      level
    };
  }, [cardUpgrades, maxUnlockedWorld]);

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

  // --- AUDIO DE FONDO (BGM) ---
  const bgmSoundRef = useRef(null);

  useEffect(() => {
    let soundObj = null;
    const initAudio = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58bb.mp3?filename=epic-battle-music-1-105763.mp3' },
          { shouldPlay: sfxEnabled, isLooping: true, volume: 0.3 }
        );
        soundObj = sound;
        bgmSoundRef.current = sound;
      } catch (err) {
        console.log('Error inicializando BGM:', err);
      }
    };
    initAudio();

    return () => {
      if (soundObj) {
        soundObj.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (bgmSoundRef.current) {
      if (sfxEnabled) {
        bgmSoundRef.current.playAsync();
      } else {
        bgmSoundRef.current.pauseAsync();
      }
    }
  }, [sfxEnabled]);

  // --- GUARDADO LOCAL ---
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [hasSeenCombatTutorial, setHasSeenCombatTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const saveGameState = async () => {
    try {
      const data = {
        maxUnlockedWorld,
        gold,
        level,
        xp,
        collection,
        relics,
        cardUpgrades,
        playerDecks,
        actMap,
        completedNodes,
        sfxEnabled,
        hasSeenTutorial,
        hasSeenCombatTutorial
      };
      await AsyncStorage.setItem('@rpg_save_data', JSON.stringify(data));
    } catch (e) {
      console.log('Error saving data', e);
    }
  };

  const loadGameState = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@rpg_save_data');
      if (jsonValue != null) {
        const data = JSON.parse(jsonValue);
        if (data.maxUnlockedWorld) setMaxUnlockedWorld(data.maxUnlockedWorld);
        if (data.gold !== undefined) setGold(data.gold);
        if (data.level) setLevel(data.level);
        if (data.xp !== undefined) setXp(data.xp);
        if (data.collection) setCollection(data.collection);
        if (data.relics) setRelics(data.relics);
        if (data.cardUpgrades) setCardUpgrades(data.cardUpgrades);
        if (data.playerDecks) setPlayerDecks(data.playerDecks);
        if (data.actMap) setActMap(data.actMap);
        if (data.completedNodes) setCompletedNodes(data.completedNodes);
        if (data.sfxEnabled !== undefined) setSfxEnabled(data.sfxEnabled);
        if (data.hasSeenTutorial !== undefined) setHasSeenTutorial(data.hasSeenTutorial);
        if (data.hasSeenCombatTutorial !== undefined) setHasSeenCombatTutorial(data.hasSeenCombatTutorial);
      }
    } catch (e) {
      console.log('Error loading data', e);
    } finally {
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    loadGameState();
  }, []);

  // Auto-guardado
  useEffect(() => {
    if (isDataLoaded) {
      saveGameState();
    }
  }, [maxUnlockedWorld, gold, level, xp, collection, relics, cardUpgrades, playerDecks, actMap, completedNodes, sfxEnabled, hasSeenTutorial, hasSeenCombatTutorial]);

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
      Animated.spring(comboMsgScale, { toValue: 1.4, friction: 3, tension: 120, useNativeDriver: false }),
      Animated.timing(comboMsgY, { toValue: -65, duration: 750, useNativeDriver: false }),
      Animated.sequence([
        Animated.delay(450),
        Animated.timing(comboMsgOpacity, { toValue: 0, duration: 300, useNativeDriver: false })
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
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(null);

  // --- ESTADOS DE COMBATE ---
  const [actionPoints, setActionPoints] = useState(3);
  const [turn, setTurn] = useState('player');
  const [player, setPlayer] = useState({ hp: 100, maxHp: 100, shield: 20 });
  const [enemy, setEnemy] = useState({ name: '', hp: 100, maxHp: 100, shield: 0, energy: 0, type: 'DEMON' });
  const [hand, setHand] = useState([]);
  const [combatLog, setCombatLog] = useState('');
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState('idle'); // 'idle' | 'showing' | 'transitioning'
  const [isForging, setIsForging] = useState(false);
  const [isRemovingCard, setIsRemovingCard] = useState(false);

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

  // Animación del Cofre 3D flotante
  const chestFloatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chestFloatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(chestFloatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();
  }, []);

  // --- COMPORTAMIENTO DE IA VISUAL Y GRID ---
  const [grid, setGrid] = useState([]);
  const [currentAiMove, setCurrentAiMove] = useState(null);
  const [incomingBoardEffect, setIncomingBoardEffect] = useState(null);
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
      const intent = forecastBossIntent(enemy, currentWorld, maxUnlockedWorld);
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

  // --- COMPRAR ÍTEM EN LA TIENDA ---
  const handleBuyItem = (item) => {
    const price = item.price || 150;
    if (gold < price) {
      alert('¡No tienes suficiente oro!');
      return;
    }

    if (item.id.startsWith('c')) {
      if (collection.includes(item.id)) return alert('Ya tienes esta carta.');
      setCollection(prev => {
        if (prev.includes(item.id)) return prev;
        return [...prev, item.id];
      });
    } else if (item.id.startsWith('r')) {
      if (relics.includes(item.id)) return alert('Ya tienes esta reliquia.');
      setRelics(prev => {
        if (prev.includes(item.id)) return prev;
        return [...prev, item.id];
      });
    } else if (item.id.startsWith('p')) {
      if (potions.length >= 3) return alert('No tienes espacio para más pociones.');
      setPotions(prev => [...prev, item.id]);
    }

    setGold(prev => prev - price);
    playSfx('victory');
    if (Platform.OS !== 'web') Vibration.vibrate(100);
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
    
    // Cargar mapa para este mundo
    setActMap(generateProceduralMap(targetWorld.id));
    setCurrentNodeId(null);
    setCompletedNodes([]);
    
    setTurn('player');
    setCombatLog(`🗺️ Has viajado a: ${targetWorld.name}.`);
    setShowVictoryModal(false);
    changeGameState('level_selection');
  };

  // --- FX: SACUDIDAS Y TEXTOS FLOTANTES ---
  const triggerShake = (isTargetPlayer) => {
    const targetAnim = isTargetPlayer ? playerShake : enemyShake;
    Animated.sequence([
      Animated.timing(targetAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: -1, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: 1, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: -1, duration: 50, useNativeDriver: false }),
      Animated.timing(targetAnim, { toValue: 0, duration: 50, useNativeDriver: false }),
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
      
      // Lanzamos el flash de impacto de forma independiente para no mezclar useNativeDriver true/false en paralelo, lo cual crashea Android
      Animated.sequence([
        Animated.timing(targetFlash, { toValue: 1, duration: 60, useNativeDriver: false }),
        Animated.timing(targetFlash, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();

      Animated.parallel([
        // Onda expansiva
        Animated.sequence([
          Animated.timing(shockwaveOpacity, { toValue: 1, duration: 50, useNativeDriver: false }),
          Animated.parallel([
            Animated.timing(shockwaveAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.timing(shockwaveOpacity, { toValue: 0, duration: 500, useNativeDriver: false }),
          ]),
        ]),
        // Partículas
        Animated.sequence([
          Animated.timing(particleOpacity, { toValue: 1, duration: 50, useNativeDriver: false }),
          Animated.parallel([
            Animated.timing(particle1X, { toValue: (isPlayerAttacking ? 1 : -1) * 35, duration: 500, useNativeDriver: false }),
            Animated.timing(particle1Y, { toValue: -45, duration: 500, useNativeDriver: false }),
            Animated.timing(particle2X, { toValue: (isPlayerAttacking ? 1 : -1) * -25, duration: 500, useNativeDriver: false }),
            Animated.timing(particle2Y, { toValue: -60, duration: 500, useNativeDriver: false }),
            Animated.timing(particle3X, { toValue: (isPlayerAttacking ? 1 : -1) * 55, duration: 500, useNativeDriver: false }),
            Animated.timing(particle3Y, { toValue: -30, duration: 500, useNativeDriver: false }),
            Animated.timing(particle4X, { toValue: (isPlayerAttacking ? 1 : -1) * -45, duration: 500, useNativeDriver: false }),
            Animated.timing(particle4Y, { toValue: -15, duration: 500, useNativeDriver: false }),
            Animated.timing(particle5X, { toValue: (isPlayerAttacking ? 1 : -1) * 20, duration: 500, useNativeDriver: false }),
            Animated.timing(particle5Y, { toValue: -75, duration: 500, useNativeDriver: false }),
            Animated.timing(particleOpacity, { toValue: 0, duration: 500, useNativeDriver: false }),
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
      triggerShake(isTargetPlayer); // Sacudir al que recibe el daño crítico, no al revés
      if (Platform.OS !== 'web') Vibration.vibrate(400); // Fuerte vibración en críticos
    } else {
      if (Platform.OS !== 'web') Vibration.vibrate(50); // Pequeña sacudida
    }

    targetY.setValue(10);
    targetOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(targetY, { toValue: -50, duration: 1000, easing: Easing.out(Easing.back(1.5)), useNativeDriver: false }),
      Animated.timing(targetOpacity, { toValue: 0, duration: 1000, useNativeDriver: false }),
    ]).start(() => {
      if (isTargetPlayer) setPlayerDamageVal(null);
      else setEnemyDamageVal(null);
    });
  };

  // --- AUTOMATIZACIÓN DE IA ENEMIGA (Árbol de Comportamiento por Mundo) ---
  const handleAiMoveComplete = useCallback(() => {
    if (!pendingAiUpdate.current) return;
    const { actionDescription, updatedPlayer, updatedEnemy, boardEffect } = pendingAiUpdate.current;
    pendingAiUpdate.current = null;
    setCurrentAiMove(null);

    if (boardEffect) {
      setIncomingBoardEffect(boardEffect);
    }

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
      // Usamos la IA avanzada pasando el mundo actual, el tablero real y el estado del enemigo
      const { actionDescription, updatedPlayer, updatedEnemy, recommendedMove, boardEffect } = executeAdvancedEnemyTurn(
        enemy,
        player,
        currentWorld,
        grid,
        enemyStatus,
        maxUnlockedWorld
      );

      pendingAiUpdate.current = { actionDescription, updatedPlayer, updatedEnemy, boardEffect };

      if (recommendedMove && enemyStatus?.type !== 'Congelado') {
        // Enviar coordenadas del swap a GameBoard para que lo anime en el tablero
        setCurrentAiMove(recommendedMove);
      } else {
        // Ejecutar de inmediato sin swap si el tablero no lo requiere o está congelado
        handleAiMoveComplete();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [turn, gameState]);

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

    if (gained.red > 0) passiveDamage += gained.red * 4;
    if (gained.blue > 0) passiveShield += gained.blue * 5;
    if (gained.green > 0) passiveHeal += gained.green * 4;

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
        const unblockedDamage = oldEnemyHp - newEnemyState.hp;

        if (totalDamageDone > 0) {
          triggerShake(false);
          triggerFloatingDamage(false, `-${totalDamageDone}`, card.type);
        }

        // Reliquia Mago: Vampirismo (10% curación del daño a la vida del enemigo)
        if (unblockedDamage > 0 && relics.includes('r_mage')) {
          const healAmount = Math.max(1, Math.floor(unblockedDamage * 0.1));
          newPlayerState.hp = Math.min(newPlayerState.maxHp, newPlayerState.hp + healAmount);
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

  // --- LÓGICA: USAR POCIÓN EN COMBATE ---
  const handleUsePotion = useCallback((potionId, index) => {
    if (turn !== 'player') return;
    const potion = POTIONS_POOL[potionId];
    if (!potion) return;

    if (potion.type === 'heal') {
      setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + 50) }));
      triggerFloatingDamage(true, '+50', 'Defensa');
    } else if (potion.type === 'shield') {
      setPlayer(prev => ({ ...prev, shield: prev.shield + 30 }));
      triggerFloatingDamage(true, '+30', 'Defensa');
    } else if (potion.type === 'energy') {
      setActionPoints(prev => prev + 1);
      triggerFloatingDamage(true, '+1 PA', 'Defensa');
    }

    setCombatLog(`🧪 Usaste ${potion.name}.`);
    playSfx('victory');

    setPotions(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }, [turn, setPlayer, setActionPoints]);

  const handleEndTurn = useCallback(() => {
    if (turn !== 'player' || enemy.hp <= 0 || player.hp <= 0) return;
    setActionPoints(0);
    setCombatLog('⏩ Turno pasado. El enemigo prepara su contraataque...');
    setTurn('enemy');
  }, [turn, player, enemy]);

  const handleClaimVictory = useCallback((action) => {
    let newGold = 150;
    if (relics.includes('r5')) {
      newGold = Math.floor(newGold * 1.2); // Moneda de la Suerte
    }
    setGold(prev => prev + newGold);

    // Reliquias de Curación al ganar
    let healAmount = 0;
    if (relics.includes('r_paladin')) healAmount += 5;
    if (relics.includes('r4')) healAmount += 15;
    
    if (healAmount > 0) {
      setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));
    }

    setCompletedNodes(prev => [...prev, currentNodeId]);

    // Check if it was a boss node
    let current;
    actMap.forEach(f => f.forEach(n => { if (n.id === currentNodeId) current = n; }));
    
    if (current && current.type === 'boss') {
      if (currentWorldIndex + 1 === maxUnlockedWorld) {
        if (maxUnlockedWorld < WORLDS.length) {
          const nextWorldId = maxUnlockedWorld + 1;
          const newDeckInfo = WORLD_DECKS[nextWorldId];
          
          if (newDeckInfo) {
            setCollection(prev => {
              const copy = [...prev];
              newDeckInfo.playerDeck.forEach(c => {
                if (!copy.includes(c)) copy.push(c);
              });
              return copy;
            });
            
            setTimeout(() => {
              alert(`¡Has avanzado al Mundo ${nextWorldId}!\nHas desbloqueado nuevas cartas del [${newDeckInfo.name}].\n¡Ve a TUS MAZOS para equiparlas!`);
            }, 800);
          }

          setMaxUnlockedWorld(prev => prev + 1);
          setActMap([]); // Will trigger regeneration for next act
          setCurrentNodeId(null);
          setCompletedNodes([]);
        } else {
          setMaxUnlockedWorld(prev => prev + 1);
          setActMap([]); 
          setCurrentNodeId(null);
          setCompletedNodes([]);
        }
      } else {
        // Just farming an old world
        setActMap([]); 
        setCurrentNodeId(null);
        setCompletedNodes([]);
      }
      
      setShowVictoryModal(false);
      setVictoryPhase('idle');
      changeGameState('act_transition');
      return;
    }

    setShowVictoryModal(false);
    setVictoryPhase('idle');
    changeGameState('level_selection');
  }, [currentNodeId, actMap, maxUnlockedWorld, playerDecks.length, currentWorldIndex, collection]);

  const handleNodeSelect = (node) => {
    // Check if playable
    let playable = false;
    if (!currentNodeId) {
      if (node.id.startsWith('f0_')) playable = true;
    } else {
      let current;
      actMap.forEach(f => f.forEach(n => { if (n.id === currentNodeId) current = n; }));
      if (current && current.next.includes(node.id)) playable = true;
    }

    if (!playable && !completedNodes.includes(node.id)) {
      if (node.id === currentNodeId) {
        // Permitir volver a entrar al nodo si morimos y decidimos volver al mapa
        playable = true;
      } else {
        alert('Ruta bloqueada. Debes avanzar desde tu nodo actual.');
        return;
      }
    }

    if (completedNodes.includes(node.id)) {
      if (['combat', 'elite', 'boss'].includes(node.type)) {
        // Permitir farmear nodos pasados
      } else {
        return; // Campfires, events y tiendas no se pueden farmear
      }
    }

    // Set as current and open view depending on type
    setCurrentNodeId(node.id);
    
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      // Configurar enemigo
      const actIdx = currentWorldIndex;
      const actWorld = WORLDS[actIdx % WORLDS.length];
      
      let enemyName = node.type === 'boss' ? actWorld.enemyName : (node.type === 'elite' ? 'Élite Guardián' : 'Esbirro');
      if (actIdx >= WORLDS.length) {
        enemyName = `[Mítico] ${enemyName}`;
      }

      // Escalado infinito: 20% más por cada mundo superado
      const multiplier = 1 + (actIdx * 0.2);
      
      let hp = node.type === 'boss' ? actWorld.enemyHp : (node.type === 'elite' ? Math.floor(actWorld.enemyHp * 0.8) : Math.floor(actWorld.enemyHp * 0.5));
      hp = Math.floor(hp * multiplier);
      
      // Select the current world index so backgrounds/colors apply
      setCurrentWorldIndex(actIdx % WORLDS.length);
      setEnemy({ name: enemyName, hp, maxHp: hp, shield: 0, energy: 0, type: node.type });
      
      // Retrieve hero base stats
      let baseHp = 100;
      let baseShield = 20;
      if (selectedClassId) {
        const hClass = HERO_CLASSES.find(h => h.id === selectedClassId);
        if (hClass) {
          baseHp = hClass.startHp;
          baseShield = hClass.startShield;
        }
      }

      let startHp = baseHp;
      let startMaxHp = baseHp;
      let startShield = baseShield;
      let startPA = 3;

      if (relics.includes('r1')) { startHp += 20; startMaxHp += 20; }
      if (relics.includes('r2')) { startShield += 15; }
      if (relics.includes('r3') || relics.includes('r_assassin')) { startPA += 1; }
      if (relics.includes('r_paladin')) { startShield += 10; }

      // Start combat setup (like handleSelectWorld does)
      setPlayer({ hp: startHp, maxHp: startMaxHp, shield: startShield });
      setActionPoints(startPA);
      setTurn('player');
      setGrid([]);
      
      const deckCards = activeDeck.map(id => getUpgradedCard(id)).filter(Boolean).map(c => ({
        ...c,
        charge: 0,
        totalCost: Object.values(c.manaCost || {}).reduce((sum, v) => sum + v, 0) || 5
      }));
      setHand(deckCards);
      
      setCombatLog(`¡Te encuentras con un ${enemyName}!`);
      
      if (!hasSeenCombatTutorial && currentWorldIndex === 0) {
        setTutorialStep(1);
        setHasSeenCombatTutorial(true);
      }
      
      changeGameState('combat');
    } else if (node.type === 'shop') {
      changeGameState('shop');
    } else if (node.type === 'event') {
      const randomEvent = EVENTS_POOL[Math.floor(Math.random() * EVENTS_POOL.length)];
      setCurrentEventId(randomEvent.id);
      changeGameState('event');
    } else if (node.type === 'campfire') {
      setIsForging(false);
      changeGameState('campfire');
    }
  };

  const handleRetryCampaign = () => {
    if (currentNodeId) {
      let current;
      actMap.forEach(f => f.forEach(n => { if (n.id === currentNodeId) current = n; }));
      if (current) {
        setShowVictoryModal(false);
        handleNodeSelect(current);
        return;
      }
    }
    handleSelectWorld(currentWorldIndex);
  };

  const heroFloating = playerDamageVal ? { value: playerDamageVal.value, type: playerDamageVal.type, animY: playerPopupY, animOpacity: playerPopupOpacity } : null;
  const enemyFloating = enemyDamageVal ? { value: enemyDamageVal.value, type: enemyDamageVal.type, animY: enemyPopupY, animOpacity: enemyPopupOpacity } : null;

  const getHeaderTitle = (tab) => {
    if (tab === 'worlds_overview') return 'MULTIVERSO';
    if (tab === 'level_selection') return 'EL REINO';
    if (tab === 'shop') return 'TIENDA MÍSTICA';
    if (tab === 'deck_management') return 'TUS MAZOS';
    return 'REALM OF ELEMENTS';
  };

  const [showInventory, setShowInventory] = useState(false);

  const renderGlobalHeader = (activeTab) => {
    const heroInfo = selectedClassId ? HERO_CLASSES.find(h => h.id === selectedClassId) : null;
    const currentEmoji = heroInfo ? heroInfo.emoji : '🧙‍♂️';
    const currentName = heroInfo ? heroInfo.name.split(' ')[0].toUpperCase() : 'HÉROE';

    return (
      <View style={styles.globalHeaderContainer}>
        <InventoryModal 
          visible={showInventory} 
          onClose={() => setShowInventory(false)} 
          relics={relics} 
          collection={collection} 
        />
        <View style={styles.globalHeaderInner}>
          <View style={styles.headerTopRow}>
            {/* Perfil del Jugador */}
            <View style={styles.playerProfileCard}>
              <View style={styles.playerAvatarCircle}>
                <Text style={styles.playerAvatarEmoji}>{currentEmoji}</Text>
              </View>
              <View style={styles.playerInfoBox}>
                <Text style={styles.playerName}>{currentName}</Text>
                <View style={styles.xpRow}>
                  <Text style={styles.playerLevelLabel}>LVL {level}</Text>
                  <View style={styles.xpBarTrack}>
                    <View style={[styles.xpBarFill, { width: `${Math.min(100, (xp / (level * 100)) * 100)}%` }]} />
                  </View>
                </View>
              </View>
            </View>

            {/* Economía y Ajustes */}
            <View style={styles.headerTopRight}>
              <TouchableOpacity onPress={() => setShowInventory(true)} style={[styles.settingsBtn, { marginRight: 4, backgroundColor: '#8b5cf6' }]}>
                <Text style={styles.settingsBtnText}>🎒</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHasSeenTutorial(false)} style={[styles.settingsBtn, { marginRight: 4, backgroundColor: '#3b82f6' }]}>
                <Text style={styles.settingsBtnText}>ℹ️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setSfxEnabled(p => !p); playSfx('match'); }} style={[styles.settingsBtn, { marginRight: 4 }]}>
                <Text style={styles.settingsBtnText}>{sfxEnabled ? '🔊' : '🔇'}</Text>
              </TouchableOpacity>
              <View style={styles.goldPill}>
                <Text style={styles.goldPillIcon}>🪙</Text>
                <Text style={styles.goldPillText}>{gold}</Text>
              </View>
            </View>
          </View>

          {/* Título Central en nueva fila para evitar overlap */}
          <View style={[styles.headerCenterBox, { marginVertical: 12 }]}>
            <Text style={styles.headerCenterText}>{getHeaderTitle(activeTab)}</Text>
          </View>
        </View>

      {/* Navegación Glassmorphism (Pill style) */}
      <View style={styles.segmentedNavWrapper}>
        <View style={styles.segmentedNav}>
          <TouchableOpacity 
            style={[styles.navSegment, activeTab === 'worlds_overview' && styles.navSegmentActive]} 
            onPress={() => changeGameState('worlds_overview')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navSegmentText, activeTab === 'worlds_overview' && styles.navSegmentTextActive]}>🌍 MUNDOS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navSegment, activeTab === 'level_selection' && styles.navSegmentActive]} 
            onPress={() => changeGameState('level_selection')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navSegmentText, activeTab === 'level_selection' && styles.navSegmentTextActive]}>🗺️ REINO</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navSegment, activeTab === 'shop' && styles.navSegmentActive]} 
            onPress={() => changeGameState('shop')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navSegmentText, activeTab === 'shop' && styles.navSegmentTextActive]}>🛒 TIENDA</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.navSegment, activeTab === 'deck_management' && styles.navSegmentActive]} 
            onPress={() => changeGameState('deck_management')}
            activeOpacity={0.8}
          >
            <Text style={[styles.navSegmentText, activeTab === 'deck_management' && styles.navSegmentTextActive]}>🎴 MAZOS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

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
            onPress={() => {
              if (!currentNodeId) {
                changeGameState('hero_selection');
              } else {
                changeGameState('level_selection');
              }
            }}
            style={styles.introStartBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.introStartBtnText}>⚡ INICIAR AVENTURA</Text>
          </TouchableOpacity>
          <Text style={styles.introVersionText}>v1.2.1 — RPG Match-3 Cards</Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: SELECCIÓN DE HÉROE (CLASE)
  // ============================================================
  if (gameState === 'hero_selection') {
    return (
      <HeroSelectionScreen 
        onSelect={(hero) => {
          playSfx('cardPlay');
          setSelectedClassId(hero.id);
          setPlayerDecks([
            { id: 1, name: `Mazo de ${hero.name}`, cards: [...hero.startDeck] },
            { id: 2, name: `Personalizado 1`, cards: [...hero.startDeck] },
            { id: 3, name: `Personalizado 2`, cards: [...hero.startDeck] },
            { id: 4, name: `Personalizado 3`, cards: [...hero.startDeck] },
            { id: 5, name: `Personalizado 4`, cards: [...hero.startDeck] },
          ]);
          setActiveDeckIndex(0);
          setCollection(Array.from(new Set([...hero.startDeck, 'c4', 'c5', 'c6', 'c10'])));
          setRelics([hero.relic]);
          changeGameState('oracle_blessing');
        }}
        screenTransitionAnim={screenTransitionAnim}
      />
    );
  }

  // ============================================================
  //  INTERFAZ: BENDICIÓN DEL ORÁCULO
  // ============================================================
  if (gameState === 'oracle_blessing') {
    return (
      <SafeAreaView style={[styles.introRoot, { backgroundColor: '#0f172a' }]}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, maxWidth: 600, width: '100%', alignSelf: 'center' }}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>👁️</Text>
          <Text style={{ color: '#fbbf24', fontSize: 28, fontWeight: 'bold', fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 10 }}>LA BENDICIÓN DEL ORÁCULO</Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 40, lineHeight: 22 }}>
            "Viajero... el abismo elemental requiere preparación. Elige un don que te acompañará en esta aventura."
          </Text>

          <View style={{ width: '100%', gap: 16 }}>
            <TouchableOpacity 
              style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#ef4444', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + 20, hp: prev.hp + 20 }));
                playSfx('victory');
                changeGameState('level_selection');
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>❤️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Vitalidad del Titán</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>+20 HP Máximo permanentemente.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#eab308', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                setGold(prev => prev + 150);
                playSfx('victory');
                changeGameState('level_selection');
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>🪙</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Bolsa del Mercader</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Inicias con 150 Oro adicional.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#3b82f6', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                const availableRelics = Object.keys(RELICS_POOL).filter(id => !relics.includes(id));
                if (availableRelics.length > 0) {
                  const randomRelicId = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                  setRelics(prev => [...prev, randomRelicId]);
                  
                  // Aplicar efecto de reliquia instantaneo si es HP
                  if (randomRelicId === 'r1') {
                    setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + 20, hp: prev.hp + 20 }));
                  }
                } else {
                  setGold(prev => prev + 200); // Fallback
                }
                playSfx('victory');
                changeGameState('level_selection');
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>🔮</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Conocimiento Antiguo</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Obtienes una Reliquia Aleatoria gratis.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#a855f7', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}
              onPress={() => {
                const epicCards = Object.values(CARDS_POOL).filter(c => c.price >= 600 && !collection.includes(c.id));
                if (epicCards.length > 0) {
                  const randomEpic = epicCards[Math.floor(Math.random() * epicCards.length)];
                  setCollection(prev => [...prev, randomEpic.id]);
                } else {
                  setGold(prev => prev + 200); // Fallback
                }
                playSfx('victory');
                changeGameState('level_selection');
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 16 }}>🎴</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Poder Despertado</Text>
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>Obtienes una Carta Épica Aleatoria gratis.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: MULTIVERSO (MAPA DE CAMPAÑA GENERAL)
  // ============================================================
  if (gameState === 'worlds_overview') {
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Image source={require('./assets/world_map_3d.png')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5, 5, 10, 0.85)' }]} pointerEvents="none" />
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
        {renderGlobalHeader('worlds_overview')}

        <ScrollView contentContainerStyle={styles.selectionScroll}>
          <Text style={styles.selectionInstructions}>
            Explora los reinos del multiverso. Desbloquea nuevos mundos derrotando a los Jefes Supremos.
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
            {WORLDS.map((world, idx) => {
              const isUnlocked = world.id <= maxUnlockedWorld;
              const isCurrent = currentWorldIndex === idx;

              return (
                <TouchableOpacity
                  key={`world_${world.id}`}
                  disabled={!isUnlocked}
                  onPress={() => {
                    handleSelectWorld(idx);
                  }}
                  activeOpacity={0.8}
                  style={[
                    {
                      width: '48%',
                      backgroundColor: isUnlocked ? 'rgba(15, 23, 42, 0.7)' : 'rgba(10, 10, 15, 0.9)',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isCurrent ? '#fbbf24' : (isUnlocked ? world.boardShadowColor : '#334155'),
                      padding: 16,
                      alignItems: 'center',
                      shadowColor: isUnlocked ? world.boardShadowColor : '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: isUnlocked ? 12 : 5,
                      shadowOpacity: isUnlocked ? 0.4 : 0.8,
                      opacity: isUnlocked ? 1 : 0.6,
                    },
                    isCurrent && {
                      transform: [{ scale: 1.05 }],
                      shadowOpacity: 0.8,
                      shadowRadius: 20,
                    }
                  ]}
                >
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>{isUnlocked ? world.enemyEmoji : '🔒'}</Text>
                  <Text style={{ color: isUnlocked ? '#fff' : '#64748b', fontSize: 13, fontWeight: '900', fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 4 }}>
                    {isUnlocked ? world.name : 'Mundo Desconocido'}
                  </Text>
                  
                  {isUnlocked && (
                    <>
                      <Text style={{ color: '#f87171', fontSize: 10, fontFamily: FONT_HUD, fontWeight: 'bold', textAlign: 'center' }}>
                        JEFE: {world.enemyName}
                      </Text>
                      <Text style={{ color: '#94a3b8', fontSize: 9, fontFamily: FONT_UI, marginTop: 4 }}>
                        HP: {world.enemyHp}
                      </Text>
                    </>
                  )}

                  {isCurrent && (
                    <View style={{ position: 'absolute', top: -8, backgroundColor: '#fbbf24', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ color: '#000', fontSize: 8, fontWeight: 'bold', fontFamily: FONT_HUD }}>ACTUAL</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        <TutorialModal 
          visible={isDataLoaded && !hasSeenTutorial && gameState === 'worlds_overview'} 
          onClose={() => setHasSeenTutorial(true)} 
        />
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: TRANSICIÓN DE ACTO (LORE SCREEN)
  // ============================================================
  if (gameState === 'act_transition') {
    return (
      <ActTransitionScreen 
        worldIndex={currentWorldIndex}
        onComplete={() => changeGameState('level_selection')} 
      />
    );
  }

  // ============================================================
  //  INTERFAZ: SELECCIÓN DE NIVELES (OVERWORLD)
  // ============================================================
  if (gameState === 'level_selection') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0a05' }}>
        <Image source={require('./assets/world_map_3d.png')} style={[StyleSheet.absoluteFillObject, { transform: [{ scale: 1.25 }] }]} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(15,10,10,0.85)' }]} pointerEvents="none" />
        
        <SafeAreaView style={{ flex: 1 }}>
          <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
          <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
          {renderGlobalHeader('level_selection')}

          <ScrollView contentContainerStyle={styles.selectionScroll}>
            <Text style={styles.selectionInstructions}>
            Elige tu camino. Acto {currentWorldIndex + 1} - {currentWorld.name}
          </Text>

          <View style={styles.mapPathContainer}>
            {/* Línea conectora eliminada para dar paso a un mapa más limpio */}

            {[...actMap].reverse().map((floorNodes, reverseFloorIdx) => {
              const floorIdx = actMap.length - 1 - reverseFloorIdx;
              return (
                <View key={`floor_${floorIdx}`} style={{ flexDirection: 'row', justifyContent: 'center', gap: 30, marginBottom: 50 }}>
                  {floorNodes.map((node) => {
                    const isCompleted = completedNodes.includes(node.id);
                    const isCurrent = currentNodeId === node.id;
                    
                    let isPlayable = false;
                    if (!currentNodeId && node.id.startsWith('f0_')) isPlayable = true;
                    if (currentNodeId) {
                      let current;
                      actMap.forEach(f => f.forEach(n => { if (n.id === currentNodeId) current = n; }));
                      if (current && current.next.includes(node.id)) isPlayable = true;
                    }
                    
                    const isLocked = !isPlayable && !isCompleted && !isCurrent;
                    
                    const getEmoji = (t) => ({ boss: '👿', elite: '💀', combat: '⚔️', shop: '🛒', campfire: '🏕️', start: '🏁', event: '❓' }[t] || '❓');
                    const getColor = (t) => ({ boss: '#ef4444', elite: '#f97316', combat: '#3b82f6', shop: '#eab308', campfire: '#10b981', start: '#8b5cf6', event: '#d946ef' }[t] || '#fff');
                    
                    const renderMapLines = () => {
                      const nextFloor = actMap[floorIdx + 1];
                      if (!nextFloor) return null;
                      const xA = (floorNodes.indexOf(node) - (floorNodes.length - 1) / 2) * 90;

                      return node.next.map(nextId => {
                        const nextIndex = nextFloor.findIndex(n => n.id === nextId);
                        if (nextIndex === -1) return null;
                        
                        const xB = (nextIndex - (nextFloor.length - 1) / 2) * 90;
                        const dx = xB - xA;
                        const dy = -131; // Distancia estimada entre centros de nodos
                        
                        const length = Math.sqrt(dx * dx + dy * dy);
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                        
                        const isPathActive = isCompleted && (completedNodes.includes(nextId) || currentNodeId === nextId);

                        // En Slay the Spire las líneas son punteadas, aquí usamos una vista sutil
                        return (
                          <View 
                            key={`line_${node.id}_${nextId}`}
                            style={{
                              position: 'absolute',
                              width: length,
                              height: 2,
                              backgroundColor: isPathActive ? 'rgba(255,255,255,0.8)' : 'rgba(255, 255, 255, 0.15)',
                              top: 30 + dy / 2 - 1,
                              left: dx / 2 - length / 2,
                              transform: [{ rotate: `${angle}deg` }],
                              zIndex: -1,
                              shadowColor: isPathActive ? '#fff' : 'transparent',
                              shadowRadius: 5,
                              shadowOpacity: 0.5,
                              elevation: isPathActive ? 2 : 0
                            }} 
                          />
                        );
                      });
                    };

                    // Determinar el resplandor de selección (Halo)
                    const showHalo = isCurrent || isPlayable;
                    const haloColor = isCurrent ? '#fbbf24' : (isPlayable ? '#22c55e' : 'transparent');

                    return (
                      <View key={node.id} style={{ alignItems: 'center', zIndex: 10 }}>
                        <View style={{ position: 'absolute', top: 0, left: '50%', width: 0, height: 0, overflow: 'visible', zIndex: -1 }}>
                          {renderMapLines()}
                        </View>
                        <TouchableOpacity
                          disabled={isLocked && !isCompleted && !isCurrent}
                          onPress={() => handleNodeSelect(node)}
                          activeOpacity={0.8}
                          style={{
                            width: 60, height: 60,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: isLocked ? 0.3 : 1,
                          }}
                        >
                          {/* Halo de selección estilo Slay the Spire */}
                          {showHalo && (
                            <View style={{
                              position: 'absolute', width: 68, height: 68, borderRadius: 34,
                              borderWidth: 2, borderColor: haloColor, borderStyle: 'dashed',
                              opacity: 0.8,
                              backgroundColor: isCurrent ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)'
                            }} />
                          )}
                          
                          <Text style={{
                            fontSize: node.type === 'boss' ? 50 : 38,
                            textShadowColor: isCompleted ? '#22c55e' : getColor(node.type),
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: showHalo ? 15 : 5,
                          }}>
                            {isCompleted ? '✓' : getEmoji(node.type)}
                          </Text>
                          
                          {isLocked && (
                            <View style={{ position: 'absolute', right: 5, bottom: 5, backgroundColor: '#000', borderRadius: 10, padding: 2 }}>
                              <Text style={{ fontSize: 10 }}>🔒</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // ============================================================
  //  INTERFAZ: FOGATA (CAMPFIRE)
  // ============================================================
  if (gameState === 'campfire') {
    return (
      <SafeAreaView style={[styles.selectionRoot, { backgroundColor: '#0f0502' }]}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0f0502" />
        
        <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 70, marginBottom: 10, textShadowColor: '#ea580c', textShadowRadius: 30 }}>🏕️</Text>
          <Text style={{ color: '#fbbf24', fontSize: 32, fontFamily: FONT_TITLE, fontWeight: 'bold', marginBottom: 8 }}>FOGATA</Text>
          
          {!isForging ? (
            <>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 40 }}>
                El calor del fuego te reconforta. Tienes tiempo para realizar una acción antes de seguir tu camino.
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'center' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 2, borderColor: '#10b981',
                    borderRadius: 16, padding: 20, width: '45%', alignItems: 'center'
                  }}
                  onPress={() => {
                    const healAmount = Math.floor(player.maxHp * 0.3);
                    setPlayer(prev => ({ ...prev, hp: Math.min(prev.maxHp, prev.hp + healAmount) }));
                    playSfx('victory');
                    alert(`Te has curado ${healAmount} HP.`);
                    setCompletedNodes(prev => [...prev, currentNodeId]);
                    changeGameState('level_selection');
                  }}
                >
                  <Text style={{ fontSize: 40, marginBottom: 10 }}>❤️</Text>
                  <Text style={{ color: '#10b981', fontSize: 14, fontWeight: 'bold', fontFamily: FONT_TITLE }}>DESCANSAR</Text>
                  <Text style={{ color: '#a7f3d0', fontSize: 10, textAlign: 'center', marginTop: 4 }}>Cura 30% HP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 2, borderColor: '#f59e0b',
                    borderRadius: 16, padding: 20, width: '45%', alignItems: 'center'
                  }}
                  onPress={() => setIsForging(true)}
                >
                  <Text style={{ fontSize: 40, marginBottom: 10 }}>🔨</Text>
                  <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: 'bold', fontFamily: FONT_TITLE }}>FORJAR</Text>
                  <Text style={{ color: '#fde68a', fontSize: 10, textAlign: 'center', marginTop: 4 }}>Mejora una carta</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, width: '100%' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 20 }}>
                Selecciona una carta de tu mazo activo para forjarla (+3 Daño/Escudo permanente).
              </Text>
              
              <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                  {activeDeck.map(cardId => {
                    const card = getUpgradedCard(cardId);
                    if (!card) return null;
                    return (
                      <TouchableOpacity
                        key={`forge_${cardId}`}
                        style={[styles.deckItemCard, { backgroundColor: 'rgba(20,20,30,0.8)', borderColor: '#f59e0b', width: '48%' }]}
                        onPress={() => {
                          setCardUpgrades(prev => ({ ...prev, [cardId]: (prev[cardId] || 0) + 1 }));
                          playSfx('victory');
                          alert(`¡[${card.name}] ha sido forjada!`);
                          setCompletedNodes(prev => [...prev, currentNodeId]);
                          changeGameState('level_selection');
                        }}
                      >
                        <View style={styles.deckItemHeader}>
                          <Text style={styles.deckItemEmoji}>{getCardEmoji(card.type)}</Text>
                          <Text style={styles.deckItemName}>{card.name}</Text>
                        </View>
                        <Text style={styles.deckItemType}>{card.type.toUpperCase()}</Text>
                        <Text style={styles.deckItemDesc}>{card.description}</Text>
                        <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: 'bold', marginTop: 8 }}>Efecto actual: {card.effectValue}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
              
              <TouchableOpacity onPress={() => setIsForging(false)} style={{ padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>CANCELAR FORJA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
        {renderGlobalHeader('shop')}

        <ScrollView contentContainerStyle={styles.shopScroll}>
          <Text style={styles.selectionInstructions}>Adquiere hechizos y guerreros para potenciar tu mazo de combate.</Text>

          {currentNodeId && currentNodeId.includes('f') && (
            <TouchableOpacity 
              style={{ backgroundColor: '#22c55e', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 }}
              onPress={() => {
                setCompletedNodes(prev => [...prev, currentNodeId]);
                changeGameState('level_selection');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: FONT_HUD }}>🗺️ VOLVER AL MAPA</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.shopGrid}>
            
            {/* Banner de Servicio de Purga (Arriba del todo) */}
            <TouchableOpacity 
              style={{ width: '100%', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              onPress={() => setIsRemovingCard(true)}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ color: '#fca5a5', fontSize: 16, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 4 }}>🔥 Purga del Mazo</Text>
                <Text style={{ color: '#fecaca', fontSize: 11, fontFamily: FONT_UI }}>Elimina permanentemente una carta de tu mazo para mejorarlo.</Text>
              </View>
              <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>100 🪙</Text>
              </View>
            </TouchableOpacity>
            {[...Object.values(CARDS_POOL), ...Object.values(RELICS_POOL), ...Object.values(POTIONS_POOL)].map(item => {
              if (!item.price) return null;
              
              const isCard = item.id.startsWith('c');
              const isRelic = item.id.startsWith('r');
              const isPotion = item.id.startsWith('p');

              const isOwned = (isCard && collection.includes(item.id)) || (isRelic && relics.includes(item.id));
              const rarity = isCard ? getCardRarity(item.id) : (isRelic ? 'Mítica' : 'Común');

              const isOffer = item.id === specialOfferId;
              const discountMultiplier = isOffer ? (1 - specialOfferDiscount) : 1;
              const finalPrice = Math.floor(item.price * discountMultiplier);

              return (
                <View key={item.id} style={[styles.shopItemCard, { borderColor: getRarityColor(rarity) }]}>
                  {isOffer && !isOwned && (
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>⚡ OFERTA -{Math.round(specialOfferDiscount * 100)}% ⚡</Text>
                    </View>
                  )}

                  <View style={styles.shopItemHeader}>
                    <Text style={styles.shopItemEmoji}>{isCard ? getCardEmoji(item.type) : item.emoji}</Text>
                    <Text style={styles.shopItemName}>{item.name}</Text>
                  </View>
                  {item.image && (
                    <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={styles.shopCardImage} resizeMode="cover" />
                  )}
                  <Text style={styles.shopItemDesc} numberOfLines={4}>{item.description}</Text>
                  
                  {isCard && (
                    <Text style={[styles.shopItemType, { color: getCardTypeColor(item.type) }]} numberOfLines={1}>
                      {item.type.toUpperCase()} (VAL: {item.effectValue})
                    </Text>
                  )}
                  {isRelic && <Text style={[styles.shopItemType, { color: '#f59e0b' }]} numberOfLines={1}>RELIQUIA PASIVA</Text>}
                  {isPotion && <Text style={[styles.shopItemType, { color: '#0ea5e9' }]} numberOfLines={1}>POCIÓN ({potions.filter(p => p === item.id).length}/3)</Text>}

                  {isOwned && !isPotion ? (
                    <View style={styles.shopBoughtBadge}>
                      <Text style={styles.shopBoughtText}>✓ ADQUIRIDA</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleBuyItem(item, finalPrice)}
                      style={styles.shopBuyBtn}
                    >
                      <Text style={styles.shopBuyBtnText}>
                        🪙 COMPRAR por {finalPrice} {isOffer && <Text style={{ textDecorationLine: 'line-through', fontSize: 7, opacity: 0.7 }}>({item.price})</Text>}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Modal de Borrado de Carta */}
        <Modal
          visible={isRemovingCard}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsRemovingCard(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.renameModalCard, { width: '90%', maxHeight: '80%' }]}>
              <Text style={styles.renameModalTitle}>🔥 Servicio de Purga 🔥</Text>
              <Text style={styles.renameModalSubtitle}>Selecciona una carta de tu colección para eliminarla permanentemente. (Costo: 100 🪙)</Text>
              
              <ScrollView style={{ width: '100%', marginVertical: 10, maxHeight: 300 }}>
                {collection.map(id => {
                  const card = getUpgradedCard(id);
                  if (!card) return null;
                  
                  return (
                    <TouchableOpacity 
                      key={`remove_${id}`}
                      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: getRarityColor(getCardRarity(id)) }}
                      onPress={() => {
                        if (gold < 100) {
                          alert('No tienes oro suficiente (100 🪙)');
                          return;
                        }
                        // Prevenir borrar si solo queda 1 carta (no deberia pasar pero por si acaso)
                        if (collection.length <= 3) {
                          alert('¡Tu mazo es demasiado pequeño para purgar más cartas!');
                          return;
                        }

                        // Cobrar oro y remover carta
                        setGold(prev => prev - 100);
                        setCollection(prev => prev.filter(c => c !== id));
                        // Tambien removerla de los mazos activos si esta ahi
                        setPlayerDecks(prev => prev.map(deck => ({
                          ...deck,
                          cards: deck.cards.filter(c => c !== id)
                        })));
                        
                        setIsRemovingCard(false);
                        playSfx('match');
                        alert('Carta purgada exitosamente.');
                      }}
                    >
                      <Text style={{ fontSize: 24, marginRight: 10 }}>{getCardEmoji(card.type)}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{card.name}</Text>
                        <Text style={{ color: '#94a3b8', fontSize: 10 }}>{card.description}</Text>
                      </View>
                      <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 12 }}>X BORRAR</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => setIsRemovingCard(false)}
                style={[styles.modalBtn, styles.modalBtnCancel, { width: '100%', marginTop: 10 }]}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: HOGUERA (CAMPFIRE)
  // ============================================================
  if (gameState === 'campfire') {
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        {renderGlobalHeader('level_selection')}

        {isForging ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
             <Text style={{ color: '#fbbf24', fontSize: 24, fontWeight: 'bold', fontFamily: FONT_TITLE, textAlign: 'center', marginBottom: 10 }}>LA FORJA ELEMENTAL</Text>
             <Text style={{ color: '#94a3b8', fontSize: 12, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 20 }}>Selecciona una carta de tu colección para mejorar su daño o defensa (+3 poder). Consumirá la hoguera.</Text>
             
             <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
                {collection.map(id => {
                  const card = getUpgradedCard(id);
                  if (!card) return null;
                  
                  return (
                    <TouchableOpacity 
                      key={id}
                      style={[styles.shopItemCard, { borderColor: getRarityColor(getCardRarity(id)), alignItems: 'center' }]}
                      onPress={() => {
                        setCardUpgrades(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
                        setCompletedNodes(prev => [...prev, currentNodeId]);
                        playSfx('victory');
                        changeGameState('level_selection');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 5 }}>{getCardEmoji(card.type)}</Text>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold', fontFamily: FONT_TITLE, textAlign: 'center' }}>{card.name}</Text>
                      <Text style={{ color: getCardTypeColor(card.type), fontSize: 9, fontFamily: FONT_HUD, marginTop: 4 }}>Poder: {card.effectValue} ➔ <Text style={{color: '#22c55e'}}>{card.effectValue + 3}</Text></Text>
                      
                      <View style={{ backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 10 }}>
                        <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>⚒️ MEJORAR</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
             </View>
             
             <TouchableOpacity 
                style={{ backgroundColor: '#475569', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 20 }}
                onPress={() => setIsForging(false)}
             >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>VOLVER</Text>
             </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 80, marginBottom: 20 }}>🏕️</Text>
            <Text style={{ color: '#fbbf24', fontSize: 24, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 10 }}>Hoguera de Descanso</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 40 }}>
              El calor de las llamas renueva tus fuerzas. Elige una acción.
            </Text>

            <TouchableOpacity 
              style={{ backgroundColor: '#10b981', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 }}
              onPress={() => {
                setPlayer(prev => ({ ...prev, hp: prev.maxHp }));
                setCompletedNodes(prev => [...prev, currentNodeId]);
                changeGameState('level_selection');
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 14 }}>❤️ DESCANSAR (Curar HP)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#8b5cf6', width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 }}
              onPress={() => setIsForging(true)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 14 }}>⚒️ FORJAR (Mejorar Carta)</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ============================================================
  //  INTERFAZ: EVENTO (MISTERIO)
  // ============================================================
  if (gameState === 'event') {
    const activeEvent = EVENTS_POOL.find(e => e.id === currentEventId);
    
    return (
      <SafeAreaView style={styles.selectionRoot}>
        <Animated.View pointerEvents="none" style={[styles.transitionOverlay, { opacity: screenTransitionAnim }]} />
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />
        {renderGlobalHeader('level_selection')}

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 80, marginBottom: 20 }}>❓</Text>
          <Text style={{ color: '#d946ef', fontSize: 24, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 10, textAlign: 'center' }}>{activeEvent?.title || 'Misterio'}</Text>
          <Text style={{ color: '#e2e8f0', fontSize: 14, fontFamily: FONT_UI, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20, lineHeight: 22 }}>
            {activeEvent?.text || 'Algo extraño sucede...'}
          </Text>

          {activeEvent?.options.map((opt, index) => {
            let btnColor = '#3b82f6';
            if (opt.type === 'danger') btnColor = '#ef4444';
            if (opt.type === 'buy') btnColor = '#eab308';
            if (opt.type === 'heal' || opt.type === 'upgrade') btnColor = '#10b981';
            if (opt.type === 'neutral') btnColor = '#64748b';

            return (
              <TouchableOpacity 
                key={`opt_${index}`}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderColor: btnColor, borderWidth: 2, width: '100%', maxWidth: 350, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 }}
                onPress={() => {
                  const { effect } = opt;
                  
                  if (effect.goldChange) {
                    if (effect.goldChange < 0 && gold < Math.abs(effect.goldChange)) {
                      alert('No tienes suficiente oro.');
                      return;
                    }
                    setGold(prev => prev + effect.goldChange);
                  }
                  if (effect.hpChange) {
                    setPlayer(prev => {
                      let newHp = prev.hp + effect.hpChange;
                      if (newHp > prev.maxHp) newHp = prev.maxHp;
                      if (newHp <= 0) newHp = 1; // Survive with 1 HP
                      return { ...prev, hp: newHp };
                    });
                  }
                  if (effect.maxHpChange) {
                    setPlayer(prev => ({ ...prev, maxHp: prev.maxHp + effect.maxHpChange, hp: prev.hp + effect.maxHpChange }));
                  }
                  if (effect.getRelic) {
                    const availableRelics = Object.keys(RELICS_POOL).filter(id => !relics.includes(id) && RELICS_POOL[id].price !== null);
                    if (availableRelics.length > 0) {
                      const randomRelicId = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                      setRelics(prev => [...prev, randomRelicId]);
                    }
                  }

                  playSfx(opt.type === 'danger' ? 'enemyHit' : 'victory');
                  setCompletedNodes(prev => [...prev, currentNodeId]);
                  changeGameState('level_selection');
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 13 }}>{opt.text}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
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
        {renderGlobalHeader('deck_management')}

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
              const card = getUpgradedCard(cardId);
              if (!card) return null;
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

      <View style={[styles.combatRoot, { flex: 1, justifyContent: 'space-between' }]}>
        {/* HUD SUPERIOR: JEFE */}
        <View style={styles.bossHudSection}>
          <AvatarCard
            name={enemy.name}
            isPlayer={false}
            hp={enemy.hp}
            maxHp={enemy.maxHp}
            shield={enemy.shield}
            energy={enemy.energy ?? 0}
            maxEnergy={6}
            shakeAnim={enemyShake}
            floatingDamage={enemyDamageVal ? {
              value: enemyDamageVal.amount,
              animY: enemyPopupY,
              animOpacity: enemyPopupOpacity,
              type: enemyDamageVal.type,
              isCrit: enemyDamageVal.isCrit
            } : null}
            flashAnim={enemyFlash}
            emojiOverride={currentWorld.enemyEmoji}
            image={currentWorld.enemyImage}
            status={enemyStatus}
            bossIntent={bossIntent}
            isHorizontal={true}
          />
        </View>

        {/* ESCENARIO DE COMBATE 3D (CENTRO) */}
        <View style={styles.boardScene}>
          <Animated.View style={[
            styles.boardWrapper, 
            { 
              shadowColor: currentWorld.boardShadowColor,
              shadowOpacity: envPulseAnim, 
              borderColor: envPulseAnim.interpolate({
                inputRange: [0.4, 1],
                outputRange: ['transparent', currentWorld.boardShadowColor]
              })
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
              aiMove={currentAiMove}
              onAiMoveComplete={handleAiMoveComplete}
              onManaGained={handleManaGained}
              incomingBoardEffect={incomingBoardEffect}
              onBoardEffectComplete={() => setIncomingBoardEffect(null)}
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

          {/* === VFX CINEMATOGRÁFICO DE ATAQUE === */}
          <Animated.View style={[styles.spellProjectile, {
            opacity: spellOpacity,
            backgroundColor: activeSpellColor,
            shadowColor: activeSpellColor,
            transform: [{ translateY: spellAnimX }, { scale: spellScale }]
          }]} pointerEvents="none">
            <View style={[styles.spellCore, { backgroundColor: activeSpellColor }]} />
          </Animated.View>

          {/* === PARTÍCULAS E IMPACTO === */}
          {attackVfx && (
            <Animated.View style={{ position: 'absolute', alignSelf: 'center', top: attackVfx.fromPlayer ? 100 : 'auto', bottom: attackVfx.fromPlayer ? 'auto' : 300, opacity: shockwaveOpacity, transform: [{ scale: shockwaveAnim }] }} pointerEvents="none">
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: attackVfx.color }} />
            </Animated.View>
          )}
          {attackVfx && [1,2,3,4,5].map(i => {
            const px = i === 1 ? particle1X : i === 2 ? particle2X : i === 3 ? particle3X : i === 4 ? particle4X : particle5X;
            const py = i === 1 ? particle1Y : i === 2 ? particle2Y : i === 3 ? particle3Y : i === 4 ? particle4Y : particle5Y;
            return (
              <Animated.View key={`p_${i}`} style={{
                position: 'absolute', alignSelf: 'center', top: attackVfx.fromPlayer ? 100 : 'auto', bottom: attackVfx.fromPlayer ? 'auto' : 300,
                width: 8, height: 8, borderRadius: 4, backgroundColor: attackVfx.color, opacity: particleOpacity,
                transform: [{ translateX: px }, { translateY: py }]
              }} pointerEvents="none" />
            )
          })}
        </View>

        {/* HUD INFERIOR Y CARTAS: JUGADOR */}
        <View style={styles.playerBottomArea}>
          
          <View style={styles.combatInfoRow}>
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
          </View>

          <View style={styles.playerHudSection}>
            <AvatarCard
              name={selectedClassId ? HERO_CLASSES.find(h => h.id === selectedClassId)?.name.toUpperCase() : "HÉROE"}
              isPlayer={true}
              hp={player.hp}
              maxHp={player.maxHp}
              shield={player.shield}
              shakeAnim={playerShake}
              floatingDamage={playerDamageVal ? {
                value: playerDamageVal.amount,
                animY: playerPopupY,
                animOpacity: playerPopupOpacity,
                type: playerDamageVal.type,
                isCrit: playerDamageVal.isCrit
              } : null}
              flashAnim={playerFlash}
              status={playerStatus}
              isHorizontal={true}
            />
            
            {/* RELIQUIAS EQUIPADAS */}
            {relics.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: -4, marginBottom: 8, paddingHorizontal: 16, justifyContent: 'center' }}>
                {relics.map((rId, idx) => {
                  const relic = RELICS_POOL[rId];
                  return relic ? (
                    <View key={`relic_${idx}`} style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: 4, borderWidth: 1, borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.5, shadowRadius: 4 }}>
                      <Text style={{ fontSize: 14 }}>{relic.emoji}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </View>

          {/* COLA DE CASTEO (MANO) */}
          <View style={styles.handSection}>
            <View style={styles.handHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.handTitle}>🎴 MANO ACTIVA</Text>
                {potions.length > 0 && (
                  <View style={{flexDirection: 'row', marginLeft: 10, gap: 4}}>
                    {potions.map((pId, idx) => {
                      const pot = POTIONS_POOL[pId];
                      return (
                        <TouchableOpacity key={`pot_${idx}`} style={{backgroundColor: '#1e293b', padding: 4, borderRadius: 12, borderWidth: 1, borderColor: '#38bdf8'}}
                          onPress={() => handleUsePotion(pId, idx)}
                        >
                          <Text style={{fontSize: 12}}>{pot.emoji}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={handleEndTurn} style={styles.endTurnBtn} disabled={turn !== 'player'}>
                <Text style={styles.endTurnText}>PASAR TURNO</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll} bounces={false}>
              {hand.map((card, idx) => {
                const isReady = card.charge >= card.totalCost;
                const progress = Math.min(100, (card.charge / card.totalCost) * 100);
                const cardDisabled = actionPoints <= 0 || turn !== 'player';
                const isSelected = selectedHandIndex === idx;
                
                return (
                  <TouchableOpacity
                    key={card.id}
                    activeOpacity={0.8}
                    disabled={cardDisabled}
                    style={[
                      styles.cardContainer,
                      isReady ? styles.cardReady : null,
                      isSelected ? styles.cardSelected : null,
                      cardDisabled && !isReady ? styles.cardContainerDisabled : null,
                      { borderColor: isReady ? '#fbbf24' : 'rgba(255,255,255,0.07)' }
                    ]}
                    onPress={() => {
                      if (isReady) {
                        handlePlayCard(card);
                      } else {
                        setSelectedHandIndex(idx);
                        playSfx('match');
                      }
                    }}
                  >
                    <View style={styles.cardManaRow}>
                      <View style={[styles.manaPip, { backgroundColor: getPipColor(Object.keys(card.manaCost)[0]) }]}>
                        <Text style={styles.manaPipText}>{card.manaCost[Object.keys(card.manaCost)[0]]}</Text>
                      </View>
                    </View>

                    {card.image ? (
                      <Image source={typeof card.image === 'number' ? card.image : { uri: card.image }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.cardImagePlaceholder}>
                        <Text style={styles.cardEmoji}>{getCardEmoji(card.type)}</Text>
                      </View>
                    )}
                    
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName} numberOfLines={1}>{card.name}</Text>
                      <Text style={[styles.cardType, { color: getCardTypeColor(card.type) }]}>
                        {card.type.toUpperCase()} ({card.effectValue})
                      </Text>
                      {isSelected && <Text style={styles.cardDesc} numberOfLines={2}>{card.description}</Text>}
                    </View>
                    <View style={styles.cardChargeBarBg}>
                      <Animated.View style={[styles.cardChargeBarFill, { width: `${progress}%`, backgroundColor: isReady ? '#fbbf24' : '#3b82f6' }]} />
                    </View>
                    <Text style={styles.chargeText}>{card.charge}/{card.totalCost}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

      </View>

      <CombatTutorialModal 
        step={tutorialStep} 
        onNext={() => setTutorialStep(prev => prev >= 4 ? 0 : prev + 1)} 
        onSkip={() => setTutorialStep(0)} 
      />

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
              <Animated.Image 
                source={require('./assets/victory_chest.png')}
                style={[styles.victoryChest3D, {
                  transform: [
                    { translateY: chestFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] }) },
                    { scale: chestFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }
                  ]
                }]}
                resizeMode="contain"
              />
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
                  style={[styles.victoryBtn, styles.victoryBtnNext]}
                >
                  <Text style={styles.victoryBtnText}>⚔️ IR AL SIGUIENTE MUNDO</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleClaimVictory('shop')}
                style={[styles.victoryBtn, styles.victoryBtnShop]}
              >
                <Text style={styles.victoryBtnText}>🛒 IR A LA TIENDA</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleClaimVictory('map')}
                style={[styles.victoryBtn, styles.victoryBtnMap]}
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
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents="none">
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
  
  // ==============================
  // GLOBAL HEADER (Glassmorphism)
  // ==============================
  globalHeaderContainer: {
    backgroundColor: 'rgba(10, 10, 20, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowRadius: 20, shadowOpacity: 0.3, elevation: 15,
    zIndex: 100,
    width: '100%',
  },
  globalHeaderInner: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 16 },
  
  // Profile
  playerProfileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 25, padding: 6, paddingRight: 16, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.4)', flex: 1, shadowColor: '#3b82f6', shadowRadius: 10, shadowOpacity: 0.2 },
  playerAvatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(30,41,59,0.8)', alignItems: 'center', justifyContent: 'center', marginRight: 10, borderWidth: 2, borderColor: '#60a5fa', shadowColor: '#93c5fd', shadowRadius: 8, shadowOpacity: 0.5 },
  playerAvatarEmoji: { fontSize: 22 },
  playerInfoBox: { justifyContent: 'center' },
  playerName: { color: '#f8fafc', fontSize: 13, fontWeight: '900', fontFamily: FONT_HUD, letterSpacing: 0.5 },
  xpRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  playerLevelLabel: { color: '#fbbf24', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD, marginRight: 6 },
  xpBarTrack: { width: 45, height: 5, backgroundColor: '#1e293b', borderRadius: 2.5, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2.5 },
  
  // Center Title
  headerCenterBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCenterText: { color: '#fbbf24', fontSize: 12, fontWeight: '900', fontFamily: FONT_HUD, letterSpacing: 1, textAlign: 'center', textShadowColor: 'rgba(251,191,36,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  // Economy
  headerTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' },
  settingsBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  settingsBtnText: { fontSize: 18 },
  goldPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(217, 119, 6, 0.15)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(251, 191, 36, 0.6)', shadowColor: '#fbbf24', shadowRadius: 8, shadowOpacity: 0.3 },
  goldPillIcon: { fontSize: 16, marginRight: 6 },
  goldPillText: { color: '#fde047', fontSize: 15, fontWeight: '900', fontFamily: FONT_HUD },

  // Nav Segments
  segmentedNavWrapper: { paddingHorizontal: 16, paddingBottom: 16 },
  segmentedNav: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  navSegment: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  navSegmentActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  navSegmentText: { color: '#64748b', fontSize: 12, fontWeight: '800', fontFamily: FONT_HUD, letterSpacing: 0.5 },
  navSegmentTextActive: { color: '#fff', textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  selectionScroll: { paddingHorizontal: 16, paddingBottom: 40 },
  selectionInstructions: { color: '#64748b', fontSize: 11, fontFamily: FONT_UI, textAlign: 'center', marginVertical: 16, lineHeight: 16 },

  // Mapa en camino RPG
  mapPathContainer: {
    position: 'relative',
    paddingVertical: 30,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    paddingHorizontal: 10,
  },
  mapConnectorLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 6,
    marginLeft: -3,
    backgroundColor: 'rgba(168,85,247,0.5)',
    borderRadius: 3,
    borderColor: 'rgba(251,191,36,0.3)',
    borderWidth: 1,
    zIndex: 1,
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 0.8,
  },
  mapNodeWrapper: {
    width: '45%', // Narrower so they stay on their half of the screen
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
    zIndex: 5,
  },
  nodeHorizontalConnector: {
    position: 'absolute',
    top: 30, // middle of the 64px node
    width: 35,
    height: 4,
    zIndex: -1,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 5,
    shadowOpacity: 0.5,
  },
  mapNodeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    shadowOpacity: 0.9,
    elevation: 10,
    marginBottom: 8,
  },
  mapNodeCurrent: {
    backgroundColor: 'rgba(30, 20, 10, 0.95)',
    borderWidth: 4,
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowRadius: 20,
    transform: [{ scale: 1.15 }],
  },
  mapNodePing: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 2, borderColor: '#fbbf24', opacity: 0.5,
  },
  mapNodeEmoji: { fontSize: 28 },
  mapNodeLabelBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mapNodeLabel: { color: '#f1f5f9', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD, textAlign: 'center' },

  // World Selected Modal
  worldModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  worldModalCard: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: 'rgba(12, 12, 20, 0.98)',
    borderRadius: 20,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    shadowOpacity: 0.8,
    elevation: 20,
  },
  worldModalCloseBtn: { position: 'absolute', top: 12, right: 16, padding: 8 },
  worldModalCloseText: { color: '#64748b', fontSize: 18, fontWeight: 'bold', fontFamily: FONT_UI },
  worldModalHeader: { alignItems: 'center', marginBottom: 12, marginTop: 10 },
  worldModalEmoji: { fontSize: 48, marginBottom: 8 },
  worldModalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', fontFamily: FONT_TITLE, textAlign: 'center', letterSpacing: 1 },
  worldModalDivider: { width: '80%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  worldModalBody: { alignItems: 'center', marginBottom: 24 },
  worldModalBossTitle: { color: '#94a3b8', fontSize: 10, fontFamily: FONT_HUD, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' },
  worldModalBossName: { color: '#f87171', fontSize: 16, fontWeight: 'bold', fontFamily: FONT_TITLE, marginBottom: 6 },
  worldModalBossHp: { color: '#e2e8f0', fontSize: 12, fontFamily: FONT_HUD, fontWeight: 'bold' },
  worldModalPlayBtn: {
    width: '100%',
    backgroundColor: '#d97706',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderBottomWidth: 4,
    borderBottomColor: '#b45309',
    alignItems: 'center',
  },
  worldModalPlayText: { color: '#fff', fontSize: 13, fontWeight: '900', fontFamily: FONT_HUD, letterSpacing: 2 },
  worldCardJefe: { color: '#f87171', fontSize: 10.5, fontWeight: 'bold', fontFamily: FONT_UI },
  worldCardHp: { color: '#64748b', fontSize: 9.5, fontFamily: FONT_HUD },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  lockText: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: FONT_HUD },

  // Tienda
  shopScroll: { paddingHorizontal: 12, paddingBottom: 40 },
  shopGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  shopItemCard: {
    width: '48%',
    backgroundColor: 'rgba(15, 23, 42, 0.65)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)', padding: 10,
    shadowColor: '#38bdf8', shadowOffset: { width: 0, height: 0 }, shadowRadius: 12, shadowOpacity: 0.2,
  },
  shopItemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  shopItemEmoji: { fontSize: 18, marginRight: 6 },
  shopItemName: { color: '#f1f5f9', fontSize: 12, fontWeight: 'bold', fontFamily: FONT_TITLE, flex: 1 },
  shopCardImage: { width: '100%', height: 60, borderRadius: 6, marginBottom: 8 },
  shopItemDesc: { color: '#64748b', fontSize: 9, fontFamily: FONT_UI, marginBottom: 8, lineHeight: 12 },
  shopItemType: { fontSize: 8, fontWeight: 'bold', fontFamily: FONT_HUD, marginBottom: 10 },
  shopBuyBtn: { backgroundColor: '#fbbf24', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  shopBuyBtnText: { color: '#000', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 9, letterSpacing: 1 },
  shopBoughtBadge: { backgroundColor: '#1e293b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  shopBoughtText: { color: '#64748b', fontWeight: 'bold', fontFamily: FONT_HUD, fontSize: 9 },

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
  // Rediseño HUD Vertical
  // Rediseño HUD Vertical
  bossHudSection: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 30,
    paddingBottom: 2,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  playerBottomArea: {
    paddingBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
    flexShrink: 0,
    // Eliminado minHeight: 180 para permitir que el tablero se expanda
  },
  playerHudSection: {
    paddingHorizontal: 16,
    paddingBottom: 5,
  },
  combatInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2, // Reducido para ahorrar espacio
  },

  avatarHorizontalContainer: {
    backgroundColor: 'rgba(15,20,30,0.7)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 6, // Reducido para ahorrar espacio
  },
  avatarFrameHorizontal: {
    width: 44, height: 44, borderRadius: 22, // Ligeramente más pequeño
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.3)',
  },
  avatarInfoHorizontal: {
    flex: 1, justifyContent: 'center',
  },
  avatarNameHorizontal: {
    color: '#e2e8f0', fontSize: 13, fontWeight: 'bold', marginBottom: 2, letterSpacing: 0.5,
  },
  statsRowHorizontal: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 2,
  },
  barBgHorizontal: {
    height: 6, backgroundColor: '#1e293b', borderRadius: 4, overflow: 'hidden', width: '100%',
  },

  boardScene: {
    flex: 1,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  boardWrapper: {
    width: '100%',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.5,
    elevation: 10,
  },

  handSection: { paddingHorizontal: 16, paddingBottom: 5 },
  handHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  handTitle: { color: '#94a3b8', fontSize: 9, fontFamily: FONT_HUD, letterSpacing: 1 },
  endTurnBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#334155', elevation: 4,
  },
  endTurnText: { color: '#94a3b8', fontSize: 9, fontWeight: 'bold', fontFamily: FONT_HUD, letterSpacing: 1 },

  cardsScroll: { paddingRight: 16, paddingTop: 5, overflow: 'visible' },
  cardContainer: {
    width: 90,
    height: 125, // Reducido para ahorrar espacio vertical
    backgroundColor: 'rgba(10,15,30,0.88)',
    borderRadius: 12, padding: 5, marginRight: 8,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden', elevation: 7,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, shadowOpacity: 0.5,
  },
  cardContainerDisabled: { opacity: 0.4 },
  cardReady: {
    borderColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.9,
    shadowRadius: 18, elevation: 14, borderWidth: 2,
  },
  cardSelected: {
    borderColor: '#a855f7',
    borderWidth: 2,
    transform: [{ translateY: -15 }, { scale: 1.05 }],
    zIndex: 100,
  },
  cardManaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  manaPip: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  manaPipText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  cardImage: { height: 50, borderRadius: 6, marginBottom: 6, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardImagePlaceholder: { height: 50, backgroundColor: '#0f172a', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  shopCardImage: { height: 100, borderRadius: 10, marginBottom: 10, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  deckCardImage: { height: 80, borderRadius: 8, marginBottom: 8, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardEmoji: { fontSize: 30 },
  cardChargeBarBg: { height: 4, backgroundColor: '#1e293b', borderRadius: 2, marginBottom: 4 },
  cardChargeBarFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 2 },
  chargeText: { color: '#64748b', fontSize: 8, fontFamily: FONT_HUD, textAlign: 'right', marginBottom: 2 },
  cardInfo: { flex: 1, justifyContent: 'flex-start' },
  cardName: { color: '#f1f5f9', fontSize: 10, fontWeight: 'bold', marginBottom: 2, fontFamily: FONT_UI },
  cardType: { fontSize: 8, fontWeight: 'bold', fontFamily: FONT_HUD, marginBottom: 2 },
  cardDesc: { color: '#64748b', fontSize: 8, lineHeight: 11, fontFamily: FONT_UI },

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
    width: '94%',
    backgroundColor: 'rgba(10, 12, 25, 0.96)',
    borderRadius: 24,
    borderWidth: 2,
    borderTopWidth: 1,
    borderBottomWidth: 4,
    borderColor: 'rgba(251,191,36,0.6)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 40,
    shadowOpacity: 0.9,
    elevation: 25,
  },
  victoryChest3D: {
    width: 100, height: 100, alignSelf: 'center', marginBottom: 12,
    shadowColor: '#fbbf24', shadowOffset: { width: 0, height: 15 }, shadowRadius: 30, shadowOpacity: 0.9, elevation: 20
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
  victoryBtnsCol: { width: '100%', gap: 12 },
  victoryBtn: {
    width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderTopWidth: 1, borderBottomWidth: 5, borderLeftWidth: 1, borderRightWidth: 1,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, shadowOpacity: 0.6,
  },
  victoryBtnNext: { backgroundColor: '#d97706', borderColor: '#b45309', borderTopColor: '#fcd34d' },
  victoryBtnShop: { backgroundColor: '#8b5cf6', borderColor: '#6d28d9', borderTopColor: '#c4b5fd' },
  victoryBtnMap: { backgroundColor: '#374151', borderColor: '#1f2937', borderTopColor: '#6b7280' },
  victoryBtnText: { color: '#fff', fontFamily: FONT_HUD, fontSize: 13, fontWeight: '900', letterSpacing: 2 },

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
  bossIntentContainer: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
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

export default function App() {
  const [customAlert, setCustomAlert] = useState(null);
  globalThis.setCustomAlert = setCustomAlert;

  return (
    <View style={{ flex: 1 }}>
      <GameApp />
      <CustomAlertModal 
        visible={!!customAlert} 
        message={customAlert?.message} 
        onConfirm={() => setCustomAlert(null)} 
      />
    </View>
  );
}

