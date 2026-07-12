import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { signOut } from 'firebase/auth';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useThemePreference, type ThemePreference } from '@/hooks/theme-preference';
import { auth } from '@/lib/firebase';

const OPTIONS: { value: ThemePreference; icon: string; label: string }[] = [{ value: 'system', icon: '▣', label: 'System' }, { value: 'light', icon: '☀', label: 'Light' }, { value: 'dark', icon: '◐', label: 'Dark' }];

export default function Profile() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { preference, setPreference } = useThemePreference();
  const email = auth.currentUser?.email ?? 'Guardian member';
  return <ThemedView style={styles.root}><ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={[styles.content, width >= 900 && styles.webContent]}>
    <ThemedText style={styles.title}>Profile</ThemedText>
    <View style={[styles.account, { backgroundColor: theme.surface, borderColor: theme.border }]}><Image source={require('../../assets/images/guardian-app-icon.png')} style={styles.avatar} /><View style={{ flex: 1 }}><ThemedText style={styles.name}>Guardian Member</ThemedText><ThemedText type="small" selectable>{email}</ThemedText></View><ThemedText>›</ThemedText></View>
    <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
    <View style={styles.appearance}>{OPTIONS.map((option) => { const selected = preference === option.value; return <Pressable key={option.value} onPress={() => setPreference(option.value)} style={({ pressed }) => [styles.appearanceOption, { backgroundColor: selected ? theme.backgroundSelected : theme.surface, borderColor: selected ? theme.primary : theme.border }, pressed && styles.pressed]}><ThemedText style={styles.optionIcon}>{option.icon}</ThemedText><ThemedText type={selected ? 'smallBold' : 'small'}>{option.label}</ThemedText></Pressable>; })}</View>
    <View style={[styles.settings, { backgroundColor: theme.surface, borderColor: theme.border }]}>{['Account & Security', 'Notifications', 'Privacy', 'Help & Support'].map((label, index) => <View key={label} style={[styles.settingRow, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}><ThemedText>{['♢','♧','▣','?'][index]}  {label}</ThemedText><ThemedText>›</ThemedText></View>)}</View>
    <Pressable onPress={() => signOut(auth)} style={({ pressed }) => [styles.signOut, { borderColor: theme.danger }, pressed && styles.pressed]}><ThemedText style={{ color: theme.danger, fontWeight: '700' }}>Sign Out</ThemedText></Pressable>
  </ScrollView></ThemedView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three }, webContent: { paddingTop: Spacing.lg }, title: { ...Type.title }, account: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.four, borderWidth: 1, borderRadius: Radii.card }, avatar: { width: 56, height: 56, borderRadius: 16 }, name: { ...Type.heading, fontSize: 20 }, sectionTitle: { ...Type.label, paddingTop: Spacing.two }, appearance: { flexDirection: 'row', gap: Spacing.two }, appearanceOption: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: Radii.card, alignItems: 'center', justifyContent: 'center', gap: Spacing.two }, optionIcon: { fontSize: 24 }, settings: { borderWidth: 1, borderRadius: Radii.card, overflow: 'hidden' }, settingRow: { minHeight: Layout.controlHeight, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three }, signOut: { minHeight: Layout.controlHeight, borderWidth: 1, borderRadius: Radii.input, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] } });
