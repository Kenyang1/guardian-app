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
import { Layout, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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

export default function Viewers() {
  const theme = useTheme();
  const statusColors: Record<Viewer['status'], string> = { pending: theme.warning, accepted: theme.success, revoked: theme.textSecondary };
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
          <View style={[styles.readOnlyBadge, { backgroundColor: theme.warning }]}>
            <ThemedText type="smallBold" style={styles.readOnlyText}>
              READ ONLY
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.sharedTitle, { color: theme.primary }]}>
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
        <ThemedText style={[styles.title, { color: theme.primary }]}>Trusted Viewers</ThemedText>
        <ThemedText style={styles.subtitle}>Securely share your financial journey with those you trust most.</ThemedText>

        <View style={[styles.inviteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><ThemedText style={styles.sectionTitle}>Invite by Email</ThemedText>
        <TextInput
          placeholder="their-email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
        />
        <ThemedText type="small" style={styles.hint}>Invited users can only view your spending; they cannot edit transactions.</ThemedText></View>
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
            <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>My Trusted Viewers</ThemedText>
            {mine.map((v) => (
              <View key={v.id} style={[styles.viewerRow, { backgroundColor: theme.surface }]}>
                <View style={styles.viewerInfo}>
                  <ThemedText>{v.viewerEmail}</ThemedText>
                  <ThemedText type="small" style={{ color: statusColors[v.status] }}>
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
                      color={theme.danger}
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
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.input, borderColor: theme.border }]}
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
          <ThemedText style={[styles.sectionTitle, { color: theme.primary }]}>Shared with Me</ThemedText>
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
                style={[styles.sharedRow, { backgroundColor: theme.surface }]}
                onPress={() => openShared(v.ownerUid)}
              >
                <ThemedText>Budget shared by {v.ownerUid.slice(0, 10)}...</ThemedText>
                <ThemedText type="smallBold">{loadingShared ? '...' : 'View >'}</ThemedText>
              </TouchableOpacity>
            ))
          )}
        </View>

        {busy ? <ActivityIndicator /> : null}
        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
        {notice ? <ThemedText style={{ color: theme.success }}>{notice}</ThemedText> : null}
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
  title: { ...Type.display }, subtitle: { ...Type.heading, fontSize: 20 }, sectionTitle: { ...Type.heading },
  inviteCard: { borderWidth: 1, borderRadius: Radii.card, padding: Spacing.four, gap: Spacing.three },
  section: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radii.input,
    minHeight: Layout.controlHeight,
    paddingHorizontal: Spacing.three,
    ...Type.body,
  },
  viewerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radii.card,
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
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.card,
  },
  sharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  readOnlyBadge: {
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
  hint: {
    opacity: 0.7,
  },
});
