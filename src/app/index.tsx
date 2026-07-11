import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged, signInWithEmailAndPassword, type User } from 'firebase/auth';

import Dashboard from '@/components/dashboard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { wakeServer } from '@/lib/api';
import { auth } from '@/lib/firebase';

/**
 * Sign-in screen (Milestone 7, step 1). Deliberately plain - the styled
 * version comes with the UI design pass. The signed-in state is a temporary
 * placeholder that the Dashboard will replace.
 */
export default function HomeScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    return <Dashboard />;
  }

  const handleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      // One vague message on purpose - never reveal whether the email exists
      // (same philosophy as the API's 404-not-403).
      setError('Wrong email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.form}>
        <ThemedText type="title" style={styles.title}>
          Guardian
        </ThemedText>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
        {busy ? (
          <ActivityIndicator />
        ) : (
          <Button title="Sign in" onPress={handleSignIn} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  form: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#d33',
  },
});
