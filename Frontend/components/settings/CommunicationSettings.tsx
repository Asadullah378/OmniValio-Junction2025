'use client';

import { UserPreferences, CommunicationChannel } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as Slider from '@radix-ui/react-slider';
import { Phone, MessageSquare, Mail, Bot, Save } from 'lucide-react';

interface CommunicationSettingsProps {
  preferences: UserPreferences;
  onUpdate: (preferences: UserPreferences) => void;
}

export function CommunicationSettings({ preferences, onUpdate }: CommunicationSettingsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Communication settings saved!');
  };

  const timeToHour = (time: string) => {
    const [hours] = time.split(':');
    return parseInt(hours);
  };

  const hourToTime = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-6">
        <div>
          <h3 className="text-heading text-glacier-900 mb-4">Communication Preferences</h3>
          <p className="text-body-sm text-glacier-600 mb-6">
            Choose how and when we contact you about your orders
          </p>

          <div className="space-y-6">
            {/* Preferred Channel */}
            <div>
              <label className="block text-body-sm font-medium text-glacier-900 mb-3">
                Preferred Communication Channel
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'voice', label: 'Voice Call', icon: Phone },
                  { value: 'sms', label: 'SMS', icon: MessageSquare },
                  { value: 'email', label: 'Email', icon: Mail },
                  { value: 'chatbot', label: 'AI Chatbot', icon: Bot },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onUpdate({ ...preferences, communicationChannel: value as CommunicationChannel })}
                    className={`flex items-center gap-3 p-4 rounded-soft-lg border-2 transition-all ${
                      preferences.communicationChannel === value
                        ? 'border-valio-500 bg-valio-50'
                        : 'border-glacier-200 hover:border-glacier-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      preferences.communicationChannel === value ? 'text-valio-600' : 'text-glacier-600'
                    }`} />
                    <span className={`font-medium ${
                      preferences.communicationChannel === value ? 'text-valio-900' : 'text-glacier-900'
                    }`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Do Not Call Before */}
            <div>
              <label className="block text-body-sm font-medium text-glacier-900 mb-3">
                Do Not Call Before
              </label>
              <div className="flex items-center gap-4">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5"
                  value={[timeToHour(preferences.doNotCallBefore)]}
                  onValueChange={([hour]) => onUpdate({ ...preferences, doNotCallBefore: hourToTime(hour) })}
                  min={0}
                  max={23}
                  step={1}
                >
                  <Slider.Track className="bg-glacier-200 relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-valio-500 rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-valio-500 rounded-full hover:bg-glacier-50 focus:outline-none focus:ring-4 focus:ring-valio-200" />
                </Slider.Root>
                <span className="text-display-lg font-bold text-valio-700 min-w-[80px] text-right">
                  {preferences.doNotCallBefore}
                </span>
              </div>
              <p className="text-caption text-glacier-600 mt-2">
                We won't call you before this time
              </p>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-glacier-50 rounded-soft-lg cursor-pointer">
                <div>
                  <p className="font-medium text-glacier-900 mb-1">
                    Auto-substitute flexible items
                  </p>
                  <p className="text-caption text-glacier-600">
                    Automatically accept AI substitutions for flexible priority items
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoSubstituteFlexible}
                  onChange={(e) => onUpdate({ ...preferences, autoSubstituteFlexible: e.target.checked })}
                  className="w-5 h-5 text-valio-600 rounded focus:ring-2 focus:ring-valio-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-glacier-50 rounded-soft-lg cursor-pointer">
                <div>
                  <p className="font-medium text-glacier-900 mb-1">
                    Send risky order reminders
                  </p>
                  <p className="text-caption text-glacier-600">
                    Get notified when placing orders with high-risk items
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sendRiskyOrderReminders}
                  onChange={(e) => onUpdate({ ...preferences, sendRiskyOrderReminders: e.target.checked })}
                  className="w-5 h-5 text-valio-600 rounded focus:ring-2 focus:ring-valio-500"
                />
              </label>
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
