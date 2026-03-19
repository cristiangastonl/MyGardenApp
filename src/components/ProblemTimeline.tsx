import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from '../theme';
import { ProblemEntry } from '../types';
import { TRACKING_STATUS_CONFIG } from '../services/problemTrackingService';

interface ProblemTimelineProps {
  entries: ProblemEntry[];
  plantIcon: string;
}

interface EntryRowProps {
  entry: ProblemEntry;
  plantIcon: string;
  isLast: boolean;
}

function EntryRow({ entry, plantIcon, isLast }: EntryRowProps) {
  const { t } = useTranslation();
  const [photoError, setPhotoError] = useState(false);

  const showPhoto = entry.photoUri && !photoError;

  return (
    <View style={styles.entryRow}>
      {/* Timeline line + dot */}
      <View style={styles.timelineColumn}>
        <View style={styles.dot} />
        {!isLast && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.entryContent}>
        {/* Date */}
        <Text style={styles.dateText}>
          {new Date(entry.date).toLocaleDateString()}
        </Text>

        {/* Status change badge */}
        {entry.statusChange && (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  TRACKING_STATUS_CONFIG[entry.statusChange].color + '26',
              },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: TRACKING_STATUS_CONFIG[entry.statusChange].color }]}>
              {TRACKING_STATUS_CONFIG[entry.statusChange].emoji}{' '}
              {t(TRACKING_STATUS_CONFIG[entry.statusChange].labelKey)}
            </Text>
          </View>
        )}

        {/* AI notes */}
        {entry.aiNotes ? (
          <Text style={styles.aiNotes} numberOfLines={3}>
            {entry.aiNotes}
          </Text>
        ) : null}

        {/* Photo or placeholder */}
        {showPhoto ? (
          <Image
            source={{ uri: entry.photoUri! }}
            style={styles.photo}
            resizeMode="cover"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoPlaceholderIcon}>{plantIcon}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function ProblemTimeline({ entries, plantIcon }: ProblemTimelineProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{plantIcon}</Text>
        <Text style={styles.emptyText}>
          {t('diagnosis.tracking.noEntriesYet')}
        </Text>
      </View>
    );
  }

  // Sort newest first
  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <View style={styles.timeline}>
      {sorted.map((entry, index) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          plantIcon={plantIcon}
          isLast={index === sorted.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    paddingTop: spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
    marginBottom: 4,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: colors.border,
    marginTop: 2,
    minHeight: 24,
  },
  entryContent: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.sm,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  statusBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
  },
  aiNotes: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  photoPlaceholderIcon: {
    fontSize: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
