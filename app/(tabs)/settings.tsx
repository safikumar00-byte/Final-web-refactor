import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, PressableFeedback, Surface, Text } from 'heroui-native';
import { Bell, Shield, CircleHelp as HelpCircle, Settings, ChevronRight, Share2, Moon, Sun, Type, Smartphone, Database, Globe, Check, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationTestPanel from '../../components/NotificationTestPanel';
import BackendMonitor from '../../components/BackendMonitor';
import PushNotificationManager from '../../components/PushNotificationManager';
import SilentNotificationTester from '../../components/SilentNotificationTester';
import { getCurrentDeviceId, getDeviceProfile, DeviceProfile, registerDevice } from '../../lib/notifications';
import { silentNotificationHandler } from '../../lib/notifications';
import { backgroundSyncManager } from '../../lib/backgroundSyncManager';
import { supabase } from '@/lib/supabase';
import { getFCMToken } from '@/lib/notifications';
import DigitalMorphHeading from '../../components/DigitalMorphHeading';


export default function SettingsScreen() {
  const { colors, fontSizes, theme, setTheme, fontSize, setFontSize } = useTheme();
  const { t, currentLanguageInfo, availableLanguages, changeLanguage } = useLanguage();
  const [showNotificationTests, setShowNotificationTests] = useState(false);
  const [showSilentTests, setShowSilentTests] = useState(false);
  const [showBackendMonitor, setShowBackendMonitor] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deviceInitialized, setDeviceInitialized] = useState(false);
  const isMountedRef = useRef(true);

  const loadDeviceInfo = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      setLoading(true);
      console.log('🔄 Fetching FCM token...');

      // 1. Get the FCM token for the current device
      const fcmToken = await getFCMToken();

      if (!fcmToken) {
        console.warn('⚠️ No FCM token found. Skipping device info fetch.');
        return;
      }

      if (!isMountedRef.current) return;
      const deviceId = await getCurrentDeviceId();

      console.log('📖 Loading device info for:', deviceId);
      console.log('🔍 Looking for device with FCM token:', fcmToken);

      // 2. Query Supabase where fcm_token matches
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, fcm_token, device_type')
        .eq('fcm_token', fcmToken)
        .limit(1);

      if (!isMountedRef.current) return;

      if (error) {
        console.error('❌ Supabase fetch error:', error.message);
        return;
      }

      if (!data || !data[0]) {
        console.log('⚠️ No device found with this FCM token. Registering device...');
        registerDevice(fcmToken);
      } else {
        console.log('✅ Device profile loaded via FCM token:', {
          user_id: data[0].user_id,
          deviceType: data[0].device_type,
        });

        if (isMountedRef.current) {
          setDeviceId(data[0].user_id);
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('❌ Unexpected error loading device info:', error);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!deviceInitialized) {
      loadDeviceInfo().then(() => {
        if (isMountedRef.current) {
          setDeviceInitialized(true);
        }
      });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [loadDeviceInfo, deviceInitialized]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Check out this amazing Gold & Silver trading signals app! Get real-time trading opportunities and boost your portfolio.',
        url: 'https://your-app-url.com',
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleNotificationRegistration = (deviceId: string | null) => {
    if (deviceId) {
      // Refresh device info after successful registration
      loadDeviceInfo();
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      setShowLanguagePicker(false);
    } catch (error) {
      Alert.alert(t('error'), t('networkError'));
    }
  };

  const menuItems = [
    {
      id: 'notifications',
      title: t('notificationSettings'),
      icon: Bell,
      color: colors.warning,
      onPress: () => Alert.alert(t('notifications'), t('comingSoon')),
    },
    {
      id: 'security',
      title: t('securityPrivacy'),
      icon: Shield,
      color: colors.success,
      onPress: () => Alert.alert(t('securityPrivacy'), t('comingSoon')),
    },
    {
      id: 'share',
      title: t('shareApp'),
      icon: Share2,
      color: colors.secondary,
      onPress: handleShare,
    },
    {
      id: 'help',
      title: t('helpSupport'),
      icon: HelpCircle,
      color: colors.primary,
      onPress: () => Alert.alert(t('helpSupport'), 'Contact support at help@tradingsignals.com'),
    },
  ];

  const renderMenuItem = (item: any) => (
    <PressableFeedback
      key={item.id}
      onPress={item.onPress}
    >
      <View style={styles.menuItem}>
        <View style={styles.menuItemLeft}>
          <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
            <item.icon size={20} color={item.color} />
          </View>
          <Text style={styles.menuItemText}>{item.title}</Text>
        </View>
        <ChevronRight size={20} color={colors.textSecondary} />
      </View>
    </PressableFeedback>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 16,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      marginBottom: 24,
    },
    title: {
      fontSize: fontSizes.large + 4,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    deviceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    deviceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    deviceIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    deviceTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    deviceInfo: {
      gap: 8,
    },
    deviceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    deviceLabel: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    deviceValue: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
      flex: 1,
      textAlign: 'right',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: `${colors.success}20`,
    },
    statusText: {
      fontSize: fontSizes.small,
      color: colors.success,
      fontFamily: 'Inter-SemiBold',
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    settingText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    settingValue: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    themeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    themeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    themeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    themeButtonTextActive: {
      color: colors.background,
    },
    fontSizeButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    fontSizeButton: {
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontSizeButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    fontSizeButtonText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Medium',
    },
    fontSizeButtonTextActive: {
      color: colors.background,
    },
    menuContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItemText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    versionText: {
      textAlign: 'center',
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      paddingBottom: 20,
    },
    testToggle: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: `${colors.secondary}15`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: `${colors.secondary}30`,
    },
    testToggleText: {
      fontSize: fontSizes.medium,
      color: colors.secondary,
      fontFamily: 'Inter-SemiBold',
    },
    silentTestToggle: {
      backgroundColor: `${colors.warning}15`,
      borderColor: `${colors.warning}30`,
    },
    silentTestToggleText: {
      color: colors.warning,
    },
    modal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '90%',
      maxWidth: 400,
      maxHeight: '70%',
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
    },
    languageNative: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    languageSelected: {
      backgroundColor: `${colors.primary}10`,
    },
  });

  // if (loading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <View style={styles.loadingContainer}>
  //         <ActivityIndicator size="large" color={colors.primary} />
  //         <Text style={styles.loadingText}>{t('loading')}</Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>


        {/* Header */}
        <View style={styles.header}>
          <DigitalMorphHeading
            text={t('settingsTitle')}
            characterHeight={30}
            style={styles.title}
            glowColor="rgba(245, 158, 11, 0.25)"
          />
          <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>
        </View>

        <PushNotificationManager onRegistrationComplete={handleNotificationRegistration} />


        {/* App Preferences */}
        <View style={styles.section}>
          <DigitalMorphHeading
            text={t('preferences')}
            characterHeight={24}
            style={styles.sectionTitle}
          />
          {/* <Text>Status: {isEnabled ? "Enabled" : "Not Enabled"}</Text> */}


          {/* Language Selection */}
          <PressableFeedback
            onPress={() => setShowLanguagePicker(true)}
          >
            <Surface style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Globe size={20} color={colors.secondary} />
                <Text style={styles.settingText}>{t('language')}</Text>
              </View>
              <Text style={styles.settingValue}>
                {currentLanguageInfo.flag} {currentLanguageInfo.name}
              </Text>
            </Surface>
          </PressableFeedback>

          {/* Theme Selection */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={colors.secondary} />
              <Text style={styles.settingText}>{t('theme')}</Text>
            </View>
            <View style={styles.themeButtons}>
              <Button
                size="sm"
                variant={theme === 'light' ? 'primary' : 'outline'}
                style={[
                  styles.themeButton,
                  theme === 'light' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('light')}
              >
                <Sun size={14} color={theme === 'light' ? colors.background : colors.textSecondary} />
                <Button.Label style={[
                  styles.themeButtonText,
                  theme === 'light' && styles.themeButtonTextActive
                ]}>
                  {t('light')}
                </Button.Label>
              </Button>
              <Button
                size="sm"
                variant={theme === 'dark' ? 'primary' : 'outline'}
                style={[
                  styles.themeButton,
                  theme === 'dark' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('dark')}
              >
                <Moon size={14} color={theme === 'dark' ? colors.background : colors.textSecondary} />
                <Button.Label style={[
                  styles.themeButtonText,
                  theme === 'dark' && styles.themeButtonTextActive
                ]}>
                  {t('dark')}
                </Button.Label>
              </Button>
              <Button
                size="sm"
                variant={theme === 'system' ? 'primary' : 'outline'}
                style={[
                  styles.themeButton,
                  theme === 'system' && styles.themeButtonActive
                ]}
                onPress={() => setTheme('system')}
              >
                <Settings size={14} color={theme === 'system' ? colors.background : colors.textSecondary} />
                <Button.Label style={[
                  styles.themeButtonText,
                  theme === 'system' && styles.themeButtonTextActive
                ]}>
                  {t('auto')}
                </Button.Label>
              </Button>
            </View>
          </View>

          {/* Font Size Selection */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Type size={20} color={colors.primary} />
              <Text style={styles.settingText}>{t('fontSize')}</Text>
            </View>
            <View style={styles.fontSizeButtons}>
              <Button
                size="sm"
                variant={fontSize === 'small' ? 'primary' : 'outline'}
                style={[
                  styles.fontSizeButton,
                  fontSize === 'small' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('small')}
              >
                <Button.Label style={[
                  styles.fontSizeButtonText,
                  fontSize === 'small' && styles.fontSizeButtonTextActive
                ]}>
                  S
                </Button.Label>
              </Button>
              <Button
                size="sm"
                variant={fontSize === 'medium' ? 'primary' : 'outline'}
                style={[
                  styles.fontSizeButton,
                  fontSize === 'medium' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('medium')}
              >
                <Button.Label style={[
                  styles.fontSizeButtonText,
                  fontSize === 'medium' && styles.fontSizeButtonTextActive
                ]}>
                  M
                </Button.Label>
              </Button>
              <Button
                size="sm"
                variant={fontSize === 'large' ? 'primary' : 'outline'}
                style={[
                  styles.fontSizeButton,
                  fontSize === 'large' && styles.fontSizeButtonActive
                ]}
                onPress={() => setFontSize('large')}
              >
                <Button.Label style={[
                  styles.fontSizeButtonText,
                  fontSize === 'large' && styles.fontSizeButtonTextActive
                ]}>
                  L
                </Button.Label>
              </Button>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <DigitalMorphHeading
            text={t('account')}
            characterHeight={24}
            style={styles.sectionTitle}
          />
          <View style={styles.menuContainer}>
            {menuItems.map(renderMenuItem)}
          </View>
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>{t('version', { version: '1.0.0' })}</Text>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modal}>
          <Card style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                style={styles.closeButton}
                onPress={() => setShowLanguagePicker(false)}
              >
                <X size={18} color={colors.textSecondary} />
              </Button>
            </View>
            <ScrollView>
              {availableLanguages.map((language) => (
                <PressableFeedback
                  key={language.code}
                  onPress={() => handleLanguageChange(language.code)}
                >
                  <Surface
                    style={[
                      styles.languageOption,
                      currentLanguageInfo.code === language.code && styles.languageSelected
                    ]}
                  >
                    <Text style={styles.languageFlag}>{language.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{language.name}</Text>
                      <Text style={styles.languageNative}>{language.nativeName}</Text>
                    </View>
                    {currentLanguageInfo.code === language.code && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </Surface>
                </PressableFeedback>
              ))}
            </ScrollView>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}