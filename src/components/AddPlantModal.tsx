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
import { colors, fonts, spacing, borderRadius } from "../theme";
import { Plant, PlantDBEntry } from "../types";
import { PLANT_TYPES, DAYS_ES } from "../data/constants";

interface AddPlantModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (plant: Omit<Plant, "id">, imageUri?: string | null) => void;
  prefilledPlant?: PlantDBEntry;
}

export function AddPlantModal({
  visible,
  onClose,
  onAdd,
  prefilledPlant,
}: AddPlantModalProps) {
  const [name, setName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("otra");
  const [waterEvery, setWaterEvery] = useState("4");
  const [sunHours, setSunHours] = useState("3");
  const [sunDays, setSunDays] = useState<number[]>([]);
  const [outdoorDays, setOutdoorDays] = useState<number[]>([]);

  // Reset or prefill form when modal opens
  useEffect(() => {
    if (visible) {
      if (prefilledPlant) {
        setName(prefilledPlant.name);
        // Match plant type from database
        const matchedType = PLANT_TYPES.find(
          (t) =>
            t.name.toLowerCase() === prefilledPlant.category.toLowerCase() ||
            t.id === prefilledPlant.category
        );
        setSelectedTypeId(matchedType?.id || "otra");
        setWaterEvery(String(prefilledPlant.waterDays));
        setSunHours(String(prefilledPlant.sunHours));
        setSunDays([]);
        setOutdoorDays(prefilledPlant.outdoor ? [0, 6] : []);
      } else {
        resetForm();
      }
    }
  }, [visible, prefilledPlant]);

  const resetForm = () => {
    setName("");
    setSelectedTypeId("otra");
    setWaterEvery("4");
    setSunHours("3");
    setSunDays([]);
    setOutdoorDays([]);
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedTypeId(typeId);
    const plantType = PLANT_TYPES.find((t) => t.id === typeId);
    if (plantType) {
      setWaterEvery(String(plantType.waterDays));
      setSunHours(String(plantType.sunHours));
    }
  };

  const toggleDay = (
    dayIndex: number,
    days: number[],
    setDays: (days: number[]) => void
  ) => {
    if (days.includes(dayIndex)) {
      setDays(days.filter((d) => d !== dayIndex));
    } else {
      setDays([...days, dayIndex]);
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    const selectedType = PLANT_TYPES.find((t) => t.id === selectedTypeId);

    const newPlant: Omit<Plant, "id"> = {
      name: name.trim(),
      typeId: selectedTypeId,
      typeName: selectedType?.name || "Otra",
      icon: selectedType?.icon || "🌻",
      waterEvery: parseInt(waterEvery) || 4,
      sunHours: parseInt(sunHours) || 3,
      sunDays,
      outdoorDays,
      lastWatered: null,
      sunDoneDate: null,
      outdoorDoneDate: null,
    };

    onAdd(newPlant);
    onClose();
  };

  const selectedType = PLANT_TYPES.find((t) => t.id === selectedTypeId);

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

            <Text style={styles.title}>Nueva planta</Text>

            {prefilledPlant && (
              <View style={styles.prefilledBanner}>
                <Text style={styles.prefilledIcon}>{prefilledPlant.icon}</Text>
                <View style={styles.prefilledInfo}>
                  <Text style={styles.prefilledName}>{prefilledPlant.name}</Text>
                  <Text style={styles.prefilledTip}>{prefilledPlant.tip}</Text>
                </View>
              </View>
            )}

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Name input */}
              <View style={styles.section}>
                <Text style={styles.label}>NOMBRE</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Mi potus favorito"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              {/* Plant type selector */}
              <View style={styles.section}>
                <Text style={styles.label}>TIPO DE PLANTA</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.typeSelector}
                >
                  {PLANT_TYPES.map((type) => (
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

              {/* Watering interval */}
              <View style={styles.section}>
                <Text style={styles.label}>RIEGO CADA (DIAS)</Text>
                <View style={styles.numberInputRow}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      setWaterEvery(String(Math.max(1, parseInt(waterEvery) - 1)))
                    }
                  >
                    <Text style={styles.numberButtonText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.numberInput}
                    value={waterEvery}
                    onChangeText={setWaterEvery}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      setWaterEvery(String(parseInt(waterEvery) + 1))
                    }
                  >
                    <Text style={styles.numberButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sun hours */}
              <View style={styles.section}>
                <Text style={styles.label}>HORAS DE SOL</Text>
                <View style={styles.numberInputRow}>
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() =>
                      setSunHours(String(Math.max(0, parseInt(sunHours) - 1)))
                    }
                  >
                    <Text style={styles.numberButtonText}>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.numberInput}
                    value={sunHours}
                    onChangeText={setSunHours}
                    keyboardType="number-pad"
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setSunHours(String(parseInt(sunHours) + 1))}
                  >
                    <Text style={styles.numberButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sun days */}
              <View style={styles.section}>
                <Text style={styles.label}>DIAS PARA SOL</Text>
                <View style={styles.daysRow}>
                  {DAYS_ES.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        sunDays.includes(index) && styles.dayChipSelected,
                      ]}
                      onPress={() => toggleDay(index, sunDays, setSunDays)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          sunDays.includes(index) && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Outdoor days */}
              <View style={styles.section}>
                <Text style={styles.label}>DIAS EXTERIOR</Text>
                <View style={styles.daysRow}>
                  {DAYS_ES.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayChip,
                        outdoorDays.includes(index) && styles.dayChipSelectedOutdoor,
                      ]}
                      onPress={() => toggleDay(index, outdoorDays, setOutdoorDays)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          outdoorDays.includes(index) && styles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
                onPress={handleAdd}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>Agregar</Text>
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
    backgroundColor: "rgba(45, 58, 46, 0.4)",
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
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayChip: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayChipSelected: {
    backgroundColor: colors.sunGold,
    borderColor: colors.sunGold,
  },
  dayChipSelectedOutdoor: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  dayText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
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
