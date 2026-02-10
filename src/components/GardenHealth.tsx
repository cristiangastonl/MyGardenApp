import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Plant, PlantHealthStatus, WeatherData } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import {
  calculateGardenHealth,
  getHealthColor,
  getHealthBgColor,
  getHealthMessage,
} from '../utils/plantHealth';
import { ProgressBar } from './ProgressBar';

interface GardenHealthProps {
  plants: Plant[];
  weather: WeatherData | null;
  onPlantPress?: (plantId: string) => void;
}

export function GardenHealth({
  plants,
  weather,
  onPlantPress,
}: GardenHealthProps) {
  const today = new Date();
  const {
    averageScore,
    level,
    plantsNeedingAttention,
  } = calculateGardenHealth(plants, today, weather);

  const healthColor = getHealthColor(level);
  const healthBgColor = getHealthBgColor(level);
  const healthMessage = getHealthMessage(level);

  // Don't show if garden is empty
  if (plants.length === 0) {
    return null;
  }

  const getGardenMessage = (): string => {
    if (level === 'excellent') {
      return 'Tu jardin esta en optimas condiciones';
    }
    if (level === 'good') {
      return 'Tu jardin esta bien, con algunos detalles';
    }
    if (level === 'warning') {
      return 'Algunas plantas necesitan atencion';
    }
    return 'Varias plantas requieren cuidado urgente';
  };

  const getGardenIcon = (): string => {
    if (level === 'excellent') return '🌿';
    if (level === 'good') return '🌱';
    if (level === 'warning') return '🍂';
    return '🥀';
  };

  return (
    <View style={[styles.container, { backgroundColor: healthBgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>{getGardenIcon()}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>Salud del jardin</Text>
            <Text style={[styles.status, { color: healthColor }]}>
              {healthMessage}
            </Text>
          </View>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNumber, { color: healthColor }]}>
            {averageScore}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <ProgressBar
          progress={averageScore / 100}
          color={healthColor}
          backgroundColor={colors.white}
          height={6}
        />
      </View>

      {/* Message */}
      <Text style={styles.message}>{getGardenMessage()}</Text>

      {/* Plants needing attention */}
      {plantsNeedingAttention.length > 0 && (
        <View style={styles.attentionSection}>
          <Text style={styles.attentionLabel}>
            {plantsNeedingAttention.length === 1
              ? '1 planta necesita atencion'
              : `${plantsNeedingAttention.length} plantas necesitan atencion`}
          </Text>
          <View style={styles.attentionPlants}>
            {plantsNeedingAttention.slice(0, 4).map((status) => {
              const plant = plants.find((p) => p.id === status.plantId);
              if (!plant) return null;

              return (
                <TouchableOpacity
                  key={status.plantId}
                  style={styles.attentionPlant}
                  onPress={() => onPlantPress?.(status.plantId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.plantBadge,
                      {
                        backgroundColor: getHealthBgColor(status.level),
                        borderColor: getHealthColor(status.level),
                      },
                    ]}
                  >
                    <Text style={styles.plantIcon}>{plant.icon}</Text>
                  </View>
                  <Text
                    style={styles.plantName}
                    numberOfLines={1}
                  >
                    {plant.name}
                  </Text>
                  <Text
                    style={[
                      styles.plantScore,
                      { color: getHealthColor(status.level) },
                    ]}
                  >
                    {status.score}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {plantsNeedingAttention.length > 4 && (
              <View style={styles.moreIndicator}>
                <Text style={styles.moreText}>
                  +{plantsNeedingAttention.length - 4}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* All good message */}
      {plantsNeedingAttention.length === 0 && level === 'excellent' && (
        <View style={styles.allGoodSection}>
          <Text style={styles.allGoodText}>
            Todas tus plantas estan saludables
          </Text>
        </View>
      )}
    </View>
  );
}

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  icon: TextStyle;
  headerInfo: ViewStyle;
  title: TextStyle;
  status: TextStyle;
  scoreCircle: ViewStyle;
  scoreNumber: TextStyle;
  progressSection: ViewStyle;
  message: TextStyle;
  attentionSection: ViewStyle;
  attentionLabel: TextStyle;
  attentionPlants: ViewStyle;
  attentionPlant: ViewStyle;
  plantBadge: ViewStyle;
  plantIcon: TextStyle;
  plantName: TextStyle;
  plantScore: TextStyle;
  moreIndicator: ViewStyle;
  moreText: TextStyle;
  allGoodSection: ViewStyle;
  allGoodText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.headingMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  status: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 2,
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  scoreNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
  },
  progressSection: {
    marginTop: spacing.md,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  attentionSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  attentionLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  attentionPlants: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  attentionPlant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    ...shadows.sm,
  },
  plantBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: spacing.xs,
  },
  plantIcon: {
    fontSize: 12,
  },
  plantName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    maxWidth: 60,
    marginRight: spacing.xs,
  },
  plantScore: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  moreIndicator: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  moreText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  allGoodSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  allGoodText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.green,
    textAlign: 'center',
  },
});
