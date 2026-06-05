import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';

/**
 * Componente que representa una carta estilo TCG Premium al estilo Magic Puzzle Quest.
 * Hechizos convertidos en unidades míticas con estética de colección y bordes de oro viejo.
 */
export default function CardComponent({ card, isEnabled, onPress }) {
  if (!card) return null;

  const glowAnim = useRef(new Animated.Value(1)).current;

  // Animación de parpadeo suave para cartas listas para castear
  useEffect(() => {
    let animation;
    if (isEnabled) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      glowAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isEnabled, glowAnim]);

  // Selección de Ilustración / Gradiente temático según el nombre de la unidad mítica
  const renderIllustration = () => {
    let themeBg = styles.illuDefault;
    let icon = '🔮';

    if (card.name.includes('Dragón')) {
      themeBg = styles.illuDragon;
      icon = '🐉'; // Dragón Mítico
    } else if (card.name.includes('Grifo')) {
      themeBg = styles.illuGriffin;
      icon = '🦅'; // Grifo (Alas/Águila)
    } else if (card.name.includes('Gólem')) {
      themeBg = styles.illuGolem;
      icon = '🗿'; // Gólem (Piedra/Obsidiana)
    } else if (card.name.includes('Caballero')) {
      themeBg = styles.illuKnight;
      icon = '🛡️'; // Caballero (Escudo/Espada)
    }

    return (
      <View style={[styles.illustrationContainer, themeBg]}>
        <Text style={styles.illuIcon}>{icon}</Text>
        
        {/* Barra de progreso de carga neón en la base de la ilustración */}
        {card.charge !== undefined && card.totalCost !== undefined && (
          <View style={styles.progressOverlay}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${Math.min(100, (card.charge / card.totalCost) * 100)}%`,
                    backgroundColor: isEnabled ? '#22c55e' : '#fbbf24', // Verde listo / Amarillo neón cargando
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              MANÁ: {card.charge}/{card.totalCost}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getTypeStyle = () => {
    switch (card.type) {
      case 'Ataque': return styles.typeAttack;
      case 'Defensa': return styles.typeDefense;
      case 'Hechizo': return styles.typeSpell;
      default: return styles.typeDefault;
    }
  };

  const isReady = card.charge >= card.totalCost;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        styles.cardGoldBorder, // Estética de colección: Borde de oro viejo
        isEnabled && {
          borderColor: '#22c55e',
          shadowColor: '#22c55e',
          shadowOpacity: 0.85,
          shadowRadius: 14,
          elevation: 12,
          opacity: glowAnim,
        },
        !isEnabled && isReady && styles.cardReadyWait, // Lista esperando turno
        !isEnabled && !isReady && styles.cardCharging, // Cargando
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={!isEnabled}
        onPress={onPress}
        style={styles.cardContainer}
      >
        {/* Ilustración temática de la criatura */}
        {renderIllustration()}

        {/* Detalles de la unidad mítica */}
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={[styles.cardType, getTypeStyle()]}>
              {card.type.toUpperCase()}
            </Text>
          </View>

          {/* Estadísticas / Efecto de Combate */}
          <View style={styles.effectRow}>
            <Text style={styles.effectLabel}>ESTADÍSTICAS:</Text>
            <Text style={styles.effectValue}>
              {card.type === 'Defensa' ? '🛡️ ARMADURA' : '⚔️ ATAQUE'} +{card.effectValue}
            </Text>
          </View>

          {/* Descripción Lore de la Unidad */}
          <Text style={styles.description}>{card.description}</Text>

          {/* Adorno visual inferior */}
          <View style={[styles.decoLine, isEnabled ? styles.decoLineEnabled : styles.decoLineDisabled]} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: 210,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#09080d',
    overflow: 'hidden',
    marginVertical: 6,
  },
  cardGoldBorder: {
    borderColor: 'rgba(217, 119, 6, 0.4)', // Borde de oro viejo medieval
  },
  cardReadyWait: {
    borderColor: 'rgba(34, 197, 94, 0.4)',
    opacity: 0.9,
  },
  cardCharging: {
    borderColor: 'rgba(217, 119, 6, 0.25)', // Borde de colección atenuado
    opacity: 0.8,
  },
  cardContainer: {
    width: '100%',
  },
  illustrationContainer: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  illuIcon: {
    fontSize: 42,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  // Fondos degradados temáticos míticos
  illuDragon: {
    backgroundColor: '#7f1d1d', // Carmesí profundo / Dragón
  },
  illuGriffin: {
    backgroundColor: '#78350f', // Dorado/Ámbar oscuro / Grifo
  },
  illuGolem: {
    backgroundColor: '#3b0764', // Morado oscuro/Obsidiana / Gólem
  },
  illuKnight: {
    backgroundColor: '#064e3b', // Verde bosque / Caballero
  },
  illuDefault: {
    backgroundColor: '#1c1917',
  },
  progressOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 8.5,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: {
    padding: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    color: '#f8fafc',
    fontSize: 12.5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cardType: {
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  typeAttack: {
    color: '#ef4444',
  },
  typeDefense: {
    color: '#38bdf8',
  },
  typeSpell: {
    color: '#a78bfa',
  },
  typeDefault: {
    color: '#94a3b8',
  },
  effectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderRadius: 6,
    padding: 5,
    marginBottom: 8,
  },
  effectLabel: {
    color: '#64748b',
    fontSize: 8,
    fontFamily: 'monospace',
  },
  effectValue: {
    color: '#fbbf24', // Dorado estadistica
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  description: {
    color: '#cbd5e1',
    fontSize: 10,
    lineHeight: 14,
    minHeight: 42,
  },
  decoLine: {
    height: 2.5,
    width: 45,
    marginTop: 10,
    borderRadius: 99,
  },
  decoLineEnabled: {
    backgroundColor: '#22c55e',
  },
  decoLineDisabled: {
    backgroundColor: '#27272a',
  },
});
