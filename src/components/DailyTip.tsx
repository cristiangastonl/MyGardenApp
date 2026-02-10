import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, fonts, borderRadius, shadows } from '../theme';
import { Plant, Location, WeatherData } from '../types';
import { TipContext, CareTip } from '../data/careTips';
import { getCurrentSeason, selectRandomTip } from '../utils/tipSelector';
import { formatDate } from '../utils/dates';

const SEEN_TIPS_KEY = 'daily-tips-seen';

interface DailyTipProps {
  plants: Plant[];
  location: Location | null;
  weather: WeatherData | null;
}

interface SeenTipsData {
  date: string;
  tipIds: string[];
}

export function DailyTip({ plants, location, weather }: DailyTipProps) {
  const [currentTip, setCurrentTip] = useState<CareTip | null>(null);
  const [seenTipIds, setSeenTipIds] = useState<string[]>([]);
  const [fadeAnim] = useState(new Animated.Value(1));

  const todayStr = formatDate(new Date());

  // Construir el contexto para evaluar tips
  const buildContext = useCallback((): TipContext => {
    const season = getCurrentSeason(location?.lat ?? null);
    return {
      season,
      weather,
      plants,
      location,
    };
  }, [plants, location, weather]);

  // Cargar tips vistos de AsyncStorage
  useEffect(() => {
    const loadSeenTips = async () => {
      try {
        const stored = await AsyncStorage.getItem(SEEN_TIPS_KEY);
        if (stored) {
          const data: SeenTipsData = JSON.parse(stored);
          // Solo mantener tips vistos si es el mismo dia
          if (data.date === todayStr) {
            setSeenTipIds(data.tipIds);
          } else {
            // Nuevo dia, reiniciar
            setSeenTipIds([]);
            await AsyncStorage.setItem(
              SEEN_TIPS_KEY,
              JSON.stringify({ date: todayStr, tipIds: [] })
            );
          }
        }
      } catch (e) {
        console.error('Error loading seen tips:', e);
      }
    };

    loadSeenTips();
  }, [todayStr]);

  // Seleccionar tip inicial
  useEffect(() => {
    if (currentTip === null) {
      const context = buildContext();
      const tip = selectRandomTip(context, seenTipIds);
      if (tip) {
        setCurrentTip(tip);
        // Marcar como visto
        markTipAsSeen(tip.id);
      }
    }
  }, [seenTipIds, currentTip, buildContext]);

  // Marcar un tip como visto
  const markTipAsSeen = async (tipId: string) => {
    const newSeenIds = [...seenTipIds, tipId];
    setSeenTipIds(newSeenIds);
    try {
      await AsyncStorage.setItem(
        SEEN_TIPS_KEY,
        JSON.stringify({ date: todayStr, tipIds: newSeenIds })
      );
    } catch (e) {
      console.error('Error saving seen tips:', e);
    }
  };

  // Mostrar otro tip
  const handleNextTip = () => {
    // Animar fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Seleccionar nuevo tip
      const context = buildContext();
      const tip = selectRandomTip(context, seenTipIds);
      if (tip) {
        setCurrentTip(tip);
        markTipAsSeen(tip.id);
      }
      // Animar fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  if (!currentTip) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentTip.icon}</Text>
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>CONSEJO DEL DIA</Text>
            <Text style={styles.categoryBadge}>
              {getCategoryLabel(currentTip.category)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{currentTip.title}</Text>
        <Text style={styles.message}>{currentTip.message}</Text>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextTip}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>Otro consejo</Text>
          <Text style={styles.nextButtonIcon}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case 'seasonal':
      return 'Estacional';
    case 'weather':
      return 'Clima';
    case 'care':
      return 'Cuidado';
    case 'general':
      return 'General';
    default:
      return '';
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#f0f7f0',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#d4e8d4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  icon: {
    fontSize: 24,
  },
  labelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.green,
    textTransform: 'uppercase',
  },
  categoryBadge: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  nextButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.green,
    marginRight: spacing.xs,
  },
  nextButtonIcon: {
    fontSize: 14,
    color: colors.green,
  },
});
