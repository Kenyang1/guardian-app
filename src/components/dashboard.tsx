import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { signOut } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ApiError, getMonthlyInsights } from '@/lib/api';
import { auth } from '@/lib/firebase';
import type { InsightRow } from '@/schemas/budget';

/**
 * The Dashboard: budget vs spent vs remaining per category for one month.
 * Data comes straight from GET /insights/monthly - all the math (spent
 * aggregation, remaining) already happened in SQL on the server.
 */

// Stable color per category id (1-10) - same order as the categories table.
const CATEGORY_COLORS: Record<number, string> = {
  1: '#E07A5F', // Food & Drink
  2: '#81B29A', // Groceries
  3: '#3D8BD9', // Transportation
  4: '#8E7DBE', // Housing & Utilities
  5: '#F2CC8F', // Education
  6: '#E98CB4', // Entertainment
  7: '#5FBFB0', // Shopping
  8: '#6FBF5F', // Health
  9: '#4CAF8E', // Income
  10: '#9AA0A6', // Other
};

const dollars = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/** '2026-07' for today; shiftMonth('2026-07', -1) -> '2026-06'. */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export function CategoryRow({ row }: { row: InsightRow }) {
  const over = row.remainingCents < 0;
  // Cap the bar at 100% - "spent 150% of budget" reads better as a full red bar.
  const fraction = row.limitCents > 0 ? Math.min(row.spentCents / row.limitCents, 1) : 1;
  const barColor = over ? '#D64545' : CATEGORY_COLORS[row.categoryId] ?? '#9AA0A6';

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <ThemedText type="smallBold">{row.categoryName}</ThemedText>
        <ThemedText>
          {dollars(row.spentCents)} / {dollars(row.limitCents)}
        </ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fraction * 100}%`, backgroundColor: barColor }]} />
      </View>
      <ThemedText style={[styles.remaining, over && styles.overBudget]}>
        {over
          ? `Over budget by ${dollars(-row.remainingCents)}`
          : `${dollars(row.remainingCents)} left`}
      </ThemedText>
    </View>
  );
}

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<InsightRow[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await getMonthlyInsights(month);
      setRows(result.categories);
    } catch (e) {
      setRows(null);
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    }
  }, [month]);

  // Re-fetch whenever the month changes; rows=null shows the spinner.
  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <ThemedText type="title">Guardian</ThemedText>
        <Button title="Sign out" onPress={() => signOut(auth)} />
      </View>

      <View style={styles.monthSwitcher}>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={12}>
          <ThemedText type="title">{'‹'}</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">{monthLabel(month)}</ThemedText>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={12}>
          <ThemedText type="title">{'›'}</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error ? (
          <View style={styles.centerBlock}>
            <ThemedText style={styles.overBudget}>{error}</ThemedText>
            <Button title="Try again" onPress={load} />
          </View>
        ) : rows === null ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.centerBlock}>
            <ThemedText type="subtitle">No budgets for {monthLabel(month)}</ThemedText>
            <ThemedText>Set one on the Budgets screen to see your progress here.</ThemedText>
          </View>
        ) : (
          rows.map((row) => <CategoryRow key={row.categoryId} row={row} />)
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  monthSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.four,
  },
  centerBlock: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  barTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(128,128,128,0.2)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  remaining: {
    fontSize: 13,
    opacity: 0.8,
  },
  overBudget: {
    color: '#D64545',
    opacity: 1,
  },
});
