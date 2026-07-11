import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { signOut } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CategoryColors, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, getMonthlyInsights } from '@/lib/api';
import { auth } from '@/lib/firebase';
import type { InsightRow } from '@/schemas/budget';

const dollars = (cents: number) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
export function currentMonth(): string { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; }
export function shiftMonth(month: string, delta: number): string { const [y, m] = month.split('-').map(Number); const d = new Date(y, m - 1 + delta, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }
const monthLabel = (month: string) => { const [y, m] = month.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };

export function CategoryRow({ row }: { row: InsightRow }) {
  const theme = useTheme();
  const over = row.remainingCents < 0;
  const fraction = row.limitCents > 0 ? Math.min(row.spentCents / row.limitCents, 1) : 1;
  const barColor = over ? theme.danger : CategoryColors[row.categoryId] ?? CategoryColors[10];
  return (
    <View style={[styles.row, { backgroundColor: theme.surface, borderColor: over ? theme.danger : theme.border }]}>
      <View style={styles.rowHeader}>
        <View style={styles.categoryCopy}>
          <ThemedText style={styles.categoryName}>{row.categoryName}</ThemedText>
          <ThemedText type="small">{dollars(row.spentCents)} of {dollars(row.limitCents)} spent</ThemedText>
        </View>
        <ThemedText style={[styles.remaining, { color: over ? theme.danger : theme.primary }]}>
          {over ? `-${dollars(-row.remainingCents)}` : dollars(row.remainingCents)}{`\n`}<ThemedText type="small">{over ? 'over' : 'left'}</ThemedText>
        </ThemedText>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.track }]}><View style={[styles.barFill, { width: `${fraction * 100}%`, backgroundColor: barColor }]} /></View>
      {over ? <ThemedText style={[styles.warning, { color: theme.danger }]}>⚠ You’ve exceeded this budget.</ThemedText> : null}
    </View>
  );
}

export default function Dashboard() {
  const theme = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<InsightRow[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setError(''); try { const result = await getMonthlyInsights(month); setRows(result.categories); } catch (e) { setRows(null); setError(e instanceof ApiError ? e.message : 'Could not reach the server'); } }, [month]);
  useEffect(() => { setRows(null); load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const totalRemaining = rows?.reduce((sum, row) => sum + row.remainingCents, 0) ?? 0;
  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}><ThemedText style={styles.brand}>Guardian</ThemedText><Button title="Sign out" onPress={() => signOut(auth)} /></View>
      <View style={styles.monthSwitcher}>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={12}><ThemedText style={styles.chevron}>‹</ThemedText></TouchableOpacity>
        <View style={styles.monthCopy}><ThemedText style={[styles.month, { color: theme.primary }]}>{monthLabel(month)}</ThemedText><ThemedText style={styles.activeBudget}>ACTIVE BUDGET</ThemedText></View>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={12}><ThemedText style={styles.chevron}>›</ThemedText></TouchableOpacity>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {!error && rows && rows.length > 0 ? <><View style={[styles.summary, { backgroundColor: theme.surface }]}><ThemedText type="smallBold">Total Remaining</ThemedText><ThemedText style={[styles.total, { color: totalRemaining < 0 ? theme.danger : theme.primary }]}>{dollars(totalRemaining)}</ThemedText></View><ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>Expense Categories</ThemedText></> : null}
        {error ? <View style={styles.centerBlock}><ThemedText style={{ color: theme.danger }}>{error}</ThemedText><Button title="Try again" onPress={load} /></View> : rows === null ? <View style={styles.centerBlock}><ActivityIndicator /></View> : rows.length === 0 ? <View style={styles.centerBlock}><ThemedText type="subtitle">No budgets for {monthLabel(month)}</ThemedText><ThemedText>Set one on the Budgets screen to see your progress here.</ThemedText></View> : rows.map((row) => <CategoryRow key={row.categoryId} row={row} />)}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Spacing.three },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four },
  brand: { ...Type.title },
  monthSwitcher: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.three },
  chevron: { ...Type.title }, monthCopy: { alignItems: 'center' }, month: { ...Type.title }, activeBudget: { ...Type.caption, letterSpacing: 2 },
  list: { paddingHorizontal: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.four },
  centerBlock: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.four },
  summary: { padding: Spacing.four, borderRadius: Radii.card, gap: Spacing.two }, total: { ...Type.display, fontVariant: ['tabular-nums'] }, sectionTitle: { ...Type.heading, paddingTop: Spacing.two },
  row: { gap: Spacing.three, padding: Spacing.four, borderRadius: Radii.card, borderWidth: 1 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two }, categoryCopy: { flex: 1, gap: Spacing.one }, categoryName: { ...Type.heading },
  barTrack: { height: 10, borderRadius: Radii.pill, overflow: 'hidden' }, barFill: { height: '100%', borderRadius: Radii.pill },
  remaining: { ...Type.label, textAlign: 'right', fontVariant: ['tabular-nums'] }, warning: { ...Type.label },
});
