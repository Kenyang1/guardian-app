import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddTransaction from '@/components/add-transaction';
import Budgets from '@/components/budgets';
import Dashboard from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

/**
 * Signed-in shell: a simple bottom tab bar switching between the app's
 * screens. Budgets and Viewers are placeholders until their screens land.
 */

const TABS = ['Dashboard', 'Add', 'Budgets', 'Viewers'] as const;
type Tab = (typeof TABS)[number];

function Placeholder({ name }: { name: string }) {
  return (
    <ThemedView style={styles.placeholder}>
      <ThemedText type="subtitle">{name}</ThemedText>
      <ThemedText>Coming next.</ThemedText>
    </ThemedView>
  );
}

export default function MainTabs() {
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
          <Placeholder name="Trusted viewers" />
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={styles.tabButton} onPress={() => setTab(t)}>
            <ThemedText type={tab === t ? 'smallBold' : 'small'} style={tab === t ? styles.active : styles.inactive}>
              {t}
            </ThemedText>
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
    borderTopColor: 'rgba(128,128,128,0.4)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  active: {
    opacity: 1,
  },
  inactive: {
    opacity: 0.55,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
