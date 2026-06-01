/**
 * src/components/plant-detail/JournalEntryRow.tsx — Phase 21 (JOURNAL-04) real impl.
 *
 * Renders a single timeline row:
 *   date header ("Hoy" / "Ayer" / "Hace N días" / locale date)
 *   + optional careTag chip
 *   + optional 80x80 photo thumbnail
 *   + optional text body
 *
 * Long-press → native Alert.alert confirm → deleteJournalPhoto (best-effort) + onDelete(entryId).
 *
 * 2026-06-01 — dropped the gorhom BottomSheetModal intermediate step. Same iOS z-order
 * root cause as the JournalQuickAddSheet fix (4b8f7ab): a gorhom BottomSheetModal portals
 * to the App root, which iOS keeps BELOW the active RN <Modal> (MyPlantDetailModal), so
 * long-press appeared to do nothing. A single destructive action only needs the native
 * confirm Alert, which always renders on top — no intermediate sheet required.
 *
 * i18n: bare t() calls only — Wave 0 ships ALL keys (Blocker 4 enforced).
 * Theme tokens: colors / spacing / borderRadius / fonts from ../../theme.
 */
import React from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { deleteJournalPhoto } from '../../services/journalService';
import { colors, spacing, borderRadius, fonts } from '../../theme';
import type { JournalEntry } from '../../types';

interface JournalEntryRowProps {
  entry: JournalEntry;
  plantId: string;
  onDelete: (entryId: string) => void;
}

/**
 * Relative date label per RESEARCH Pattern 7. No new dependency — just `new Date()` math.
 *   diff = 0  → "Hoy"
 *   diff = 1  → "Ayer"
 *   2..7      → "Hace N días"
 *   > 7       → locale date string
 */
function getRelativeDateLabel(dateISO: string, t: TFunction): string {
  const entryDate = new Date(dateISO + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return t('journal.dateLabel.today');
  if (diffDays === 1) return t('journal.dateLabel.yesterday');
  if (diffDays >= 2 && diffDays <= 7) return t('journal.dateLabel.daysAgo', { count: diffDays });
  return entryDate.toLocaleDateString();
}

export default function JournalEntryRow({
  entry,
  plantId,
  onDelete,
}: JournalEntryRowProps): React.ReactElement {
  const { t } = useTranslation();

  const dateLabel = getRelativeDateLabel(entry.date, t);
  const careTagLabel = entry.careTag ? t(`journal.careTag.${entry.careTag}`) : null;

  const handleLongPress = () => {
    Alert.alert(
      t('journal.deleteEntry'),
      t('journal.deleteConfirm'),
      [
        { text: t('journal.cancel'), style: 'cancel' },
        {
          text: t('journal.delete'),
          style: 'destructive',
          onPress: async () => {
            if (entry.photoUri) {
              // Best-effort photo cleanup — failure does NOT block state mutation (mirrors
              // Plan 21-03 deleteJournalDirectory fail-fast policy).
              try {
                await deleteJournalPhoto(plantId, entry.id);
              } catch {
                /* silent */
              }
            }
            onDelete(entry.id);
          },
        },
      ]
    );
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={300}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={dateLabel}
    >
      <View style={styles.headerRow}>
        <Text style={styles.dateLabel}>{dateLabel}</Text>
        {careTagLabel ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{careTagLabel}</Text>
          </View>
        ) : null}
      </View>
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.thumbnail} resizeMode="cover" />
      ) : null}
      {entry.text ? <Text style={styles.body}>{entry.text}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.03)', // mirrors EducationalSection nested-card pattern
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardPressed: {
    // While the long-press is held, highlight which entry is about to be deleted.
    backgroundColor: 'rgba(91,154,106,0.12)', // colors.green tint
    borderColor: colors.green,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.md,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textPrimary,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
