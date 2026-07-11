import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
        <ThemedText type="title">Add transaction</ThemedText>

        <TextInput
          placeholder="Amount (e.g. 5.75)"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />
        <TextInput
          placeholder="Merchant (as it appears on your statement)"
          autoCapitalize="characters"
          value={merchant}
          onChangeText={setMerchant}
          style={styles.input}
        />
        <TextInput
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
        />
        <TextInput
          placeholder="Note (optional)"
          value={note}
          onChangeText={setNote}
          style={styles.input}
        />

        <View style={styles.suggestionHeader}>
          <ThemedText type="smallBold">Category</ThemedText>
          {suggesting ? (
            <ActivityIndicator size="small" />
          ) : suggestion ? (
            <ThemedText type="small">
              {overridden ? 'manual override' : `suggested (${suggestion.source})`}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.chips}>
          {Object.entries(CATEGORY_NAMES).map(([id, name]) => {
            const catId = Number(id);
            const selected = selectedId === catId;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedId(catId)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <ThemedText type="small" style={selected ? styles.chipTextSelected : undefined}>
                  {name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
        <ThemedText type="small" style={styles.hint}>
          Leave the suggested chip selected and the server categorizes automatically.
        </ThemedText>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {success ? <ThemedText style={styles.success}>{success}</ThemedText> : null}

        {busy ? <ActivityIndicator /> : <Button title="Save transaction" onPress={submit} />}
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
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
  chipSelected: {
    backgroundColor: '#3D8BD9',
    borderColor: '#3D8BD9',
  },
  chipTextSelected: {
    color: '#fff',
  },
  hint: {
    opacity: 0.7,
  },
  error: {
    color: '#D64545',
  },
  success: {
    color: '#2E8B57',
  },
});
