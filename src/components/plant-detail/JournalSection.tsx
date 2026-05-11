/**
 * src/components/plant-detail/JournalSection.tsx — Phase 21 (JOURNAL-04) real impl.
 *
 * Collapsible Diario section (mirrors EducationalSection composition pattern, NOT a child
 * of it — Diario owns its own header with a trailing "+ Nueva entrada" button).
 *
 * Behavior:
 *  - Default collapsed=false (visible by default — empty-state CTA is the primary entry point).
 *  - 180ms `Easing.out(Easing.cubic)` collapse animation (Phase 14-03 device-tuned timing).
 *  - hasInteracted gate prevents Android height-0 lockout (RESEARCH Pitfall 9).
 *  - FlatList timeline reverse-chronologically sorted by entry.date.
 *  - Empty-state CTA renders both an explanatory string AND a "+ Nueva entrada" button.
 *
 * i18n: bare t() calls only — Wave 0 shipped 22 keys (Blocker 4).
 */
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, fonts, shadows } from '../../theme';
import JournalEntryRow from './JournalEntryRow';
import type { JournalEntry } from '../../types';

// Phase 21 device-tuning lock — mirrors EducationalSection.tsx COLLAPSE_DURATION (180ms).
// 180ms is the iOS / Material "appearing" standard; sits within CONTEXT.md ~250ms guardrail.
const COLLAPSE_DURATION = 180;

interface JournalSectionProps {
  plantId: string;
  entries: JournalEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export default function JournalSection({
  plantId,
  entries,
  onAddEntry,
  onDeleteEntry,
}: JournalSectionProps): React.ReactElement {
  const { t } = useTranslation();
  // Collapsible: default expanded (so users discover the empty-state CTA immediately).
  const [expanded, setExpanded] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const measuredHeight = useSharedValue(0);
  const open = useSharedValue(1);

  const derivedHeight = useDerivedValue(() =>
    withTiming(measuredHeight.value * open.value, {
      duration: COLLAPSE_DURATION,
      easing: Easing.out(Easing.cubic),
    })
  );
  const opacity = useDerivedValue(() =>
    withTiming(open.value, { duration: COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
  );
  const chevronRotation = useDerivedValue(() =>
    withTiming(open.value * 90, { duration: COLLAPSE_DURATION, easing: Easing.out(Easing.cubic) })
  );

  const bodyStyle = useAnimatedStyle(() => ({
    height: derivedHeight.value,
    opacity: opacity.value,
  }));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const toggle = () => {
    if (!hasInteracted) setHasInteracted(true);
    const next = !expanded;
    setExpanded(next);
    open.value = next ? 1 : 0;
  };

  // Reverse-chronological sort — newest first (timestamp lexical sort on ISO YYYY-MM-DD strings).
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={toggle}
          style={styles.titleTap}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={t('journal.header')}
        >
          <Text style={styles.title}>📔 {t('journal.header')}</Text>
          <Animated.Text style={[styles.chevron, chevronStyle]}>›</Animated.Text>
        </Pressable>
        <TouchableOpacity onPress={onAddEntry} style={styles.addBtn} accessibilityRole="button">
          <Text style={styles.addBtnText}>{t('journal.addEntry')}</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        style={[styles.bodyClip, hasInteracted ? bodyStyle : styles.bodyAuto]}
      >
        <View
          style={styles.bodyContent}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) measuredHeight.value = h;
          }}
        >
          <FlatList
            data={sorted}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <JournalEntryRow entry={item} plantId={plantId} onDelete={onDeleteEntry} />
            )}
            scrollEnabled={false} // Modal ScrollView owns vertical scroll; inner list just lays out.
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('journal.emptyState')}</Text>
                <TouchableOpacity onPress={onAddEntry} style={styles.emptyCtaBtn}>
                  <Text style={styles.emptyCtaText}>{t('journal.addEntry')}</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44, // Apple HIG touch target
  },
  titleTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  chevron: {
    fontSize: 22,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  addBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  addBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.green,
  },
  bodyClip: {
    overflow: 'hidden',
  },
  bodyAuto: {
    height: 'auto',
  },
  bodyContent: {
    paddingTop: spacing.md,
  },
  emptyState: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyCtaBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.green,
    borderRadius: borderRadius.md,
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
