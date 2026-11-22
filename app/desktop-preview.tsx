import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Card, Chip, Surface } from 'heroui-native';
import { useRouter } from 'expo-router';
import {
  Smartphone,
  Tablet,
  Laptop,
  TrendingUp,
  History,
  Calculator,
  Settings,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function DesktopPreviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();

  // Width presets for testing responsiveness
  const [deviceWidth, setDeviceWidth] = useState<number>(430);
  const [activeTab, setActiveTab] = useState<string>('signals');

  const isWide = width >= 1024;

  const handleOpenApp = (tabName: string) => {
    setActiveTab(tabName);
  };

  const previewUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? `${window.location.origin}/(tabs)/${activeTab}`
    : `/(tabs)/${activeTab}`;

  return (
    <SafeAreaView style={[styles.rootContainer, { backgroundColor: '#070A0F' }]}>
      {/* Presentation Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/(tabs)')}
            style={styles.backButton}
          >
            <ArrowLeft size={18} color={colors.text} />
            <Button.Label>Back to App</Button.Label>
          </Button>

          <View style={styles.brandTitleContainer}>
            <Text style={styles.brandTitle}>Forex Sigma Signals</Text>
            <Chip variant="soft" color="accent" size="sm">
              <Chip.Label>Desktop Presentation Viewport</Chip.Label>
            </Chip>
          </View>
        </View>

        {/* Viewport Width Preset Controls */}
        <View style={styles.controlsRow}>
          <Text style={styles.controlLabel}>Device Viewport:</Text>
          <View style={styles.presetButtons}>
            <Button
              variant={deviceWidth === 390 ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setDeviceWidth(390)}
              style={styles.presetBtn}
            >
              <Smartphone size={15} color={deviceWidth === 390 ? '#000' : colors.text} />
              <Button.Label>390px (Mobile)</Button.Label>
            </Button>
            <Button
              variant={deviceWidth === 430 ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setDeviceWidth(430)}
              style={styles.presetBtn}
            >
              <Smartphone size={15} color={deviceWidth === 430 ? '#000' : colors.text} />
              <Button.Label>430px (Pro Max)</Button.Label>
            </Button>
            <Button
              variant={deviceWidth === 540 ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setDeviceWidth(540)}
              style={styles.presetBtn}
            >
              <Tablet size={15} color={deviceWidth === 540 ? '#000' : colors.text} />
              <Button.Label>540px (Tablet/Fold)</Button.Label>
            </Button>
          </View>
        </View>
      </View>

      {/* Main Showcase Stage */}
      <View style={styles.stageContainer}>
        {/* Left Side: Presentation Notes & Quick Links (visible on wide screens) */}
        {isWide && (
          <View style={styles.sidePanel}>
            <Card style={styles.sideCard}>
              <Card.Body>
                <Text style={styles.sideCardTitle}>📱 Mobile Shell Highlights</Text>
                <Text style={styles.sideCardDesc}>
                  The production desktop application now automatically constrains its layout to mobile proportions (430–460px max width) with a centered neutral background, ensuring desktop visitors get a clean mobile app experience without stretched UI or distorted charts.
                </Text>

                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.featureText}>Centered Responsive Frame</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.featureText}>Full Height Viewport Aware</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.featureText}>100% Full Width on Mobile Devices</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text style={styles.featureText}>Native Bottom Nav & Safe Insets</Text>
                </View>

                <View style={styles.divider} />

                <Text style={styles.quickNavTitle}>Quick Tab Simulator:</Text>
                <View style={styles.quickNavButtons}>
                  <Button
                    variant={activeTab === 'signals' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleOpenApp('signals')}
                    style={styles.navBtn}
                  >
                    <TrendingUp size={15} color={activeTab === 'signals' ? '#000' : colors.text} />
                    <Button.Label>Signals</Button.Label>
                  </Button>
                  <Button
                    variant={activeTab === 'history' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleOpenApp('history')}
                    style={styles.navBtn}
                  >
                    <History size={15} color={activeTab === 'history' ? '#000' : colors.text} />
                    <Button.Label>History</Button.Label>
                  </Button>
                  <Button
                    variant={activeTab === 'calculator' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleOpenApp('calculator')}
                    style={styles.navBtn}
                  >
                    <Calculator size={15} color={activeTab === 'calculator' ? '#000' : colors.text} />
                    <Button.Label>Calculator</Button.Label>
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => handleOpenApp('settings')}
                    style={styles.navBtn}
                  >
                    <Settings size={15} color={activeTab === 'settings' ? '#000' : colors.text} />
                    <Button.Label>Settings</Button.Label>
                  </Button>
                </View>
              </Card.Body>
            </Card>
          </View>
        )}

        {/* Center: Device Mock-Up Frame */}
        <View style={styles.deviceFrameWrapper}>
          <View
            style={[
              styles.deviceMockupOuter,
              {
                width: Math.min(deviceWidth, width - 40),
                height: Math.min(height - 120, 840),
              },
            ]}
          >
            {/* Device Hardware Top: Dynamic Island / Speaker Pill */}
            <View style={styles.deviceSpeakerBar}>
              <View style={styles.dynamicIslandPill} />
            </View>

            {/* Embedded Live Screen Container */}
            <View style={styles.deviceScreenContent}>
              {Platform.OS === 'web' ? (
                // On Web, render iframe to the actual route for live interactive sandbox
                <iframe
                  src={previewUrl}
                  title="App Live Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    backgroundColor: '#0F172A',
                  }}
                />
              ) : (
                <View style={styles.nativeFallback}>
                  <Text style={styles.fallbackText}>Interactive Preview on Web Browser</Text>
                  <Button variant="primary" onPress={() => router.push('/(tabs)')}>
                    <Button.Label>Launch App Screen</Button.Label>
                  </Button>
                </View>
              )}
            </View>

            {/* Device Bottom Home Indicator Bar */}
            <View style={styles.deviceHomeBar}>
              <View style={styles.homeIndicatorLine} />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0A0E17',
    flexWrap: 'wrap',
    gap: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    paddingHorizontal: 10,
  },
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controlLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontFamily: 'Inter-Medium',
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 10,
    height: 34,
  },
  stageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 24,
    backgroundColor: '#05070C',
  },
  sidePanel: {
    width: 320,
    height: '90%',
    maxHeight: 760,
    justifyContent: 'center',
  },
  sideCard: {
    backgroundColor: '#0D1322',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 16,
  },
  sideCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  sideCardDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontFamily: 'Inter-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 16,
  },
  quickNavTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  quickNavButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  navBtn: {
    flex: 1,
    minWidth: 120,
    height: 36,
  },
  deviceFrameWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceMockupOuter: {
    backgroundColor: '#000000',
    borderRadius: 44,
    borderWidth: 4,
    borderColor: '#1E293B',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.95), 0 0 0 2px rgba(255, 255, 255, 0.1)',
      } as any,
      default: {
        elevation: 16,
      },
    }),
  },
  deviceSpeakerBar: {
    height: 32,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  dynamicIslandPill: {
    width: 90,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#262626',
  },
  deviceScreenContent: {
    flex: 1,
    width: '100%',
    backgroundColor: '#0B0F17',
    overflow: 'hidden',
  },
  deviceHomeBar: {
    height: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicatorLine: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
  },
  nativeFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 16,
  },
  fallbackText: {
    fontSize: 16,
    color: '#F8FAFC',
    textAlign: 'center',
  },
});
