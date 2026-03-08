import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ExpoLocation from "expo-location";
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';
import { colors, fonts, spacing, borderRadius, shadows } from "../theme";
import { Location, NotificationSettings, SyncStatus } from "../types";
import { SyncStatusBadge } from "./SyncStatusBadge";

// Types defined locally to avoid importing notification module in Expo Go
type PermissionStatus = "granted" | "denied" | "undetermined";
interface NotificationCounts {
  morning: number;
  weatherAlerts: number;
  careReminders: number;
  total: number;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
  location: Location | null;
  onUpdateLocation: (location: Location) => void;
  // Notification props
  notificationSettings: NotificationSettings;
  notificationPermission: PermissionStatus;
  notificationCounts: NotificationCounts;
  isRequestingPermission: boolean;
  onUpdateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  onEnableNotifications: () => Promise<boolean>;
  onDisableNotifications: () => Promise<void>;
  onSendTestNotification: () => Promise<void>;
  // PlantNet API props
  plantNetApiKey: string | null;
  onUpdatePlantNetApiKey: (key: string | null) => void;
  // Account/Auth props (optional - only shown when user is logged in)
  user?: {
    displayName: string | null;
    avatarUrl: string | null;
    email: string | null;
  } | null;
  syncStatus?: SyncStatus;
  lastSyncedAt?: string | null;
  onSignOut?: () => Promise<void>;
  onSyncNow?: () => Promise<void>;
}

// Time options for morning reminder
const TIME_OPTIONS = [
  { label: "6:00", value: "06:00" },
  { label: "7:00", value: "07:00" },
  { label: "8:00", value: "08:00" },
  { label: "9:00", value: "09:00" },
  { label: "10:00", value: "10:00" },
];

export function SettingsPanel({
  visible,
  onClose,
  location,
  onUpdateLocation,
  notificationSettings,
  notificationPermission,
  notificationCounts,
  isRequestingPermission,
  onUpdateNotificationSettings,
  onEnableNotifications,
  onDisableNotifications,
  onSendTestNotification,
  plantNetApiKey,
  onUpdatePlantNetApiKey,
  user,
  syncStatus = "idle",
  lastSyncedAt,
  onSignOut,
  onSyncNow,
}: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTimeSelector, setShowTimeSelector] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(plantNetApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t('settings.permissionDenied'),
          t('settings.permissionDeniedMessage'),
        );
        setIsDetecting(false);
        return;
      }

      const currentLocation = await ExpoLocation.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocode to get city name
      const reverseGeocode = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const place = reverseGeocode[0];
      const newLocation: Location = {
        lat: latitude,
        lon: longitude,
        name: place?.city || place?.subregion || t('settingsPanel.yourLocation'),
        country: place?.country || "",
        admin1: place?.region || undefined,
      };

      onUpdateLocation(newLocation);
      setShowSearch(false);
    } catch (error) {
      Alert.alert(
        t('settings.error'),
        t('settings.locationError'),
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=5&language=es`
      );
      const data = await response.json();

      if (data.results) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchCities(text);
  };

  const selectCity = (city: GeocodingResult) => {
    const newLocation: Location = {
      lat: city.latitude,
      lon: city.longitude,
      name: city.name,
      country: city.country,
      admin1: city.admin1,
    };
    onUpdateLocation(newLocation);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await onEnableNotifications();
      if (!granted) {
        Alert.alert(
          t('settings.permissionsNeeded'),
          t('settings.permissionsNeededMessage'),
        );
      }
    } else {
      await onDisableNotifications();
    }
  };

  const handleSendTest = async () => {
    await onSendTestNotification();
    Alert.alert(t('settings.testSent'), t('settings.testSentMessage'));
  };

  const formatTime = (time: string): string => {
    const [hours] = time.split(":");
    return `${hours}:00`;
  };

  const getPermissionStatusText = (): string => {
    switch (notificationPermission) {
      case "granted":
        return t('settings.granted');
      case "denied":
        return t('settings.denied');
      default:
        return t('settings.notConfigured');
    }
  };

  const getPermissionStatusColor = (): string => {
    switch (notificationPermission) {
      case "granted":
        return colors.green;
      case "denied":
        return colors.dangerText;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>{t('settings.title')}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{t('settingsPanel.done')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Account Section */}
              {user && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('settingsPanel.account')}</Text>

                  <View style={styles.accountCard}>
                    <View style={styles.accountInfo}>
                      {user.avatarUrl ? (
                        <Image
                          source={{ uri: user.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarPlaceholderText}>
                            {user.displayName?.[0]?.toUpperCase() || "?"}
                          </Text>
                        </View>
                      )}
                      <View style={styles.accountText}>
                        <Text style={styles.accountName}>
                          {user.displayName || t('settingsPanel.user')}
                        </Text>
                        {user.email && (
                          <Text style={styles.accountEmail}>{user.email}</Text>
                        )}
                      </View>
                    </View>

                    <SyncStatusBadge
                      status={syncStatus}
                      lastSyncedAt={lastSyncedAt || null}
                      onPress={onSyncNow}
                    />
                  </View>

                  <View style={styles.accountActions}>
                    {onSyncNow && (
                      <TouchableOpacity
                        style={styles.syncButton}
                        onPress={onSyncNow}
                        disabled={syncStatus === "syncing"}
                      >
                        {syncStatus === "syncing" ? (
                          <ActivityIndicator color={colors.green} size="small" />
                        ) : (
                          <>
                            <Text style={styles.syncButtonIcon}>☁️</Text>
                            <Text style={styles.syncButtonText}>{t('settingsPanel.syncNow')}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {onSignOut && (
                      <TouchableOpacity
                        style={styles.signOutButton}
                        onPress={() => {
                          Alert.alert(
                            t('settingsPanel.signOut'),
                            t('settingsPanel.signOutMessage'),
                            [
                              { text: t('settings.cancel'), style: "cancel" },
                              {
                                text: t('settingsPanel.signOut'),
                                style: "destructive",
                                onPress: onSignOut,
                              },
                            ]
                          );
                        }}
                      >
                        <Text style={styles.signOutButtonText}>{t('settingsPanel.signOut')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Location Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.location')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('settings.locationDescription')}
                </Text>

                {location && !showSearch ? (
                  <View style={styles.locationCard}>
                    <View style={styles.locationInfo}>
                      <Text style={styles.locationIcon}>📍</Text>
                      <View style={styles.locationText}>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <Text style={styles.locationDetails}>
                          {location.admin1 && `${location.admin1}, `}
                          {location.country}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.changeButton}
                      onPress={() => setShowSearch(true)}
                    >
                      <Text style={styles.changeButtonText}>{t('settings.change')}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.locationSetup}>
                    {/* Detect location button */}
                    <TouchableOpacity
                      style={styles.detectButton}
                      onPress={detectLocation}
                      disabled={isDetecting}
                    >
                      {isDetecting ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <>
                          <Text style={styles.detectButtonIcon}>📍</Text>
                          <Text style={styles.detectButtonText}>
                            {t('settings.detectLocation')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>{t('settings.orSearchCity')}</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* City search */}
                    <View style={styles.searchContainer}>
                      <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholder={t('settings.searchCity')}
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {isSearching && (
                        <ActivityIndicator
                          style={styles.searchSpinner}
                          color={colors.textSecondary}
                          size="small"
                        />
                      )}
                    </View>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                      <View style={styles.searchResults}>
                        {searchResults.map((city) => (
                          <TouchableOpacity
                            key={city.id}
                            style={styles.searchResultItem}
                            onPress={() => selectCity(city)}
                          >
                            <Text style={styles.searchResultName}>
                              {city.name}
                            </Text>
                            <Text style={styles.searchResultDetails}>
                              {city.admin1 && `${city.admin1}, `}
                              {city.country}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {searchQuery.length >= 2 &&
                      !isSearching &&
                      searchResults.length === 0 && (
                        <Text style={styles.noResults}>
                          {t('settings.noResults')}
                        </Text>
                      )}

                    {location && showSearch && (
                      <TouchableOpacity
                        style={styles.cancelSearchButton}
                        onPress={() => setShowSearch(false)}
                      >
                        <Text style={styles.cancelSearchText}>{t('settings.cancel')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Notifications Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('settings.notificationsDescription')}
                </Text>

                {/* Permission Status */}
                <View style={styles.permissionRow}>
                  <Text style={styles.permissionLabel}>{t('settings.status')}</Text>
                  <Text
                    style={[
                      styles.permissionStatus,
                      { color: getPermissionStatusColor() },
                    ]}
                  >
                    {getPermissionStatusText()}
                  </Text>
                </View>

                {/* Main Toggle */}
                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingIcon}>🔔</Text>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>
                        {t('settings.enableNotifications')}
                      </Text>
                      <Text style={styles.settingSubtitle}>
                        {notificationCounts.total > 0
                          ? t('settings.scheduled', { count: notificationCounts.total })
                          : t('settings.noneScheduled')}
                      </Text>
                    </View>
                  </View>
                  {isRequestingPermission ? (
                    <ActivityIndicator color={colors.green} size="small" />
                  ) : (
                    <Switch
                      value={!!notificationSettings.enabled}
                      onValueChange={handleNotificationToggle}
                      trackColor={{ false: colors.border, true: colors.green }}
                      thumbColor={colors.white}
                    />
                  )}
                </View>

                {notificationSettings.enabled && (
                  <>
                    {/* Morning Reminder Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingIcon}>🌅</Text>
                        <View style={styles.settingText}>
                          <Text style={styles.settingTitle}>
                            {t('settings.morningSummary')}
                          </Text>
                          <Text style={styles.settingSubtitle}>
                            {t('settings.dailyTasks')}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={!!notificationSettings.morningReminder}
                        onValueChange={(value) =>
                          onUpdateNotificationSettings({ morningReminder: value })
                        }
                        trackColor={{ false: colors.border, true: colors.green }}
                        thumbColor={colors.white}
                      />
                    </View>

                    {/* Morning Time Selector */}
                    {notificationSettings.morningReminder && (
                      <View style={styles.timeSelector}>
                        <Text style={styles.timeSelectorLabel}>
                          {t('settings.reminderTime')}
                        </Text>
                        <View style={styles.timeOptions}>
                          {TIME_OPTIONS.map((option) => (
                            <TouchableOpacity
                              key={option.value}
                              style={[
                                styles.timeOption,
                                notificationSettings.morningTime === option.value &&
                                  styles.timeOptionSelected,
                              ]}
                              onPress={() =>
                                onUpdateNotificationSettings({
                                  morningTime: option.value,
                                })
                              }
                            >
                              <Text
                                style={[
                                  styles.timeOptionText,
                                  notificationSettings.morningTime ===
                                    option.value && styles.timeOptionTextSelected,
                                ]}
                              >
                                {option.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {/* Weather Alerts Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingIcon}>⚠️</Text>
                        <View style={styles.settingText}>
                          <Text style={styles.settingTitle}>
                            {t('settings.weatherAlerts')}
                          </Text>
                          <Text style={styles.settingSubtitle}>
                            {t('settings.weatherAlertsSubtitle')}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={!!notificationSettings.weatherAlerts}
                        onValueChange={(value) =>
                          onUpdateNotificationSettings({ weatherAlerts: value })
                        }
                        trackColor={{ false: colors.border, true: colors.green }}
                        thumbColor={colors.white}
                      />
                    </View>

                    {/* Care Reminders Toggle */}
                    <View style={styles.settingRow}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingIcon}>💧</Text>
                        <View style={styles.settingText}>
                          <Text style={styles.settingTitle}>
                            {t('settings.careReminders')}
                          </Text>
                          <Text style={styles.settingSubtitle}>
                            {t('settings.careRemindersSubtitle')}
                          </Text>
                        </View>
                      </View>
                      <Switch
                        value={!!notificationSettings.careReminders}
                        onValueChange={(value) =>
                          onUpdateNotificationSettings({ careReminders: value })
                        }
                        trackColor={{ false: colors.border, true: colors.green }}
                        thumbColor={colors.white}
                      />
                    </View>

                    {/* Test Notification Button */}
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={handleSendTest}
                    >
                      <Text style={styles.testButtonText}>
                        {t('settings.sendTest')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {notificationPermission === "denied" && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      {t('settings.notificationsBlocked')}
                    </Text>
                  </View>
                )}
              </View>

              {/* PlantNet API Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.plantId')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('settings.plantIdDescription')}
                </Text>

                <View style={styles.apiKeyContainer}>
                  <View style={styles.apiKeyInputContainer}>
                    <TextInput
                      style={styles.apiKeyInput}
                      value={apiKeyInput}
                      onChangeText={setApiKeyInput}
                      placeholder={t('settings.pasteApiKey')}
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showApiKey}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      style={styles.showApiKeyButton}
                      onPress={() => setShowApiKey(!showApiKey)}
                    >
                      <Text style={styles.showApiKeyText}>
                        {showApiKey ? "🙈" : "👁️"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.apiKeyActions}>
                    {apiKeyInput !== (plantNetApiKey || "") && (
                      <TouchableOpacity
                        style={styles.saveApiKeyButton}
                        onPress={() => {
                          onUpdatePlantNetApiKey(apiKeyInput || null);
                          Alert.alert(t('settings.saved'), t('settings.savedMessage'));
                        }}
                      >
                        <Text style={styles.saveApiKeyText}>{t('settings.save')}</Text>
                      </TouchableOpacity>
                    )}
                    {plantNetApiKey && (
                      <TouchableOpacity
                        style={styles.clearApiKeyButton}
                        onPress={() => {
                          setApiKeyInput("");
                          onUpdatePlantNetApiKey(null);
                        }}
                      >
                        <Text style={styles.clearApiKeyText}>{t('settings.delete')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {plantNetApiKey ? (
                  <View style={styles.apiKeyStatus}>
                    <Text style={styles.apiKeyStatusIcon}>✓</Text>
                    <Text style={styles.apiKeyStatusText}>{t('settingsPanel.apiKeyConfigured')}</Text>
                  </View>
                ) : (
                  <View style={styles.apiKeyInfo}>
                    <Text style={styles.apiKeyInfoText}>
                      {t('settingsPanel.noApiKeyWarning')}
                    </Text>
                  </View>
                )}
              </View>

              {/* Language Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
                <Text style={styles.sectionDescription}>
                  {t('settings.languageDescription')}
                </Text>

                <View style={styles.languageOptions}>
                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      i18n.language === 'es' && styles.languageOptionSelected,
                    ]}
                    onPress={() => setLanguage('es')}
                  >
                    <Text style={styles.languageOptionFlag}>🇪🇸</Text>
                    <Text
                      style={[
                        styles.languageOptionText,
                        i18n.language === 'es' && styles.languageOptionTextSelected,
                      ]}
                    >
                      {t('settings.spanish')}
                    </Text>
                    {i18n.language === 'es' && (
                      <Text style={styles.languageCheck}>✓</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      i18n.language === 'en' && styles.languageOptionSelected,
                    ]}
                    onPress={() => setLanguage('en')}
                  >
                    <Text style={styles.languageOptionFlag}>🇺🇸</Text>
                    <Text
                      style={[
                        styles.languageOptionText,
                        i18n.language === 'en' && styles.languageOptionTextSelected,
                      ]}
                    >
                      {t('settings.english')}
                    </Text>
                    {i18n.language === 'en' && (
                      <Text style={styles.languageCheck}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.versionText}>
                MyGarden v{Constants.expoConfig?.version || '2.0.0'}
              </Text>

              <TouchableOpacity
                style={styles.resetButton}
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
                          const { DevSettings } = require('react-native');
                          DevSettings?.reload?.();
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.resetButtonText}>🗑️ Reset App</Text>
              </TouchableOpacity>

              <View style={styles.bottomPadding} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: "88%",
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.green,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
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
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
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
    textAlign: "center",
    padding: spacing.lg,
  },
  cancelSearchButton: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelSearchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  languageOptions: {
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageOptionSelected: {
    borderColor: colors.green,
    backgroundColor: colors.successBg,
  },
  languageOptionFlag: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  languageOptionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  languageOptionTextSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.green,
  },
  languageCheck: {
    fontSize: 18,
    color: colors.green,
    fontWeight: "bold",
  },
  versionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  resetButton: {
    backgroundColor: colors.dangerBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  resetButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.dangerText,
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
  // Notification styles
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: colors.bgPrimary,
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
    flexDirection: "row",
    flexWrap: "wrap",
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
    alignSelf: "center",
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
    textAlign: "center",
  },
  // API Key styles
  apiKeyContainer: {
    marginBottom: spacing.md,
  },
  apiKeyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  apiKeyInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  showApiKeyButton: {
    padding: spacing.md,
  },
  showApiKeyText: {
    fontSize: 18,
  },
  apiKeyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saveApiKeyButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  saveApiKeyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
  clearApiKeyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  clearApiKeyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.dangerText,
  },
  apiKeyStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.infoBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  apiKeyStatusIcon: {
    fontSize: 16,
    color: colors.green,
    marginRight: spacing.sm,
  },
  apiKeyStatusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.infoText,
  },
  apiKeyInfo: {
    backgroundColor: colors.warningBg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  apiKeyInfoText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.warningText,
  },
  // Account styles
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgPrimary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarPlaceholderText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: colors.white,
  },
  accountText: {
    flex: 1,
  },
  accountName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  accountEmail: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  syncButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  syncButtonIcon: {
    fontSize: 16,
  },
  syncButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  signOutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  signOutButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.dangerText,
  },
});
