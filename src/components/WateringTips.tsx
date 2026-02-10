import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Plant, WeatherData } from '../types';
import {
  getWateringRecommendations,
  WateringRecommendation,
} from '../utils/wateringRecommendations';

interface WateringTipsProps {
  plants: Plant[];
  weather: WeatherData | null;
}

interface RecommendationTypeConfig {
  bg: string;
  border: string;
  text: string;
  headerBg: string;
}

function getTypeStyles(type: WateringRecommendation['type']): RecommendationTypeConfig {
  switch (type) {
    case 'skip':
    case 'delay':
      // Info style - blue tones
      return {
        bg: colors.infoBg,
        border: '#b4d4e8',
        text: colors.infoText,
        headerBg: '#d4e8f4',
      };
    case 'advance':
    case 'extra':
      // Warning style - golden tones
      return {
        bg: colors.warningBg,
        border: '#e8dbb4',
        text: colors.warningText,
        headerBg: '#f5ecd0',
      };
    case 'normal':
    default:
      // Green style
      return {
        bg: '#e8f5e8',
        border: '#b4e8b4',
        text: colors.green,
        headerBg: '#d4f0d4',
      };
  }
}

function getTypeIcon(type: WateringRecommendation['type']): string {
  switch (type) {
    case 'skip':
      return '💧';
    case 'delay':
      return '⏳';
    case 'advance':
      return '⏰';
    case 'extra':
      return '💦';
    case 'normal':
    default:
      return '✅';
  }
}

function getTypeTitle(type: WateringRecommendation['type']): string {
  switch (type) {
    case 'skip':
      return 'No riegues hoy';
    case 'delay':
      return 'Podes esperar';
    case 'advance':
      return 'Rega temprano';
    case 'extra':
      return 'Riego extra';
    case 'normal':
    default:
      return 'Riego normal';
  }
}

export function WateringTips({ plants, weather }: WateringTipsProps) {
  const today = new Date();
  const recommendations = getWateringRecommendations(plants, weather, today);

  if (recommendations.length === 0) {
    return null;
  }

  // Group recommendations by type to show them together
  const groupedByMessage = recommendations.reduce((acc, rec) => {
    const key = `${rec.type}-${rec.message}`;
    if (!acc[key]) {
      acc[key] = {
        type: rec.type,
        message: rec.message,
        plants: [],
      };
    }
    acc[key].plants.push({
      id: rec.plantId,
      name: rec.plantName,
      icon: rec.icon,
    });
    return acc;
  }, {} as Record<string, { type: WateringRecommendation['type']; message: string; plants: { id: string; name: string; icon: string }[] }>);

  const groups = Object.values(groupedByMessage);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CONSEJOS DE RIEGO</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groups.map((group, index) => {
          const typeStyles = getTypeStyles(group.type);
          const typeIcon = getTypeIcon(group.type);
          const typeTitle = getTypeTitle(group.type);

          return (
            <View
              key={`${group.type}-${index}`}
              style={[
                styles.card,
                {
                  backgroundColor: typeStyles.bg,
                  borderColor: typeStyles.border,
                },
              ]}
            >
              {/* Header */}
              <View style={[styles.cardHeader, { backgroundColor: typeStyles.headerBg }]}>
                <Text style={styles.typeIcon}>{typeIcon}</Text>
                <Text style={[styles.typeTitle, { color: typeStyles.text }]}>
                  {typeTitle}
                </Text>
              </View>

              {/* Message */}
              <Text style={[styles.message, { color: typeStyles.text }]}>
                {group.message}
              </Text>

              {/* Plants affected */}
              <View style={styles.plantsContainer}>
                {group.plants.map((plant, plantIndex) => (
                  <View key={plant.id} style={styles.plantTag}>
                    <Text style={styles.plantIcon}>{plant.icon}</Text>
                    <Text style={[styles.plantName, { color: typeStyles.text }]}>
                      {plant.name}
                    </Text>
                    {plantIndex < group.plants.length - 1 && (
                      <Text style={[styles.plantSeparator, { color: typeStyles.text }]}>,</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: 280,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  typeTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  plantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  plantTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantIcon: {
    fontSize: 14,
    marginRight: 2,
  },
  plantName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  plantSeparator: {
    marginLeft: 2,
    fontFamily: fonts.body,
    fontSize: 13,
  },
});
