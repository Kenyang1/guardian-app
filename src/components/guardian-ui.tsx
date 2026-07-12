import { Image, Pressable, StyleSheet, View, type ViewProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Radii, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Brand({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return <View style={styles.brand}><Image source={require('../../assets/images/guardian-app-icon.png')} style={compact ? styles.logoSmall : styles.logo} /><ThemedText style={[compact ? styles.brandSmall : styles.brandText, { color: theme.text }]}>Guardian</ThemedText></View>;
}

export function SurfaceCard({ style, ...props }: ViewProps) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]} {...props} />;
}

export function ProgressBar({ value, danger = false }: { value: number; danger?: boolean }) {
  const theme = useTheme();
  const percent = Math.max(0, Math.min(value, 1)) * 100;
  return <View style={[styles.track, { backgroundColor: theme.track }]}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: danger ? theme.danger : theme.primary }]} /></View>;
}

export function ActionButton({ label, onPress, tone = 'primary', disabled = false }: { label: string; onPress: () => void; tone?: 'primary' | 'outline' | 'danger'; disabled?: boolean }) {
  const theme = useTheme(); const primary = tone === 'primary'; const danger = tone === 'danger';
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: primary ? theme.primary : danger ? theme.dangerSurface : theme.backgroundSelected, borderColor: danger ? theme.danger : theme.primary }, pressed && styles.pressed, disabled && styles.disabled]}><ThemedText type="smallBold" style={{ color: primary ? theme.primaryStrong : danger ? theme.danger : theme.primary }}>{label}</ThemedText></Pressable>;
}

const styles = StyleSheet.create({ brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, logo: { width: 42, height: 42, borderRadius: 12 }, logoSmall: { width: 30, height: 30, borderRadius: 8 }, brandText: { fontSize: 25, lineHeight: 30, fontWeight: '800' }, brandSmall: { fontSize: 20, lineHeight: 24, fontWeight: '800' }, card: { borderWidth: 1, borderRadius: Radii.card, padding: Spacing.three, boxShadow: Shadows.card }, track: { height: 7, borderRadius: Radii.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: Radii.pill }, button: { minHeight: 46, paddingHorizontal: Spacing.three, borderWidth: 1, borderRadius: Radii.input, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, disabled: { opacity: 0.5 } });
