import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddTransaction from '@/components/add-transaction';
import Budgets from '@/components/budgets';
import Dashboard from '@/components/dashboard';
import Viewers from '@/components/viewers';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Signed-in shell: a simple bottom tab bar switching between the app's
 * screens. Budgets and Viewers are placeholders until their screens land.
 */

const TABS = ['Dashboard', 'Add', 'Budgets', 'Viewers'] as const;
type Tab = (typeof TABS)[number];
const TAB_META: Record<Tab, { icon: string; label: string }> = {
  Dashboard: { icon: '⌂', label: 'Home' }, Add: { icon: '+', label: 'Add' }, Budgets: { icon: '▣', label: 'Budgets' }, Viewers: { icon: '♙', label: 'Viewers' },
};

function Placeholder({ name }: { name: string }) {
  return (
    <ThemedView style={styles.placeholder}>
      <ThemedText type="subtitle">{name}</ThemedText>
      <ThemedText>Coming next.</ThemedText>
    </ThemedView>
  );
}

export default function MainTabs() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('Dashboard');

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.screen}>
        {tab === 'Dashboard' ? (
          <Dashboard />
        ) : tab === 'Add' ? (
          <AddTransaction />
        ) : tab === 'Budgets' ? (
          <Budgets />
        ) : (
          <Viewers />
        )}
      </View>
      <View style={[styles.tabBar, { backgroundColor: theme.tabBar, borderTopColor: theme.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={styles.tabButton} onPress={() => setTab(t)}>
            <View style={[styles.iconWrap, t === 'Add' && { backgroundColor: theme.primary }, tab === t && t !== 'Add' && { backgroundColor: theme.primaryStrong }]}><ThemedText style={[styles.icon, { color: tab === t ? (t === 'Add' ? theme.primaryStrong : theme.primary) : theme.textSecondary }]}>{TAB_META[t].icon}</ThemedText></View>
            <ThemedText type={tab === t ? 'smallBold' : 'small'} style={{ color: tab === t ? theme.primary : theme.textSecondary }}>{TAB_META[t].label}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: Layout.tabHeight,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  iconWrap: { width: 38, height: 34, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center' }, icon: { fontSize: 24, lineHeight: 28, fontWeight: '800' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
