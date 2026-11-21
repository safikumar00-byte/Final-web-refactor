import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { TrendingUp, Sparkles, ShieldCheck } from 'lucide-react-native';
import { Text } from 'heroui-native';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
  isReady: boolean;
}

export default function AnimatedSplashScreen({ onFinish, isReady }: AnimatedSplashScreenProps) {
  const [canDismiss, setCanDismiss] = useState(false);

  // Animation values
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(0.7);
  const glowScale = useSharedValue(0.9);
  const glowOpacity = useSharedValue(0.4);
  const textTranslateY = useSharedValue(20);
  const textOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // 1. Logo Scale-in with spring
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 90,
    });

    // 2. Continuous Glow Pulse behind logo
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 })
      ),
      -1,
      true
    );

    // 3. Text entrance
    textOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
    textTranslateY.value = withSpring(0, { damping: 14 });

    // 4. Progress bar fill
    progressWidth.value = withTiming(
      1,
      {
        duration: 1800,
        easing: Easing.inOut(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setCanDismiss)(true);
        }
      }
    );
  }, []);

  // When both minimum display time (canDismiss) and app initialization (isReady) are satisfied, fade out
  useEffect(() => {
    if (canDismiss && isReady) {
      opacity.value = withTiming(
        0,
        {
          duration: 450,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(onFinish)();
          }
        }
      );
    }
  }, [canDismiss, isReady, onFinish, opacity]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Background radial glow */}
      <View style={styles.backgroundGlow} />

      <View style={styles.centerContent}>
        {/* Animated Glow Halo */}
        <Animated.View style={[styles.glowRing, glowAnimatedStyle]} />

        {/* Main Brand Logo Icon */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoBadge}>
            <TrendingUp size={44} color="#F59E0B" strokeWidth={2.5} />
            <View style={styles.sparkleBadge}>
              <Sparkles size={16} color="#FBBF24" />
            </View>
          </View>
        </Animated.View>

        {/* Typography */}
        <Animated.View style={[styles.titleContainer, textAnimatedStyle]}>
          <Text style={styles.brandTitle}>GOLD & SILVER</Text>
          <Text style={styles.brandSubtitle}>SIGNALS</Text>
          <Text style={styles.brandTagline}>Precision Live Trading Opportunities</Text>
        </Animated.View>

        {/* Loading Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, progressBarAnimatedStyle]} />
        </View>

        {/* Verified Badge */}
        <View style={styles.verifiedRow}>
          <ShieldCheck size={14} color="#10B981" />
          <Text style={styles.verifiedText}>Institutional Grade Algorithmic Analytics</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F172A', // Deep dark luxury background
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
    backgroundColor: '#F59E0B',
    opacity: 0.08,
  },
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  glowRing: {
    position: 'absolute',
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F59E0B',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter-Bold',
    color: '#F59E0B',
    letterSpacing: 6,
    marginTop: -2,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: width * 0.55,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 28,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.8,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
});
