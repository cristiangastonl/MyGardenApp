import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Plant, PlantPhoto, WeatherData, SavedDiagnosis } from '../types';
import { calculatePlantHealth } from '../utils/plantHealth';
import { findDatabaseEntry } from '../utils/plantInfo';
import { PlantHealthBadge } from './PlantHealthBadge';
import { PlantPhotoAlbum } from './PlantPhotoAlbum';
import { PlantDiagnosisModal, DiagnosisHistoryItem, DiagnosisDetailModal } from './PlantDiagnosis';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';
import { useStorage } from '../hooks/useStorage';

interface MyPlantDetailModalProps {
  visible: boolean;
  plant: Plant | null;
  weather: WeatherData | null;
  onClose: () => void;
  onDelete: (plantId: string) => void;
  onAddPhoto: (plantId: string, photo: PlantPhoto) => void;
  onDeletePhoto: (plantId: string, photoId: string) => void;
}

export function MyPlantDetailModal({
  visible,
  plant,
  weather,
  onClose,
  onDelete,
  onAddPhoto,
  onDeletePhoto,
}: MyPlantDetailModalProps) {
  const { t } = useTranslation();
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<SavedDiagnosis | null>(null);
  const { canDiagnose } = usePremiumGate();
  const { showPaywall } = usePremium();
  const { diagnosisCount, incrementDiagnosisCount, getDiagnosesForPlant } = useStorage();

  const healthStatus = useMemo(() => {
    if (!plant) return null;
    return calculatePlantHealth(plant, new Date(), weather);
  }, [plant, weather]);

  const plantDiagnoses = useMemo(() => {
    if (!plant) return [];
    return getDiagnosesForPlant(plant.id).slice(0, 5);
  }, [plant, getDiagnosesForPlant]);

  const dbEntry = useMemo(() => {
    if (!plant) return null;
    return findDatabaseEntry(plant);
  }, [plant]);

  const resolvedImageUrl = useMemo(() => {
    if (!plant) return null;
    if (plant.imageUrl) return plant.imageUrl;
    return dbEntry?.imageUrl || null;
  }, [plant, dbEntry]);

  if (!plant) return null;

  const handleDiagnose = () => {
    if (!canDiagnose(diagnosisCount)) {
      showPaywall('plant_diagnosis');
      return;
    }
    incrementDiagnosisCount();
    setShowDiagnosis(true);
  };

  const handleDelete = () => {
    Alert.alert(
      t('plantDetail.deletePlant'),
      t('plantDetail.deleteConfirm', { name: plant.name }),
      [
        { text: t('plantDetail.cancel'), style: 'cancel' },
        {
          text: t('plantDetail.delete'),
          style: 'destructive',
          onPress: () => {
            onDelete(plant.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              {resolvedImageUrl ? (
                <Image
                  source={{ uri: resolvedImageUrl }}
                  style={styles.plantImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.icon}>{plant.icon}</Text>
              )}
              <Text style={styles.name}>{plant.name}</Text>
              <Text style={styles.typeName}>{plant.typeName}</Text>
              {healthStatus && healthStatus.score < 100 && (
                <View style={styles.healthRow}>
                  <PlantHealthBadge healthStatus={healthStatus} />
                </View>
              )}
            </View>

            {/* Info pills */}
            <View style={styles.infoRow}>
              <View style={styles.infoPill}>
                <Text style={styles.infoPillIcon}>💧</Text>
                <Text style={styles.infoPillText}>
                  {t('plantDetail.waterEvery', { days: plant.waterEvery })}
                </Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoPillIcon}>☀️</Text>
                <Text style={styles.infoPillText}>
                  {t('plantDetail.sunHours', { hours: plant.sunHours })}
                </Text>
              </View>
            </View>

            {/* Diagnose button */}
            <TouchableOpacity
              style={styles.diagnoseButton}
              onPress={handleDiagnose}
              activeOpacity={0.7}
            >
              <Text style={styles.diagnoseButtonIcon}>🔬</Text>
              <Text style={styles.diagnoseButtonText}>Diagnosticar salud</Text>
            </TouchableOpacity>

            {/* Nutrients */}
            {dbEntry?.nutrients && (
              <View style={styles.nutrientsSection}>
                <Text style={styles.nutrientsSectionTitle}>
                  {t('plantDetail.nutrients')}
                </Text>
                <View style={styles.nutrientsCard}>
                  <Text style={styles.nutrientsType}>🧪 {dbEntry.nutrients.type}</Text>
                  <Text style={styles.nutrientsHomemade}>🏡 {t('plantDetail.homemadeRecipe')}: {dbEntry.nutrients.homemade}</Text>
                </View>
              </View>
            )}

            {/* Diagnosis History */}
            {plantDiagnoses.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historySectionTitle}>HISTORIAL DE DIAGNÓSTICOS</Text>
                {plantDiagnoses.map((diagnosis) => (
                  <DiagnosisHistoryItem
                    key={diagnosis.id}
                    diagnosis={diagnosis}
                    onPress={setSelectedDiagnosis}
                  />
                ))}
              </View>
            )}

            {/* Photo Album */}
            <PlantPhotoAlbum
              plantId={plant.id}
              photos={plant.photos || []}
              onAddPhoto={(photo) => onAddPhoto(plant.id, photo)}
              onDeletePhoto={(photoId) => onDeletePhoto(plant.id, photoId)}
            />

            {/* Delete */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteButtonText}>{t('plantDetail.deletePlant')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>

    {plant && (
      <PlantDiagnosisModal
        visible={showDiagnosis}
        plant={plant}
        weather={weather}
        onClose={() => setShowDiagnosis(false)}
      />
    )}

    <DiagnosisDetailModal
      visible={!!selectedDiagnosis}
      diagnosis={selectedDiagnosis}
      onClose={() => setSelectedDiagnosis(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '92%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: fonts.bodyMedium,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl + 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.textPrimary,
  },
  typeName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  healthRow: {
    marginTop: spacing.md,
  },

  // Info
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoPillIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  infoPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },

  // Diagnose
  diagnoseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  diagnoseButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  diagnoseButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.green,
  },

  // Nutrients
  nutrientsSection: {
    marginBottom: spacing.sm,
  },
  nutrientsSectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  nutrientsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  nutrientsType: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  nutrientsHomemade: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.green,
    lineHeight: 20,
  },

  // History
  historySection: {
    marginBottom: spacing.sm,
  },
  historySectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  // Delete
  deleteButton: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.dangerText,
  },
});
