import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Bell, X, ArrowRight, TrendingUp, Sparkles } from 'lucide-react-native';
import { Card, Chip, PressableFeedback, Text } from 'heroui-native';
import { useTheme } from '../contexts/ThemeContext';

export interface NotificationToastData {
  id: string;
  title: string;
  message: string;
  pair?: string;
  type?: 'BUY' | 'SELL';
  actionLabel?: string;
  onPressAction?: () => void;
}

interface InAppNotificationToastProps {
  notification: NotificationToastData | null;
  onDismiss: () => void;
  autoHideDuration?: number;
}

const { width } = Dimensions.get('window');

export default function InAppNotificationToast({
  notification,
  onDismiss,
  autoHideDuration = 5500,
}: InAppNotificationToastProps) {
  const { colors } = useTheme();

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [notification, autoHideDuration, onDismiss]);

  if (!notification) return null;

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <Animated.View
        entering={FadeInDown.springify().damping(14).stiffness(120)}
        exiting={FadeOutUp.duration(250)}
        style={styles.animatedWrapper}
      >
        <PressableFeedback
          onPress={() => {
            notification.onPressAction?.();
            onDismiss();
          }}
        >
          <Card
            style={[
              styles.toastCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.primary,
              },
            ]}
          >
            <Card.Body style={styles.toastBody}>
              <View style={styles.contentRow}>
                {/* Left Alert Icon */}
                <View
                  style={[
                    styles.iconBadge,
                    {
                      backgroundColor:
                        notification.type === 'BUY'
                          ? '#10B98120'
                          : notification.type === 'SELL'
                          ? '#EF444420'
                          : `${colors.primary}25`,
                    },
                  ]}
                >
                  {notification.type ? (
                    <TrendingUp
                      size={20}
                      color={notification.type === 'BUY' ? '#10B981' : '#EF4444'}
                    />
                  ) : (
                    <Bell size={20} color={colors.primary} />
                  )}
                </View>

                {/* Text Content */}
                <View style={styles.textColumn}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.titleText, { color: colors.text }]}>
                      {notification.title}
                    </Text>
                    {notification.pair && (
                      <Chip
                        variant="soft"
                        color={notification.type === 'BUY' ? 'success' : 'danger'}
                      >
                        <Chip.Label>{notification.pair}</Chip.Label>
                      </Chip>
                    )}
                  </View>

                  <Text style={[styles.messageText, { color: colors.textSecondary }]}>
                    {notification.message}
                  </Text>
                </View>

                {/* Dismiss Button */}
                <PressableFeedback onPress={onDismiss}>
                  <View style={[styles.closeButton, { backgroundColor: colors.background }]}>
                    <X size={14} color={colors.textSecondary} />
                  </View>
                </PressableFeedback>
              </View>

              {/* Bottom actionable prompt */}
              {notification.actionLabel && (
                <View style={[styles.actionPromptRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.actionPromptText, { color: colors.primary }]}>
                    {notification.actionLabel}
                  </Text>
                  <ArrowRight size={14} color={colors.primary} />
                </View>
              )}
            </Card.Body>
          </Card>
        </PressableFeedback>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  animatedWrapper: {
    width: '100%',
    maxWidth: 440,
  },
  toastCard: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  toastBody: {
    padding: 14,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  messageText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
});
