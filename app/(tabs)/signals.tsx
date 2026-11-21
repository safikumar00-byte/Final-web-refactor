import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import SignalCard from '../../components/SignalCard';
import CampaignBanner from '../../components/CampaignBanner';
import { subscribeToSignals } from '../../supabase/signals';
import { Signal } from '../../lib/supabase';
import { Campaign, getRandomSignalsPageCampaign } from '../../lib/campaigns';
import { Award, ChartBar, DollarSign, Target, TrendingDown, TrendingUp } from 'lucide-react-native';
import SignalCardSkeleton from '../../components/skeletons/SignalCardSkeleton';
import DigitalMorphHeading from '../../components/DigitalMorphHeading';
import DigitalOdometer from '../../components/DigitalOdometer';

export default function SignalsScreen() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const handleSignalsUpdate = useCallback((newSignals: Signal[]) => {
    setSignals(newSignals);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSignals(handleSignalsUpdate);
    loadCampaign();
    return () => unsubscribe?.();
  }, []);

  const loadCampaign = async () => {
    try {
      const randomCampaign = await getRandomSignalsPageCampaign();
      setCampaign(randomCampaign);
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCampaign(); // Reload campaign on refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const styles = StyleSheet.create({
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 4,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      flexBasis: '48%',
    },
    statValue: {
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      // marginTop: 8,
      // marginBottom: 4,
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
    },
    statCardLarge: {
      flexBasis: '100%',
    },
  });

  // Calculate portfolio stats from signals
  const closedSignals = signals.filter(s => s.status === 'closed');
  const activeSignals = signals.filter(s => s.status === 'active');
  const profitTrades = closedSignals.filter(s => (s.pnl || 0) > 0).length;
  const lossTrades = closedSignals.length - profitTrades;

  const portfolioStats = {
    totalTrades: closedSignals.length,
    activeTrades: activeSignals.length,
    profitTrades,
    lossTrades,
  };

  const filteredSignals = signals.filter(signal =>
    filter === 'all' ? true : signal.status === filter
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={{ padding: 20 }}>
          <DigitalMorphHeading
            text={t('signalsTitle')}
            characterHeight={30}
            style={{
              fontSize: fontSizes.large + 4,
              fontWeight: 'bold',
              color: colors.text,
              fontFamily: 'Inter-Bold',
              marginBottom: 12,
            }}
            glowColor="rgba(34, 197, 94, 0.25)"
          />

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Card.Body style={{ width: '100%', padding: 0 }}>
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.statLabel}>{t('totalTrades')}</Text>
                  <DigitalOdometer
                    value={portfolioStats.totalTrades}
                    digitHeight={22}
                    textStyle={styles.statValue}
                  />
                </View>
              </Card.Body>
            </Card>
            <Card style={styles.statCard}>
              <Card.Body style={{ width: '100%', padding: 0 }}>
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.statLabel}>{t('profitTrades')}</Text>
                  <DigitalOdometer
                    value={portfolioStats.profitTrades}
                    digitHeight={22}
                    textStyle={[styles.statValue, { color: colors.success }]}
                  />
                </View>
              </Card.Body>
            </Card>
            <Card style={styles.statCard}>
              <Card.Body style={{ width: '100%', padding: 0 }}>
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.statLabel}>{t('lossTrades')}</Text>
                  <DigitalOdometer
                    value={portfolioStats.lossTrades}
                    digitHeight={22}
                    textStyle={[styles.statValue, { color: colors.error }]}
                  />
                </View>
              </Card.Body>
            </Card>
            <Card style={styles.statCard}>
              <Card.Body style={{ width: '100%', padding: 0 }}>
                <View style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.statLabel}>{t('activeTrades')}</Text>
                  <DigitalOdometer
                    value={activeSignals.length}
                    digitHeight={22}
                    textStyle={[styles.statValue, { color: colors.primary }]}
                  />
                </View>
              </Card.Body>
            </Card>
          </View>

          {/* Filter Buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
            {['all', 'active', 'closed'].map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'primary' : 'secondary'}
                style={{
                  borderRadius: 16,
                  backgroundColor: filter === f ? colors.primary : colors.surface,
                }}
                onPress={() => setFilter(f)}
              >
                <Button.Label
                  style={{
                    color: filter === f ? colors.background : colors.text,
                    fontFamily: 'Inter-Medium',
                    fontSize: fontSizes.medium,
                  }}
                >
                  {t(f.toUpperCase().toLowerCase())}
                </Button.Label>
              </Button>
            ))}
          </View>

          {/* Signal Cards with Skeleton Loading */}
          {loading && signals.length === 0 ? (
            <SignalCardSkeleton count={3} />
          ) : (
            filteredSignals.map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))
          )}
        </Animated.View>
      </ScrollView>
        {/* Campaign Banner */}
        {campaign && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <CampaignBanner campaign={campaign} aspectRatio="1:4" />
          </View>
        )}

    </SafeAreaView>
  );
}