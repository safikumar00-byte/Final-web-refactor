import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Button, Card, Chip, PressableFeedback, Text } from 'heroui-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Settings2, Bell, RefreshCw, Repeat, BarChart2 } from 'lucide-react-native';
import FlippableCard from '@/components/FlippableCard';
import LivePriceCardSkeleton from '@/components/skeletons/LivePriceCardSkeleton';
import DigitalOdometer from '@/components/DigitalOdometer';
import DigitalMorphHeading from '@/components/DigitalMorphHeading';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AssetSwitcher from '../../components/AssetSwitcher';
import TimeframeSwitcher from '../../components/TimeframeSwitcher';
import PulsingLiveDot from '@/components/PulsingLiveDot';
import ConnectionStatus from '@/components/ConnectionStatus';
import MarketOverview from '@/components/MarketOverview';
import AboutAppSection from '@/components/AboutAppSection';
import { fetchMarketData, fetchTechnicalIndicators, fetchEconomicEvents, MarketData, TechnicalIndicator, EconomicEvent } from '../../lib/database';
import { getForexPrice } from '../../lib/forex';
import { fetchPriceSummary } from '../../lib/database';
import { DeviceProfile, getCurrentDeviceId, getFCMToken, registerDevice } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import NotificationSheet from '@/components/NotificationSheet';
import SetupGuide from '@/components/SetupGuide';

const screenWidth = Dimensions.get('window').width;

type LivePriceData = {
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: string | number;
  updated_at?: string;
};

const getTradingViewInterval = (label: string): string => {
  const map: Record<string, string> = {
    '1M': '1',
    '5M': '5',
    '15M': '15',
    '1H': '60',
    '4H': '240',
    '1D': 'D',
    '1W': 'W',
  };
  return map[label] || '60';
};

export default function HomeScreen() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [selectedAsset, setSelectedAsset] = useState<'XAU/USD' | 'BTC/USD'>('XAU/USD');
  const [timeframe, setTimeframe] = useState('1H');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const tradingViewInterval = getTradingViewInterval(timeframe);
  const [setupGuideVisible, setSetupGuideVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const loadDeviceInfo = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching FCM token...');

      // 1. Get the FCM token for the current device
      const fcmToken = await getFCMToken();

      if (!fcmToken) {
        console.warn('⚠️ No FCM token found. Skipping device info fetch.');
        return;
      }

      const deviceId = await getCurrentDeviceId();

      console.log('📖 Loading device info for:', deviceId);

      console.log('🔍 Looking for device with FCM token:', fcmToken);

      // 2. Query Supabase where fcm_token matches
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, fcm_token, device_type')
        .eq('fcm_token', fcmToken)
        .limit(1); // returns null if not found

      if (error) {
        console.error('❌ Supabase fetch error:', error.message);
        Alert.alert(t('error'), t('failedToLoad'));
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

        setDeviceId(data[0].user_id);     // set local state
        // setDeviceProfile(data[0]);        // set local state
      }
    } catch (error) {
      console.error('❌ Unexpected error loading device info:', error);
      Alert.alert(t('error'), t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);


  const [deviceInitialized, setDeviceInitialized] = useState(false);

  useEffect(() => {
    if (!deviceInitialized) {
      loadDeviceInfo().then(() => {
        setDeviceInitialized(true);
      });

      // Initialize silent notification system
      // const initializeSilentSystem = async () => {
      //   try {
      //     await silentNotificationHandler.initialize();
      //     await backgroundSyncManager.initialize();
      //     console.log('✅ Silent notification system initialized');
      //   } catch (error) {
      //     console.error('❌ Error initializing silent system:', error);
      //   }
      // };
    }
  }, [loadDeviceInfo, deviceInitialized]);


  const fetchLivePrice = async () => {
    setPriceLoading(true);

    try {
      const data = await fetchPriceSummary(selectedAsset.toUpperCase());

      if (!data) throw new Error('Price summary not available');

      setCurrentData({
        price: data.current_price,
        change: data.change_amount,
        change_percent: data.change_percent,
        high: data.high_price,
        low: data.low_price,
        volume: data.volume ?? '-',
      });
    } catch (error) {
      console.error('❌ Error fetching price summary:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const [currentData, setCurrentData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    change_percent: 0,
    high: 0,
    low: 0,
    volume: '-',
    updated_at: undefined,
  });
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedAsset]);

  const loadData = async () => {
    try {
      const [market, indicators, events] = await Promise.all([
        fetchMarketData(),
        fetchTechnicalIndicators(selectedAsset),
        fetchEconomicEvents(),
      ]);

      setMarketData(market);
      setTechnicalIndicators(indicators);
      setEconomicEvents(events);

      const assetData = market.find(item => item.pair === selectedAsset);
      if (assetData) {
        setCurrentData({
          price: assetData.price,
          change: assetData.change,
          change_percent: assetData.change_percent,
          high: assetData.high,
          low: assetData.low,
          volume: assetData.volume || '-',
          updated_at: assetData.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading home screen data:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  if (livePrice) {
    currentData.price = livePrice;
  }

  const getTradingViewHTML = (symbol: string, interval: string): string => {
    const formattedSymbol = symbol.replace('/', '');
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          background-color: #f1f3f6;
        }
      </style>
    </head>
    <body>
      <iframe
        src="https://s.tradingview.com/widgetembed/?frameElementId=tv_embed&symbol=${formattedSymbol}&interval=${interval}&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=exchange"
        style="width:100%;height:100%;border:none;"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </body>
    </html>
  `;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.large + 4,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    livePriceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1,
      height: 320,
      borderColor: colors.border,
    },
    livePriceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    pairTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    livePriceValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 12,
    },
    priceLoading: {
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    statValue: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    flipBar: {
      height: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    flipBarText: {
      fontSize: fontSizes.small - 1,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    techGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 8,
      marginBottom: 6,
    },
    techItem: {
      flexBasis: '48%',
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    techLabel: {
      fontSize: fontSizes.small - 2,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    techValue: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    chartContainer: {
      height: 300,
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    indicatorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    indicatorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    indicatorName: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    indicatorValue: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
    },
    indicatorStatus: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Regular',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <View style={styles.headerLeft}>
          <DigitalMorphHeading
            text={t('homeTitle')}
            characterHeight={30}
            style={styles.title}
            glowColor="rgba(245, 158, 11, 0.25)"
          />
          <Text style={styles.subtitle}>{t('homeSubtitle')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Button
            isIconOnly
            size="md"
            variant="ghost"
            style={styles.actionButton}
            onPress={() => setSetupGuideVisible(true)}
          >
            <Settings2 size={24} color={colors.text} />
          </Button>
          <Button
            isIconOnly
            size="md"
            variant="ghost"
            style={styles.actionButton}
            onPress={() => setNotificationVisible(true)}
          >
            <Bell size={24} color={colors.text} />
          </Button>
        </View>
      </Animated.View>

      <AssetSwitcher selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).springify().damping(15)}>
          {priceLoading && !currentData.price ? (
            <LivePriceCardSkeleton />
          ) : (
            <FlippableCard
              isFlipped={isCardFlipped}
              onFlipChange={setIsCardFlipped}
              front={
                <Card style={styles.livePriceCard}>
                  <Card.Body style={{ padding: 0, justifyContent: 'space-between', flex: 1 }}>
                    <View style={styles.livePriceHeader}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <DigitalMorphHeading
                            text={selectedAsset}
                            characterHeight={26}
                            style={styles.pairTitle}
                            glowColor="rgba(34, 197, 94, 0.3)"
                          />
                          <PulsingLiveDot color="#22C55E" size={7} />
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: fontSizes.medium }}>
                          {currentData.updated_at
                            ? t('updatedMinutesAgo', { minutes: Math.ceil((Date.now() - new Date(currentData.updated_at).getTime()) / 60000) })
                            : t('updatedRecently')}
                        </Text>
                      </View>
                      <View style={styles.changeContainer}>
                        {currentData.change >= 0 ? (
                          <TrendingUp size={16} color={colors.success} />
                        ) : (
                          <TrendingDown size={16} color={colors.error} />
                        )}
                        <Text style={{ color: currentData.change >= 0 ? colors.success : colors.error }}>
                          {currentData.change >= 0 ? '+' : ''}
                          {isFinite(currentData.change_percent) ? currentData.change_percent.toFixed(2) : '0.00'}%
                        </Text>
                      </View>
                    </View>

                    {priceLoading ? (
                      <Text style={[styles.livePriceValue, styles.priceLoading]}>
                        {t('loading')}
                      </Text>
                    ) : (
                      <DigitalOdometer
                        value={isFinite(currentData.price) ? currentData.price.toFixed(2) : '0.00'}
                        prefix="$"
                        digitHeight={38}
                        textStyle={[styles.livePriceValue, { marginBottom: 0 }]}
                        containerStyle={{ marginVertical: 8 }}
                      />
                    )}

                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('high')}</Text>
                        <Text style={styles.statValue}>
                          ${isFinite(currentData.high) ? currentData.high.toFixed(2) : '0.00'}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('low')}</Text>
                        <Text style={styles.statValue}>
                          ${isFinite(currentData.low) ? currentData.low.toFixed(2) : '0.00'}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statLabel}>{t('volume')}</Text>
                        <Text style={styles.statValue}>
                          {currentData.volume || '-'}
                        </Text>
                      </View>
                    </View>

                    {/* Interactive 3D Card Flip Action */}
                    <PressableFeedback onPress={() => setIsCardFlipped(true)}>
                      <View style={styles.flipBar}>
                        <Repeat size={13} color={colors.primary} />
                        <Text style={styles.flipBarText}>Tap to View 3D Technical Depth 🔄</Text>
                      </View>
                    </PressableFeedback>
                  </Card.Body>
                </Card>
              }
              back={
                <Card style={styles.livePriceCard}>
                  <Card.Body style={{ padding: 0 }}>
                    <View style={styles.livePriceHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.pairTitle}>{selectedAsset} Technicals</Text>
                        {/* <Chip variant="soft" color="accent" size="sm">
                          <Chip.Label style={{ fontSize: 10 }}>Pivots & Trend</Chip.Label>
                        </Chip> */}
                      </View>
                      <View style={styles.changeContainer}>
                        <TrendingUp size={14} color={colors.success} />
                        <Text style={{ color: colors.success, fontSize: 12, fontFamily: 'Inter-SemiBold' }}>
                          Bullish
                        </Text>
                      </View>
                    </View>

                    <View style={styles.techGrid}>
                      <View style={styles.techItem}>
                        <Text style={styles.techLabel}>RSI (14-period)</Text>
                        <Text style={[styles.techValue, { color: colors.success }]}>62.8 (Strong)</Text>
                      </View>
                      <View style={styles.techItem}>
                        <Text style={styles.techLabel}>Trend Momentum</Text>
                        <Text style={[styles.techValue, { color: colors.primary }]}>EMA 50 &gt; 200 Cross</Text>
                      </View>
                      <View style={styles.techItem}>
                        <Text style={styles.techLabel}>Key Resistance (R1)</Text>
                        <Text style={styles.techValue}>
                          ${isFinite(currentData.high) ? (currentData.high * 1.006).toFixed(2) : '2,365.40'}
                        </Text>
                      </View>
                      <View style={styles.techItem}>
                        <Text style={styles.techLabel}>Key Support (S1)</Text>
                        <Text style={styles.techValue}>
                          ${isFinite(currentData.low) ? (currentData.low * 0.994).toFixed(2) : '2,332.10'}
                        </Text>
                      </View>
                    </View>

                    {/* Interactive 3D Card Flip Action */}
                    <PressableFeedback onPress={() => setIsCardFlipped(false)}>
                      <View style={styles.flipBar}>
                        <Repeat size={13} color={colors.primary} />
                        <Text style={styles.flipBarText}>Tap to Return to Live Price 🔄</Text>
                      </View>
                    </PressableFeedback>
                  </Card.Body>
                </Card>
              }
            />
          )}
        </Animated.View>

        <TimeframeSwitcher
          selectedTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />

        {Platform.OS === 'web' ? (
          <View style={styles.chartContainer}>
            <iframe
              srcDoc={getTradingViewHTML(selectedAsset, tradingViewInterval)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <WebView
              source={{ html: getTradingViewHTML(selectedAsset, tradingViewInterval) }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scalesPageToFit
            />
          </View>
        )}

        {/* Technical Indicators */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <DigitalMorphHeading
            text={t('technicalIndicators')}
            characterHeight={24}
            style={styles.sectionTitle}
          />
          <Text style={{ color: colors.textSecondary, fontSize: fontSizes.medium, marginBottom: 12 }}>
            {technicalIndicators[0]?.updated_at
              ? t('updatedMinutesAgo', { minutes: Math.ceil((Date.now() - new Date(technicalIndicators[0].updated_at).getTime()) / 60000) })
              : t('updatedRecently')}
          </Text>

          <View style={{ gap: 12 }}>
            {technicalIndicators.map((indicator) => (
              <Card key={indicator.id} style={styles.indicatorCard}>
                <Card.Body style={{ padding: 0 }}>
                  <View style={styles.indicatorHeader}>
                    <Text style={styles.indicatorName}>{indicator.indicator_name}</Text>
                    <Text style={[styles.indicatorValue, { color: indicator.color }]}>
                      {indicator.value}
                    </Text>
                  </View>
                  <Text style={[styles.indicatorStatus, { color: indicator.color }]}>
                    {indicator.status}
                  </Text>
                </Card.Body>
              </Card>
            ))}
          </View>
        </View>

        <NotificationSheet
          visible={notificationVisible}
          onClose={() => setNotificationVisible(false)}
        />

        <SetupGuide
          visible={setupGuideVisible}
          onClose={() => setSetupGuideVisible(false)}
        />


        {/* About App Section */}
      </ScrollView>
    </SafeAreaView>
  );
}