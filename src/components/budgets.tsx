import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { currentMonth, shiftMonth } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, listBudgets, setBudget } from '@/lib/api';
import { CATEGORY_NAMES, type Budget } from '@/schemas/budget';

/**
 * Budgets screen: see this month's limits and set new ones. POST /budgets is
 * an upsert, so "setting" a category that already has a budget REPLACES its
 * limit - the button says Set, never Add, on purpose.
 */

const dollars = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function Budgets() {
  const theme = useTheme();
  const [month, setMonth] = useState(currentMonth());
  const [budgets, setBudgets] = useState<Budget[] | null>(null);
  const [error, setError] = useState('');

  // The editor: which category is being set, and the limit typed so far.
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const result = await listBudgets(month);
      setBudgets(result.items);
    } catch (e) {
      setBudgets(null);
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    }
  }, [month]);

  useEffect(() => {
    setBudgets(null);
    setSaved('');
    load();
  }, [load]);

  const existingFor = (id: number) => budgets?.find((b) => b.categoryId === id);

  // Tapping a category chip opens the editor, pre-filled with its current
  // limit if one exists - "edit" and "create" are the same gesture.
  const pick = (id: number) => {
    setCategoryId(id);
    setSaved('');
    const existing = existingFor(id);
    setLimit(existing ? (existing.limitCents / 100).toFixed(2) : '');
  };

  const save = async () => {
    if (categoryId === null) return;
    setError('');
    setSaved('');
    const limitCents = Math.round(Number(limit) * 100);
    if (!Number.isInteger(limitCents) || limitCents <= 0) {
      setError('Enter a positive limit, like 250 or 99.50');
      return;
    }
    setSaving(true);
    try {
      await setBudget({ categoryId, month, limitCents });
      setSaved(`${CATEGORY_NAMES[categoryId]} set to ${dollars(limitCents)} for ${monthLabel(month)}`);
      setCategoryId(null);
      setLimit('');
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.monthSwitcher}>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, -1))} hitSlop={12}>
          <ThemedText style={styles.chevron}>‹</ThemedText>
        </TouchableOpacity>
        <View style={styles.headingCopy}><ThemedText style={[styles.title, { color: theme.primary }]}>Budgets</ThemedText><ThemedText>Manage your spending limits for {monthLabel(month)}</ThemedText></View>
        <TouchableOpacity onPress={() => setMonth((m) => shiftMonth(m, 1))} hitSlop={12}>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {budgets === null && !error ? (
          <ActivityIndicator />
        ) : (
          <>
            <View style={[styles.editorCard, { backgroundColor: theme.surface }]}><ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>⊕ Set New Budget</ThemedText><ThemedText type="smallBold">Select Category</ThemedText>
            <View style={styles.chips}>
              {Object.entries(CATEGORY_NAMES).map(([id, name]) => {
                const catId = Number(id);
                const existing = existingFor(catId);
                const selected = categoryId === catId;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => pick(catId)}
                    style={[styles.chip, { borderColor: theme.border }, selected && { backgroundColor: theme.primaryStrong, borderColor: theme.primary }]}
                  >
                    <ThemedText type="small" style={selected ? { color: theme.primary } : undefined}>
                      {name}
                      {existing ? ` · ${dollars(existing.limitCents)}` : ''}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {categoryId !== null ? (
              <View style={styles.editor}>
                <ThemedText type="smallBold">
                  {existingFor(categoryId) ? 'Replace' : 'Set'} {CATEGORY_NAMES[categoryId]} limit for{' '}
                  {monthLabel(month)}
                </ThemedText>
                <TextInput
                  placeholder="Limit in dollars (e.g. 250)"
                  keyboardType="decimal-pad"
                  value={limit}
                  onChangeText={setLimit}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
                  autoFocus
                />
                {saving ? (
                  <ActivityIndicator />
                ) : (
                  <Button title={existingFor(categoryId) ? 'Replace budget' : 'Set budget'} onPress={save} color={theme.primaryStrong} />
                )}
              </View>
            ) : null}</View>

            {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
            {saved ? <ThemedText style={{ color: theme.success }}>{saved}</ThemedText> : null}

            {budgets !== null && budgets.length === 0 ? (
              <ThemedText style={styles.hint}>
                No budgets for {monthLabel(month)} yet - your dashboard is empty until you set one.
              </ThemedText>
            ) : null}
          </>
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
  monthSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  headingCopy: { flex: 1, alignItems: 'center' }, title: { ...Type.title }, chevron: { ...Type.title },
  list: {
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  editorCard: { padding: Spacing.four, borderRadius: Radii.card, gap: Spacing.three }, sectionTitle: { ...Type.heading },
  editor: {
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.input,
    minHeight: Layout.controlHeight,
    paddingHorizontal: Spacing.three,
    ...Type.body,
  },
  hint: {
    opacity: 0.7,
  },
});
