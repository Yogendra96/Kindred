import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';

export interface FoodData {
  category: string;
  mealType: string;
  servings: number;
  foodItems: string[];
  dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian';
  isOrganic: boolean;
  isLocal: boolean;
  packaging: 'minimal' | 'moderate' | 'excessive';
  wasteAmount: number; // percentage
  description: string;
}

interface FoodFormProps {
  onSubmit: (data: FoodData) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: Partial<FoodData>;
}

const FoodForm: React.FC<FoodFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData = {},
}) => {
  const [formData, setFormData] = useState<FoodData>({
    category: initialData.category ?? '',
    mealType: initialData.mealType ?? '',
    servings: initialData.servings ?? 1,
    foodItems: initialData.foodItems ?? [],
    dietType: initialData.dietType ?? 'omnivore',
    isOrganic: initialData.isOrganic ?? false,
    isLocal: initialData.isLocal ?? false,
    packaging: initialData.packaging ?? 'moderate',
    wasteAmount: initialData.wasteAmount ?? 0,
    description: initialData.description ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newFoodItem, setNewFoodItem] = useState('');

  const log = useAdvancedLogging({
    component: 'FoodForm',
    screen: 'CarbonTrackerScreen',
    category: 'carbon',
    autoTrackLifecycle: true,
  });

  const foodCategories = [
    { id: 'meat', name: 'Meat & Poultry', icon: 'restaurant-outline', color: '#E74C3C' },
    { id: 'seafood', name: 'Seafood', icon: 'fish-outline', color: '#3498DB' },
    { id: 'dairy', name: 'Dairy', icon: 'cafe-outline', color: '#F39C12' },
    { id: 'vegetables', name: 'Vegetables', icon: 'leaf-outline', color: '#27AE60' },
    { id: 'fruits', name: 'Fruits', icon: 'nutrition-outline', color: '#E67E22' },
    { id: 'grains', name: 'Grains & Cereals', icon: 'basket-outline', color: '#8E44AD' },
    { id: 'snacks', name: 'Snacks & Treats', icon: 'ice-cream-outline', color: '#E91E63' },
    { id: 'beverages', name: 'Beverages', icon: 'wine-outline', color: '#9C27B0' },
  ];

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', icon: 'sunny-outline' },
    { id: 'lunch', name: 'Lunch', icon: 'partly-sunny-outline' },
    { id: 'dinner', name: 'Dinner', icon: 'moon-outline' },
    { id: 'snack', name: 'Snack', icon: 'fast-food-outline' },
    { id: 'full-day', name: 'Full Day', icon: 'calendar-outline' },
  ];

  const dietTypes = [
    { id: 'omnivore', name: 'Omnivore', description: 'Meat, dairy, and plants' },
    { id: 'vegetarian', name: 'Vegetarian', description: 'No meat, includes dairy' },
    { id: 'vegan', name: 'Vegan', description: 'Plant-based only' },
    { id: 'pescatarian', name: 'Pescatarian', description: 'Fish, dairy, and plants' },
  ];

  const packagingLevels = [
    { id: 'minimal', name: 'Minimal', color: '#27AE60', description: 'No packaging or reusable' },
    { id: 'moderate', name: 'Moderate', color: '#F39C12', description: 'Some packaging' },
    { id: 'excessive', name: 'Excessive', color: '#E74C3C', description: 'Heavy packaging' },
  ];

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) {
      newErrors.category = 'Please select a food category';
    }

    if (!formData.mealType) {
      newErrors.mealType = 'Please select a meal type';
    }

    if (!formData.servings || formData.servings <= 0) {
      newErrors.servings = 'Please enter a valid number of servings';
    }

    if (formData.servings > 20) {
      newErrors.servings = 'Number of servings seems unusually high';
    }

    if (formData.foodItems.length === 0) {
      newErrors.foodItems = 'Please add at least one food item';
    }

    if (formData.wasteAmount < 0 || formData.wasteAmount > 100) {
      newErrors.wasteAmount = 'Waste percentage must be between 0 and 100';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a brief description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    log.trackButtonPress('submit_food_form', {
      category: formData.category,
      mealType: formData.mealType,
      servings: formData.servings,
      dietType: formData.dietType,
      isOrganic: formData.isOrganic,
      isLocal: formData.isLocal,
      foodItemsCount: formData.foodItems.length,
    });

    if (validateForm()) {
      log.trackBusinessEvent('food_activity_submitted', {
        category: formData.category,
        mealType: formData.mealType,
        servings: formData.servings,
        dietType: formData.dietType,
        isOrganic: formData.isOrganic,
        isLocal: formData.isLocal,
        packaging: formData.packaging,
        wasteAmount: formData.wasteAmount,
        foodItemsCount: formData.foodItems.length,
      });

      onSubmit(formData);
    } else {
      log.trackError('food_form_validation_failed', {
        errors: Object.keys(errors),
        formData: {
          category: formData.category,
          mealType: formData.mealType,
          hasDescription: !!formData.description,
          foodItemsCount: formData.foodItems.length,
        },
      });

      Alert.alert('Form Error', 'Please fix the highlighted fields and try again.');
    }
  }, [formData, validateForm, onSubmit, log, errors]);

  const updateFormData = useCallback((field: keyof FoodData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const addFoodItem = useCallback(() => {
    if (newFoodItem.trim()) {
      const updatedItems = [...formData.foodItems, newFoodItem.trim()];
      updateFormData('foodItems', updatedItems);
      setNewFoodItem('');
      
      log.trackUserAction('add_food_item', {
        item: newFoodItem.trim(),
        totalItems: updatedItems.length,
      });
    }
  }, [newFoodItem, formData.foodItems, updateFormData, log]);

  const removeFoodItem = useCallback((index: number) => {
    const updatedItems = formData.foodItems.filter((_, i) => i !== index);
    updateFormData('foodItems', updatedItems);
    
    log.trackUserAction('remove_food_item', {
      removedIndex: index,
      totalItems: updatedItems.length,
    });
  }, [formData.foodItems, updateFormData, log]);

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Food Category *</Text>
      <View style={styles.categoryGrid}>
        {foodCategories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { borderColor: category.color },
              formData.category === category.id && {
                backgroundColor: `${category.color}20`,
                borderWidth: 2,
              },
            ]}
            onPress={() => updateFormData('category', category.id)}
          >
            <Icon name={category.icon} size={24} color={category.color} />
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
    </View>
  );

  const renderMealTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Meal Type *</Text>
      <View style={styles.mealTypeContainer}>
        {mealTypes.map(meal => (
          <TouchableOpacity
            key={meal.id}
            style={[
              styles.mealTypeButton,
              formData.mealType === meal.id && styles.mealTypeButtonSelected,
            ]}
            onPress={() => updateFormData('mealType', meal.id)}
          >
            <Icon 
              name={meal.icon} 
              size={20} 
              color={formData.mealType === meal.id ? '#FFFFFF' : '#7F8C8D'} 
            />
            <Text
              style={[
                styles.mealTypeText,
                formData.mealType === meal.id && styles.mealTypeTextSelected,
              ]}
            >
              {meal.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.mealType ? <Text style={styles.errorText}>{errors.mealType}</Text> : null}
    </View>
  );

  const renderServingsInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Number of Servings *</Text>
      <TextInput
        style={[styles.input, errors.servings && styles.inputError]}
        placeholder="Enter number of servings"
        value={formData.servings.toString()}
        onChangeText={text => updateFormData('servings', parseInt(text, 10) || 1)}
        keyboardType="numeric"
        returnKeyType="next"
      />
      {errors.servings ? <Text style={styles.errorText}>{errors.servings}</Text> : null}
    </View>
  );

  const renderFoodItemsInput = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Food Items *</Text>
      <View style={styles.foodItemInputContainer}>
        <TextInput
          style={styles.foodItemInput}
          placeholder="Add a food item (e.g., chicken breast, rice)"
          value={newFoodItem}
          onChangeText={setNewFoodItem}
          onSubmitEditing={addFoodItem}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={addFoodItem}>
          <Icon name="add-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {formData.foodItems.length > 0 && (
        <View style={styles.foodItemsList}>
          {formData.foodItems.map((item, index) => (
            <View key={index} style={styles.foodItemChip}>
              <Text style={styles.foodItemText}>{item}</Text>
              <TouchableOpacity onPress={() => removeFoodItem(index)}>
                <Icon name="close-outline" size={16} color="#7F8C8D" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {errors.foodItems ? <Text style={styles.errorText}>{errors.foodItems}</Text> : null}
    </View>
  );

  const renderDietTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Diet Type</Text>
      <View style={styles.dietTypeContainer}>
        {dietTypes.map(diet => (
          <TouchableOpacity
            key={diet.id}
            style={[
              styles.dietTypeCard,
              formData.dietType === diet.id && styles.dietTypeCardSelected,
            ]}
            onPress={() => updateFormData('dietType', diet.id as 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian')}
          >
            <Text
              style={[
                styles.dietTypeName,
                formData.dietType === diet.id && styles.dietTypeNameSelected,
              ]}
            >
              {diet.name}
            </Text>
            <Text
              style={[
                styles.dietTypeDescription,
                formData.dietType === diet.id && styles.dietTypeDescriptionSelected,
              ]}
            >
              {diet.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSustainabilityOptions = () => (
    <>
      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Icon name="leaf-outline" size={20} color="#27AE60" />
            <Text style={styles.switchLabel}>Organic Food</Text>
          </View>
          <Switch
            value={formData.isOrganic}
            onValueChange={value => updateFormData('isOrganic', value)}
            trackColor={{ false: '#E1E8ED', true: '#27AE60' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.switchContainer}>
          <View style={styles.switchLabelContainer}>
            <Icon name="location-outline" size={20} color="#3498DB" />
            <Text style={styles.switchLabel}>Locally Sourced</Text>
          </View>
          <Switch
            value={formData.isLocal}
            onValueChange={value => updateFormData('isLocal', value)}
            trackColor={{ false: '#E1E8ED', true: '#3498DB' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Packaging Level</Text>
        <View style={styles.packagingContainer}>
          {packagingLevels.map(level => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.packagingButton,
                { borderColor: level.color },
                formData.packaging === level.id && {
                  backgroundColor: `${level.color}20`,
                  borderWidth: 2,
                },
              ]}
              onPress={() => updateFormData('packaging', level.id as 'minimal' | 'moderate' | 'excessive')}
            >
              <Text style={[styles.packagingName, { color: level.color }]}>
                {level.name}
              </Text>
              <Text style={styles.packagingDescription}>{level.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Food Waste (%)</Text>
        <TextInput
          style={[styles.input, errors.wasteAmount && styles.inputError]}
          placeholder="Estimated percentage of food wasted (0-100)"
          value={formData.wasteAmount.toString()}
          onChangeText={text => updateFormData('wasteAmount', parseFloat(text) || 0)}
          keyboardType="numeric"
          returnKeyType="next"
        />
        <Text style={styles.helperText}>
          Enter 0 if no food was wasted, or percentage if some was thrown away
        </Text>
        {errors.wasteAmount ? <Text style={styles.errorText}>{errors.wasteAmount}</Text> : null}
      </View>
    </>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Food & Diet Tracking</Text>
        <Text style={styles.subtitle}>Log your meals and dietary choices</Text>
      </View>

      {renderCategorySelector()}
      {renderMealTypeSelector()}
      {renderServingsInput()}
      {renderFoodItemsInput()}
      {renderDietTypeSelector()}
      {renderSustainabilityOptions()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description *</Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder="e.g., Lunch at local restaurant, homemade pasta dinner..."
          value={formData.description}
          onChangeText={text => updateFormData('description', text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          returnKeyType="done"
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.submitButton, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Calculating...' : 'Calculate Impact'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    marginTop: 8,
    textAlign: 'center',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTypeButtonSelected: {
    backgroundColor: '#45B7D1',
    borderColor: '#45B7D1',
  },
  mealTypeText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  mealTypeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 80,
  },
  foodItemInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  foodItemInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#45B7D1',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodItemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  foodItemChip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  foodItemText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  dietTypeContainer: {
    gap: 8,
  },
  dietTypeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  dietTypeCardSelected: {
    backgroundColor: '#45B7D1',
    borderColor: '#45B7D1',
  },
  dietTypeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  dietTypeNameSelected: {
    color: '#FFFFFF',
  },
  dietTypeDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  dietTypeDescriptionSelected: {
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginLeft: 8,
  },
  packagingContainer: {
    gap: 8,
  },
  packagingButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    padding: 12,
  },
  packagingName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  packagingDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  helperText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  submitButton: {
    backgroundColor: '#45B7D1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FoodForm;