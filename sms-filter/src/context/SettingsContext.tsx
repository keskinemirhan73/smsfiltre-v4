import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { FilterManager, AppSettings } from '../modules/FilterManager';

interface SettingsContextType {
  settings: AppSettings;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {} as AppSettings,
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    underAttackMode: false,
    smartFilter: true,
    silentBlocking: true,
    filterScheduleEnabled: false,
    scheduleStart: '22:00',
    scheduleEnd: '08:00',
    filterTransactions: false,
    filterPromotions: false,
    fraudFilter: true,
    databaseFilter: true,
    proactiveFilter: true,
    invalidNumberFilter: false,
    categoryMapping: {
      spam: 'junk',
      transaction: 'transaction',
      promotion: 'promotion',
    },
    aiSensitivity: 0.8,
    blockForeignNumbers: false,
    blockArabic: false,
    theme: 'system',
    language: 'en',
    customFraudKeywords: [],
    whitelist: [],
    autoSyncEnabled: true,
    biometricLock: false,
  });

  useEffect(() => {
    FilterManager.loadSettings().then(s => setSettings(s as AppSettings));

    const sub = DeviceEventEmitter.addListener('onSettingsChanged', (newSettings: AppSettings) => {
      setSettings(newSettings);
    });
    return () => sub.remove();
  }, []);

  const value = useMemo(() => ({ settings }), [settings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsContext;
