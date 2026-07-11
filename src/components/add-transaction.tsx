import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, categorizeMerchant, createTransaction } from '@/lib/api';
import { CATEGORY_NAMES } from '@/schemas/budget';

/**
 * Add-transaction screen. The signature interaction: as soon as the user
 * finishes typing the merchant, we ask the API for a category suggestion
 * (cache-first, LLM on miss) and show it as a pre-selected chip. Tapping a
 * different chip is a manual override - the API then stores
 * categorySource: 'manual' instead of 'auto'.
 */

const todayIso = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function AddTransaction() {
  const theme = useTheme();
  const [amount, setAmount] = useState(''); // dollars as typed, e.g. "5.75"
  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');

  // Suggestion state. selectedId is what will be saved; suggestion is what
  // the API proposed. They start equal; a tap on another chip diverges them.
  const [suggestion, setSuggestion] = useState<{ categoryId: number; source: string } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Debounce: suggest 800ms after the user stops typing a merchant name.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setSuggestion(null);
    setSelectedId(null);
    if (merchant.trim().length < 3) return;
    debounce.current = setTimeout(async () => {
      setSuggesting(true);
      try {
        const result = await categorizeMerchant(merchant.trim());
        setSuggestion({ categoryId: result.categoryId, source: result.source });
        setSelectedId(result.categoryId);
      } catch {
        // Suggestion is a nicety - if it fails, the user just picks manually.
      } finally {
        setSuggesting(false);
      }
    }, 800);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [merchant]);

  const overridden = suggestion !== null && selectedId !== suggestion.categoryId;

  const submit = async () => {
    setError('');
    setSuccess('');
    const amountCents = Math.round(Number(amount) * 100);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      setError('Enter a positive amount, like 5.75');
      return;
    }
    if (!merchant.trim()) {
      setError('Enter the merchant name');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Date must be YYYY-MM-DD');
      return;
    }
    setBusy(true);
    try {
      const created = await createTransaction({
        amountCents,
        merchantRaw: merchant.trim(),
        occurredAt: new Date(`${date}T12:00:00`).toISOString(),
        // Only send categoryId when the user overrode the suggestion - the
        // server marks user-picked categories as 'manual', auto ones as 'auto'.
        ...(overridden && selectedId !== null ? { categoryId: selectedId } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setSuccess(
        `Saved: ${CATEGORY_NAMES[created.categoryId]} (${created.categorySource})`,
      );
      setAmount('');
      setMerchant('');
      setNote('');
      setDate(todayIso());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}><ThemedText style={styles.amountLabel}>Amount</ThemedText><View style={styles.amountRow}><ThemedText style={[styles.currency, { color: theme.textSecondary }]}>$</ThemedText>
        <TextInput
          placeholder="0.00"
          placeholderTextColor={theme.primary}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={[styles.amountInput, { color: theme.primary }]}
        /></View></View>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <ThemedText style={styles.label}>Merchant Name</ThemedText>
        <TextInput
          placeholder="DUNKIN #341782"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          value={merchant}
          onChangeText={setMerchant}
          style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
        />
        <View style={styles.suggestionHeader}>
          <ThemedText style={styles.label}>Category</ThemedText>
          {suggesting ? <ActivityIndicator size="small" /> : suggestion ? <ThemedText type="small">{overridden ? 'MANUAL OVERRIDE' : `SUGGESTED (${suggestion.source})`}</ThemedText> : null}
        </View>
        <View style={styles.chips}>
          {Object.entries(CATEGORY_NAMES).map(([id, name]) => { const catId = Number(id); const selected = selectedId === catId; return <TouchableOpacity key={id} onPress={() => setSelectedId(catId)} style={[styles.chip, { borderColor: theme.border }, selected && { backgroundColor: theme.primaryStrong, borderColor: theme.primary }]}><ThemedText type="small" style={selected ? { color: theme.primary } : undefined}>{name}</ThemedText></TouchableOpacity>; })}
        </View>
        <ThemedText style={styles.label}>Date</ThemedText>
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
        />
        <ThemedText style={styles.label}>Note (Optional)</ThemedText>
        <TextInput
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.input, styles.note, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
        />
        </View>
        <View style={[styles.hintBox, { backgroundColor: theme.primaryStrong, borderColor: theme.border }]}><ThemedText type="small">ⓘ Leave the suggested chip selected and the server categorizes automatically.</ThemedText></View>

        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
        {success ? <ThemedText style={{ color: theme.success }}>{success}</ThemedText> : null}

        <Pressable disabled={busy} onPress={submit} style={[styles.button, { backgroundColor: theme.primary }]}>{busy ? <ActivityIndicator color={theme.primaryStrong} /> : <ThemedText style={[styles.buttonText, { color: theme.primaryStrong }]}>Save transaction</ThemedText>}</Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  hero: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four }, amountLabel: { ...Type.heading }, amountRow: { flexDirection: 'row', alignItems: 'center' }, currency: { ...Type.display }, amountInput: { ...Type.display, minWidth: 180, textAlign: 'center' },
  card: { borderRadius: Radii.card, padding: Spacing.four, gap: Spacing.three }, label: { ...Type.heading, fontSize: 20 },
  input: {
    borderWidth: 1,
    borderRadius: Radii.input,
    paddingHorizontal: Spacing.three,
    minHeight: Layout.controlHeight,
    ...Type.body,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    borderColor: '#999',
  },
  note: { minHeight: 96, paddingTop: Spacing.three, textAlignVertical: 'top' },
  hintBox: { borderWidth: 1, borderRadius: Radii.input, padding: Spacing.three },
  button: { minHeight: Layout.controlHeight, borderRadius: Radii.input, alignItems: 'center', justifyContent: 'center' }, buttonText: { ...Type.heading },
});
