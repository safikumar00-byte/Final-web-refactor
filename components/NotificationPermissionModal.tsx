import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Bell, ShieldCheck, X } from 'lucide-react-native';
import { Button, Card, Chip, PressableFeedback, Text } from 'heroui-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { registerForPushNotifications, requestNotificationPermissions } from '../lib/notifications';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

const { width } = Dimensions.get('window');

export default function NotificationPermissionModal({
  visible,
  onClose,
  onPermissionGranted,
}: NotificationPermissionModalProps) {
  const { colors } = useTheme();

  // Bell ringing animation
  const bellRotation = useSharedValue(0);
  const bellScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      bellScale.value = withSpring(1.12, { damping: 10 });
      bellRotation.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 110 }),
          withTiming(14, { duration: 110 }),
          withTiming(-8, { duration: 110 }),
          withTiming(8, { duration: 110 }),
          withTiming(0, { duration: 250 }),
          withTiming(0, { duration: 1400 }) // pause before next ring
        ),
        -1,
        false
      );
    }
  }, [visible, bellRotation, bellScale]);

  const animatedBellStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bellScale.value },
      { rotate: `${bellRotation.value}deg` },
    ],
  }));

  const handleAllowNotifications = async () => {
    try {
      const granted = await requestNotificationPermissions();
      await AsyncStorage.setItem('@notification_permission_prompt_shown', 'true');
      if (granted) {
        await AsyncStorage.setItem('@notifications_enabled', 'true');
        await registerForPushNotifications();
        onPermissionGranted?.();
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
    } finally {
      onClose();
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem('@notification_permission_prompt_shown', 'true');
    } catch (err) {
      console.error('Error saving dismissal preference:', err);
    } finally {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(180)}
          style={styles.modalWrapper}
        >
          <Card
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Card.Body style={styles.cardBody}>
              {/* Header row with pill and close button */}
              <View style={styles.topBar}>
                <Chip variant="soft" color="accent" size="sm">
                  <Chip.Label style={styles.chipText}>Live Trade Alerts</Chip.Label>
                </Chip>
                <PressableFeedback onPress={handleDismiss}>
                  <View
                    style={[
                      styles.closeIconCircle,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <X size={15} color={colors.textSecondary} />
                  </View>
                </PressableFeedback>
              </View>

              {/* Animated Bell Hero Badge */}
              <View style={styles.bellHeroContainer}>
                <View
                  style={[
                    styles.bellHalo,
                    { backgroundColor: `${colors.primary}18` },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.bellBadge,
                      { backgroundColor: colors.primary },
                      animatedBellStyle,
                    ]}
                  >
                    <Bell size={28} color="#0F172A" strokeWidth={2.4} />
                  </Animated.View>
                </View>
              </View>

              {/* Streamlined, Punchy Headline & Copy (Crowd-free) */}
              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Never Miss a Live Trade
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  Instant notifications the second high-probability Gold & Silver setups trigger and hit profit targets.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <Button
                  variant="primary"
                  size="lg"
                  style={styles.allowButton}
                  onPress={handleAllowNotifications}
                >
                  <Button.Label style={styles.allowButtonText}>
                    Enable Live Alerts
                  </Button.Label>
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  style={styles.laterButton}
                  onPress={handleDismiss}
                >
                  <Button.Label style={{ color: colors.textSecondary }}>
                    Maybe Later
                  </Button.Label>
                </Button>
              </View>

              {/* Clean Trust Micro-copy */}
              <View style={styles.privacyRow}>
                <ShieldCheck size={13} color="#10B981" />
                <Text
                  style={[styles.privacyText, { color: colors.textSecondary }]}
                >
                  Zero spam • Strictly live trading signals
                </Text>
              </View>
            </Card.Body>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardBody: {
    padding: 22,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    fontFamily: 'Inter-Bold',
    letterSpacing: 0.5,
  },
  closeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellHeroContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  bellHalo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 19,
  },
  actionContainer: {
    gap: 8,
  },
  allowButton: {
    borderRadius: 12,
    backgroundColor: '#F59E0B',
  },
  allowButtonText: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    fontSize: 15,
  },
  laterButton: {
    borderRadius: 12,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
});
