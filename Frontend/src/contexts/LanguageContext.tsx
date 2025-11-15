import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/lib/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.orders': 'Orders',
    'nav.newOrder': 'New Order',
    'nav.alerts': 'Alerts',
    'nav.claims': 'Claims',
    'nav.payments': 'Payments',
    'nav.communication': 'Communication',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
  },
  fi: {
    'nav.dashboard': 'Kojelauta',
    'nav.orders': 'Tilaukset',
    'nav.newOrder': 'Uusi tilaus',
    'nav.alerts': 'Hälytykset',
    'nav.claims': 'Reklamointi',
    'nav.payments': 'Maksut',
    'nav.communication': 'Viestintä',
    'nav.settings': 'Asetukset',
    'nav.profile': 'Profiili',
    'nav.logout': 'Kirjaudu ulos',
  },
  sv: {
    'nav.dashboard': 'Instrumentpanel',
    'nav.orders': 'Beställningar',
    'nav.newOrder': 'Ny beställning',
    'nav.alerts': 'Varningar',
    'nav.claims': 'Reklamationer',
    'nav.payments': 'Betalningar',
    'nav.communication': 'Kommunikation',
    'nav.settings': 'Inställningar',
    'nav.profile': 'Profil',
    'nav.logout': 'Logga ut',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved && ['en', 'fi', 'sv'].includes(saved) ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

