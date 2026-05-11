/**
 * src/components/plant-detail/JournalEntryRow.tsx — Phase 21 (JOURNAL-04) skeleton.
 * Real impl in Plan 21-04: date header ("Hoy"/"Ayer"/"Hace N días") + careTag chip
 * + 80x80 photo thumbnail + text body + long-press → BottomSheetModal delete option.
 */
import React from 'react';
import { View } from 'react-native';
import type { JournalEntry } from '../../types';

interface JournalEntryRowProps {
  entry: JournalEntry;
  plantId: string;
  onDelete: (entryId: string) => void;
}

export default function JournalEntryRow(props: JournalEntryRowProps): React.ReactElement {
  void props;
  return <View />;
}
