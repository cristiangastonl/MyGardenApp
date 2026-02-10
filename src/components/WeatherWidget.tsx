import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { WeatherData, Location } from '../types';
import { getWeatherInfo } from '../data/weatherCodes';
import { DAYS_ES } from '../data/constants';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  location: Location | null;
  loading: boolean;
  error: string | null;
  onOpenSettings: () => void;
}

export function WeatherWidget({
  weather,
  location,
  loading,
  error,
  onOpenSettings,
}: WeatherWidgetProps) {
  // No location configured - show setup banner
  if (!location) {
    return (
      <TouchableOpacity
        style={styles.setupBanner}
        onPress={onOpenSettings}
        activeOpacity={0.8}
      >
        <View style={styles.setupIconContainer}>
          <Text style={styles.setupIcon}>📍</Text>
        </View>
        <View style={styles.setupTextContainer}>
          <Text style={styles.setupTitle}>Configura tu ubicacion</Text>
          <Text style={styles.setupSubtitle}>
            Para ver el clima y alertas personalizadas
          </Text>
        </View>
        <Text style={styles.setupArrow}>→</Text>
      </TouchableOpacity>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.green} />
          <Text style={styles.loadingText}>Cargando clima...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>
            {error || 'No se pudo cargar el clima'}
          </Text>
          <TouchableOpacity onPress={onOpenSettings} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentWeather = getWeatherInfo(weather.current.weatherCode);
  const forecastDays = weather.daily.slice(0, 5);

  return (
    <View style={styles.container}>
      {/* Current Weather */}
      <View style={styles.currentSection}>
        <View style={styles.currentMain}>
          <Text style={styles.currentIcon}>{currentWeather.icon}</Text>
          <View style={styles.currentTemp}>
            <Text style={styles.temperature}>
              {Math.round(weather.current.temperature)}°
            </Text>
            <Text style={styles.description}>{currentWeather.description}</Text>
          </View>
        </View>

        <View style={styles.currentDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💨</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.current.windSpeed)} km/h
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💧</Text>
            <Text style={styles.detailValue}>
              {weather.current.humidity}%
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {location.name}
            {location.admin1 ? `, ${location.admin1}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5-Day Forecast */}
      <View style={styles.forecastSection}>
        <Text style={styles.forecastTitle}>PROXIMOS DIAS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastScroll}
        >
          {forecastDays.map((day, index) => {
            const dayWeather = getWeatherInfo(day.weatherCode);
            const date = new Date(day.date);
            const dayName = index === 0 ? 'Hoy' : DAYS_ES[date.getDay()];

            return (
              <View key={day.date} style={styles.forecastDay}>
                <Text style={styles.forecastDayName}>{dayName}</Text>
                <Text style={styles.forecastIcon}>{dayWeather.icon}</Text>
                <View style={styles.forecastTemps}>
                  <Text style={styles.forecastTempMax}>
                    {Math.round(day.tempMax)}°
                  </Text>
                  <Text style={styles.forecastTempMin}>
                    {Math.round(day.tempMin)}°
                  </Text>
                </View>
                {day.precipitation > 0 && (
                  <View style={styles.forecastRain}>
                    <Text style={styles.forecastRainText}>
                      💧{Math.round(day.precipitation)}mm
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },

  // Setup Banner
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  setupIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.waterLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  setupIcon: {
    fontSize: 22,
  },
  setupTextContainer: {
    flex: 1,
  },
  setupTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  setupSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  setupArrow: {
    fontSize: 18,
    color: colors.waterBlue,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  errorIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },

  // Current Weather
  currentSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  currentMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  currentTemp: {
    flex: 1,
  },
  temperature: {
    fontFamily: fonts.heading,
    fontSize: 42,
    color: colors.textPrimary,
    lineHeight: 48,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
  currentDetails: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xl,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  detailValue: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: borderRadius.full,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: spacing.xs,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    maxWidth: 200,
  },

  // Forecast
  forecastSection: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  forecastTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  forecastScroll: {
    paddingRight: spacing.lg,
  },
  forecastDay: {
    alignItems: 'center',
    marginRight: spacing.lg,
    minWidth: 52,
  },
  forecastDayName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  forecastIcon: {
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastTempMax: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  forecastTempMin: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  forecastRain: {
    marginTop: spacing.xs,
  },
  forecastRainText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.waterBlue,
  },
});
