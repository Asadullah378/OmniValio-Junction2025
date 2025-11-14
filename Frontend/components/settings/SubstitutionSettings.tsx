'use client';

import { UserPreferences, Priority } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Save } from 'lucide-react';

interface SubstitutionSettingsProps {
  preferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
}

export function SubstitutionSettings({ preferences, onUpdate }: SubstitutionSettingsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Substitution settings saved!');
  };

  const categories = [
    'Dairy',
    'Vegetables',
    'Meat',
    'Bakery',
    'Beverages',
    'Frozen Foods',
    'Dry Goods',
  ];

  const updateCategoryPriority = (category: string, priority: Priority) => {
    onUpdate({
      ...preferences,
      categoryPriorities: {
        ...preferences.categoryPriorities,
        [category]: priority,
      },
    });
  };

  const toggleAllergen = (allergen: string) => {
    const newRestrictions = preferences.allergenRestrictions.includes(allergen)
      ? preferences.allergenRestrictions.filter(a => a !== allergen)
      : [...preferences.allergenRestrictions, allergen];

    onUpdate({
      ...preferences,
      allergenRestrictions: newRestrictions,
    });
  };

  const commonAllergens = [
    'Milk', 'Eggs', 'Gluten', 'Nuts', 'Soy', 'Fish', 'Shellfish', 'Peanuts',
  ];

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Allergen Restrictions */}
        <Card>
          <h3 className="text-heading text-glacier-900 mb-4">Allergen Restrictions</h3>
          <p className="text-body-sm text-glacier-600 mb-6">
            Select allergens to avoid in substitutions
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {commonAllergens.map((allergen) => (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergen(allergen)}
                className={`px-4 py-3 rounded-soft-lg font-medium text-body-sm transition-all ${
                  preferences.allergenRestrictions.includes(allergen)
                    ? 'bg-red-600 text-white border-2 border-red-600'
                    : 'bg-white text-glacier-900 border-2 border-glacier-200 hover:border-glacier-300'
                }`}
              >
                {allergen}
              </button>
            ))}
          </div>

          {preferences.allergenRestrictions.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-soft flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-caption text-red-800">
                Avoiding: {preferences.allergenRestrictions.join(', ')}
              </p>
            </div>
          )}
        </Card>

        {/* Category Priorities */}
        <Card>
          <h3 className="text-heading text-glacier-900 mb-4">Category-by-Category Priorities</h3>
          <p className="text-body-sm text-glacier-600 mb-6">
            Set default priorities for each product category
          </p>

          <div className="space-y-3">
            {categories.map((category) => {
              const currentPriority = preferences.categoryPriorities[category] || 'important';

              return (
                <div
                  key={category}
                  className="flex items-center justify-between p-4 bg-glacier-50 rounded-soft-lg"
                >
                  <span className="font-medium text-glacier-900">{category}</span>

                  <div className="flex gap-2">
                    {['critical', 'important', 'flexible'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => updateCategoryPriority(category, priority as Priority)}
                        className={`px-3 py-1.5 rounded text-caption font-medium transition-all ${
                          currentPriority === priority
                            ? priority === 'critical'
                              ? 'bg-red-600 text-white'
                              : priority === 'important'
                              ? 'bg-amber-600 text-white'
                              : 'bg-green-600 text-white'
                            : 'bg-white text-glacier-700 border border-glacier-300 hover:border-glacier-400'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-valio-50 border border-valio-200 rounded-soft-lg">
            <h4 className="font-semibold text-valio-900 mb-2">Priority Guide</h4>
            <div className="space-y-1 text-caption text-valio-800">
              <p><strong>Critical:</strong> Never substitute without asking</p>
              <p><strong>Important:</strong> Suggest alternatives when risky</p>
              <p><strong>Flexible:</strong> Auto-substitute with similar items</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary">
            <Save className="w-4 h-4" />
            Save All Settings
          </Button>
        </div>
      </div>
    </form>
  );
}
