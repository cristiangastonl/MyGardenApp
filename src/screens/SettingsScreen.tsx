import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, Linking, Platform, DevSettings } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoLocation from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { usePremium } from '../hooks/usePremium';
import { useWeather } from '../hooks/useWeather';
import { useNotifications } from '../hooks/useNotifications';
import { generatePlantAlerts } from '../utils/plantAlerts';
import { Location } from '../types';
import i18n, { setLanguage } from '../i18n';

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

const TIME_OPTIONS = [
  { label: '6:00', value: '06:00' },
  { label: '7:00', value: '07:00' },
  { label: '8:00', value: '08:00' },
  { label: '9:00', value: '09:00' },
  { label: '10:00', value: '10:00' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    plants,
    location,
    notificationSettings,
    updateLocation,
    updateNotificationSettings,
  } = useStorage();

  const { isPremium, showPaywall, toggleMockPremium } = usePremium();

  const { weather } = useWeather(location);
  const plantAlerts = useMemo(() => generatePlantAlerts(plants, weather), [plants, weather]);

  const {
    permissionStatus,
    isRequesting,
    settings: notifSettings,
    scheduledCounts,
    updateSettings,
    enableNotifications,
    disableNotifications,
    sendTest,
  } = useNotifications({
    settings: notificationSettings,
    onSettingsChange: updateNotificationSettings,
    plants,
    weather,
    alerts: plantAlerts,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);


  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('settings.permissionDenied'), t('settings.permissionDeniedMessage'));
        setIsDetecting(false);
        return;
      }
      const currentLocation = await ExpoLocation.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      const reverseGeocode = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const place = reverseGeocode[0];
      const newLocation: Location = {
        lat: latitude,
        lon: longitude,
        name: place?.city || place?.subregion || 'Tu ubicación',
        country: place?.country || '',
        admin1: place?.region || undefined,
      };
      updateLocation(newLocation);
      setShowSearch(false);
    } catch {
      Alert.alert(t('settings.error'), t('settings.locationError'));
    } finally {
      setIsDetecting(false);
    }
  };

  const searchCities = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=${i18n.language}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  const selectCity = (city: GeocodingResult) => {
    updateLocation({ lat: city.latitude, lon: city.longitude, name: city.name, country: city.country, admin1: city.admin1 });
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await enableNotifications();
      if (!granted) Alert.alert(t('settings.permissionsNeeded'), t('settings.permissionsNeededMessage'));
    } else {
      await disableNotifications();
    }
  };

  const getPermissionStatusText = (): string => {
    switch (permissionStatus) {
      case 'granted': return t('settings.granted');
      case 'denied': return t('settings.denied');
      default: return t('settings.notConfigured');
    }
  };

  const getPermissionStatusColor = (): string => {
    switch (permissionStatus) {
      case 'granted': return colors.green;
      case 'denied': return colors.dangerText;
      default: return colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.location')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.locationDescription')}</Text>

          {location && !showSearch ? (
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationText}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationDetails}>{location.admin1 && `${location.admin1}, `}{location.country}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={() => setShowSearch(true)}>
                <Text style={styles.changeButtonText}>{t('settings.change')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationSetup}>
              <TouchableOpacity style={styles.detectButton} onPress={detectLocation} disabled={isDetecting}>
                {isDetecting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Text style={styles.detectButtonIcon}>📍</Text>
                    <Text style={styles.detectButtonText}>{t('settings.detectLocation')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('settings.orSearchCity')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => { setSearchQuery(text); searchCities(text); }}
                  placeholder={t('settings.searchCity')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching && <ActivityIndicator style={styles.searchSpinner} color={colors.textSecondary} size="small" />}
              </View>

              {searchResults.length > 0 && (
                <View style={styles.searchResults}>
                  {searchResults.map((city) => (
                    <TouchableOpacity key={city.id} style={styles.searchResultItem} onPress={() => selectCity(city)}>
                      <Text style={styles.searchResultName}>{city.name}</Text>
                      <Text style={styles.searchResultDetails}>{city.admin1 && `${city.admin1}, `}{city.country}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <Text style={styles.noResults}>{t('settings.noResults')}</Text>
              )}

              {location && showSearch && (
                <TouchableOpacity style={styles.cancelSearchButton} onPress={() => setShowSearch(false)}>
                  <Text style={styles.cancelSearchText}>{t('settings.cancel')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.notificationsDescription')}</Text>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>{t('settings.status')}</Text>
            <Text style={[styles.permissionStatus, { color: getPermissionStatusColor() }]}>{getPermissionStatusText()}</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('settings.enableNotifications')}</Text>
                <Text style={styles.settingSubtitle}>{scheduledCounts.total > 0 ? t('settings.scheduled', { count: scheduledCounts.total }) : t('settings.noneScheduled')}</Text>
              </View>
            </View>
            {isRequesting ? (
              <ActivityIndicator color={colors.green} size="small" />
            ) : (
              <Switch
                value={!!notifSettings.enabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.border, true: colors.green }}
                thumbColor={colors.white}
              />
            )}
          </View>

          {notifSettings.enabled && (
            <>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingIcon}>🌅</Text>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{t('settings.morningSummary')}</Text>
                    <Text style={styles.settingSubtitle}>{t('settings.dailyTasks')}</Text>
                  </View>
                </View>
                <Switch
                  value={!!notifSettings.morningReminder}
                  onValueChange={(value) => updateSettings({ morningReminder: value })}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              {notifSettings.morningReminder && (
                <View style={styles.timeSelector}>
                  <Text style={styles.timeSelectorLabel}>{t('settings.reminderTime')}</Text>
                  <View style={styles.timeOptions}>
                    {TIME_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.timeOption, notifSettings.morningTime === option.value && styles.timeOptionSelected]}
                        onPress={() => updateSettings({ morningTime: option.value })}
                      >
                        <Text style={[styles.timeOptionText, notifSettings.morningTime === option.value && styles.timeOptionTextSelected]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingIcon}>⚠️</Text>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{t('settings.weatherAlerts')}</Text>
                    <Text style={styles.settingSubtitle}>{t('settings.weatherAlertsSubtitle')}</Text>
                  </View>
                </View>
                <Switch
                  value={!!notifSettings.weatherAlerts}
                  onValueChange={(value) => updateSettings({ weatherAlerts: value })}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingIcon}>💧</Text>
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{t('settings.careReminders')}</Text>
                    <Text style={styles.settingSubtitle}>{t('settings.careRemindersSubtitle')}</Text>
                  </View>
                </View>
                <Switch
                  value={!!notifSettings.careReminders}
                  onValueChange={(value) => updateSettings({ careReminders: value })}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <TouchableOpacity style={styles.testButton} onPress={async () => { await sendTest(); Alert.alert(t('settings.testSent'), t('settings.testSentMessage')); }}>
                <Text style={styles.testButtonText}>{t('settings.sendTest')}</Text>
              </TouchableOpacity>
            </>
          )}

          {permissionStatus === 'denied' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{t('settings.notificationsBlocked')}</Text>
              <TouchableOpacity style={styles.openSettingsButton} onPress={() => Linking.openSettings()}>
                <Text style={styles.openSettingsText}>{t('settings.openSettings')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.languageDescription')}</Text>

          <TouchableOpacity
            style={[styles.settingRow, i18n.language === 'es' && { borderWidth: 2, borderColor: colors.green }]}
            onPress={() => setLanguage('es')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🇪🇸</Text>
              <Text style={styles.settingTitle}>{t('settings.spanish')}</Text>
            </View>
            {i18n.language === 'es' && <Text style={{ color: colors.green, fontFamily: fonts.bodySemiBold }}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, i18n.language === 'en' && { borderWidth: 2, borderColor: colors.green }]}
            onPress={() => setLanguage('en')}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🇺🇸</Text>
              <Text style={styles.settingTitle}>{t('settings.english')}</Text>
            </View>
            {i18n.language === 'en' && <Text style={{ color: colors.green, fontFamily: fonts.bodySemiBold }}>✓</Text>}
          </TouchableOpacity>
        </View>

        {/* Premium Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.premium')}</Text>
          {isPremium ? (
            <>
              <View style={styles.premiumActiveCard}>
                <View style={styles.premiumActiveRow}>
                  <Text style={styles.premiumActiveIcon}>✓</Text>
                  <Text style={styles.premiumActiveText}>{t('settings.premiumActive')}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.manageSubButton}
                onPress={() => {
                  const url = Platform.OS === 'android'
                    ? 'https://play.google.com/store/account/subscriptions'
                    : 'https://apps.apple.com/account/subscriptions';
                  Linking.openURL(url);
                }}
              >
                <Text style={styles.manageSubText}>{t('settings.manageSubscription')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => showPaywall('settings')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.premiumDark, colors.premiumLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeIconCircle}>
                  <Text style={styles.upgradeIcon}>🌱</Text>
                </View>
                <View style={styles.upgradeTextContainer}>
                  <Text style={styles.upgradeTitle}>{t('settings.upgradeToPremium')}</Text>
                  <Text style={styles.upgradeSubtitle}>{t('settings.upgradeSubtitle')}</Text>
                </View>
                <View style={styles.upgradeArrowCircle}>
                  <Text style={styles.upgradeArrow}>→</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Dev tools — only in development */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.devTools')}</Text>
            <Text style={styles.sectionDescription}>{t('settings.devToolsDescription')}</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔧</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{t('settings.togglePremium')}</Text>
                  <Text style={styles.settingSubtitle}>{isPremium ? t('settings.active') : t('settings.inactive')}</Text>
                </View>
              </View>
              <Switch
                value={isPremium}
                onValueChange={() => toggleMockPremium()}
                trackColor={{ false: colors.border, true: colors.green }}
                thumbColor={colors.white}
              />
            </View>

            <TouchableOpacity
              style={styles.devButton}
              onPress={() => showPaywall('dev_test')}
            >
              <Text style={styles.devButtonText}>{t('settings.showPaywall')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: colors.dangerBg }]}
              onPress={() => {
                Alert.alert(
                  'Reset App',
                  'This will delete all data and restart the app. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await AsyncStorage.clear();
                        DevSettings?.reload?.();
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={[styles.devButtonText, { color: colors.dangerText }]}>🗑️ Reset App</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  locationDetails: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  changeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  locationSetup: {
    gap: spacing.md,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  detectButtonIcon: {
    fontSize: 18,
  },
  detectButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  searchSpinner: {
    marginRight: spacing.md,
  },
  searchResults: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  searchResultItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchResultName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchResultDetails: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  noResults: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  cancelSearchButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelSearchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  permissionLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  permissionStatus: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeSelector: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  timeSelectorLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  timeOptionSelected: {
    borderColor: colors.green,
    backgroundColor: colors.green,
  },
  timeOptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  timeOptionTextSelected: {
    color: colors.white,
  },
  testButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  testButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.green,
  },
  warningBox: {
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warningText,
    textAlign: 'center',
  },
  openSettingsButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.warningText,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  openSettingsText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  premiumActiveCard: {
    backgroundColor: colors.successBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: spacing.sm,
  },
  premiumActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumActiveIcon: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.green,
    marginRight: spacing.sm,
  },
  premiumActiveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.green,
  },
  manageSubButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  manageSubText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  upgradeButton: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  upgradeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  upgradeIcon: {
    fontSize: 22,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  upgradeSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.whiteSubdued,
    marginTop: 2,
  },
  upgradeArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.whiteOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  upgradeArrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  devButton: {
    backgroundColor: colors.bgTertiary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  devButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
});
