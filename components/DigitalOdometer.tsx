import React, { useEffect } from 'react';
import { View, StyleSheet, TextStyle, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'heroui-native';

interface DigitalOdometerProps {
  value: string | number;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  digitHeight?: number;
  prefix?: string;
  suffix?: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function OdometerDigit({
  char,
  digitHeight,
  textStyle,
  index,
}: {
  char: string;
  digitHeight: number;
  textStyle?: StyleProp<TextStyle>;
  index: number;
}) {
  const isDigit = /^[0-9]$/.test(char);
  const targetIndex = isDigit ? parseInt(char, 10) : 0;
  const animatedOffset = useSharedValue(0);

  useEffect(() => {
    if (isDigit) {
      animatedOffset.value = withSpring(targetIndex * -digitHeight, {
        damping: 18,
        stiffness: 140,
        mass: 0.7,
      });
    }
  }, [targetIndex, digitHeight, isDigit]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: animatedOffset.value }],
  }));

  if (!isDigit) {
    return (
      <View style={[styles.charContainer, { height: digitHeight }]}>
        <Text style={[styles.defaultText, textStyle, { lineHeight: digitHeight }]}>
          {char}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.digitWindow, { height: digitHeight }]}>
      <Animated.View style={[styles.digitColumn, animatedStyle]}>
        {DIGITS.map((d) => (
          <View key={d} style={[styles.singleDigitCell, { height: digitHeight }]}>
            <Text style={[styles.defaultText, textStyle, { lineHeight: digitHeight }]}>
              {d}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export default function DigitalOdometer({
  value,
  textStyle,
  containerStyle,
  digitHeight = 38,
  prefix = '',
  suffix = '',
}: DigitalOdometerProps) {
  const stringValue = `${prefix}${value}${suffix}`;
  const chars = stringValue.split('');

  return (
    <View style={[styles.row, containerStyle]}>
      {chars.map((char, i) => (
        <OdometerDigit
          key={`${i}-${char}`}
          char={char}
          digitHeight={digitHeight}
          textStyle={textStyle}
          index={i}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  charContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  digitWindow: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  digitColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  singleDigitCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultText: {
    fontSize: 32,
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
