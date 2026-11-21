import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

interface FlippableCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  isFlipped?: boolean;
  onFlipChange?: (flipped: boolean) => void;
  allowTapToFlip?: boolean;
}

export default function FlippableCard({
  front,
  back,
  style,
  isFlipped: controlledFlipped,
  onFlipChange,
  allowTapToFlip = false,
}: FlippableCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const flipAnimation = useSharedValue(isFlipped ? 1 : 0);

  const triggerFlip = () => {
    const nextVal = !isFlipped;
    if (controlledFlipped === undefined) {
      setInternalFlipped(nextVal);
    }
    onFlipChange?.(nextVal);

    flipAnimation.value = withSpring(nextVal ? 1 : 0, {
      damping: 14,
      stiffness: 110,
      mass: 0.8,
    });
  };

  // Sync if controlled externally
  React.useEffect(() => {
    if (controlledFlipped !== undefined) {
      flipAnimation.value = withSpring(controlledFlipped ? 1 : 0, {
        damping: 14,
        stiffness: 110,
        mass: 0.8,
      });
    }
  }, [controlledFlipped, flipAnimation]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateValue}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      opacity: flipAnimation.value > 0.5 ? 0 : 1,
      zIndex: flipAnimation.value > 0.5 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(flipAnimation.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotateValue}deg` },
      ],
      backfaceVisibility: 'hidden' as const,
      opacity: flipAnimation.value <= 0.5 ? 0 : 1,
      zIndex: flipAnimation.value <= 0.5 ? 0 : 1,
    };
  });

  const content = (
    <View style={[styles.cardContainer, style]}>
      {/* Front Face */}
      <Animated.View
        style={[
          styles.face,
          frontAnimatedStyle,
        ]}
        pointerEvents={isFlipped ? 'none' : 'auto'}
      >
        {front}
      </Animated.View>

      {/* Back Face */}
      <Animated.View
        style={[
          styles.face,
          styles.backFace,
          backAnimatedStyle,
        ]}
        pointerEvents={isFlipped ? 'auto' : 'none'}
      >
        {back}
      </Animated.View>
    </View>
  );

  if (allowTapToFlip) {
    return (
      <Pressable onPress={triggerFlip} style={{ width: '100%' }}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    position: 'relative',
  },
  face: {
    width: '100%',
  },
  backFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
