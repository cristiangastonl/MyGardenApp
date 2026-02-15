import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';

interface ExpandedFABProps {
  onAddManual: () => void;
  onIdentify: () => void;
  showIdentifyOption?: boolean;
}

export function ExpandedFAB({ onAddManual, onIdentify, showIdentifyOption = true }: ExpandedFABProps) {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Dynamic bottom position accounting for safe area
  const bottomPosition = Math.max(spacing.xl, insets.bottom + spacing.md);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isExpanded ? 1 : 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, rotateAnim, scaleAnim, fadeAnim]);

  const handleToggle = () => {
    if (!showIdentifyOption) {
      onAddManual();
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const handleIdentify = () => {
    setIsExpanded(false);
    onIdentify();
  };

  const handleAddManual = () => {
    setIsExpanded(false);
    onAddManual();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <Modal transparent visible={isExpanded} animationType="none">
          <Pressable style={styles.backdrop} onPress={() => setIsExpanded(false)}>
            <Animated.View
              style={[
                styles.backdropInner,
                { opacity: fadeAnim },
              ]}
            />
          </Pressable>

          {/* Menu options */}
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                bottom: bottomPosition + 70,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleIdentify}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIcon, styles.menuIconCamera]}>
                <Text style={styles.menuIconText}>📷</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Identificar con foto</Text>
                <Text style={styles.menuHint}>Usá la cámara o galería</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleAddManual}
              activeOpacity={0.8}
            >
              <View style={[styles.menuIcon, styles.menuIconManual]}>
                <Text style={styles.menuIconText}>🌱</Text>
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuLabel}>Agregar de la lista</Text>
                <Text style={styles.menuHint}>Elegí de plantas conocidas</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* FAB in expanded state */}
          <TouchableOpacity
            style={[styles.fab, styles.fabExpanded, { bottom: bottomPosition }]}
            onPress={handleToggle}
            activeOpacity={0.8}
          >
            <Animated.Text
              style={[
                styles.fabIcon,
                { transform: [{ rotate: rotateInterpolate }] },
              ]}
            >
              +
            </Animated.Text>
          </TouchableOpacity>
        </Modal>
      )}

      {/* FAB in collapsed state */}
      {!isExpanded && (
        <TouchableOpacity
          style={[styles.fab, { bottom: bottomPosition }]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  fabExpanded: {
    backgroundColor: colors.textPrimary,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 58, 46, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    right: spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
    minWidth: 220,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuIconCamera: {
    backgroundColor: colors.infoBg,
  },
  menuIconManual: {
    backgroundColor: colors.warningBg,
  },
  menuIconText: {
    fontSize: 22,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  menuHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
