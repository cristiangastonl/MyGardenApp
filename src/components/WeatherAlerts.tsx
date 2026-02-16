import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { WeatherData, WeatherAlert, Plant } from '../types';
import { isRainyWeather } from '../data/weatherCodes';
import { generatePlantAlerts, PlantAlert, getAlertCounts } from '../utils/plantAlerts';
import { usePremium } from '../hooks/usePremium';

interface WeatherAlertsProps {
  weather: WeatherData | null;
  plants: Plant[];
}

const MAX_VISIBLE_ALERTS = 5;

/**
 * Generates generic weather alerts (not plant-specific)
 */
function generateGenericAlerts(weather: WeatherData | null, plants: Plant[]): WeatherAlert[] {
  if (!weather || plants.length === 0) return [];

  const alerts: WeatherAlert[] = [];
  const { current, daily } = weather;
  const todayForecast = daily[0];

  // Rain alert - useful for all plants
  if (isRainyWeather(current.weatherCode)) {
    alerts.push({
      type: 'rain',
      icon: '🌧️',
      title: 'Lluvia actual',
      message: 'No necesitas regar hoy. La naturaleza se encarga.',
      severity: 'info',
    });
  } else if (todayForecast && todayForecast.precipitation > 5) {
    alerts.push({
      type: 'rain',
      icon: '☔',
      title: 'Lluvia esperada',
      message: `Se esperan ${Math.round(todayForecast.precipitation)}mm de lluvia. Podes omitir el riego.`,
      severity: 'info',
    });
  }

  return alerts;
}

export function WeatherAlerts({ weather, plants }: WeatherAlertsProps) {
  const { isPremium, showPaywall } = usePremium();
  const [showAll, setShowAll] = useState(false);

  // Generate personalized plant alerts
  const plantAlerts = generatePlantAlerts(plants, weather);

  // Generate generic alerts
  const genericAlerts = generateGenericAlerts(weather, plants);

  // Combine all alerts, plant-specific first (sorted by severity)
  const allAlerts = [...plantAlerts, ...genericAlerts];

  if (allAlerts.length === 0) {
    return null;
  }

  const alertCounts = getAlertCounts(plantAlerts);
  const hasMoreAlerts = allAlerts.length > MAX_VISIBLE_ALERTS;
  const visibleAlerts = showAll ? allAlerts : allAlerts.slice(0, MAX_VISIBLE_ALERTS);
  const hiddenCount = allAlerts.length - MAX_VISIBLE_ALERTS;

  const getAlertStyles = (severity: 'danger' | 'warning' | 'info') => {
    switch (severity) {
      case 'danger':
        return {
          bg: colors.dangerBg,
          border: '#e8b4b4',
          text: colors.dangerText,
        };
      case 'warning':
        return {
          bg: colors.warningBg,
          border: '#e8dbb4',
          text: colors.warningText,
        };
      case 'info':
      default:
        return {
          bg: colors.infoBg,
          border: '#b4d4e8',
          text: colors.infoText,
        };
    }
  };

  const getAlertIcon = (alert: PlantAlert | WeatherAlert): string => {
    // If it's a plant alert, we show the plant icon
    if ('plantIcon' in alert) {
      return alert.plantIcon;
    }
    // For generic alerts, use the built-in icon
    return alert.icon;
  };

  const isPlantAlert = (alert: PlantAlert | WeatherAlert): alert is PlantAlert => {
    return 'plantId' in alert;
  };

  // Determine if we should use compact mode (more than 3 alerts)
  const useCompactMode = allAlerts.length > 3;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>ALERTAS PARA TUS PLANTAS</Text>
        {alertCounts.danger > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{alertCounts.danger}</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {visibleAlerts.map((alert, index) => {
          const alertColors = getAlertStyles(alert.severity);
          const isPlant = isPlantAlert(alert);
          const showLock = isPlant && !isPremium;

          const cardContent = (
            <View
              key={isPlant ? `${alert.plantId}-${alert.type}` : `generic-${alert.type}-${index}`}
              style={[
                styles.alertCard,
                useCompactMode && styles.alertCardCompact,
                {
                  backgroundColor: alertColors.bg,
                  borderColor: alertColors.border,
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.iconContainer}>
                  <Text style={[styles.alertIcon, useCompactMode && styles.alertIconCompact]}>
                    {getAlertIcon(alert)}
                  </Text>
                </View>
                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.alertTitle,
                      useCompactMode && styles.alertTitleCompact,
                      { color: alertColors.text }
                    ]}
                    numberOfLines={1}
                  >
                    {alert.title}
                  </Text>
                  {isPlant && (
                    <Text style={[styles.plantName, { color: alertColors.text }]} numberOfLines={1}>
                      {alert.plantName}
                    </Text>
                  )}
                </View>
              </View>
              {showLock ? (
                <Text
                  style={[
                    styles.alertMessage,
                    useCompactMode && styles.alertMessageCompact,
                    { color: alertColors.text, fontStyle: 'italic' }
                  ]}
                  numberOfLines={2}
                >
                  Toca para ver el detalle (Premium)
                </Text>
              ) : (
                <Text
                  style={[
                    styles.alertMessage,
                    useCompactMode && styles.alertMessageCompact,
                    { color: alertColors.text }
                  ]}
                  numberOfLines={useCompactMode ? 2 : 3}
                >
                  {alert.message}
                </Text>
              )}
            </View>
          );

          if (showLock) {
            return (
              <TouchableOpacity
                key={`${alert.plantId}-${alert.type}`}
                onPress={() => showPaywall('weather_alert')}
                activeOpacity={0.7}
              >
                {cardContent}
              </TouchableOpacity>
            );
          }

          return cardContent;
        })}

        {hasMoreAlerts && !showAll && (
          <TouchableOpacity
            style={styles.viewMoreCard}
            onPress={() => setShowAll(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewMoreNumber}>+{hiddenCount}</Text>
            <Text style={styles.viewMoreText}>Ver mas</Text>
          </TouchableOpacity>
        )}

        {showAll && hasMoreAlerts && (
          <TouchableOpacity
            style={styles.viewLessCard}
            onPress={() => setShowAll(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewLessText}>Ocultar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: colors.dangerText,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  alertCard: {
    width: 260,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginRight: spacing.md,
    ...shadows.sm,
  },
  alertCardCompact: {
    width: 220,
    padding: spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  alertIcon: {
    fontSize: 24,
  },
  alertIconCompact: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  alertTitleCompact: {
    fontSize: 13,
  },
  plantName: {
    fontFamily: fonts.body,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  alertMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  alertMessageCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  viewMoreCard: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginRight: spacing.md,
    padding: spacing.md,
  },
  viewMoreNumber: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  viewMoreText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  viewLessCard: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
    padding: spacing.md,
  },
  viewLessText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
