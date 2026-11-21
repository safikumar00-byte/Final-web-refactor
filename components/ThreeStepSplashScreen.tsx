import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  FadeInRight,
  FadeOutLeft,
  runOnJS,
} from 'react-native-reanimated';
import {
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  BarChart2,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { Button, Card, Chip, PressableFeedback, Surface, Text } from 'heroui-native';

const { width, height } = Dimensions.get('window');

interface ThreeStepSplashScreenProps {
  onFinish: () => void;
  isReady: boolean;
}

interface StepData {
  id: number;
  badge: string;
  badgeIcon: any;
  title: string;
  subtitle: string;
  description: string;
  highlightStat: string;
  imageSource: any;
  imageStyle?: 'icon' | 'banner' | 'medium';
}

const STEPS: StepData[] = [
  {
    id: 1,
    badge: 'LIVE SIGNALS TERMINAL',
    badgeIcon: Zap,
    title: 'Precision Precious Metals',
    subtitle: 'High-Probability BUY & SELL Setups',
    description:
      'Institutional Gold (XAU/USD) & Silver (XAG/USD) signals with verified entry points, strict stop loss, and multi-level profit targets.',
    highlightStat: '94.2% Historical Target Hit Rate',
    imageSource: require('../assets/images/icon.png'),
    imageStyle: 'icon',
  },
  {
    id: 2,
    badge: 'TECHNICAL DEPTH',
    badgeIcon: BarChart2,
    title: 'Real-Time Market Analytics',
    subtitle: 'Multi-Timeframe Charts & Momentum',
    description:
      'Sub-second tick data, live TradingView charting, RSI momentum analysis, and institutional pivot levels engineered for active traders.',
    highlightStat: '1M to 1W Interactive Timeframes',
    imageSource: require('../assets/images/mediumBanner.png'),
    imageStyle: 'medium',
  },
  {
    id: 3,
    badge: 'DYNAMIC P&L SYSTEM',
    badgeIcon: ShieldCheck,
    title: 'Automated P&L Calculator',
    subtitle: 'Transparent & Verifiable History',
    description:
      'Simulate your personal lot sizes, calculate pip gains dynamically, and inspect every past signal with zero hidden entries.',
    highlightStat: '100% Verifiable Public Track Record',
    imageSource: require('../assets/images/smallBanner.png'),
    imageStyle: 'banner',
  },
];

export default function ThreeStepSplashScreen({
  onFinish,
  isReady,
}: ThreeStepSplashScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const containerOpacity = useSharedValue(1);

  const step = STEPS[currentStep];

  const handleDismiss = () => {
    containerOpacity.value = withTiming(
      0,
      {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }
    );
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const BadgeIcon = step.badgeIcon;

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Background ambient radial glow */}
      <View style={styles.ambientGlow} />
      <View style={styles.ambientGlowSecondary} />

      {/* Header bar with Skip action */}
      <View style={styles.headerBar}>
        <View style={styles.brandRow}>
          <TrendingUp size={20} color="#F59E0B" />
          <Text style={styles.headerBrandText}>GOLD & SILVER PRO</Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Button.Label style={styles.skipButtonText}>Skip</Button.Label>
        </Button>
      </View>

      {/* Main Slide Content */}
      <View style={styles.contentContainer}>
        <Animated.View
          key={`step-${step.id}`}
          entering={FadeInRight.duration(280).easing(Easing.out(Easing.cubic))}
          exiting={FadeOutLeft.duration(200).easing(Easing.in(Easing.cubic))}
          style={styles.slideCard}
        >
          {/* Visual Showcase (Image / Icon) */}
          <View style={styles.visualContainer}>
            {step.imageStyle === 'icon' && (
              <View style={styles.iconVisualWrapper}>
                <View style={styles.iconHalo} />
                <Surface style={styles.iconSurface}>
                  <Image
                    source={step.imageSource}
                    style={styles.appIconImage}
                    resizeMode="contain"
                  />
                </Surface>
                <View style={styles.goldBadgePill}>
                  <Sparkles size={14} color="#F59E0B" />
                  <Text style={styles.goldBadgeText}>Institutional Grade</Text>
                </View>
              </View>
            )}

            {step.imageStyle === 'medium' && (
              <Surface style={styles.bannerSurface}>
                <Image
                  source={step.imageSource}
                  style={styles.mediumBannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlayBadge}>
                  <BarChart2 size={14} color="#10B981" />
                  <Text style={styles.bannerOverlayText}>Real-Time Feeds</Text>
                </View>
              </Surface>
            )}

            {step.imageStyle === 'banner' && (
              <Surface style={styles.bannerSurface}>
                <Image
                  source={step.imageSource}
                  style={styles.smallBannerImage}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlayBadge}>
                  <ShieldCheck size={14} color="#F59E0B" />
                  <Text style={styles.bannerOverlayText}>100% Verified Track Record</Text>
                </View>
              </Surface>
            )}
          </View>

          {/* Text and Information */}
          <View style={styles.textContainer}>
            <View style={styles.categoryBadgeRow}>
              <Chip variant="soft" color="accent" style={styles.stepChip}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <BadgeIcon size={12} color="#F59E0B" />
                  <Chip.Label style={styles.stepChipLabel}>{step.badge}</Chip.Label>
                </View>
              </Chip>
            </View>

            <Text style={styles.slideTitle}>{step.title}</Text>
            <Text style={styles.slideSubtitle}>{step.subtitle}</Text>
            <Text style={styles.slideDescription}>{step.description}</Text>

            {/* Highlighted Stat Pill */}
            <View style={styles.highlightPill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.highlightStatText}>{step.highlightStat}</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation and Indicators */}
      <View style={styles.footerContainer}>
        {/* Step Indicator Dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, index) => {
            const isActive = index === currentStep;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          style={styles.nextButton}
          onPress={handleNext}
        >
          <View style={styles.buttonContentRow}>
            <Button.Label style={styles.nextButtonText}>
              {currentStep === STEPS.length - 1 ? 'Enter Trading Terminal' : 'Continue'}
            </Button.Label>
            <ArrowRight size={18} color="#0F172A" strokeWidth={2.5} />
          </View>
        </Button>

        {/* Step Number Tracker */}
        <Text style={styles.stepCounterText}>
          Step {currentStep + 1} of {STEPS.length}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0F1D', // Deep modern dark luxury palette
    zIndex: 99999,
    justifyContent: 'space-between',
  },
  ambientGlow: {
    position: 'absolute',
    top: -60,
    left: width * 0.1,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#F59E0B',
    opacity: 0.08,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    bottom: -100,
    right: -40,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: '#3B82F6',
    opacity: 0.06,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBrandText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    letterSpacing: 2,
    color: '#F8FAFC',
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skipButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  slideCard: {
    width: '100%',
    alignItems: 'center',
  },
  visualContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconVisualWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F59E0B',
    opacity: 0.18,
  },
  iconSurface: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  appIconImage: {
    width: 72,
    height: 72,
  },
  goldBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 14,
  },
  goldBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  bannerSurface: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  mediumBannerImage: {
    width: '100%',
    height: '100%',
  },
  smallBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerOverlayText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#F8FAFC',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  categoryBadgeRow: {
    marginBottom: 10,
  },
  stepChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stepChipLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  highlightStatText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F1F5F9',
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
    gap: 16,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 28,
    backgroundColor: '#F59E0B',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#334155',
  },
  nextButton: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#0F172A',
    fontWeight: '800',
  },
  stepCounterText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
});
