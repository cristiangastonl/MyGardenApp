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
import { useSync } from './src/hooks/useSync';
import { AuthProvider, useAuthContext } from './src/components/AuthProvider';
import { DataMigrationModal } from './src/components/DataMigrationModal';
import { CloudData } from './src/services/syncService';
import { initAnalytics, trackEvent } from './src/services/analyticsService';

// Screens
import TodayScreen from './src/screens/TodayScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PlantsScreen from './src/screens/PlantsScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';

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
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{ tabBarLabel: 'Calendario', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text> }}
      />
      <Tab.Screen
        name="Plantas"
        component={PlantsScreen}
        options={{ tabBarLabel: 'Plantas', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🪴</Text> }}
      />
      <Tab.Screen
        name="Explorar"
        component={ExploreScreen}
        options={{ tabBarLabel: 'Explorar', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text> }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
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
    addPlants,
  } = useStorage();

  const { user, loading: authLoading, isAuthenticated } = useAuthContext();

  // Initialize analytics and track app open
  useEffect(() => {
    initAnalytics().then(() => trackEvent('app_opened'));
  }, []);

  // Migration modal state
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Handle data received from cloud
  const handleDataReceived = useCallback((data: CloudData) => {
    // Merge cloud data with local - for now, cloud data takes precedence
    if (data.plants.length > 0) {
      setPlants(data.plants);
    }
    // Notes, reminders, settings would be handled by useStorage updates
  }, [setPlants]);

  // Sync hook
  const {
    syncUp,
    syncDown,
    checkCloudData,
    hasCloudData,
  } = useSync({
    user,
    plants,
    notes,
    reminders,
    location,
    notificationSettings,
    plantNetApiKey,
    onDataReceived: handleDataReceived,
  });

  // Check for migration scenario when user logs in
  useEffect(() => {
    if (user && !migrationChecked && !storageLoading) {
      const checkMigration = async () => {
        const cloudHasData = await checkCloudData();

        if (!cloudHasData && plants.length > 0) {
          // User has local data but no cloud data - offer migration
          setShowMigrationModal(true);
        } else if (cloudHasData) {
          // Cloud has data - sync down
          await syncDown();
        }
        setMigrationChecked(true);
      };

      checkMigration();
    }
  }, [user, migrationChecked, storageLoading, plants.length, checkCloudData, syncDown]);

  // Reset migration check when user changes
  useEffect(() => {
    if (!user) {
      setMigrationChecked(false);
    }
  }, [user]);

  const handleUploadToCloud = async () => {
    await syncUp();
    setShowMigrationModal(false);
  };

  const handleStartFresh = () => {
    // Clear local data - user chose to start fresh
    setPlants([]);
    setShowMigrationModal(false);
  };

  const handleCancelMigration = () => {
    setShowMigrationModal(false);
  };

  // Loading state
  if (!fontsLoaded || storageLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🌿</Text>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  // Show login if not authenticated
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

      <DataMigrationModal
        visible={showMigrationModal}
        plantCount={plants.length}
        onUploadToCloud={handleUploadToCloud}
        onStartFresh={handleStartFresh}
        onCancel={handleCancelMigration}
      />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StorageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
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
