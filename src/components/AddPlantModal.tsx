import React, { useState, useEffect } from "react";
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
} from "react-native";
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius } from "../theme";
import { Plant, PlantDBEntry, LightLevel, WaterMode, WaterSchedule } from "../types";
import { getPlantTypes } from "../data/constants";
import { LightLevelPicker } from "./LightLevelPicker";
import { WaterScheduleEditor } from "./WaterScheduleEditor";
import { inferWaterMode } from "../utils/migration";

interface AddPlantModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (plant: Omit<Plant, "id">, imageUri?: string | null) => void;
  prefilledPlant?: PlantDBEntry | Plant;
}

export function AddPlantModal({
  visible,
  onClose,
  onAdd,
  prefilledPlant,
}: AddPlantModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("otra");
  const [lightLevel, setLightLevel] = useState<LightLevel>('bright_indirect');
  const [waterSchedule, setWaterSchedule] = useState<WaterSchedule>({ warm: 4, cold: 8 });
  const [waterMode, setWaterMode] = useState<WaterMode>('fixed');

  // Reset or prefill form when modal opens
  useEffect(() => {
    if (visible) {
      if (prefilledPlant) {
        setName(prefilledPlant.name);
        // PlantDBEntry uses .category; Plant uses .typeId — handle both shapes
        const categoryOrTypeId =
          ('category' in prefilledPlant && prefilledPlant.category) ||
          ('typeId' in prefilledPlant && prefilledPlant.typeId) ||
          'otra';
        const matchedType = getPlantTypes().find(
          (t) =>
            t.name.toLowerCase() === String(categoryOrTypeId).toLowerCase() ||
            t.id === categoryOrTypeId
        );
        setSelectedTypeId(matchedType?.id || "otra");

        // v1.1 fields with defensive ladder (v1.1 → legacy → default)
        // PlantDBEntry has .waterDays, Plant has .waterEvery — both legacy
        const legacyDays =
          ('waterDays' in prefilledPlant && prefilledPlant.waterDays) ||
          ('waterEvery' in prefilledPlant && prefilledPlant.waterEvery) ||
          4;
        setLightLevel(prefilledPlant.lightLevel ?? 'bright_indirect');
        setWaterSchedule(
          prefilledPlant.waterSchedule ?? { warm: legacyDays, cold: legacyDays * 2 }
        );
        // Plant doesn't expose category directly; PlantDBEntry has .category, Plant has .typeId
        const dbId = ('id' in prefilledPlant && 'category' in prefilledPlant) ? (prefilledPlant as PlantDBEntry).id : undefined;
        const cat = ('category' in prefilledPlant) ? (prefilledPlant as PlantDBEntry).category : undefined;
        setWaterMode(prefilledPlant.waterMode ?? inferWaterMode(cat, dbId));
      } else {
        resetForm();
      }
    }
  }, [visible, prefilledPlant]);

  const resetForm = () => {
    setName("");
    setSelectedTypeId("otra");
    setLightLevel('bright_indirect');
    setWaterSchedule({ warm: 4, cold: 8 });
    setWaterMode('fixed');
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypeId(typeId);
    const plantType = getPlantTypes().find((pt) => pt.id === typeId);
    if (plantType) {
      // PlantType has legacy waterDays + sunHours; derive v1.1 defaults
      setWaterSchedule({ warm: plantType.waterDays || 4, cold: (plantType.waterDays || 4) * 2 });
      setWaterMode(inferWaterMode(typeId as any));
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    const selectedType = getPlantTypes().find((pt) => pt.id === selectedTypeId);

    const newPlant: Omit<Plant, "id"> = {
      name: name.trim(),
      typeId: selectedTypeId,
      typeName: selectedType?.name || "Otra",
      icon: selectedType?.icon || "🌻",
      // v1.1 schema (Phase 7 LIGHT-01, LIGHT-02, WATER-01, WATER-02, WATER-03)
      lightLevel,
      waterSchedule,
      waterMode,
      sunDays: [],
      outdoorDays: [],
      lastWatered: null,
      sunDoneDate: null,
      outdoorDoneDate: null,
    };

    onAdd(newPlant);
    onClose();
  };

  const selectedType = getPlantTypes().find((pt) => pt.id === selectedTypeId);

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

            <Text style={styles.title}>{t('addPlant.title')}</Text>

            {prefilledPlant && (
              <View style={styles.prefilledBanner}>
                <Text style={styles.prefilledIcon}>{prefilledPlant.icon}</Text>
                <View style={styles.prefilledInfo}>
                  <Text style={styles.prefilledName}>{prefilledPlant.name}</Text>
                  {('tip' in prefilledPlant) && (
                    <Text style={styles.prefilledTip}>{(prefilledPlant as PlantDBEntry).tip}</Text>
                  )}
                </View>
              </View>
            )}

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Name input */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('addPlant.name')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('addPlant.namePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Plant type selector */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('addPlant.plantType')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.typeSelector}
                >
                  {getPlantTypes().map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeChip,
                        selectedTypeId === type.id && styles.typeChipSelected,
                      ]}
                      onPress={() => handleTypeSelect(type.id)}
                    >
                      <Text style={styles.typeIcon}>{type.icon}</Text>
                      <Text
                        style={[
                          styles.typeName,
                          selectedTypeId === type.id && styles.typeNameSelected,
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {selectedType && (
                  <Text style={styles.typeTip}>{selectedType.tip}</Text>
                )}
              </View>

              {/* Light level — Phase 7 (LIGHT-01, LIGHT-02) */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('identification.lightLevelLabel')}</Text>
                <LightLevelPicker
                  typeId={selectedTypeId}
                  value={lightLevel}
                  onChange={setLightLevel}
                />
              </View>

              {/* Water schedule — Phase 7 (WATER-01, WATER-02, WATER-03) */}
              <View style={styles.section}>
                <Text style={styles.label}>{t('addPlant.waterScheduleSection')}</Text>
                <WaterScheduleEditor
                  mode={waterMode}
                  schedule={waterSchedule}
                  onModeChange={setWaterMode}
                  onScheduleChange={setWaterSchedule}
                />
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>{t('addPlant.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>{t('addPlant.add')}</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: "90%",
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  prefilledBanner: {
    flexDirection: "row",
    backgroundColor: colors.infoBg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  prefilledIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  prefilledInfo: {
    flex: 1,
  },
  prefilledName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.infoText,
  },
  prefilledTip: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.infoText,
    marginTop: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typeChipSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  typeName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  typeNameSelected: {
    color: colors.white,
  },
  typeTip: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },
  numberInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  numberButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  numberButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  numberInput: {
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
    color: colors.textPrimary,
    width: 60,
    textAlign: "center",
  },
  bottomPadding: {
    height: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
});
