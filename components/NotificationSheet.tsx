import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Card, Chip, PressableFeedback, Spinner, Surface, Text } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Bell,
  TrendingUp,
  Award,
  CircleAlert as AlertCircle,
  Clock,
  CheckCheck,
  Sparkles,
  Inbox,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchNotifications, NotificationData } from '../lib/database';
import DigitalMorphHeading from './DigitalMorphHeading';

interface NotificationSheetProps {
  visible: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | 'signal' | 'alert' | 'updates';

export default function NotificationSheet({ visible, onClose }: NotificationSheetProps) {
  const { colors, fontSizes } = useTheme();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<FilterCategory>('all');

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: 'sent' as const }))
    );
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, status: (n.status === 'pending' ? 'sent' : 'pending') as 'sent' | 'pending' }
          : n
      )
    );
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'signal':
        return {
          icon: <TrendingUp size={18} color="#10B981" />,
          color: '#10B981',
          bgTint: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.28)',
          label: 'SIGNAL',
          chipColor: 'success' as const,
        };
      case 'achievement':
        return {
          icon: <Award size={18} color="#F59E0B" />,
          color: '#F59E0B',
          bgTint: 'rgba(245, 158, 11, 0.12)',
          borderColor: 'rgba(245, 158, 11, 0.28)',
          label: 'ACHIEVE',
          chipColor: 'warning' as const,
        };
      case 'announcement':
        return {
          icon: <Sparkles size={18} color="#06B6D4" />,
          color: '#06B6D4',
          bgTint: 'rgba(6, 182, 212, 0.12)',
          borderColor: 'rgba(6, 182, 212, 0.28)',
          label: 'UPDATE',
          chipColor: 'accent' as const,
        };
      case 'alert':
        return {
          icon: <AlertCircle size={18} color="#EF4444" />,
          color: '#EF4444',
          bgTint: 'rgba(239, 68, 68, 0.12)',
          borderColor: 'rgba(239, 68, 68, 0.28)',
          label: 'ALERT',
          chipColor: 'danger' as const,
        };
      default:
        return {
          icon: <Bell size={18} color={colors.textSecondary} />,
          color: colors.textSecondary,
          bgTint: `${colors.surface}`,
          borderColor: colors.border,
          label: 'INFO',
          chipColor: 'default' as const,
        };
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now.getTime() - notificationTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredNotifications = useMemo(() => {
    if (selectedFilter === 'all') return notifications;
    if (selectedFilter === 'signal') return notifications.filter((n) => n.type === 'signal');
    if (selectedFilter === 'alert') return notifications.filter((n) => n.type === 'alert');
    if (selectedFilter === 'updates')
      return notifications.filter((n) => n.type === 'announcement' || n.type === 'achievement');
    return notifications;
  }, [notifications, selectedFilter]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.status === 'pending').length;
  }, [notifications]);

  const filterTabs: { id: FilterCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: notifications.length },
    {
      id: 'signal',
      label: 'Signals',
      count: notifications.filter((n) => n.type === 'signal').length,
    },
    {
      id: 'alert',
      label: 'Alerts',
      count: notifications.filter((n) => n.type === 'alert').length,
    },
    {
      id: 'updates',
      label: 'Updates',
      count: notifications.filter(
        (n) => n.type === 'announcement' || n.type === 'achievement'
      ).length,
    },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'flex-end',
    },
    sheetWrapper: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      maxHeight: '85%',
      width: '100%',
      flex: 1,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
    sheetContainer: {
      flex: 1,
    },
    dragHandleBar: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 4,
    },
    dragHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionBtn: {
      borderRadius: 10,
      paddingHorizontal: 10,
      height: 32,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBarContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterScroll: {
      gap: 8,
    },
    filterChip: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 14,
      paddingBottom: 40,
    },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'flex-start',
    },
    notificationCardUnread: {
      borderColor: 'rgba(245, 158, 11, 0.4)',
      backgroundColor: 'rgba(245, 158, 11, 0.05)',
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      marginTop: 2,
    },
    contentCol: {
      flex: 1,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    typePillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    title: {
      fontSize: fontSizes.medium,
      fontWeight: '700',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
      lineHeight: 20,
      marginBottom: 4,
    },
    message: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      lineHeight: 18,
    },
    unreadPill: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    loadingContainer: {
      padding: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 16,
    },
    emptyState: {
      padding: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 6,
    },
    emptyText: {
      fontSize: fontSizes.small + 1,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 260,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Card style={styles.sheetWrapper}>
          <SafeAreaView style={styles.sheetContainer} edges={['bottom']}>
            {/* Visual Drag Handle */}
            <View style={styles.dragHandleBar}>
              <View style={styles.dragHandle} />
            </View>

            {/* Modal Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <DigitalMorphHeading
                  text="Notifications"
                  characterHeight={26}
                  style={{
                    fontSize: fontSizes.large + 2,
                    fontWeight: 'bold',
                    color: colors.text,
                    fontFamily: 'Inter-Bold',
                  }}
                  glowColor="rgba(245, 158, 11, 0.25)"
                />
                {unreadCount > 0 && (
                  <Chip size="sm" variant="soft" color="warning" style={{ borderRadius: 8 }}>
                    <Chip.Label style={{ fontSize: 11, fontFamily: 'Inter-Bold' }}>
                      {unreadCount} New
                    </Chip.Label>
                  </Chip>
                )}
              </View>

              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    style={styles.actionBtn}
                    onPress={markAllAsRead}
                  >
                    <CheckCheck size={14} color={colors.primary} />
                    <Button.Label style={{ fontSize: 11, color: colors.primary }}>
                      Mark all read
                    </Button.Label>
                  </Button>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <X size={16} color={colors.textSecondary} />
                </Button>
              </View>
            </View>

            {/* Filter Category Tabs */}
            <View style={styles.filterBarContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {filterTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={selectedFilter === tab.id ? 'primary' : 'outline'}
                    style={styles.filterChip}
                    onPress={() => setSelectedFilter(tab.id)}
                  >
                    <Button.Label style={{ fontSize: 12 }}>
                      {tab.label} {tab.count > 0 ? `(${tab.count})` : ''}
                    </Button.Label>
                  </Button>
                ))}
              </ScrollView>
            </View>

            {/* Notifications Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <Spinner size="lg" />
                <Text style={styles.loadingText}>Loading live alerts...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.emptyIconCircle}>
                      <Inbox size={32} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>
                      {selectedFilter === 'all'
                        ? "You're all caught up! Real-time signals and trading alerts will appear here."
                        : `No ${selectedFilter} notifications found right now.`}
                    </Text>
                  </View>
                ) : (
                  filteredNotifications.map((notification, index) => {
                    const typeConfig = getTypeConfig(notification.type);
                    const isUnread = notification.status === 'pending';

                    return (
                      <Animated.View
                        key={notification.id}
                        entering={FadeInDown.delay(index * 35).springify().damping(16)}
                      >
                        <PressableFeedback
                          onPress={() => toggleNotificationRead(notification.id)}
                        >
                          <Surface
                            style={[
                              styles.notificationCard,
                              isUnread && {
                                borderColor: typeConfig.borderColor,
                                backgroundColor: typeConfig.bgTint,
                              },
                            ]}
                          >
                            {/* Type Icon Badge */}
                            <View
                              style={[
                                styles.iconBox,
                                {
                                  backgroundColor: typeConfig.bgTint,
                                  borderColor: typeConfig.borderColor,
                                },
                              ]}
                            >
                              {typeConfig.icon}
                            </View>

                            {/* Notification Body */}
                            <View style={styles.contentCol}>
                              <View style={styles.metaRow}>
                                <View style={styles.typePillRow}>
                                  <Chip
                                    size="sm"
                                    variant="soft"
                                    color={typeConfig.chipColor}
                                    style={{ borderRadius: 6, paddingHorizontal: 6 }}
                                  >
                                    <Chip.Label
                                      style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        fontFamily: 'Inter-Bold',
                                      }}
                                    >
                                      {typeConfig.label}
                                    </Chip.Label>
                                  </Chip>
                                  {isUnread && (
                                    <View
                                      style={[
                                        styles.unreadPill,
                                        { backgroundColor: typeConfig.color },
                                      ]}
                                    />
                                  )}
                                </View>

                                <View style={styles.timeRow}>
                                  <Clock size={11} color={colors.textSecondary} />
                                  <Text style={styles.timeText}>
                                    {getTimeAgo(notification.created_at)}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.title}>{notification.title}</Text>
                              <Text style={styles.message}>{notification.message}</Text>
                            </View>
                          </Surface>
                        </PressableFeedback>
                      </Animated.View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </SafeAreaView>
        </Card>
      </View>
    </Modal>
  );
}
