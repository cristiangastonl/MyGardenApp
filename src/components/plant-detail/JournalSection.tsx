/**
 * src/components/plant-detail/JournalSection.tsx — Phase 21 (JOURNAL-04) skeleton.
 * Real impl in Plan 21-04: collapsible (EducationalSection composition) + FlatList timeline +
 * empty-state CTA + "+ Nueva entrada" header button.
 */
import React from 'react';
import { View } from 'react-native';
import type { JournalEntry } from '../../types';

interface JournalSectionProps {
  plantId: string;
  entries: JournalEntry[];
  onAddEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export default function JournalSection(props: JournalSectionProps): React.ReactElement {
  void props;
  return <View />;
}
