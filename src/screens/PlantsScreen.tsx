import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import { LoadingScreen } from '../components/LoadingScreen';
import { useStorage } from '../hooks/useStorage';
import { useWeather } from '../hooks/useWeather';
import { Plant } from '../types';
import {
  PlantCard,
  ExpandedFAB,
  AddPlantModal,
  PlantIdentifierModal,
  MyPlantDetailModal,
} from '../components';
import { PlantDiagnosisModal } from '../components/PlantDiagnosis/PlantDiagnosisModal';
import { uploadPlantImage } from '../services/imageService';
import { trackEvent } from '../services/analyticsService';
import { Features } from '../config/features';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';

export default function PlantsScreen() {
  const { t } = useTranslation();
  const premium = usePremiumGate();
  const { showPaywall } = usePremium();
  const {
    plants,
    plantNetApiKey,
    location,
    loading,
    identificationCount,
    incrementIdentificationCount,
    updatePlant,
    deletePlant,
    addPlant,
    addPhotoToPlant,
    removePhotoFromPlant,
    diagnosisHistory,
    getActiveDiagnosesForPlant,
  } = useStorage();

  const { weather } = useWeather(location);

  const [showAddPlant, setShowAddPlant] = useState(false);
  const [showIdentifier, setShowIdentifier] = useState(false);
  const [detailPlant, setDetailPlant] = useState<Plant | null>(null);
  const [diagnosePlantState, setDiagnosePlantState] = useState<Plant | null>(null);
  const [diagnosisInitialImages, setDiagnosisInitialImages] = useState<Array<{ uri: string; base64: string }> | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenAddPlant = () => {
    if (!premium.canAddPlant(plants.length)) {
      showPaywall('plant_limit');
      return;
    }
    setShowAddPlant(true);
  };

  const today = new Date();

  const handleAddPlant = async (plantData: Omit<Plant, 'id'>, imageUri?: string | null): Promise<Plant> => {
    const plantId = Date.now().toString();

    // Upload image if provided
    let imageUrl: string | undefined;
    if (imageUri) {
      try {
        const uploadedUrl = await uploadPlantImage(imageUri, plantId);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      } catch (e) {
        console.error('Error uploading plant image:', e);
      }
    }

    const newPlant: Plant = {
      ...plantData,
      id: plantId,
      imageUrl,
    };
    addPlant(newPlant);
    trackEvent('plant_added', { plant_name: plantData.name, source: 'plants' });
    return newPlant;
  };

  const handleDeletePlant = (plantId: string) => {
    deletePlant(plantId);
    trackEvent('plant_deleted', { plant_id: plantId });
  };

  const handleToggleFavorite = (plantId: string) => {
    const plant = plants.find(p => p.id === plantId);
    if (plant) {
      updatePlant(plantId, { favorite: !plant.favorite });
    }
  };

  // Filter by search query and sort: favorites first
  const sortedPlants = [...plants]
    .filter((plant) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        plant.name.toLowerCase().includes(query) ||
        plant.typeName.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
      return 0;
    });

  if (loading) {
    return <LoadingScreen message={t('plants.loadingPlants')} />;
  }

  const renderPlant = ({ item }: { item: Plant }) => (
    <PlantCard
      plant={item}
      today={today}
      weather={weather}
      mode="collection"
      onDelete={handleDeletePlant}
      onPress={setDetailPlant}
      onToggleFavorite={handleToggleFavorite}
      diagnoses={diagnosisHistory[item.id]}
      hasActiveDiagnosis={getActiveDiagnosesForPlant(item.id).length > 0}
    />
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('plants.title')}</Text>
      <Text style={styles.subtitle}>
        {plants.length === 0
          ? t('plants.noPlants')
          : t('plants.plantCount', { count: plants.length })}
      </Text>

      {/* Search bar */}
      {plants.length > 0 && (
        <TextInput
          style={styles.searchBar}
          placeholder={t('plants.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      )}

      {/* Tip card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{t('plants.tip')}</Text>
          <Text style={styles.tipText}>
            {t('plants.tipText')}
          </Text>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🌿</Text>
      <Text style={styles.emptyTitle}>{t('plants.emptyTitle')}</Text>
      <Text style={styles.emptyText}>
        {t('plants.emptyText')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sortedPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      <ExpandedFAB
        onAddManual={handleOpenAddPlant}
        onIdentify={() => {
          if (!premium.canIdentify(identificationCount)) {
            showPaywall('plant_identification');
            return;
          }
          setShowIdentifier(true);
        }}
        showIdentifyOption={Features.PLANT_IDENTIFICATION}
      />

      {/* Add Plant Modal */}
      <AddPlantModal
        visible={showAddPlant}
        onClose={() => setShowAddPlant(false)}
        onAdd={handleAddPlant}
      />

      {/* Plant Identifier Modal — only when flag is on */}
      {Features.PLANT_IDENTIFICATION && (
        <PlantIdentifierModal
          visible={showIdentifier}
          onClose={() => setShowIdentifier(false)}
          onAddPlant={async (plantData, imageUri) => {
            incrementIdentificationCount();
            return handleAddPlant(plantData, imageUri);
          }}
          isPremium={premium.isPremium}
          onDiagnoseAfterIdentify={(plant, reusePhotos, capturedUri, capturedBase64) => {
            setShowIdentifier(false);
            setDiagnosePlantState(plant);
            setDiagnosisInitialImages(reusePhotos && capturedUri && capturedBase64 ? [{ uri: capturedUri, base64: capturedBase64 }] : undefined);
          }}
        />
      )}

      {/* Diagnosis Modal from Identify flow */}
      {diagnosePlantState && (
        <PlantDiagnosisModal
          visible={!!diagnosePlantState}
          plant={diagnosePlantState}
          weather={weather}
          initialImages={diagnosisInitialImages}
          onClose={() => {
            setDiagnosePlantState(null);
            setDiagnosisInitialImages(undefined);
          }}
        />
      )}

      {/* Plant Detail Modal with Photo Album */}
      <MyPlantDetailModal
        visible={!!detailPlant}
        plant={detailPlant ? plants.find(p => p.id === detailPlant.id) ?? detailPlant : null}
        weather={weather}
        onClose={() => setDetailPlant(null)}
        onDelete={(id) => {
          handleDeletePlant(id);
          setDetailPlant(null);
        }}
        onAddPhoto={addPhotoToPlant}
        onDeletePhoto={removePhotoFromPlant}
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
    paddingBottom: spacing.fabClearance,
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
  searchBar: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    ...shadows.sm,
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
