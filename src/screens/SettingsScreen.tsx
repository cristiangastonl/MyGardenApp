import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoLocation from 'expo-location';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { useNotifications } from '../hooks/useNotifications';
import { generatePlantAlerts } from '../utils/plantAlerts';
import { Location } from '../types';
import { Features } from '../config/features';

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
  const {
    plants,
    location,
    notificationSettings,
    plantNetApiKey,
    updateLocation,
    updateNotificationSettings,
    updatePlantNetApiKey,
  } = useStorage();

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
  const [apiKeyInput, setApiKeyInput] = useState(plantNetApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicacion para mostrar el clima local.');
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
        name: place?.city || place?.subregion || 'Tu ubicacion',
        country: place?.country || '',
        admin1: place?.region || undefined,
      };
      updateLocation(newLocation);
      setShowSearch(false);
    } catch {
      Alert.alert('Error', 'No se pudo detectar tu ubicacion. Intenta buscar tu ciudad manualmente.');
    } finally {
      setIsDetecting(false);
    }
  };

  const searchCities = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es`);
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
      if (!granted) Alert.alert('Permisos necesarios', 'Para recibir notificaciones, necesitas permitir el acceso en la configuracion de tu dispositivo.');
    } else {
      await disableNotifications();
    }
  };

  const getPermissionStatusText = (): string => {
    switch (permissionStatus) {
      case 'granted': return 'Permitidas';
      case 'denied': return 'Bloqueadas';
      default: return 'No configuradas';
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
        <Text style={styles.title}>Configuracion</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicacion</Text>
          <Text style={styles.sectionDescription}>Tu ubicacion se usa para mostrar el clima y alertas relevantes para tus plantas.</Text>

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
                <Text style={styles.changeButtonText}>Cambiar</Text>
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
                    <Text style={styles.detectButtonText}>Detectar ubicacion</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o buscar ciudad</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => { setSearchQuery(text); searchCities(text); }}
                  placeholder="Buscar ciudad..."
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
                <Text style={styles.noResults}>No se encontraron resultados</Text>
              )}

              {location && showSearch && (
                <TouchableOpacity style={styles.cancelSearchButton} onPress={() => setShowSearch(false)}>
                  <Text style={styles.cancelSearchText}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          <Text style={styles.sectionDescription}>Recibe recordatorios para cuidar tus plantas y alertas de clima.</Text>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Estado:</Text>
            <Text style={[styles.permissionStatus, { color: getPermissionStatusColor() }]}>{getPermissionStatusText()}</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Activar notificaciones</Text>
                <Text style={styles.settingSubtitle}>{scheduledCounts.total > 0 ? `${scheduledCounts.total} programadas` : 'Ninguna programada'}</Text>
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
                    <Text style={styles.settingTitle}>Resumen matutino</Text>
                    <Text style={styles.settingSubtitle}>Tareas del dia cada manana</Text>
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
                  <Text style={styles.timeSelectorLabel}>Hora del recordatorio:</Text>
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
                    <Text style={styles.settingTitle}>Alertas de clima</Text>
                    <Text style={styles.settingSubtitle}>Heladas, calor extremo, etc.</Text>
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
                    <Text style={styles.settingTitle}>Recordatorios de cuidado</Text>
                    <Text style={styles.settingSubtitle}>Cuando se atrasa el riego</Text>
                  </View>
                </View>
                <Switch
                  value={!!notifSettings.careReminders}
                  onValueChange={(value) => updateSettings({ careReminders: value })}
                  trackColor={{ false: colors.border, true: colors.green }}
                  thumbColor={colors.white}
                />
              </View>

              <TouchableOpacity style={styles.testButton} onPress={async () => { await sendTest(); Alert.alert('Listo!', 'Se envio una notificacion de prueba.'); }}>
                <Text style={styles.testButtonText}>Enviar notificacion de prueba</Text>
              </TouchableOpacity>
            </>
          )}

          {permissionStatus === 'denied' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>Las notificaciones estan bloqueadas. Para activarlas, ve a Configuracion {'>'} Mi Jardin {'>'} Notificaciones en tu dispositivo.</Text>
            </View>
          )}
        </View>

        {/* PlantNet API Section — only show when PLANT_IDENTIFICATION is enabled */}
        {Features.PLANT_IDENTIFICATION && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identificacion de plantas</Text>
            <Text style={styles.sectionDescription}>Configura tu API key de PlantNet para identificar plantas con fotos. Obtene una gratis en my.plantnet.org</Text>

            <View style={styles.apiKeyContainer}>
              <View style={styles.apiKeyInputContainer}>
                <TextInput
                  style={styles.apiKeyInput}
                  value={apiKeyInput}
                  onChangeText={setApiKeyInput}
                  placeholder="Pegar API key aqui..."
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.showApiKeyButton} onPress={() => setShowApiKey(!showApiKey)}>
                  <Text style={styles.showApiKeyText}>{showApiKey ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.apiKeyActions}>
                {apiKeyInput !== (plantNetApiKey || '') && (
                  <TouchableOpacity style={styles.saveApiKeyButton} onPress={() => { updatePlantNetApiKey(apiKeyInput || null); Alert.alert('Guardado', 'API key guardada correctamente.'); }}>
                    <Text style={styles.saveApiKeyText}>Guardar</Text>
                  </TouchableOpacity>
                )}
                {plantNetApiKey && (
                  <TouchableOpacity style={styles.clearApiKeyButton} onPress={() => { setApiKeyInput(''); updatePlantNetApiKey(null); }}>
                    <Text style={styles.clearApiKeyText}>Borrar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <Text style={styles.comingSoon}>Proximamente</Text>
        </View>

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
  apiKeyContainer: {
    marginBottom: spacing.md,
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  comingSoon: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: spacing.xxxl,
  },
});
