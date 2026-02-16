import { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import { colors } from './src/theme';
import { useStorage, StorageProvider } from './src/hooks/useStorage';
import { PremiumProvider } from './src/hooks/usePremium';
import { Features } from './src/config/features';
import { initAnalytics, trackEvent } from './src/services/analyticsService';
import { PaywallModal } from './src/components';

// Screens
import TodayScreen from './src/screens/TodayScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PlantsScreen from './src/screens/PlantsScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: 'DMSans_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tab.Screen
        name="Hoy"
        component={TodayScreen}
        options={{ tabBarLabel: 'Hoy', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🌱</Text> }}
      />
      {Features.CALENDAR_TAB && (
        <Tab.Screen
          name="Calendario"
          component={CalendarScreen}
          options={{ tabBarLabel: 'Calendario', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text> }}
        />
      )}
      <Tab.Screen
        name="Plantas"
        component={PlantsScreen}
        options={{ tabBarLabel: 'Plantas', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🪴</Text> }}
      />
      {Features.EXPLORE_TAB && (
        <Tab.Screen
          name="Explorar"
          component={ExploreScreen}
          options={{ tabBarLabel: 'Explorar', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text> }}
        />
      )}
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Ajustes', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  );
}

// MVP AppContent — no auth, no sync
function AppContentMVP() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const {
    loading: storageLoading,
    onboardingCompleted,
    plants,
  } = useStorage();

  useEffect(() => {
    initAnalytics().then(() => trackEvent('app_opened'));
  }, []);

  if (!fontsLoaded || storageLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🌿</Text>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const showOnboarding = !onboardingCompleted && plants.length === 0;

  return (
    <>
      <NavigationContainer>
        <StatusBar style="dark" />
        {showOnboarding ? <OnboardingScreen /> : <MainTabs />}
      </NavigationContainer>
      <PaywallModal />
    </>
  );
}

// Full AppContent with auth + sync — only used when those flags are on
function AppContentFull() {
  // Lazy-require to avoid importing auth/sync modules at the top level when not needed
  const { AuthProvider, useAuthContext } = require('./src/components/AuthProvider');
  const { useSync } = require('./src/hooks/useSync');
  const { DataMigrationModal } = require('./src/components/DataMigrationModal');
  const { default: LoginScreen } = require('./src/screens/LoginScreen');

  return (
    <AuthProvider>
      <AppContentFullInner
        useAuthContext={useAuthContext}
        useSync={useSync}
        DataMigrationModal={DataMigrationModal}
        LoginScreen={LoginScreen}
      />
    </AuthProvider>
  );
}

function AppContentFullInner({
  useAuthContext,
  useSync,
  DataMigrationModal,
  LoginScreen,
}: {
  useAuthContext: any;
  useSync: any;
  DataMigrationModal: any;
  LoginScreen: any;
}) {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const {
    loading: storageLoading,
    onboardingCompleted,
    plants,
    notes,
    reminders,
    location,
    notificationSettings,
    plantNetApiKey,
    setPlants,
  } = useStorage();

  const { user, loading: authLoading, isAuthenticated } = useAuthContext();

  useEffect(() => {
    initAnalytics().then(() => trackEvent('app_opened'));
  }, []);

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  const handleDataReceived = useCallback((data: any) => {
    if (data.plants.length > 0) {
      setPlants(data.plants);
    }
  }, [setPlants]);

  const { syncUp, syncDown, checkCloudData } = Features.CLOUD_SYNC
    ? useSync({
        user,
        plants,
        notes,
        reminders,
        location,
        notificationSettings,
        plantNetApiKey,
        onDataReceived: handleDataReceived,
      })
    : { syncUp: async () => {}, syncDown: async () => null, checkCloudData: async () => false };

  useEffect(() => {
    if (!Features.CLOUD_SYNC) return;
    if (user && !migrationChecked && !storageLoading) {
      const check = async () => {
        const cloudHasData = await checkCloudData();
        if (!cloudHasData && plants.length > 0) {
          setShowMigrationModal(true);
        } else if (cloudHasData) {
          await syncDown();
        }
        setMigrationChecked(true);
      };
      check();
    }
  }, [user, migrationChecked, storageLoading, plants.length]);

  useEffect(() => {
    if (!user) setMigrationChecked(false);
  }, [user]);

  if (!fontsLoaded || storageLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🌿</Text>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const showOnboarding = !onboardingCompleted && plants.length === 0;

  return (
    <>
      <NavigationContainer>
        <StatusBar style="dark" />
        {showOnboarding ? <OnboardingScreen /> : <MainTabs />}
      </NavigationContainer>

      {Features.CLOUD_SYNC && (
        <DataMigrationModal
          visible={showMigrationModal}
          plantCount={plants.length}
          onUploadToCloud={async () => { await syncUp(); setShowMigrationModal(false); }}
          onStartFresh={() => { setPlants([]); setShowMigrationModal(false); }}
          onCancel={() => setShowMigrationModal(false)}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StorageProvider>
        <PremiumProvider>
          {Features.AUTH ? <AppContentFull /> : <AppContentMVP />}
        </PremiumProvider>
      </StorageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 48,
  },
});
