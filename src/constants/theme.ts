import { Platform } from 'react-native';

const shared = {
  primary: '#A5D0B9',
  primaryStrong: '#1B4332',
  primaryMuted: '#86AF99',
  danger: '#FFB4AB',
  dangerSurface: '#3A1012',
  warning: '#E7C875',
  success: '#A5D0B9',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    ...shared,
    text: '#18211D',
    textSecondary: '#5C6861',
    background: '#F4F7F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DDEBE3',
    surface: '#FFFFFF',
    surfaceRaised: '#EDF2EF',
    input: '#F7F9F8',
    border: '#D2DDD6',
    track: '#E3E9E5',
    tabBar: '#FFFFFF',
  },
  dark: {
    ...shared,
    text: '#E5E2E1',
    textSecondary: '#C1C8C2',
    background: '#131313',
    backgroundElement: '#201F1F',
    backgroundSelected: '#2A2A2A',
    surface: '#201F1F',
    surfaceRaised: '#2A2A2A',
    input: '#353534',
    border: '#414844',
    track: '#2A2A2A',
    tabBar: '#1C1B1B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const CategoryColors: Record<number, string> = {
  1: '#A5D0B9', 2: '#86AF99', 3: '#BACAC1', 4: '#6F9D87', 5: '#E7C875',
  6: '#E89A94', 7: '#9CB7AA', 8: '#86C5A6', 9: '#62AF88', 10: '#9AAAA2',
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', serif: 'serif', rounded: 'system-ui', mono: 'monospace' },
});

export const Type = {
  display: { fontSize: 40, lineHeight: 48, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: '800' as const, letterSpacing: -0.4 },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const, letterSpacing: 0.3 },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: '600' as const },
} as const;

export const Spacing = { half: 2, one: 4, two: 8, sm: 12, three: 16, four: 24, five: 32, lg: 48, six: 64, xl: 80 } as const;
export const Radii = { small: 6, input: 10, card: 18, large: 24, pill: 999 } as const;
export const Layout = { gutter: 24, maxContentWidth: 800, controlHeight: 56, tabHeight: 68 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = Layout.maxContentWidth;
