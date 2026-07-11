import { View, type ViewProps } from 'react-native';

import { AmbientBackground } from '@/components/ambient-background';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, children, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'], overflow: 'hidden' }, style]} {...otherProps}>{type === undefined ? <AmbientBackground /> : null}{children}</View>;
}
