import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';

import MainTabs from '@/components/main-tabs';
import { Brand } from '@/components/guardian-ui';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { wakeServer } from '@/lib/api';
import { auth } from '@/lib/firebase';

/**
 * Sign-in screen (Milestone 7, step 1). Deliberately plain - the styled
 * version comes with the UI design pass. The signed-in state is a temporary
 * placeholder that the Dashboard will replace.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'signIn' | 'signUp'>('signIn');

  // Wake the sleeping Render dyno the moment the app opens - by the time
  // the user finishes typing their password, the server is warm.
  useEffect(() => {
    wakeServer();
  }, []);

  // Fires once on startup (restoring a persisted session from AsyncStorage)
  // and again after every sign-in / sign-out.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    [],
  );

  if (!ready) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (user) {
    return <MainTabs />;
  }

  const handleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      if (authMode === 'signUp') {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch {
      // One vague message on purpose - never reveal whether the email exists
      // (same philosophy as the API's 404-not-403).
      setError(authMode === 'signUp' ? 'Could not create your account' : 'Wrong email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <Brand />
          <ThemedText style={[styles.tagline, { color: theme.primary }]}>Securing your financial growth</ThemedText>
        </View>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
          placeholder="name@college.edu"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
        />
        <View style={styles.passwordLabel}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <ThemedText style={[styles.forgot, { color: theme.primary }]}>Forgot Password?</ThemedText>
        </View>
        <TextInput
          placeholder="••••••••"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[styles.input, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
        />
        {error ? <ThemedText style={{ color: theme.danger }}>{error}</ThemedText> : null}
        <Pressable disabled={busy} onPress={handleSignIn} style={({ pressed }) => [styles.button, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
          {busy ? <ActivityIndicator color={theme.primaryStrong} /> : <ThemedText style={[styles.buttonText, { color: theme.primaryStrong }]}>{authMode === 'signUp' ? 'Create Account' : 'Sign In'}  →</ThemedText>}
        </Pressable>
        <Pressable onPress={() => { setAuthMode((mode) => mode === 'signIn' ? 'signUp' : 'signIn'); setError(''); }} style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText style={styles.create}>{authMode === 'signIn' ? 'New to Guardian? ' : 'Already have an account? '}<ThemedText style={{ color: theme.primary, fontWeight: '800' }}>{authMode === 'signIn' ? 'Create an account' : 'Sign in'}</ThemedText></ThemedText>
        </Pressable>
        </View>
        <View style={[styles.wake, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText style={{ color: theme.primary, fontSize: 24 }}>⌛</ThemedText>
          <ThemedText style={styles.wakeText}>Getting your vault ready… our servers are waking up (this might take a moment)</ThemedText>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  safe: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: Spacing.four, gap: Spacing.lg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  brand: { alignItems: 'center', gap: Spacing.three },
  tagline: { ...Type.heading, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: Radii.large, padding: Spacing.four, gap: Spacing.three },
  label: { ...Type.heading, fontSize: 20 },
  passwordLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgot: { ...Type.body, fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: Radii.input,
    minHeight: Layout.controlHeight,
    paddingHorizontal: Spacing.three,
    ...Type.body,
  },
  button: { minHeight: Layout.controlHeight, borderRadius: Radii.input, alignItems: 'center', justifyContent: 'center' },
  buttonText: { ...Type.heading },
  pressed: { opacity: 0.8 },
  create: { ...Type.body, textAlign: 'center' },
  wake: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1, borderRadius: Radii.pill, padding: Spacing.three },
  wakeText: { ...Type.label, flex: 1 },
});
