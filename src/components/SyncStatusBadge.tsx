import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, spacing, borderRadius } from '../theme';
import { SyncStatus } from '../services/syncService';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  lastSyncedAt: string | null;
  onPress?: () => void;
  compact?: boolean;
}

export function SyncStatusBadge({
  status,
  lastSyncedAt,
  onPress,
  compact = false,
}: SyncStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: null,
          text: 'Sincronizando...',
          color: colors.textSecondary,
          showSpinner: true,
        };
      case 'success':
        return {
          icon: '✓',
          text: 'Sincronizado',
          color: colors.green,
          showSpinner: false,
        };
      case 'error':
        return {
          icon: '!',
          text: 'Error al sincronizar',
          color: colors.dangerText,
          showSpinner: false,
        };
      case 'offline':
        return {
          icon: '○',
          text: 'Sin conexion',
          color: colors.textMuted,
          showSpinner: false,
        };
      default:
        return {
          icon: '☁️',
          text: formatLastSync(lastSyncedAt),
          color: colors.textSecondary,
          showSpinner: false,
        };
    }
  };

  const config = getStatusConfig();

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        disabled={!onPress}
      >
        {config.showSpinner ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <Text style={[styles.compactIcon, { color: config.color }]}>
            {config.icon}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      {config.showSpinner ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <Text style={[styles.icon, { color: config.color }]}>{config.icon}</Text>
      )}
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </TouchableOpacity>
  );
}

function formatLastSync(timestamp: string | null): string {
  if (!timestamp) return 'Nunca sincronizado';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Recien sincronizado';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} dias`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  compactContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactIcon: {
    fontSize: 16,
  },
});
