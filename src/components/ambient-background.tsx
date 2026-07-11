import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/use-theme';

export function AmbientBackground() {
  const theme = useTheme();
  const drift = useSharedValue(0);
  useEffect(() => { drift.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true); }, [drift]);
  const first = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * 54 }, { translateY: drift.value * 38 }, { scale: 1 + drift.value * 0.12 }], opacity: 0.1 + drift.value * 0.05 }));
  const second = useAnimatedStyle(() => ({ transform: [{ translateX: drift.value * -46 }, { translateY: drift.value * -30 }, { scale: 1.12 - drift.value * 0.08 }], opacity: 0.06 + drift.value * 0.05 }));
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Animated.View style={[styles.orb, styles.first, { backgroundColor: theme.primary }, first]} /><Animated.View style={[styles.orb, styles.second, { backgroundColor: theme.warning }, second]} /></View>;
}

const styles = StyleSheet.create({ orb: { position: 'absolute', width: 320, height: 320, borderRadius: 160 }, first: { top: -120, left: -150 }, second: { right: -170, bottom: -120 } });
