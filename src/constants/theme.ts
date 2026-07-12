import { Platform } from 'react-native';

const shared = {
  primary: '#72E6B1',
  primaryStrong: '#063F2F',
  primaryMuted: '#8CB7A4',
  danger: '#E56B67',
  dangerSurface: '#351515',
  warning: '#DDBB63',
  success: '#72E6B1',
  white: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    ...shared,
    text: '#15201B',
    textSecondary: '#68716C',
    background: '#F8F6F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4F7EE',
    surface: '#FFFFFF',
    surfaceRaised: '#F2F0EB',
    input: '#FBFAF7',
    border: '#DDDAD3',
    track: '#E8E5DF',
    tabBar: '#FFFFFF',
  },
  dark: {
    ...shared,
    text: '#F4F6F5',
    textSecondary: '#A7AFAB',
    background: '#090D0C',
    backgroundElement: '#151A18',
    backgroundSelected: '#17362B',
    surface: '#171C1A',
    surfaceRaised: '#202623',
    input: '#202623',
    border: '#303834',
    track: '#343B38',
    tabBar: '#111614',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const CategoryColors: Record<number, string> = {
  1: '#72E6B1', 2: '#82C8A5', 3: '#66B7DF', 4: '#6F9D87', 5: '#DDBB63',
  6: '#D889AF', 7: '#9B8DD6', 8: '#86C5A6', 9: '#5FC595', 10: '#8E9792',
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
export const Shadows = { card: '0 12px 28px rgba(0,0,0,0.16)', floating: '0 24px 64px rgba(0,0,0,0.32)' } as const;
export const Motion = { quick: 160, standard: 240, ambient: 14000 } as const;
export const Layout = { gutter: 24, maxContentWidth: 1180, controlHeight: 56, tabHeight: 68, sidebarWidth: 220 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = Layout.maxContentWidth;
