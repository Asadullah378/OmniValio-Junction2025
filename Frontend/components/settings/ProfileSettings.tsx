'use client';

import { UserPreferences } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Save } from 'lucide-react';

interface ProfileSettingsProps {
  preferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
}

export function ProfileSettings({ preferences, onUpdate }: ProfileSettingsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile settings saved!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-6">
        <div>
          <h3 className="text-heading text-glacier-900 mb-4">Profile Information</h3>
          <p className="text-body-sm text-glacier-600 mb-6">
            Update your restaurant details and delivery information
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-glacier-900 mb-2">
                Restaurant Name
              </label>
              <input
                type="text"
                value={preferences.restaurantName}
                onChange={(e) => onUpdate({ ...preferences, restaurantName: e.target.value })}
                className="input"
                placeholder="Enter restaurant name"
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-glacier-900 mb-2">
                Delivery Address
              </label>
              <textarea
                value={preferences.deliveryAddress}
                onChange={(e) => onUpdate({ ...preferences, deliveryAddress: e.target.value })}
                rows={3}
                className="input"
                placeholder="Enter delivery address"
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-glacier-900 mb-2">
                Language Preference
              </label>
              <select
                value={preferences.language}
                onChange={(e) => onUpdate({ ...preferences, language: e.target.value as any })}
                className="input"
              >
                <option value="FI">Finnish (Suomi)</option>
                <option value="SV">Swedish (Svenska)</option>
                <option value="EN">English</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-glacier-200">
          <Button type="submit" variant="primary">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </Card>
    </form>
  );
}
