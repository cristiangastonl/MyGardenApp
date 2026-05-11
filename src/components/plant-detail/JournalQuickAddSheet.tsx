/**
 * src/components/plant-detail/JournalQuickAddSheet.tsx — Phase 21 (JOURNAL-04) skeleton.
 * Real impl in Plan 21-04: BottomSheetModal with snapPoints=['60%'], text input,
 * Cámara/Galería buttons, 6 careTag chips, Guardar/Cancelar footer.
 */
import React from 'react';
import { View } from 'react-native';
import type { CareTag, JournalEntry } from '../../types';

interface JournalQuickAddSheetProps {
  plantId: string;
  visible: boolean;
  onDismiss: () => void;
  onSave: (entry: JournalEntry) => void;
}

export default function JournalQuickAddSheet(props: JournalQuickAddSheetProps): React.ReactElement {
  void props;
  const _careTag: CareTag | undefined = undefined;
  void _careTag;
  return <View />;
}
