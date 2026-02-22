import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { PlantPhoto } from '../types';
import { usePremium } from '../hooks/usePremium';
import { pickPhoto, savePhoto, deletePhoto } from '../services/photoService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_GAP = spacing.sm;
const THUMB_SIZE = (SCREEN_WIDTH - spacing.xl * 2 - THUMB_GAP * 2) / 3;

interface PlantPhotoAlbumProps {
  plantId: string;
  photos: PlantPhoto[];
  onAddPhoto: (photo: PlantPhoto) => void;
  onDeletePhoto: (photoId: string) => void;
}

export function PlantPhotoAlbum({
  plantId,
  photos,
  onAddPhoto,
  onDeletePhoto,
}: PlantPhotoAlbumProps) {
  const { t } = useTranslation();
  const { isPremium, showPaywall } = usePremium();
  const [fullscreenPhoto, setFullscreenPhoto] = useState<PlantPhoto | null>(null);
  const [saving, setSaving] = useState(false);

  // Premium gate
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('photoAlbum.title')}</Text>
        <View style={styles.lockedContainer}>
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedIcon}>🖼</Text>
            <Text style={styles.lockedTitle}>{t('photoAlbum.premiumTitle')}</Text>
            <Text style={styles.lockedText}>{t('photoAlbum.premiumText')}</Text>
            <TouchableOpacity
              style={styles.unlockButton}
              onPress={() => showPaywall('photo_album')}
              activeOpacity={0.8}
            >
              <Text style={styles.unlockButtonText}>{t('photoAlbum.unlock')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const handlePickPhoto = async (source: 'camera' | 'gallery') => {
    try {
      const uri = await pickPhoto(source);
      if (!uri) return;
      setSaving(true);
      const photo = await savePhoto(plantId, uri);
      onAddPhoto(photo);
    } catch (e) {
      console.error('Error saving photo:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = () => {
    Alert.alert(
      t('photoAlbum.addPhoto'),
      undefined,
      [
        { text: t('photoAlbum.camera'), onPress: () => handlePickPhoto('camera') },
        { text: t('photoAlbum.gallery'), onPress: () => handlePickPhoto('gallery') },
        { text: t('photoAlbum.cancel'), style: 'cancel' },
      ]
    );
  };

  const handleDeletePhoto = (photo: PlantPhoto) => {
    Alert.alert(
      t('photoAlbum.deleteTitle'),
      t('photoAlbum.deleteMessage'),
      [
        { text: t('photoAlbum.cancel'), style: 'cancel' },
        {
          text: t('photoAlbum.delete'),
          style: 'destructive',
          onPress: async () => {
            setFullscreenPhoto(null);
            await deletePhoto(plantId, photo.id);
            onDeletePhoto(photo.id);
          },
        },
      ]
    );
  };

  const sortedPhotos = [...photos].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderThumb = ({ item }: { item: PlantPhoto }) => (
    <TouchableOpacity
      style={styles.thumb}
      onPress={() => setFullscreenPhoto(item)}
      onLongPress={() => handleDeletePhoto(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{t('photoAlbum.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPhoto}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.green} />
          ) : (
            <Text style={styles.addButtonText}>+ {t('photoAlbum.addPhoto')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {sortedPhotos.length === 0 ? (
        <TouchableOpacity style={styles.emptyState} onPress={handleAddPhoto} activeOpacity={0.7}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>{t('photoAlbum.emptyTitle')}</Text>
          <Text style={styles.emptyText}>{t('photoAlbum.emptyText')}</Text>
        </TouchableOpacity>
      ) : (
        <FlatList
          data={sortedPhotos}
          renderItem={renderThumb}
          keyExtractor={(item) => item.id}
          numColumns={3}
          scrollEnabled={false}
          columnWrapperStyle={styles.row}
        />
      )}

      {/* Fullscreen modal */}
      <Modal
        visible={!!fullscreenPhoto}
        animationType="fade"
        transparent
        onRequestClose={() => setFullscreenPhoto(null)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setFullscreenPhoto(null)}
          >
            <Text style={styles.fullscreenCloseText}>✕</Text>
          </TouchableOpacity>

          {fullscreenPhoto && (
            <View style={styles.fullscreenContent}>
              <Image
                source={{ uri: fullscreenPhoto.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
              <View style={styles.fullscreenInfo}>
                <Text style={styles.fullscreenDate}>
                  {formatDate(fullscreenPhoto.date)}
                </Text>
                {fullscreenPhoto.note && (
                  <Text style={styles.fullscreenNote}>{fullscreenPhoto.note}</Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePhoto(fullscreenPhoto)}
              >
                <Text style={styles.deleteButtonText}>{t('photoAlbum.delete')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  addButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.green,
  },

  // Grid
  row: {
    gap: THUMB_GAP,
    marginBottom: THUMB_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Locked (non-premium)
  lockedContainer: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  lockedOverlay: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  lockedIcon: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  lockedTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lockedText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  unlockButton: {
    backgroundColor: colors.premiumDark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.full,
  },
  unlockButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },

  // Fullscreen
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 60,
    right: spacing.xl,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCloseText: {
    fontSize: 22,
    color: colors.white,
  },
  fullscreenContent: {
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: SCREEN_WIDTH - spacing.xl * 2,
    borderRadius: borderRadius.lg,
  },
  fullscreenInfo: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  fullscreenDate: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.whiteSubdued,
  },
  fullscreenNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.whiteSubdued,
    marginTop: spacing.xs,
  },
  deleteButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    minHeight: 44,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.dangerText,
  },
});
