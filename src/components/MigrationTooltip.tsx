import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';

const TOOLTIP_SEEN_KEY = 'migration-tooltip-seen-v1.1';

interface MigrationTooltipProps {
  plantId: string;
  onDismiss?: () => void;
}

type SeenMap = Record<string, true>;

/**
 * One-time per-plant tooltip shown the first time a v1.0-migrated plant is opened
 * in MyPlantDetailModal. Implements UX-01.
 *
 * Storage: separate AsyncStorage key (NOT in AppData) for clean v1.2 cleanup —
 * pairs with cleanupBackup_v1_1() to drop both transient v1.1 state at once.
 *
 * Pattern: absolute-positioned overlay with tap-anywhere-to-dismiss backdrop —
 * NOT a modal component (avoids project-wide modal-stacking bug; see CLAUDE.md
 * + 04-RESEARCH.md Pitfall 4).
 *
 * Lifecycle:
 *  1. Mount → read seen map → if seen[plantId] then state='hidden', render null
 *  2. Otherwise state='visible' → render overlay card
 *  3. User taps backdrop OR "Got it" button → write seen[plantId]=true, call onDismiss
 *  4. AsyncStorage write failure is swallowed (tooltip will reappear on next open;
 *     acceptable per CONTEXT.md "no degraded mode on storage failures")
 */
export function MigrationTooltip({ plantId, onDismiss }: MigrationTooltipProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<'loading' | 'visible' | 'hidden'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TOOLTIP_SEEN_KEY);
        const seen: SeenMap = raw ? JSON.parse(raw) : {};
        if (cancelled) return;
        setState(seen[plantId] ? 'hidden' : 'visible');
      } catch {
        if (!cancelled) setState('hidden'); // fail silent — never block UX
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plantId]);

  const dismiss = async () => {
    setState('hidden');
    try {
      const raw = await AsyncStorage.getItem(TOOLTIP_SEEN_KEY);
      const seen: SeenMap = raw ? JSON.parse(raw) : {};
      seen[plantId] = true;
      await AsyncStorage.setItem(TOOLTIP_SEEN_KEY, JSON.stringify(seen));
    } catch {
      // Silent — tooltip will reappear on next open if write fails; acceptable
    }
    onDismiss?.();
  };

  if (state !== 'visible') return null;

  return (
    <View style={styles.overlayWrap} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={dismiss}
        accessibilityLabel={t('migration.tooltip.cta')}
      />
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.body}>{t('migration.tooltip.body')}</Text>
        <TouchableOpacity onPress={dismiss} style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>{t('migration.tooltip.cta')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  card: {
    marginTop: spacing.xxxl * 2,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  cta: {
    alignSelf: 'flex-end',
    backgroundColor: colors.green,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
