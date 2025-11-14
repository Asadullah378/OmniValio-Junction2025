'use client';

import { useState } from 'react';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { CommunicationSettings } from '@/components/settings/CommunicationSettings';
import { SubstitutionSettings } from '@/components/settings/SubstitutionSettings';
import { AITransparency } from '@/components/settings/AITransparency';
import { mockUserPreferences } from '@/lib/mockData';
import { UserPreferences } from '@/lib/types';
import * as Tabs from '@radix-ui/react-tabs';
import { User, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>(mockUserPreferences);

  return (
    <div className="min-h-screen bg-glacier-50 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-display-lg text-glacier-900 mb-2">
            Settings
          </h1>
          <p className="text-body text-glacier-600">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Tabs */}
        <Tabs.Root defaultValue="profile" className="w-full">
          {/* Tab List */}
          <Tabs.List className="flex gap-2 mb-8 border-b border-glacier-200 overflow-x-auto">
            <Tabs.Trigger
              value="profile"
              className="flex items-center gap-2 px-4 py-3 text-body-sm font-medium text-glacier-600 hover:text-glacier-900 border-b-2 border-transparent data-[state=active]:border-valio-600 data-[state=active]:text-valio-700 transition-all whitespace-nowrap"
            >
              <User className="w-4 h-4" />
              Profile
            </Tabs.Trigger>
            <Tabs.Trigger
              value="communication"
              className="flex items-center gap-2 px-4 py-3 text-body-sm font-medium text-glacier-600 hover:text-glacier-900 border-b-2 border-transparent data-[state=active]:border-valio-600 data-[state=active]:text-valio-700 transition-all whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
            </Tabs.Trigger>
            <Tabs.Trigger
              value="substitution"
              className="flex items-center gap-2 px-4 py-3 text-body-sm font-medium text-glacier-600 hover:text-glacier-900 border-b-2 border-transparent data-[state=active]:border-valio-600 data-[state=active]:text-valio-700 transition-all whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Substitution Rules
            </Tabs.Trigger>
            <Tabs.Trigger
              value="ai"
              className="flex items-center gap-2 px-4 py-3 text-body-sm font-medium text-glacier-600 hover:text-glacier-900 border-b-2 border-transparent data-[state=active]:border-valio-600 data-[state=active]:text-valio-700 transition-all whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              AI Transparency
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab Content */}
          <Tabs.Content value="profile">
            <ProfileSettings preferences={preferences} onUpdate={setPreferences} />
          </Tabs.Content>

          <Tabs.Content value="communication">
            <CommunicationSettings preferences={preferences} onUpdate={setPreferences} />
          </Tabs.Content>

          <Tabs.Content value="substitution">
            <SubstitutionSettings preferences={preferences} onUpdate={setPreferences} />
          </Tabs.Content>

          <Tabs.Content value="ai">
            <AITransparency />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
