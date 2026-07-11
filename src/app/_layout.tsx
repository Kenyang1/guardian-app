import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { GuardianThemeProvider, useThemePreference } from '@/hooks/theme-preference';

export default function RootLayout() {
  return <GuardianThemeProvider><NavigationRoot /></GuardianThemeProvider>;
}

function NavigationRoot() {
  const { scheme } = useThemePreference();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
