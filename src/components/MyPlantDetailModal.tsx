import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  LayoutChangeEvent,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { Plant, PlantPhoto, WeatherData, SavedDiagnosis, Location } from '../types';
import type { ToxLevel } from '../types';
import { getPetToxicity } from '../utils/petToxicity';
import { getPlantCategories, getCatalogEntry, getTranslatedPlant } from '../data/plantDatabase';
import { getPlantTypes } from '../data/constants';
import { calculatePlantHealth } from '../utils/plantHealth';
import { findDatabaseEntry } from '../utils/plantInfo';
import { PlantHealthBadge } from './PlantHealthBadge';
import { PlantPhotoAlbum } from './PlantPhotoAlbum';
import { PlantDiagnosisModal, DiagnosisHistoryItem, DiagnosisDetailModal } from './PlantDiagnosis';
import { ActiveProblemsSection } from './ActiveProblemsSection';
import { MigrationTooltip } from './MigrationTooltip';
import { EducationalSection } from './plant-detail/EducationalSection';
import { compareUserVsCatalog, OverrideField, OverrideResult } from '../utils/overrideDetection';
import { usePremiumGate } from '../config/premium';
import { usePremium } from '../hooks/usePremium';
import { useStorage } from '../hooks/useStorage';
import { getEffectiveSeason, type WaterSeason } from '../utils/seasonality';
import { getSeasonalInterval } from '../utils/plantLogic';
import { getLightLabel } from '../utils/lightLabel';

/** v1.2 Phase 19 (TOX-04) — modal section anchors for scroll-to behavior. */
export type ModalSectionId = 'que-hacer' | 'donde' | 'por-que' | 'tus-ajustes' | 'mascotas';

interface MyPlantDetailModalProps {
  visible: boolean;
  plant: Plant | null;
  weather: WeatherData | null;
  latitude: number | null;
  onClose: () => void;
  onDelete: (plantId: string) => void;
  onAddPhoto: (plantId: string, photo: PlantPhoto) => void;
  onDeletePhoto: (plantId: string, photoId: string) => void;
  /** v1.2 Phase 19 (TOX-04) — when set, modal scrolls to that section after layout. Reset to undefined on close. */
  initialSection?: ModalSectionId;
}

export function MyPlantDetailModal({
  visible,
  plant,
  weather,
  latitude,
  onClose,
  onDelete,
  onAddPhoto,
  onDeletePhoto,
  initialSection,
}: MyPlantDetailModalProps) {
  const { t } = useTranslation();
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<SavedDiagnosis | null>(null);
  const [resumeDiagnosis, setResumeDiagnosis] = useState<SavedDiagnosis | null>(null);
  const { canDiagnose, isPremium } = usePremiumGate();
  const { showPaywall } = usePremium();
  const { diagnosisCount, getDiagnosesForPlant, climateOverride } = useStorage();

  // Phase 19 (TOX-04): ScrollView ref + section layout tracking for scroll-to-section.
  const scrollViewRef = useRef<ScrollView>(null);
  const sectionLayouts = useRef<Partial<Record<ModalSectionId, number>>>({});

  const onSectionLayout = (id: ModalSectionId) => (e: LayoutChangeEvent) => {
    sectionLayouts.current[id] = e.nativeEvent.layout.y;
  };

  const healthStatus = useMemo(() => {
    if (!plant) return null;
    const today = new Date();
    const locationObj: Location | null = latitude !== null ? { lat: latitude, lon: 0, name: '', country: '' } : null;
    const season = getEffectiveSeason(locationObj, climateOverride, today);
    return calculatePlantHealth(plant, today, weather, undefined, season);
  }, [plant, weather, latitude, climateOverride]);

  const allPlantDiagnoses = useMemo(() => {
    if (!plant) return [];
    return getDiagnosesForPlant(plant.id);
  }, [plant, getDiagnosesForPlant]);

  const plantDiagnoses = useMemo(() => {
    return allPlantDiagnoses.slice(0, 5);
  }, [allPlantDiagnoses]);

  // Phase 8 (CAT-04): prefer direct id lookup via getCatalogEntry over fuzzy findDatabaseEntry.
  // Defensive 3-rung fallback: getCatalogEntry(databaseId) → findDatabaseEntry (fuzzy, covers
  // user-created custom plants without databaseId) → null.
  const dbEntry = useMemo(() => {
    if (!plant) return null;
    const raw = (plant.databaseId ? getCatalogEntry(plant.databaseId) : null)
      ?? findDatabaseEntry(plant);
    return raw ? getTranslatedPlant(raw) : null;
  }, [plant]);

  // Phase 14 (EDU-01 + RESEARCH §Open Questions Q1 lock): strict-only catalog resolution
  // for the 5 NEW educational fields (careAction / placement* / whyRationale). Fuzzy
  // findDatabaseEntry is NOT used here — prevents wrong-plant educational content for
  // ambiguous user-named plants. The legacy `dbEntry` (with fuzzy fallback) above stays
  // for nutrients access (folded into the 🌿 ¿Qué hacer? section).
  const strictDbEntry = useMemo(() => {
    if (!plant?.databaseId) return null;
    const raw = getCatalogEntry(plant.databaseId);
    return raw ? getTranslatedPlant(raw) : null;
  }, [plant]);

  // Phase 19 (TOX-04): pet toxicity from strict catalog entry; helper resolves absence to 'unknown'.
  const petToxicity = getPetToxicity(strictDbEntry);

  // Phase 18 CARD-03: tip relocated from PlantCard. Preserve the 3-rung fallback
  // chain (Pitfall 9): catalog entry → plantType.tip → ''. Custom plants without
  // databaseId still get plantType.tip; plants with stale plantType still get ''.
  const relocatedCatalogEntry = plant?.databaseId ? getCatalogEntry(plant.databaseId) : null;
  const relocatedTranslatedEntry = relocatedCatalogEntry ? getTranslatedPlant(relocatedCatalogEntry) : null;
  const relocatedPlantType = plant ? getPlantTypes().find(pt => pt.id === plant.typeId) : undefined;
  const relocatedTip = relocatedTranslatedEntry?.tip ?? relocatedPlantType?.tip ?? '';

  // Override detection (EDU-05) — feeds the ⚙️ Tus ajustes section's inline override notes.
  // Compares against strict entry only (canonical recommendation, no false positives from fuzzy).
  const overrides = useMemo(
    () => (plant ? compareUserVsCatalog(plant, strictDbEntry) : []),
    [plant, strictDbEntry]
  );
  const hasOverride = (field: OverrideField) =>
    overrides.some((o: OverrideResult) => o.field === field);

  // Phase 6 (SEASON-05, LIGHT-06/07): season-aware interval + localized light label.
  // Phase 7: getEffectiveSeason replaces getWaterSeason — honors climateOverride.
  // Hooks: useMemo to recompute only when lat/override/plant/locale changes — keeps render cheap.
  const { currentSeason, waterInterval, lightLabel, seasonKey } = useMemo(() => {
    const today = new Date();
    const locationObj: Location | null = latitude !== null ? { lat: latitude, lon: 0, name: '', country: '' } : null;
    const season: WaterSeason = getEffectiveSeason(locationObj, climateOverride, today);
    const interval = plant ? getSeasonalInterval(plant, season) : 0;
    const label = plant ? getLightLabel(plant, t) : '';
    // 'tropical' is its own label key; 'cold' is cold; everything else (incl. 'warm') is warm.
    const key: 'warm' | 'cold' | 'tropical' =
      season === 'cold' ? 'cold' : season === 'tropical' ? 'tropical' : 'warm';
    return { currentSeason: season, waterInterval: interval, lightLabel: label, seasonKey: key };
  }, [plant, latitude, climateOverride, t]);

  const resolvedImageUrl = useMemo(() => {
    if (!plant) return null;
    if (plant.imageUrl) return plant.imageUrl;
    return dbEntry?.imageUrl || null;
  }, [plant, dbEntry]);

  // Phase 19 (TOX-04): scroll to initialSection after layout settles.
  // Pitfall 2 mitigation: defer to next tick so onLayout callbacks fire first.
  useEffect(() => {
    if (!visible || !initialSection) return;
    const timer = setTimeout(() => {
      const y = sectionLayouts.current[initialSection];
      if (y != null) {
        scrollViewRef.current?.scrollTo({ y, animated: true });
      }
    }, 50); // 50ms gives slow devices enough time for layout settle (Pitfall 2 fallback)
    return () => clearTimeout(timer);
  }, [visible, initialSection]);

  // Phase 19 (TOX-04): reset cached layouts on modal hide so re-open captures fresh y-coords.
  useEffect(() => {
    if (!visible) {
      sectionLayouts.current = {};
    }
  }, [visible]);

  if (!plant) return null;

  // iOS can't stack two top-level Modals — close this one first, then open the paywall after the
  // slide-down animation finishes
  const requestPaywall = (trigger: string) => {
    onClose();
    setTimeout(() => showPaywall(trigger), 350);
  };

  const handleDiagnose = () => {
    if (!canDiagnose(diagnosisCount)) {
      requestPaywall('plant_diagnosis');
      return;
    }
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
            ref={scrollViewRef}
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
              <Text style={styles.typeName}>{getPlantCategories().find(c => c.id === plant.typeId)?.name || plant.typeName}</Text>
              {healthStatus && healthStatus.score < 100 && (
                <View style={styles.healthRow}>
                  <PlantHealthBadge healthStatus={healthStatus} />
                </View>
              )}
            </View>

            {/* Phase 6: SEASON-05 + LIGHT-06/07 — season-aware interval with badge + localized light label */}
            <View style={styles.infoRow}>
              <View style={styles.infoPill}>
                <Text style={styles.infoPillIcon}>💧</Text>
                <Text style={styles.infoPillText}>
                  {t('plantDetail.seasonBadge.every', { days: waterInterval })}
                  {' — '}
                  <Text style={styles.seasonQualifier}>
                    {t(`plantDetail.seasonBadge.${seasonKey}`)}
                  </Text>
                </Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoPillIcon}>☀️</Text>
                <Text style={styles.infoPillText}>
                  {lightLabel}
                </Text>
              </View>
            </View>

            {/* Diagnose button */}
            <TouchableOpacity
              style={[styles.diagnoseButton, !canDiagnose(diagnosisCount) && styles.diagnoseButtonDisabled]}
              onPress={handleDiagnose}
              activeOpacity={0.7}
            >
              <Text style={styles.diagnoseButtonIcon}>{canDiagnose(diagnosisCount) ? '🔬' : '🔒'}</Text>
              <Text style={styles.diagnoseButtonText}>{t('diagnosis.diagnoseHealth')}</Text>
            </TouchableOpacity>

            {/* ═══════════════════════════════════════════════════════════════
                Phase 14 (EDU-01) Educational sections — 4-section restructure
                Replaces existing nutrients card + standalone ActiveProblemsSection.
                Order locked per CONTEXT.md: 🌿 → 🏠 → ℹ️ → ⚙️
                ═══════════════════════════════════════════════════════════════ */}

            {/* 🌿 ¿Qué hacer? — folds Active Problems + careAction + nutrients.
                Empty-state placeholder shown when nothing to render (no diagnoses,
                no careAction fields, no nutrients) — common for custom plants. */}
            <View onLayout={onSectionLayout('que-hacer')}>
              <EducationalSection emoji="🌿" title={t('plantDetailModal.whatToDo')}>
                {(() => {
                  const hasDiagnoses = allPlantDiagnoses.length > 0;
                  const hasCareAction = !!(strictDbEntry?.careAction?.fixed || strictDbEntry?.careAction?.soilCheck);
                  const hasNutrients = !!dbEntry?.nutrients;
                  const hasRelocatedTip = relocatedTip.length > 0;
                  if (!hasDiagnoses && !hasCareAction && !hasNutrients && !hasRelocatedTip) {
                    return <Text style={styles.placeholderCopy}>{t('plantDetailModal.emptyWhatToDo')}</Text>;
                  }
                  return (
                    <>
                      <ActiveProblemsSection
                        diagnoses={allPlantDiagnoses}
                        plantIcon={plant.icon}
                        onPressDiagnosis={(d) => {
                          setResumeDiagnosis(d);
                          setShowDiagnosis(true);
                        }}
                      />
                      {strictDbEntry?.careAction?.fixed && (
                        <Text style={styles.eduCopy}>{strictDbEntry.careAction.fixed}</Text>
                      )}
                      {strictDbEntry?.careAction?.soilCheck && (
                        <Text style={styles.eduCopy}>{strictDbEntry.careAction.soilCheck}</Text>
                      )}
                      {dbEntry?.nutrients && (
                        <View style={styles.nutrientsCardEdu}>
                          <Text style={styles.nutrientsType}>🧪 {dbEntry.nutrients.type}</Text>
                          <Text style={styles.nutrientsHomemade}>
                            🏡 {t('plantDetail.homemadeRecipe')}: {dbEntry.nutrients.homemade}
                          </Text>
                        </View>
                      )}
                      {relocatedTip ? (
                        <Text style={styles.relocatedTip}>{relocatedTip}</Text>
                      ) : null}
                    </>
                  );
                })()}
              </EducationalSection>
            </View>

            {/* 🏠 ¿Dónde ponerla? — placement* fields; placeholder when strict null OR all placement fields empty */}
            <View onLayout={onSectionLayout('donde')}>
              <EducationalSection emoji="🏠" title={t('plantDetailModal.whereToPlace')}>
                {(() => {
                  const hasRecommended = !!strictDbEntry?.placementRecommended;
                  const hasAlternatives = !!(strictDbEntry?.placementAlternatives && strictDbEntry.placementAlternatives.length > 0);
                  const hasAvoid = !!strictDbEntry?.placementAvoid;
                  if (!strictDbEntry || (!hasRecommended && !hasAlternatives && !hasAvoid)) {
                    return <Text style={styles.placeholderCopy}>{t('plantDetailModal.notInCatalog')}</Text>;
                  }
                  return null;
                })()}
                {strictDbEntry && (strictDbEntry.placementRecommended || (strictDbEntry.placementAlternatives && strictDbEntry.placementAlternatives.length > 0) || strictDbEntry.placementAvoid) && (
                  <View>
                    {strictDbEntry.placementRecommended && (
                      <View style={styles.subBlock}>
                        <Text style={styles.subTitle}>{t('plantDetailModal.recommended')}</Text>
                        <Text style={styles.eduCopy}>{strictDbEntry.placementRecommended}</Text>
                      </View>
                    )}
                    {strictDbEntry.placementAlternatives && strictDbEntry.placementAlternatives.length > 0 && (
                      <View style={styles.subBlock}>
                        <Text style={styles.subTitle}>{t('plantDetailModal.alternatives')}</Text>
                        {strictDbEntry.placementAlternatives.map((alt, i) => (
                          <Text key={i} style={styles.bullet}>• {alt}</Text>
                        ))}
                      </View>
                    )}
                    {strictDbEntry.placementAvoid && (
                      <View style={styles.subBlock}>
                        <Text style={styles.subTitle}>{t('plantDetailModal.avoid')}</Text>
                        <Text style={styles.eduCopy}>{strictDbEntry.placementAvoid}</Text>
                      </View>
                    )}
                  </View>
                )}
              </EducationalSection>
            </View>

            {/* ℹ️ ¿Por qué? — single backing field; SKIP entire section if absent */}
            {strictDbEntry?.whyRationale && (
              <View onLayout={onSectionLayout('por-que')}>
                <EducationalSection emoji="ℹ️" title={t('plantDetailModal.why')}>
                  <Text style={styles.eduCopy}>{strictDbEntry.whyRationale}</Text>
                </EducationalSection>
              </View>
            )}

            {/* ⚙️ Tus ajustes — user data + override notes; works for ALL plants */}
            <View onLayout={onSectionLayout('tus-ajustes')}>
              <EducationalSection emoji="⚙️" title={t('plantDetailModal.yourSettings')}>
                {/* Light level row */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t('plantDetailModal.lightLabel')}</Text>
                  <Text style={styles.settingValue}>☀️ {lightLabel || '—'}</Text>
                  {hasOverride('lightLevel') && (
                    <Text style={styles.overrideNote}>
                      {t('plantDetailModal.overrideNote')}
                    </Text>
                  )}
                </View>
                {/* Watering warm row */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t('plantDetailModal.watering')} ({t('plantDetail.seasonBadge.warm')})
                  </Text>
                  <Text style={styles.settingValue}>
                    {plant.waterSchedule?.warm != null
                      ? t('plantDetailModal.everyDays', { days: plant.waterSchedule.warm })
                      : '—'}
                  </Text>
                  {hasOverride('waterScheduleWarm') && (
                    <Text style={styles.overrideNote}>
                      {t('plantDetailModal.overrideNote')}
                    </Text>
                  )}
                </View>
                {/* Watering cold row */}
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {t('plantDetailModal.watering')} ({t('plantDetail.seasonBadge.cold')})
                  </Text>
                  <Text style={styles.settingValue}>
                    {plant.waterSchedule?.cold != null
                      ? t('plantDetailModal.everyDays', { days: plant.waterSchedule.cold })
                      : '—'}
                  </Text>
                  {hasOverride('waterScheduleCold') && (
                    <Text style={styles.overrideNote}>
                      {t('plantDetailModal.overrideNote')}
                    </Text>
                  )}
                </View>
              </EducationalSection>
            </View>

            {/* Phase 19 (TOX-04): 5th educational section — ALWAYS visible per CONTEXT.md lock. */}
            <View onLayout={onSectionLayout('mascotas')}>
              <EducationalSection emoji="🐾" title={t('plantDetailModal.pets')}>
                <MascotasContent toxicity={petToxicity} plantId={plant?.databaseId} />
              </EducationalSection>
            </View>

            {/* Diagnosis History */}
            {plantDiagnoses.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historySectionTitle}>{t('diagnosis.diagnosisHistory')}</Text>
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
              onRequestPremium={() => requestPaywall('photo_album')}
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
          {/* W3: tooltip is a sibling of ScrollView (NOT inside it) so its
              absolute-fill backdrop overlays the entire modal card. UX-01. */}
          {plant._migratedFromV0 && visible ? (
            <MigrationTooltip plantId={plant.id} />
          ) : null}
        </View>
      </View>
    </Modal>

    {plant && (
      <PlantDiagnosisModal
        visible={showDiagnosis}
        plant={plant}
        weather={weather}
        onClose={() => {
          setShowDiagnosis(false);
          setResumeDiagnosis(null);
        }}
        resumeDiagnosis={resumeDiagnosis}
      />
    )}

    <DiagnosisDetailModal
      visible={!!selectedDiagnosis}
      diagnosis={selectedDiagnosis}
      onClose={() => setSelectedDiagnosis(null)}
      // Phase 9 (RESEARCH §Q3): closure captures setSelectedDiagnosis + setResumeDiagnosis +
      // setShowDiagnosis (and plant via outer scope) so DiagnosisDetailModal's deferred
      // showPaywall onSuccess can re-invoke this same closure after purchase succeeds.
      // No state-machine handoff needed — vanilla React closure suffices.
      onContinueChat={(diag) => {
        setSelectedDiagnosis(null);
        setResumeDiagnosis(diag);
        setShowDiagnosis(true);
      }}
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
  seasonQualifier: {
    color: colors.textSecondary,
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
  diagnoseButtonDisabled: {
    opacity: 0.5,
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

  // ─── Phase 14 (EDU-01) educational section sub-blocks ───
  eduCopy: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  placeholderCopy: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  subBlock: {
    marginBottom: spacing.md,
  },
  subTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  bullet: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },
  settingRow: {
    marginBottom: spacing.md,
  },
  settingLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  settingValue: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  overrideNote: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  nutrientsCardEdu: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  relocatedTip: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});

// ─── Phase 19 (TOX-04): Mascotas section sub-components ───────────────────────
// Defined at module level (below styles) so they can reference the styles object.
// Both components are file-private; only used within MyPlantDetailModal JSX.

function SpeciesLine({
  species,
  level,
  plantId,
}: {
  species: 'cats' | 'dogs';
  level: ToxLevel;
  plantId?: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const speciesLabel = t(`toxicity.species.${species}`); // "gatos" / "perros" / "cats" / "dogs"

  if (level === 'safe') {
    return <Text style={styles.eduCopy}>{t('toxicity.safeForSpecies', { species: speciesLabel })}</Text>;
  }
  if (level === 'unknown') {
    return <Text style={styles.eduCopy}>{t('toxicity.unverifiedLatam')}</Text>;
  }

  // 'caution' or 'toxic' — render header + symptoms bullets if available.
  const symptomsKey = `plants:${plantId ?? '__missing__'}.petToxicity.symptoms.${species}`;
  const symptoms = plantId
    ? (t(symptomsKey, { returnObjects: true, defaultValue: [] as string[] }) as string[])
    : [];
  const headerKey = level === 'toxic' ? 'toxicity.toxicForSpecies' : 'toxicity.cautionForSpecies';

  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={styles.eduCopy}>{t(headerKey, { species: speciesLabel })}</Text>
      {Array.isArray(symptoms) && symptoms.length > 0 && (
        <>
          <Text style={[styles.eduCopy, { fontFamily: fonts.bodySemiBold, marginTop: spacing.xs }]}>
            {t('toxicity.symptomsLabel')}
          </Text>
          {symptoms.map((s, i) => (
            <Text key={i} style={[styles.eduCopy, { marginLeft: spacing.sm }]}>
              {`• ${s}`}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

function MascotasContent({
  toxicity,
  plantId,
}: {
  toxicity: { cats: ToxLevel; dogs: ToxLevel };
  plantId?: string;
}): React.ReactElement {
  const { t } = useTranslation();
  const { cats, dogs } = toxicity;

  // Special case: both species 'safe' → single line per CONTEXT.md TOX-04.
  if (cats === 'safe' && dogs === 'safe') {
    return <Text style={styles.eduCopy}>{t('toxicity.safeForBoth')}</Text>;
  }

  // Otherwise: two independent lines (per-species asymmetry per CONTEXT.md TOX-04).
  return (
    <>
      <SpeciesLine species="cats" level={cats} plantId={plantId} />
      <SpeciesLine species="dogs" level={dogs} plantId={plantId} />
    </>
  );
}
