import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, shadows, fonts } from '../theme';
import { useStorage } from '../hooks/useStorage';
import { PLANT_DATABASE, getPlantCategories, getTranslatedDatabase, getTranslatedPlant, searchPlants } from '../data/plantDatabase';
import { PlantDBEntry, PlantCategory, Plant } from '../types';
import {
  PlantDatabaseCard,
  PlantDetailModal,
} from '../components';
import { trackEvent } from '../services/analyticsService';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { addPlant } = useStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlantCategory | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantDBEntry | null>(null);
  const [showPlantDetail, setShowPlantDetail] = useState(false);

  const translatedDatabase = getTranslatedDatabase();

  // Filter plants based on search and category
  const filteredPlants = useMemo(() => {
    let results = translatedDatabase;

    if (searchQuery.trim()) {
      results = searchPlants(searchQuery);
    }

    if (selectedCategory) {
      results = results.filter(plant => plant.category === selectedCategory);
    }

    return results;
  }, [searchQuery, selectedCategory, translatedDatabase]);

  const handleSelectCategory = (category: PlantCategory | null) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const handleSelectPlant = (plant: PlantDBEntry) => {
    setSelectedPlant(plant);
    setShowPlantDetail(true);
  };

  const handleAddPlant = (plantDB: PlantDBEntry) => {
    const newPlant: Plant = {
      id: Date.now().toString(),
      name: plantDB.name,
      typeId: plantDB.category,
      typeName: getCategoryName(plantDB.category),
      icon: plantDB.icon,
      waterEvery: plantDB.waterDays,
      sunHours: plantDB.sunHours,
      sunDays: [],
      outdoorDays: plantDB.outdoor ? [0, 1, 2, 3, 4, 5, 6] : [],
      lastWatered: null,
      sunDoneDate: null,
      outdoorDoneDate: null,
    };

    addPlant(newPlant);
    trackEvent('plant_added', { plant_name: plantDB.name, source: 'explore' });
    setShowPlantDetail(false);
    setSelectedPlant(null);

    Alert.alert(
      t('explore.plantAdded'),
      t('explore.plantAddedMessage', { name: getTranslatedPlant(plantDB).name }),
      [{ text: 'OK' }]
    );
  };

  const getCategoryName = (categoryId: PlantCategory): string => {
    const category = getPlantCategories().find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const renderPlant = ({ item }: { item: PlantDBEntry }) => (
    <PlantDatabaseCard
      plant={item}
      onPress={() => handleSelectPlant(item)}
    />
  );

  const ListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{t('explore.title')}</Text>
      <Text style={styles.subtitle}>
        {t('explore.subtitle', { count: PLANT_DATABASE.length })}
      </Text>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('explore.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {getPlantCategories().map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => handleSelectCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryName,
                selectedCategory === category.id && styles.categoryNameSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredPlants.length === PLANT_DATABASE.length
            ? t('explore.available', { count: PLANT_DATABASE.length })
            : t('explore.result', { count: filteredPlants.length })}
        </Text>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🔍</Text>
      <Text style={styles.emptyTitle}>{t('explore.noResults')}</Text>
      <Text style={styles.emptyText}>
        {t('explore.noResultsText')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredPlants}
        renderItem={renderPlant}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Plant Detail Modal */}
      <PlantDetailModal
        visible={showPlantDetail}
        plant={selectedPlant}
        onClose={() => {
          setShowPlantDetail(false);
          setSelectedPlant(null);
        }}
        onAdd={handleAddPlant}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  header: {
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  categoriesScroll: {
    marginHorizontal: -spacing.lg,
    marginBottom: spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.green,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  categoryName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  categoryNameSelected: {
    color: colors.white,
  },
  resultsInfo: {
    marginTop: spacing.sm,
  },
  resultsText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
