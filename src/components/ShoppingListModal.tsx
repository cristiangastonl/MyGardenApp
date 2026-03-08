import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, borderRadius, shadows } from '../theme';
import { ShoppingItem } from '../types';

interface ShoppingListModalProps {
  visible: boolean;
  items: ShoppingItem[];
  onClose: () => void;
  onToggle: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClearChecked: () => void;
}

export function ShoppingListModal({
  visible,
  items,
  onClose,
  onToggle,
  onRemove,
  onClearChecked,
}: ShoppingListModalProps) {
  const { t } = useTranslation();

  // Group items by plant name
  const grouped = items.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    if (!acc[item.plantName]) acc[item.plantName] = [];
    acc[item.plantName].push(item);
    return acc;
  }, {});

  const hasChecked = items.some(i => i.checked);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>🛒 {t('shoppingList.title')}</Text>
            </View>

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛒</Text>
                <Text style={styles.emptyTitle}>{t('shoppingList.emptyTitle')}</Text>
                <Text style={styles.emptyText}>{t('shoppingList.emptyMessage')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {Object.entries(grouped).map(([plantName, plantItems]) => (
                  <View key={plantName} style={styles.group}>
                    <Text style={styles.groupTitle}>{plantName}</Text>
                    {plantItems.map((item) => (
                      <View key={item.id} style={styles.itemRow}>
                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => onToggle(item.id)}
                        >
                          <Text style={styles.checkboxText}>
                            {item.checked ? '☑️' : '⬜'}
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={[
                            styles.itemText,
                            item.checked && styles.itemTextChecked,
                          ]}
                          numberOfLines={3}
                        >
                          {item.text}
                        </Text>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => onRemove(item.id)}
                        >
                          <Text style={styles.removeButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}

                {hasChecked && (
                  <TouchableOpacity style={styles.clearButton} onPress={onClearChecked}>
                    <Text style={styles.clearButtonText}>{t('shoppingList.clearCompleted')}</Text>
                  </TouchableOpacity>
                )}

                <View style={{ height: spacing.xxl }} />
              </ScrollView>
            )}

            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>{t('settingsPanel.done')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '85%',
    minHeight: '40%',
    ...shadows.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  checkbox: {
    marginRight: spacing.sm,
  },
  checkboxText: {
    fontSize: 18,
  },
  itemText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  itemTextChecked: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  removeButtonText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  clearButton: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  clearButtonText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  doneButton: {
    backgroundColor: colors.green,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  doneButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
});
