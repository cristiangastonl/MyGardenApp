import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  Dimensions,
} from 'react-native';
import { PlantDBEntry } from '../types';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PlantDetailModalProps {
  visible: boolean;
  plant: PlantDBEntry | null;
  onClose: () => void;
  onAdd: (plant: PlantDBEntry) => void;
}

const HUMIDITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
};

export function PlantDetailModal({ visible, plant, onClose, onAdd }: PlantDetailModalProps) {
  if (!plant) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Galería de imágenes */}
            {(plant.imageUrl || (plant.galleryUrls && plant.galleryUrls.length > 0)) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gallery}
                style={styles.galleryContainer}
              >
                {plant.imageUrl && (
                  <Image
                    source={{ uri: plant.imageUrl }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                )}
                {plant.galleryUrls?.map((url, index) => (
                  <Image
                    key={index}
                    source={{ uri: url }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

            <View style={styles.header}>
              {!plant.imageUrl && !plant.galleryUrls?.length && (
                <Text style={styles.icon}>{plant.icon}</Text>
              )}
              <Text style={styles.name}>{plant.name}</Text>
              <Text style={styles.scientificName}>{plant.scientificName}</Text>
            </View>

            <Text style={styles.description}>{plant.description}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💧</Text>
                <Text style={styles.infoLabel}>Riego</Text>
                <Text style={styles.infoValue}>Cada {plant.waterDays} dias</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>☀️</Text>
                <Text style={styles.infoLabel}>Sol</Text>
                <Text style={styles.infoValue}>{plant.sunHours}h por dia</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>🌡️</Text>
                <Text style={styles.infoLabel}>Temperatura</Text>
                <Text style={styles.infoValue}>{plant.tempMin}° - {plant.tempMax}°</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💨</Text>
                <Text style={styles.infoLabel}>Humedad</Text>
                <Text style={styles.infoValue}>{HUMIDITY_LABELS[plant.humidity]}</Text>
              </View>
            </View>

            <View style={styles.tipSection}>
              <Text style={styles.tipLabel}>CONSEJO</Text>
              <Text style={styles.tip}>{plant.tip}</Text>
            </View>

            {plant.problems.length > 0 && (
              <View style={styles.problemsSection}>
                <Text style={styles.problemsTitle}>PROBLEMAS COMUNES</Text>
                {plant.problems.map((problem, index) => (
                  <View key={index} style={styles.problemCard}>
                    <Text style={styles.symptom}>{problem.symptom}</Text>
                    <Text style={styles.cause}>Causa: {problem.cause}</Text>
                    <Text style={styles.solution}>Solucion: {problem.solution}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.addButton} onPress={() => onAdd(plant)}>
                <Text style={styles.addButtonText}>Agregar a mis plantas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface Styles {
  overlay: ViewStyle;
  container: ViewStyle;
  handle: ViewStyle;
  galleryContainer: ViewStyle;
  gallery: ViewStyle;
  galleryImage: ImageStyle;
  header: ViewStyle;
  icon: TextStyle;
  name: TextStyle;
  scientificName: TextStyle;
  description: TextStyle;
  infoGrid: ViewStyle;
  infoItem: ViewStyle;
  infoIcon: TextStyle;
  infoLabel: TextStyle;
  infoValue: TextStyle;
  tipSection: ViewStyle;
  tipLabel: TextStyle;
  tip: TextStyle;
  problemsSection: ViewStyle;
  problemsTitle: TextStyle;
  problemCard: ViewStyle;
  symptom: TextStyle;
  cause: TextStyle;
  solution: TextStyle;
  actions: ViewStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '90%',
    padding: spacing.xl,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  galleryContainer: {
    marginHorizontal: -spacing.xl,
    marginBottom: spacing.lg,
  },
  gallery: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  galleryImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: borderRadius.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
  },
  scientificName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  infoItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  tipSection: {
    backgroundColor: colors.infoBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  tipLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.infoText,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  tip: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.infoText,
    lineHeight: 20,
  },
  problemsSection: {
    marginBottom: spacing.lg,
  },
  problemsTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  problemCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  symptom: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cause: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  solution: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.green,
  },
  actions: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  addButton: {
    backgroundColor: colors.green,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  closeButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.textSecondary,
  },
});
