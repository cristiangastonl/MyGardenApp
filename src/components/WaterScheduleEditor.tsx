/**
 * Phase 7 (WATER-01, WATER-02, WATER-03). Watering mode toggle + warm/cold schedule editor.
 *
 * Segmented control toggles between 'fixed' (calendar-driven, two intervals) and
 * 'soil_check' (no intervals, user touches soil). soil_check HIDES the warm/cold
 * inputs entirely (not disabled — RESEARCH §Manual-Only Verifications #2 lock).
 *
 * Numeric input pattern reuses AddPlantModal's existing +/- + TextInput layout for
 * visual consistency with the rest of the form.
 *
 * Consumed by:
 *  - AddPlantModal (Plan 07-05) — replaces the legacy waterEvery numeric input
 */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { WaterMode, WaterSchedule } from '../types';
import { colors, fonts, spacing, borderRadius } from '../theme';

interface WaterScheduleEditorProps {
  mode: WaterMode;
  schedule: WaterSchedule;
  onModeChange: (mode: WaterMode) => void;
  onScheduleChange: (schedule: WaterSchedule) => void;
}

export function WaterScheduleEditor({ mode, schedule, onModeChange, onScheduleChange }: WaterScheduleEditorProps) {
  const { t } = useTranslation();

  const adjustWarm = (delta: number) => {
    const next = Math.max(1, schedule.warm + delta);
    onScheduleChange({ ...schedule, warm: next });
  };
  const adjustCold = (delta: number) => {
    const next = Math.max(2, schedule.cold + delta);
    onScheduleChange({ ...schedule, cold: next });
  };

  return (
    <View>
      {/* Segmented mode control */}
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segment, mode === 'fixed' && styles.segmentSelected]}
          onPress={() => onModeChange('fixed')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'fixed' }}
        >
          <Text style={[styles.segmentText, mode === 'fixed' && styles.segmentTextSelected]}>
            {t('waterSchedule.modeFixed')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, mode === 'soil_check' && styles.segmentSelected]}
          onPress={() => onModeChange('soil_check')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'soil_check' }}
        >
          <Text style={[styles.segmentText, mode === 'soil_check' && styles.segmentTextSelected]}>
            {t('waterSchedule.modeSoilCheck')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fixed mode: two side-by-side warm/cold inputs */}
      {mode === 'fixed' && (
        <View style={styles.inputsRow}>
          <View style={styles.inputColumn}>
            <Text style={styles.inputLabel}>{t('waterSchedule.warmLabel')}</Text>
            <View style={styles.numberInputRow}>
              <TouchableOpacity style={styles.numberButton} onPress={() => adjustWarm(-1)}>
                <Text style={styles.numberButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                value={String(schedule.warm)}
                onChangeText={(txt) => {
                  const n = parseInt(txt, 10);
                  if (Number.isFinite(n) && n >= 1) onScheduleChange({ ...schedule, warm: n });
                }}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity style={styles.numberButton} onPress={() => adjustWarm(1)}>
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputColumn}>
            <Text style={styles.inputLabel}>{t('waterSchedule.coldLabel')}</Text>
            <View style={styles.numberInputRow}>
              <TouchableOpacity style={styles.numberButton} onPress={() => adjustCold(-1)}>
                <Text style={styles.numberButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.numberInput}
                value={String(schedule.cold)}
                onChangeText={(txt) => {
                  const n = parseInt(txt, 10);
                  if (Number.isFinite(n) && n >= 2) onScheduleChange({ ...schedule, cold: n });
                }}
                keyboardType="number-pad"
                textAlign="center"
              />
              <TouchableOpacity style={styles.numberButton} onPress={() => adjustCold(1)}>
                <Text style={styles.numberButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Soil-check mode: explanatory text only — inputs HIDDEN (not in tree) */}
      {mode === 'soil_check' && (
        <Text style={styles.soilCheckExplain}>
          {t('waterSchedule.soilCheckExplanation', { days: schedule.warm > 0 ? schedule.warm : 12 })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.green,
  },
  segmentText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  segmentTextSelected: {
    color: colors.white,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputColumn: {
    flex: 1,
  },
  inputLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.bgPrimary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 56,
    textAlign: 'center',
  },
  soilCheckExplain: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
