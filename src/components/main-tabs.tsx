import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddTransaction from '@/components/add-transaction';
import Budgets from '@/components/budgets';
import Dashboard from '@/components/dashboard';
import Profile from '@/components/profile';
import Viewers from '@/components/viewers';
import { Brand } from '@/components/guardian-ui';
import { ThemedText } from '@/components/themed-text';
import { Layout, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TABS = ['Dashboard', 'Add', 'Budgets', 'Viewers', 'Profile'] as const;
type Tab = (typeof TABS)[number];
const TAB_META: Record<Tab, { icon: string; label: string }> = { Dashboard: { icon: '⌂', label: 'Home' }, Add: { icon: '+', label: 'Add' }, Budgets: { icon: '▤', label: 'Budgets' }, Viewers: { icon: '♙', label: 'Viewers' }, Profile: { icon: '○', label: 'Profile' } };

export default function MainTabs() {
  const theme = useTheme(); const { width } = useWindowDimensions(); const desktop = width >= 900; const [tab, setTab] = useState<Tab>('Dashboard'); const [addOpen, setAddOpen] = useState(false);
  const screen = tab === 'Dashboard' ? <Dashboard /> : tab === 'Budgets' ? <Budgets /> : tab === 'Viewers' ? <Viewers /> : <Profile />;
  const selectTab = (next: Tab) => { if (next === 'Add') { setAddOpen(true); return; } setTab(next); };
  return <SafeAreaView style={[styles.root, desktop && styles.desktopRoot]} edges={['bottom']}>
    {desktop ? <View style={[styles.sidebar, { backgroundColor: theme.tabBar, borderRightColor: theme.border }]}><Brand /><Nav theme={theme} tab={tab} setTab={selectTab} desktop /><View style={[styles.premium, { borderColor: theme.border }]}><Brand compact /><View><ThemedText type="smallBold">Guardian Premium</ThemedText><ThemedText type="small">You’re all set</ThemedText></View></View></View> : null}
    <View style={styles.screen}>{screen}</View>
    {!desktop ? <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}><Nav theme={theme} tab={tab} setTab={selectTab} /></View> : null}
    <Modal visible={addOpen} transparent animationType="slide" onRequestClose={() => setAddOpen(false)}><View style={styles.modalRoot}><Pressable accessibilityLabel="Close add transaction" style={styles.modalBackdrop} onPress={() => setAddOpen(false)} /><View style={[styles.modalSheet, desktop && styles.modalSheetDesktop, { backgroundColor: theme.background }]}><AddTransaction onClose={() => setAddOpen(false)} /></View></View></Modal>
  </SafeAreaView>;
}

function Nav({ theme, tab, setTab, desktop = false }: { theme: ReturnType<typeof useTheme>; tab: Tab; setTab: (tab: Tab) => void; desktop?: boolean }) { return <>{TABS.map((item) => { const selected = tab === item; return <Pressable key={item} onPress={() => setTab(item)} style={({ pressed }) => [styles.tabButton, desktop && styles.desktopButton, selected && { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed]}><View style={styles.iconWrap}><ThemedText style={[styles.icon, { color: selected ? theme.primary : theme.textSecondary }]}>{TAB_META[item].icon}</ThemedText></View><ThemedText type={selected ? 'smallBold' : 'small'} style={{ color: selected ? theme.primary : theme.textSecondary }}>{TAB_META[item].label}</ThemedText></Pressable>; })}</>; }

const styles = StyleSheet.create({ root: { flex: 1 }, desktopRoot: { flexDirection: 'row' }, screen: { flex: 1 }, sidebar: { width: 220, borderRightWidth: StyleSheet.hairlineWidth, padding: Spacing.four, gap: Spacing.two }, premium: { marginTop: 'auto', borderWidth: 1, borderRadius: Radii.input, padding: Spacing.two, gap: Spacing.two }, tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, minHeight: Layout.tabHeight }, tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two, gap: Spacing.one, borderRadius: Radii.input }, desktopButton: { flex: 0, minHeight: 54, flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: Spacing.three, gap: Spacing.three }, iconWrap: { width: 34, height: 32, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center' }, icon: { fontSize: 22, lineHeight: 26, fontWeight: '800' }, pressed: { opacity: 0.68 }, modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.62)' }, modalSheet: { width: '100%', maxHeight: '92%', borderTopLeftRadius: Radii.large, borderTopRightRadius: Radii.large, overflow: 'hidden' }, modalSheetDesktop: { width: 620, maxHeight: '90%', alignSelf: 'center', borderRadius: Radii.large, marginBottom: Spacing.four } });
