import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors, spacing, fonts, borderRadius, shadows } from '../theme';
import { Plant, Location, WeatherData } from '../types';
import { TipContext, CareTip, getTranslatedTip } from '../data/careTips';
import { getCurrentSeason, selectRandomTip } from '../utils/tipSelector';
import { formatDate } from '../utils/dates';
import { usePremium } from '../hooks/usePremium';
import { usePremiumGate } from '../config/premium';
import { useStorage } from '../hooks/useStorage';

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
  const { t } = useTranslation();
  const { isPremium, showPaywall } = usePremium();
  const premium = usePremiumGate();
  const { installDate } = useStorage();
  const [currentTip, setCurrentTip] = useState<CareTip | null>(null);
  const [seenTipIds, setSeenTipIds] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    // Check if user can see more tips (considers first-week trial)
    if (!premium.canSeeTips(seenTipIds.length, installDate)) {
      showPaywall('daily_tip');
      return;
    }

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

  const translatedTip = getTranslatedTip(currentTip);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{currentTip.icon}</Text>
          </View>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{t('dailyTip.label')}</Text>
            <Text style={styles.categoryBadge}>
              {getCategoryLabel(currentTip.category, t)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{translatedTip.title}</Text>
        <Text style={styles.message}>{translatedTip.message}</Text>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNextTip}
          activeOpacity={0.7}
        >
          <Text style={styles.nextButtonText}>{t('dailyTip.nextTip')}</Text>
          {!premium.canSeeTips(seenTipIds.length + 1, installDate) && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
          <Text style={styles.nextButtonIcon}>→</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function getCategoryLabel(category: string, t: (key: string) => string): string {
  switch (category) {
    case 'seasonal':
      return t('dailyTip.seasonal');
    case 'weather':
      return t('dailyTip.weather');
    case 'care':
      return t('dailyTip.care');
    case 'general':
      return t('dailyTip.general');
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
    backgroundColor: colors.successBg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.successBorder,
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 44,
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
  proBadge: {
    backgroundColor: colors.premiumDark,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  proBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 8,
    color: colors.white,
    letterSpacing: 0.5,
  },
});
