import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PulsingLiveDotProps {
  color?: string;
  size?: number;
  style?: ViewStyle;
}

export default function PulsingLiveDot({
  color = '#22C55E', // Green default
  size = 8,
  style,
}: PulsingLiveDotProps) {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(2.4, {
        duration: 1600,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withTiming(0, {
        duration: 1600,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
  }, [pulseScale, pulseOpacity]);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }, style]}>
      {/* Outer Pulse Wave */}
      <Animated.View
        style={[
          styles.pulseWave,
          {
            width: size * 2.2,
            height: size * 2.2,
            borderRadius: (size * 2.2) / 2,
            backgroundColor: color,
          },
          animatedPulseStyle,
        ]}
      />
      {/* Center Solid Dot */}
      <View
        style={[
          styles.solidDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseWave: {
    position: 'absolute',
  },
  solidDot: {
    zIndex: 2,
  },
});
