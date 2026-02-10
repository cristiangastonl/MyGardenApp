import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fonts } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { formatDate } from '../utils/dates';
import { Plant } from '../types';
import {
  PlantCard,
  ExpandedFAB,
  AddPlantModal,
  PlantIdentifierModal,
} from '../components';
import { uploadPlantImage } from '../services/imageService';

export default function PlantsScreen() {
  const {
    plants,
    plantNetApiKey,
    location,
    loading,
    updatePlant,
    deletePlant,
    addPlant,
  } = useStorage();

  const { weather } = useWeather(location);

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showIdentifier, setShowIdentifier] = useState(false);

  const today = new Date();
  const todayStr = formatDate(today);

  const handleWater = (plantId: string) => {
    updatePlant(plantId, { lastWatered: todayStr });
  };

  const handleSunDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        sunDoneDate: plant.sunDoneDate === todayStr ? null : todayStr
      });
    }
  };

  const handleOutdoorDone = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, {
        outdoorDoneDate: plant.outdoorDoneDate === todayStr ? null : todayStr
      });
    }
  };

  const handleAddPlant = async (plantData: Omit<Plant, 'id'>, imageUri?: string | null) => {
    const plantId = Date.now().toString();

    // Upload image if provided
    let imageUrl: string | undefined;
    if (imageUri) {
      const uploadedUrl = await uploadPlantImage(imageUri, plantId);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    const newPlant: Plant = {
      ...plantData,
      id: plantId,
      imageUrl,
    };
    addPlant(newPlant);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>Cargando plantas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderPlant = ({ item }: { item: Plant }) => (
    <PlantCard
      plant={item}
      today={today}
      weather={weather}
      onWater={handleWater}
      onSunDone={handleSunDone}
      onOutdoorDone={handleOutdoorDone}
      onDelete={deletePlant}
    />
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Mis Plantas</Text>
      <Text style={styles.subtitle}>
        {plants.length === 0
          ? 'No tenes plantas todavia'
          : plants.length === 1
          ? '1 planta en tu jardin'
          : `${plants.length} plantas en tu jardin`}
      </Text>

      {/* Tip card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Consejo</Text>
          <Text style={styles.tipText}>
            Toca una planta para ver sus tareas del dia. Arrastra hacia abajo para
            actualizar. Usa el boton + para agregar nuevas plantas.
          </Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>Sin plantas todavia</Text>
      <Text style={styles.emptyText}>
        Toca el boton + para agregar tu primera planta y comenzar a cuidar tu jardin.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={plants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Expanded FAB */}
      <ExpandedFAB
        onAddManual={() => setShowAddPlant(true)}
        onIdentify={() => setShowIdentifier(true)}
      />

      {/* Add Plant Modal */}
      <AddPlantModal
        visible={showAddPlant}
        onClose={() => setShowAddPlant(false)}
        onAdd={handleAddPlant}
      />

      {/* Plant Identifier Modal */}
      <PlantIdentifierModal
        visible={showIdentifier}
        onClose={() => setShowIdentifier(false)}
        onAddPlant={handleAddPlant}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.infoText,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.infoText,
    lineHeight: 19,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
