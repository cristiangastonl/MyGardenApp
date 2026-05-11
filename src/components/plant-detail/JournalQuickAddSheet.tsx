/**
 * src/components/plant-detail/JournalQuickAddSheet.tsx — Phase 21 (JOURNAL-04) real impl.
 *
 * BottomSheetModal quick-add UI (60% snap), driven by `visible` prop from parent modal.
 *
 * Form fields (all optional — 2-tap floor permits saving a date-only entry):
 *  - Multiline text input
 *  - 📷 Cámara + 🖼️ Galería buttons (via pickJournalPhoto from journalService)
 *  - 6 careTag chips driven by module-level CARE_TAGS literal array (Warning D)
 *  - Guardar / Cancelar footer
 *
 * Atomic-write order (RESEARCH Pattern 8):
 *   1. Generate entryId via Date.now().toString().
 *   2. If rawPhotoUri present → saveJournalPhoto (try/catch; abort + Alert on failure).
 *   3. Compose JournalEntry → onSave(entry) (parent calls addJournalEntry).
 *   4. Reset form + onDismiss().
 *
 * i18n: bare t() calls only — Blocker 4 enforced (Wave 0 ships all keys).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { useDismissOnPaywall } from '../../hooks/useDismissOnPaywall';
import { pickJournalPhoto, saveJournalPhoto } from '../../services/journalService';
import { colors, spacing, borderRadius, fonts } from '../../theme';
import type { CareTag, JournalEntry } from '../../types';

// Phase 21 (JOURNAL-04, Warning D LOCKED) — explicit literal array for the 6 care-tag chips.
// Listing the tag names verbatim in source (a) makes them grep-able for acceptance criteria,
// (b) drives chip rendering via .map() so adding/removing a tag is a single-line change,
// (c) keeps the literal union (types/index.ts `CareTag`) and the runtime array in lockstep
// via the `as const satisfies readonly CareTag[]` annotation.
const CARE_TAGS = ['riego', 'fertilizar', 'sol', 'poda', 'problema', 'otro'] as const satisfies readonly CareTag[];

interface JournalQuickAddSheetProps {
  plantId: string;
  visible: boolean;
  onDismiss: () => void;
  onSave: (entry: JournalEntry) => void;
}

export default function JournalQuickAddSheet({
  plantId,
  visible,
  onDismiss,
  onSave,
}: JournalQuickAddSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  useDismissOnPaywall(sheetRef); // Pitfall 10 — paywall z-order safety.

  const [text, setText] = useState('');
  const [rawPhotoUri, setRawPhotoUri] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<CareTag | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Drive presentation from `visible` prop — gives the parent modal full control.
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handlePhotoCamera = useCallback(async () => {
    const uri = await pickJournalPhoto('camera');
    if (uri) setRawPhotoUri(uri);
  }, []);

  const handlePhotoGallery = useCallback(async () => {
    const uri = await pickJournalPhoto('gallery');
    if (uri) setRawPhotoUri(uri);
  }, []);

  const resetForm = useCallback(() => {
    setText('');
    setRawPhotoUri(undefined);
    setSelectedTag(undefined);
    setSaving(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    const entryId = Date.now().toString(); // app-wide convention (RESEARCH).
    let savedPhotoUri: string | undefined;
    if (rawPhotoUri) {
      try {
        savedPhotoUri = await saveJournalPhoto(plantId, entryId, rawPhotoUri);
      } catch {
        Alert.alert(t('journal.error.photoSaveFailed'));
        setSaving(false);
        return;
      }
    }
    const entry: JournalEntry = {
      id: entryId,
      date: new Date().toISOString().slice(0, 10), // "YYYY-MM-DD"
      text: text.trim() || undefined,
      photoUri: savedPhotoUri,
      careTag: selectedTag,
    };
    onSave(entry);
    resetForm();
    onDismiss();
  }, [plantId, text, rawPhotoUri, selectedTag, saving, onSave, onDismiss, resetForm, t]);

  const handleCancel = useCallback(() => {
    resetForm();
    onDismiss();
  }, [resetForm, onDismiss]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['60%']}
      enablePanDownToClose
      onDismiss={onDismiss}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
    >
      <BottomSheetView style={styles.content}>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={3}
          placeholder={t('journal.textPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
        />
        <View style={styles.photoRow}>
          <TouchableOpacity onPress={handlePhotoCamera} style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>{t('journal.photoCamera')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePhotoGallery} style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>{t('journal.photoGallery')}</Text>
          </TouchableOpacity>
        </View>
        {rawPhotoUri ? (
          <View style={styles.previewTile}>
            <Image source={{ uri: rawPhotoUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity
              onPress={() => setRawPhotoUri(undefined)}
              style={styles.removeBtn}
              hitSlop={8}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.chipRow}>
          {CARE_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedTag(isSelected ? undefined : tag)}
                style={[styles.chip, isSelected && styles.chipSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {t(`journal.careTag.${tag}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>{t('journal.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{t('journal.save')}</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    minHeight: 80,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  photoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoBtn: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  photoBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  previewTile: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  preview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.sm,
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.md,
  },
  chipSelected: {
    backgroundColor: colors.green,
  },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
  },
  chipTextSelected: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.green,
    borderRadius: borderRadius.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
});
