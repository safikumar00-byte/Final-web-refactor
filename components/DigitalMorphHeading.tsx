import React, { useEffect } from 'react';
import { View, StyleSheet, TextStyle, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'heroui-native';

interface DigitalMorphHeadingProps {
  text: string;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  characterHeight?: number;
  glowColor?: string;
}

function MorphCharacter({
  char,
  index,
  characterHeight,
  style,
  glowColor,
}: {
  char: string;
  index: number;
  characterHeight: number;
  style?: StyleProp<TextStyle>;
  glowColor?: string;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Reset and trigger staggered entrance when character changes
    progress.value = 0;
    progress.value = withDelay(
      index * 35,
      withSpring(1, {
        damping: 15,
        stiffness: 160,
        mass: 0.6,
      })
    );
  }, [char, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [characterHeight * 0.7, 0]);
    const opacity = interpolate(progress.value, [0, 0.4, 1], [0, 0.7, 1]);
    const scale = interpolate(progress.value, [0, 0.8, 1], [0.8, 1.05, 1]);

    return {
      opacity,
      transform: [{ translateY }, { scale }],
    };
  });

  if (char === ' ') {
    return <View style={{ width: characterHeight * 0.3 }} />;
  }

  return (
    <View style={[styles.charBox, { height: characterHeight }]}>
      <Animated.View style={animatedStyle}>
        <Text
          style={[
            styles.defaultHeadingText,
            style,
            glowColor
              ? {
                  textShadowColor: glowColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 8,
                }
              : null,
          ]}
        >
          {char}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function DigitalMorphHeading({
  text,
  style,
  containerStyle,
  characterHeight = 32,
  glowColor,
}: DigitalMorphHeadingProps) {
  const characters = text.split('');

  return (
    <View style={[styles.container, containerStyle]}>
      {characters.map((char, idx) => (
        <MorphCharacter
          key={`${idx}-${char}`}
          char={char}
          index={idx}
          characterHeight={characterHeight}
          style={style}
          glowColor={glowColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  charBox: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  defaultHeadingText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    ...Platform.select({
      android: {
        includeFontPadding: false,
        textAlignVertical: 'center',
      },
    }),
  },
});
