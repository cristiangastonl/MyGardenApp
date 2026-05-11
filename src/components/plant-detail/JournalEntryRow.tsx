/**
 * src/components/plant-detail/JournalEntryRow.tsx — Phase 21 (JOURNAL-04) real impl.
 *
 * Renders a single timeline row:
 *   date header ("Hoy" / "Ayer" / "Hace N días" / locale date)
 *   + optional careTag chip
 *   + optional 80x80 photo thumbnail
 *   + optional text body
 *
 * Long-press → BottomSheetModal with "Eliminar entrada" option → Alert.alert confirm
 * → deleteJournalPhoto (best-effort) + onDelete(entryId).
 *
 * i18n: bare t() calls only — Wave 0 ships ALL keys (Blocker 4 enforced).
 * Theme tokens: colors / spacing / borderRadius / fonts from ../../theme.
 */
import React, { useRef } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useDismissOnPaywall } from '../../hooks/useDismissOnPaywall';
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
  const deleteSheetRef = useRef<BottomSheetModal>(null);
  useDismissOnPaywall(deleteSheetRef); // Pitfall 10 — paywall z-order safety.

  const dateLabel = getRelativeDateLabel(entry.date, t);
  const careTagLabel = entry.careTag ? t(`journal.careTag.${entry.careTag}`) : null;

  const handleConfirmDelete = () => {
    deleteSheetRef.current?.dismiss();
    Alert.alert(
      t('journal.deleteConfirm'),
      '',
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
      onLongPress={() => deleteSheetRef.current?.present()}
      style={styles.card}
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

      {/* Long-press → delete sheet. Sibling of the Pressable card for portal mount. */}
      <BottomSheetModal
        ref={deleteSheetRef}
        snapPoints={['25%']}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
      >
        <BottomSheetView style={styles.sheet}>
          <TouchableOpacity onPress={handleConfirmDelete} style={styles.sheetItem}>
            <Text style={styles.sheetItemDestructive}>{t('journal.deleteEntry')}</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheetModal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(0,0,0,0.03)', // mirrors EducationalSection nested-card pattern
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
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
  sheet: {
    padding: spacing.lg,
  },
  sheetItem: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  sheetItemDestructive: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.dangerText,
  },
});
