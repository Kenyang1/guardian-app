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

import { CategoryRow, currentMonth } from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  acceptInvite,
  ApiError,
  getSharedInsights,
  inviteViewer,
  listMyViewers,
  listSharedWithMe,
  revokeViewer,
} from '@/lib/api';
import type { InsightRow } from '@/schemas/budget';
import type { Viewer } from '@/schemas/viewer';

/**
 * Trusted viewers - both sides of the relationship:
 *   - People I invited (pending / accepted / revoked), with invite + revoke
 *   - Dashboards shared WITH me, opening a READ-ONLY copy of the owner's
 *     insights (the API's /shared route - a viewer write is impossible
 *     because no such endpoint exists)
 *
 * Accepting requires the invite's code (its id): the owner shares it with
 * the viewer out-of-band for now. Revoke uses tap-then-confirm because
 * RN's Alert buttons don't work on web.
 */

const STATUS_COLORS: Record<Viewer['status'], string> = {
  pending: '#C99A2E',
  accepted: '#2E8B57',
  revoked: '#9AA0A6',
};

export default function Viewers() {
  const [mine, setMine] = useState<Viewer[] | null>(null);
  const [sharedWithMe, setSharedWithMe] = useState<Viewer[] | null>(null);
  const [error, setError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // The read-only view of one owner's dashboard, when opened.
  const [viewing, setViewing] = useState<{ ownerUid: string; rows: InsightRow[] } | null>(null);
  const [loadingShared, setLoadingShared] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [my, shared] = await Promise.all([listMyViewers(), listSharedWithMe()]);
      setMine(my.items);
      setSharedWithMe(shared.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action: () => Promise<unknown>, successMessage: string) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await action();
      setNotice(successMessage);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setBusy(false);
    }
  };

  const openShared = async (ownerUid: string) => {
    setLoadingShared(true);
    setError('');
    try {
      const result = await getSharedInsights(ownerUid, currentMonth());
      setViewing({ ownerUid, rows: result.categories });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the server');
    } finally {
      setLoadingShared(false);
    }
  };

  // ---- Read-only shared dashboard ------------------------------------------
  if (viewing) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.sharedHeader}>
          <Button title="< Back" onPress={() => setViewing(null)} />
          <View style={styles.readOnlyBadge}>
            <ThemedText type="smallBold" style={styles.readOnlyText}>
              READ ONLY
            </ThemedText>
          </View>
        </View>
        <ThemedText style={styles.sharedTitle}>
          Viewing a shared budget - you can look, not touch.
        </ThemedText>
        <ScrollView contentContainerStyle={styles.list}>
          {viewing.rows.length === 0 ? (
            <ThemedText>No budgets set for this month.</ThemedText>
          ) : (
            viewing.rows.map((row) => <CategoryRow key={row.categoryId} row={row} />)
          )}
        </ScrollView>
      </ThemedView>
    );
  }

  // ---- Main viewers screen --------------------------------------------------
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        <ThemedText type="title">Trusted viewers</ThemedText>

        <ThemedText type="smallBold">Invite someone to view your budget</ThemedText>
        <TextInput
          placeholder="their-email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          style={styles.input}
        />
        <Button
          title="Send invite"
          onPress={() =>
            run(async () => {
              await inviteViewer(inviteEmail.trim());
              setInviteEmail('');
            }, 'Invite created - share its code below with them')
          }
        />

        {mine === null ? (
          <ActivityIndicator />
        ) : mine.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="smallBold">People I invited</ThemedText>
            {mine.map((v) => (
              <View key={v.id} style={styles.viewerRow}>
                <View style={styles.viewerInfo}>
                  <ThemedText>{v.viewerEmail}</ThemedText>
                  <ThemedText type="small" style={{ color: STATUS_COLORS[v.status] }}>
                    {v.status}
                    {v.status === 'pending' ? ` - code: ${v.id.slice(0, 8)}...` : ''}
                  </ThemedText>
                  {v.status === 'pending' ? (
                    <ThemedText type="small" selectable style={styles.code}>
                      {v.id}
                    </ThemedText>
                  ) : null}
                </View>
                {v.status !== 'revoked' ? (
                  confirmingId === v.id ? (
                    <Button
                      title="Confirm revoke"
                      color="#D64545"
                      onPress={() => {
                        setConfirmingId(null);
                        run(() => revokeViewer(v.id), `Revoked ${v.viewerEmail}`);
                      }}
                    />
                  ) : (
                    <Button title="Revoke" onPress={() => setConfirmingId(v.id)} />
                  )
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="smallBold">Got an invite code? Accept it here</ThemedText>
          <TextInput
            placeholder="Paste the invite code"
            autoCapitalize="none"
            value={inviteCode}
            onChangeText={setInviteCode}
            style={styles.input}
          />
          <Button
            title="Accept invite"
            onPress={() =>
              run(async () => {
                await acceptInvite(inviteCode.trim());
                setInviteCode('');
              }, 'Invite accepted - their dashboard is below')
            }
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold">Shared with me</ThemedText>
          {sharedWithMe === null ? (
            <ActivityIndicator />
          ) : sharedWithMe.length === 0 ? (
            <ThemedText type="small" style={styles.hint}>
              When someone shares their budget with you, it appears here.
            </ThemedText>
          ) : (
            sharedWithMe.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.sharedRow}
                onPress={() => openShared(v.ownerUid)}
              >
                <ThemedText>Budget shared by {v.ownerUid.slice(0, 10)}...</ThemedText>
                <ThemedText type="smallBold">{loadingShared ? '...' : 'View >'}</ThemedText>
              </TouchableOpacity>
            ))
          )}
        </View>

        {busy ? <ActivityIndicator /> : null}
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {notice ? <ThemedText style={styles.success}>{notice}</ThemedText> : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.four,
  },
  list: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  viewerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  viewerInfo: {
    flex: 1,
    gap: 2,
  },
  code: {
    opacity: 0.6,
  },
  sharedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  sharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  readOnlyBadge: {
    backgroundColor: '#C99A2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  readOnlyText: {
    color: '#fff',
  },
  sharedTitle: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    opacity: 0.8,
  },
  error: {
    color: '#D64545',
  },
  success: {
    color: '#2E8B57',
  },
  hint: {
    opacity: 0.7,
  },
});
