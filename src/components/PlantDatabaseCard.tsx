import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Image, ImageStyle } from 'react-native';
import { PlantDBEntry } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';

interface PlantDatabaseCardProps {
  plant: PlantDBEntry;
  onPress: () => void;
}

export function PlantDatabaseCard({ plant, onPress }: PlantDatabaseCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {plant.imageUrl ? (
        <Image
          source={{ uri: plant.imageUrl }}
          style={styles.plantImage}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.icon}>{plant.icon}</Text>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {plant.name}
      </Text>
      <View style={styles.badges}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>💧 {plant.waterDays}d</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>☀️ {plant.sunHours}h</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface Styles {
  card: ViewStyle;
  icon: TextStyle;
  plantImage: ImageStyle;
  name: TextStyle;
  badges: ViewStyle;
  badge: ViewStyle;
  badgeText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    width: '48%',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  plantImage: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  badge: {
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
});
