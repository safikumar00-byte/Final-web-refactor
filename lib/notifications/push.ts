import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { createNotification } from '../database';
import { getDeviceId, getDeviceInfo } from './core';
import { upsertUserProfile } from './userProfile';
import { getFCMToken, onForegroundMessage } from './firebase';
import { requestNotificationPermissions } from './permissions';
import { supabase } from '../supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushNotificationData {
  type: 'signal' | 'achievement' | 'announcement' | 'alert';
  title: string;
  message: string;
  data?: any;
}

// Get FCM token based on platform
async function getPlatformFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return await getFCMToken();
    } else {
      // For mobile, you would use Expo push tokens
      // This is handled in the push notification registration
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting platform FCM token:', error);
    return null;
  }
}


// Get push notification token
async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const deviceId = await getDeviceId();
    const { data: existingDevice, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', deviceId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error checking device registration:', error);
      return null;
    }

    if (!existingDevice) {
      console.log('➕ Device not registered, inserting...');
      await supabase
        .from('user_profiles')
        .insert({
          user_id: deviceId,
          fcm_token: null,
          device_type: Platform.OS as 'ios' | 'android' | 'web',
          app_version: '1.0.0',
          last_active: new Date().toISOString(),
        });
    } else {
      console.log('✅ Device already registered:', deviceId);
    }
    return null;
  }

  return getExpoPushToken(); // ← Your existing logic
}

async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Must use physical device for push notifications');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('⚠️ EAS project ID not configured');
      return null;
    }

    console.log('🔑 Getting Expo push token...');
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('✅ Expo push token obtained');
    return token.data;
  } catch (error) {
    console.error('❌ Error getting Expo push token:', error);
    return null;
  }
}

// Register device for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    console.log('🚀 Starting push notification registration...');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    const deviceId = await getDeviceId();
    const pushToken = await getPushToken();

    if (!pushToken) {
      console.log('Could not get push token');
      return null;
    }


    // Save device profile to database
    const success = await upsertUserProfile({
      user_id: deviceId,
      fcm_token: pushToken,
      device_type: Platform.OS as 'ios' | 'android' | 'web',
      app_version: '1.0.0',
    });


    if (success) {
      console.log('Device registered for push notifications:', deviceId);
      return deviceId;
    } else {
      console.error('Failed to save device profile');
      return null;
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    return null;
  }
}

// Send a local notification (for testing and immediate feedback)
export async function sendLocalNotification(data: PushNotificationData): Promise<void> {
  try {
    console.log('📤 Sending local notification:', data.title);

    if (Platform.OS === 'web') {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.title, {
          body: data.message,
          icon: '/assets/images/icon.png',
          data: data.data,
        });
      }
    } else {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.message,
          data: data.data,
        },
        trigger: null, // Send immediately
      });
    }

    // Also save to database - this will trigger the automatic push notification
    await createNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
    });

    console.log('✅ Local notification sent');
  } catch (error) {
    console.error('❌ Error sending local notification:', error);
  }
}

// Create notification in database (triggers automatic push)
export async function createPushNotification(data: PushNotificationData & { target_user?: string | null }): Promise<string | null> {
  try {
    console.log('📝 Creating push notification in database:', data.title);

    // Insert into notifications table - this will automatically trigger the push notification
    const notificationId = await createNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      target_user: data.target_user || undefined,
    });

    if (notificationId) {
      console.log('✅ Notification created:', notificationId);
    }

    return notificationId;
  } catch (error) {
    console.error('❌ Error creating push notification:', error);
    return null;
  }
}

// Log notification response
export async function logNotificationResponse(
  notificationId: string,
  action: 'clicked' | 'dismissed' | 'opened',
  deviceInfo?: any
): Promise<void> {
  try {
    const deviceId = await getDeviceId();

    // In a real app, you'd send this to your notification_responses table
    console.log('Notification response logged:', {
      notificationId,
      deviceId,
      action,
      deviceInfo: deviceInfo || getDeviceInfo(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging notification response:', error);
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  const listeners: (() => void)[] = [];

  console.log('🔔 Setting up notification listeners...');

  if (Platform.OS === 'web') {
    // Web foreground message listener
    const unsubscribeForeground = onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload);
      // Handle foreground message
    });
    listeners.push(unsubscribeForeground);
  } else {
    // Mobile notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response.notification.request.content.title);

      const notificationId = response.notification.request.identifier;
      logNotificationResponse(notificationId, 'clicked');

      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type === 'signal' && data?.signal_id) {
        console.log('Navigate to signal:', data.signal_id);
        // Add navigation logic here
      }
    });

    listeners.push(() => {
      notificationListener.remove();
      responseListener.remove();
    });
  }

  console.log('✅ Notification listeners set up');

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up notification listeners');
    listeners.forEach(cleanup => cleanup());
  };
}

// Predefined notification functions
export async function sendSignalNotification(signal: {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  status: string;
}): Promise<void> {
  await createPushNotification({
    type: 'signal',
    title: `${signal.status === 'active' ? 'New' : 'Updated'} Signal Alert`,
    message: `${signal.pair} ${signal.type} signal ${signal.status}! Entry: $${signal.entry_price.toFixed(2)}`,
    data: {
      signal_id: signal.id,
      pair: signal.pair,
      type: signal.type,
      entry_price: signal.entry_price,
      status: signal.status,
    },
  });
}

export async function sendAchievementNotification(achievement: {
  title: string;
  description: string;
  type: string;
}): Promise<void> {
  await createPushNotification({
    type: 'achievement',
    title: `Achievement Unlocked: ${achievement.title}`,
    message: achievement.description,
    data: {
      achievement_type: achievement.type,
    },
  });
}

export async function sendTestNotification(): Promise<void> {
  await createPushNotification({
    type: 'signal',
    title: 'Test Signal Alert',
    message: 'XAU/USD BUY signal activated! Entry: $2,345.67',
    data: {
      signal_id: 'test-123',
      pair: 'XAU/USD',
      type: 'BUY',
      entry_price: 2345.67,
      test: true,
    },
  });
}

export async function sendTargetedNotification(
  userId: string,
  data: PushNotificationData
): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: userId,
  });
}

export async function sendBroadcastNotification(data: PushNotificationData): Promise<void> {
  await createPushNotification({
    ...data,
    target_user: null, // null means broadcast to all users
  });
}