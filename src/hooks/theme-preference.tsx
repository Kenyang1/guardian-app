import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemePreference = 'system' | 'light' | 'dark';
type ThemeContextValue = { preference: ThemePreference; scheme: 'light' | 'dark'; setPreference: (value: ThemePreference) => void };
const ThemePreferenceContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'guardian.themePreference';

export function GuardianThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value === 'system' || value === 'light' || value === 'dark') setPreferenceState(value); }).catch(() => undefined); }, []);
  const setPreference = (value: ThemePreference) => { setPreferenceState(value); AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined); };
  const value = useMemo(() => ({ preference, scheme: preference === 'system' ? systemScheme : preference, setPreference }), [preference, systemScheme]);
  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference must be used within GuardianThemeProvider');
  return value;
}
