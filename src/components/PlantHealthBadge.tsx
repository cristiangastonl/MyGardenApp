import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { PlantHealthStatus, HealthLevel } from '../types';
import { colors, spacing, borderRadius, fonts, shadows } from '../theme';
import {
  getHealthColor,
  getHealthBgColor,
  getHealthMessage,
} from '../utils/plantHealth';

interface PlantHealthBadgeProps {
  healthStatus: PlantHealthStatus;
  showScore?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium';
}

export function PlantHealthBadge({
  healthStatus,
  showScore = false,
  onPress,
  size = 'small',
}: PlantHealthBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const healthColor = getHealthColor(healthStatus.level);
  const healthBgColor = getHealthBgColor(healthStatus.level);
  const healthMessage = getHealthMessage(healthStatus.level);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setShowTooltip(true);
    }
  };

  const isSmall = size === 'small';

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.badge,
          isSmall ? styles.badgeSmall : styles.badgeMedium,
          { backgroundColor: healthBgColor },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.heart, isSmall ? styles.heartSmall : styles.heartMedium]}>
          {healthStatus.level === 'danger' ? '💔' : '❤️'}
        </Text>
        {showScore && (
          <Text
            style={[
              styles.scoreText,
              isSmall ? styles.scoreTextSmall : styles.scoreTextMedium,
              { color: healthColor },
            ]}
          >
            {healthStatus.score}
          </Text>
        )}
      </TouchableOpacity>

      {/* Simple tooltip modal */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <Pressable
          style={styles.tooltipOverlay}
          onPress={() => setShowTooltip(false)}
        >
          <View style={[styles.tooltipContent, { borderLeftColor: healthColor }]}>
            <View style={styles.tooltipHeader}>
              <Text style={styles.tooltipHeart}>
                {healthStatus.level === 'danger' ? '💔' : '❤️'}
              </Text>
              <View>
                <Text style={[styles.tooltipTitle, { color: healthColor }]}>
                  {healthMessage}
                </Text>
                <Text style={styles.tooltipScore}>
                  Salud: {healthStatus.score}/100
                </Text>
              </View>
            </View>

            {healthStatus.issues.length > 0 && (
              <View style={styles.tooltipIssues}>
                {healthStatus.issues.slice(0, 3).map((issue, index) => (
                  <View key={index} style={styles.tooltipIssue}>
                    <Text style={styles.tooltipBullet}>•</Text>
                    <Text style={styles.tooltipIssueText}>{issue.message}</Text>
                  </View>
                ))}
              </View>
            )}

            {healthStatus.issues.length === 0 && (
              <Text style={styles.tooltipNoIssues}>
                Esta planta esta en optimas condiciones
              </Text>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

interface Styles {
  badge: ViewStyle;
  badgeSmall: ViewStyle;
  badgeMedium: ViewStyle;
  heart: TextStyle;
  heartSmall: TextStyle;
  heartMedium: TextStyle;
  scoreText: TextStyle;
  scoreTextSmall: TextStyle;
  scoreTextMedium: TextStyle;
  tooltipOverlay: ViewStyle;
  tooltipContent: ViewStyle;
  tooltipHeader: ViewStyle;
  tooltipHeart: TextStyle;
  tooltipTitle: TextStyle;
  tooltipScore: TextStyle;
  tooltipIssues: ViewStyle;
  tooltipIssue: ViewStyle;
  tooltipBullet: TextStyle;
  tooltipIssueText: TextStyle;
  tooltipNoIssues: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 28,
    height: 28,
  },
  badgeMedium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 36,
    height: 36,
  },
  heart: {
    textAlign: 'center',
  },
  heartSmall: {
    fontSize: 14,
  },
  heartMedium: {
    fontSize: 18,
  },
  scoreText: {
    fontFamily: fonts.bodyMedium,
    marginLeft: spacing.xs,
  },
  scoreTextSmall: {
    fontSize: 11,
  },
  scoreTextMedium: {
    fontSize: 13,
  },
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  tooltipContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxWidth: 300,
    width: '100%',
    borderLeftWidth: 4,
    ...shadows.lg,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tooltipHeart: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  tooltipTitle: {
    fontFamily: fonts.headingMedium,
    fontSize: 18,
  },
  tooltipScore: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tooltipIssues: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  tooltipIssue: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tooltipBullet: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.sm,
    width: 12,
  },
  tooltipIssueText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  tooltipNoIssues: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
});
