import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import PulsingLiveDot from '../../components/PulsingLiveDot';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calculator,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import { Button, Card, Chip, Input, PressableFeedback, Spinner, Surface, Text } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fetchSignals, subscribeToSignals } from '../../supabase/signals';
import { Signal } from '../../lib/supabase';
import {
  analyzeAllTrades,
  TradeHistoryAnalysisResult,
  DynamicTradeCalculation,
} from '../../lib/tradeHistoryAnalysis';
import TradeHistorySkeleton from '../../components/skeletons/TradeHistorySkeleton';
import DigitalOdometer from '../../components/DigitalOdometer';
import DigitalMorphHeading from '../../components/DigitalMorphHeading';

type FilterTab = 'all' | 'closed' | 'active' | 'wins' | 'losses';

export default function HistoryScreen() {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Calculator System State
  const [simulatedLotSize, setSimulatedLotSize] = useState<number>(0.1);
  const [lotInputStr, setLotInputStr] = useState<string>('0.1');
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [balanceInputStr, setBalanceInputStr] = useState<string>('10000');
  const [showCalculatorDetails, setShowCalculatorDetails] = useState<boolean>(true);
  const [expandedSimulators, setExpandedSimulators] = useState<Record<string, boolean>>({});

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedPair, setSelectedPair] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSignals();
      setSignals(data);
    } catch (err) {
      console.error('Error fetching trade history:', err);
      setError('Failed to load trade history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Real-time subscription to signals
    const unsubscribe = subscribeToSignals((newSignals) => {
      setSignals(newSignals);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Handle lot size change
  const handleLotChange = (valStr: string) => {
    setLotInputStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setSimulatedLotSize(parsed);
    }
  };

  const handleLotPreset = (preset: number) => {
    setSimulatedLotSize(preset);
    setLotInputStr(preset.toString());
  };

  // Handle account balance change
  const handleBalanceChange = (valStr: string) => {
    setBalanceInputStr(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      setAccountBalance(parsed);
    }
  };

  const handleBalancePreset = (preset: number) => {
    setAccountBalance(preset);
    setBalanceInputStr(preset.toString());
  };

  // Toggle individual signal calculator simulator
  const toggleSignalSimulator = (id: string) => {
    setExpandedSimulators((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Dynamic automatic calculation of all trades
  const analysis: TradeHistoryAnalysisResult = useMemo(() => {
    return analyzeAllTrades(signals, simulatedLotSize, accountBalance);
  }, [signals, simulatedLotSize, accountBalance]);

  // Unique pairs for filter dropdown/chips
  const availablePairs = useMemo(() => {
    const set = new Set<string>();
    signals.forEach((s) => set.add(s.pair));
    return ['ALL', ...Array.from(set)];
  }, [signals]);

  // Filtered signals list
  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      // Pair filter
      if (selectedPair !== 'ALL' && signal.pair !== selectedPair) {
        return false;
      }

      const calc = analysis.tradeCalculations[signal.id];

      // Tab filter
      if (activeFilter === 'closed') return signal.status === 'closed';
      if (activeFilter === 'active') return signal.status === 'active';
      if (activeFilter === 'wins') {
        return signal.status === 'closed' && (calc?.dynamicPnL ?? 0) >= 0;
      }
      if (activeFilter === 'losses') {
        return signal.status === 'closed' && (calc?.dynamicPnL ?? 0) < 0;
      }

      return true; // 'all'
    });
  }, [signals, activeFilter, selectedPair, analysis]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <TradeHistorySkeleton />
      </SafeAreaView>
    );
  }

  if (error && signals.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <Button variant="primary" onPress={loadData}>
            <Button.Label>Retry</Button.Label>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <DigitalMorphHeading
            text="Trade History"
            characterHeight={28}
            style={[styles.headerTitle, { color: colors.text }]}
            glowColor="rgba(245, 158, 11, 0.25)"
          />
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {analysis.totalSignalsSent} Regularly Sent Signals • Verified Results
          </Text>
        </View>
        <Button variant="ghost" size="sm" isIconOnly onPress={loadData}>
          <RotateCcw size={18} color={colors.text} />
        </Button>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Dynamic Calculator System Card */}
        <Card style={[styles.calculatorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Card.Body>
            <PressableFeedback onPress={() => setShowCalculatorDetails((prev) => !prev)}>
              <View style={styles.calcHeader}>
                <View style={styles.calcTitleRow}>
                  <Calculator size={20} color={colors.primary} />
                  <Text style={[styles.calcTitle, { color: colors.text }]}>
                    Dynamic P&L Calculator System
                  </Text>
                  {/* <Chip variant="soft" color="accent">
                    <Chip.Label>Live Auto-Calculate</Chip.Label>
                  </Chip> */}
                </View>
                {showCalculatorDetails ? (
                  <ChevronUp size={18} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={colors.textSecondary} />
                )}
              </View>
            </PressableFeedback>

            {showCalculatorDetails && (
              <View style={styles.calcBody}>
                {/* Simulated Lot Size Control */}
                <View style={styles.calcSection}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Simulated Lot Size</Text>
                    <Text style={[styles.currentValueTag, { color: colors.primary }]}>
                      {simulatedLotSize} Lot{simulatedLotSize !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View style={styles.lotPresetRow}>
                    {[0.01, 0.05, 0.1, 0.5, 1.0].map((preset) => (
                      <Button
                        key={preset}
                        variant={simulatedLotSize === preset ? 'primary' : 'outline'}
                        size="sm"
                        style={styles.presetButton}
                        onPress={() => handleLotPreset(preset)}
                      >
                        <Button.Label>{preset}</Button.Label>
                      </Button>
                    ))}
                  </View>

                  <Input
                    value={lotInputStr}
                    onChangeText={handleLotChange}
                    keyboardType="numeric"
                    placeholder="Custom lot size (e.g. 0.25)"
                    style={[styles.calcInput, { borderColor: colors.border, color: colors.text }]}
                  />
                </View>

                {/* Account Balance Simulation */}
                <View style={styles.calcSection}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account Balance Simulation</Text>
                    <Text style={[styles.currentValueTag, { color: colors.primary }]}>
                      ${accountBalance.toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.lotPresetRow}>
                    {[1000, 5000, 10000, 25000].map((preset) => (
                      <Button
                        key={preset}
                        variant={accountBalance === preset ? 'primary' : 'outline'}
                        size="sm"
                        style={styles.presetButton}
                        onPress={() => handleBalancePreset(preset)}
                      >
                        <Button.Label>${preset >= 1000 ? `${preset / 1000}k` : preset}</Button.Label>
                      </Button>
                    ))}
                  </View>

                  <Input
                    value={balanceInputStr}
                    onChangeText={handleBalanceChange}
                    keyboardType="numeric"
                    placeholder="Enter account balance"
                    style={[styles.calcInput, { borderColor: colors.border, color: colors.text }]}
                  />
                </View>

                {/* Dynamic Calculated Outcomes */}
                <Surface
                  style={[
                    styles.resultsSurface,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.resultItem}>
                    <Text style={[styles.resultItemLabel, { color: colors.textSecondary }]}>
                      Net Realized Profit
                    </Text>
                    <DigitalOdometer
                      value={Math.abs(analysis.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      prefix={analysis.netProfit >= 0 ? "+$" : "-$"}
                      digitHeight={22}
                      textStyle={[
                        styles.resultItemValue,
                        { color: analysis.netProfit >= 0 ? colors.success : colors.error },
                      ]}
                    />
                  </View>

                  <View style={styles.resultDivider} />

                  <View style={styles.resultItem}>
                    <Text style={[styles.resultItemLabel, { color: colors.textSecondary }]}>
                      Account Growth
                    </Text>
                    <DigitalOdometer
                      value={Math.abs(analysis.totalGainPercentage).toFixed(2)}
                      prefix={analysis.totalGainPercentage >= 0 ? "+" : "-"}
                      suffix="%"
                      digitHeight={22}
                      textStyle={[
                        styles.resultItemValue,
                        { color: analysis.totalGainPercentage >= 0 ? colors.success : colors.error },
                      ]}
                    />
                  </View>

                  <View style={styles.resultDivider} />

                  <View style={styles.resultItem}>
                    <Text style={[styles.resultItemLabel, { color: colors.textSecondary }]}>
                      Active Floating P&L
                    </Text>
                    <DigitalOdometer
                      value={Math.abs(analysis.currentFloatingPnL).toFixed(2)}
                      prefix={analysis.currentFloatingPnL >= 0 ? "+$" : "-$"}
                      digitHeight={22}
                      textStyle={[
                        styles.resultItemValue,
                        { color: analysis.currentFloatingPnL >= 0 ? colors.success : colors.error },
                      ]}
                    />
                  </View>
                </Surface>
              </View>
            )}
          </Card.Body>
        </Card>

        {/* Trade Analysis Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Win Rate */}
          <Card style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Card.Body style={styles.metricCardBody}>
              <View style={styles.metricIconRow}>
                <Target size={18} color={colors.success} />
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Win Rate</Text>
              </View>
              <DigitalOdometer
                value={analysis.winRate.toFixed(1)}
                suffix="%"
                digitHeight={26}
                textStyle={[styles.metricNumber, { color: colors.text }]}
              />
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                {analysis.winningTradesCount}W / {analysis.losingTradesCount}L
              </Text>
            </Card.Body>
          </Card>

          {/* Profit Factor */}
          <Card style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Card.Body style={styles.metricCardBody}>
              <View style={styles.metricIconRow}>
                <Award size={18} color={colors.warning} />
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Profit Factor</Text>
              </View>
              <DigitalOdometer
                value={analysis.profitFactor.toFixed(2)}
                digitHeight={26}
                textStyle={[styles.metricNumber, { color: colors.text }]}
              />
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                ${analysis.totalProfit.toFixed(0)} / ${analysis.totalLoss.toFixed(0)}
              </Text>
            </Card.Body>
          </Card>

          {/* Total Pips Gained */}
          <Card style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Card.Body style={styles.metricCardBody}>
              <View style={styles.metricIconRow}>
                <TrendingUp size={18} color={colors.primary} />
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Total Pips</Text>
              </View>
              <DigitalOdometer
                value={Math.abs(analysis.totalPips).toLocaleString()}
                prefix={analysis.totalPips >= 0 ? '+' : '-'}
                digitHeight={26}
                textStyle={[styles.metricNumber, { color: colors.text }]}
              />
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>Closed Signals</Text>
            </Card.Body>
          </Card>

          {/* Avg Gain Per Trade */}
          <Card style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Card.Body style={styles.metricCardBody}>
              <View style={styles.metricIconRow}>
                <Sparkles size={18} color={colors.secondary} />
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>Avg / Trade</Text>
              </View>
              <DigitalOdometer
                value={Math.abs(analysis.averageGainPerTrade).toFixed(1)}
                prefix={analysis.averageGainPerTrade >= 0 ? "+$" : "-$"}
                digitHeight={26}
                textStyle={[
                  styles.metricNumber,
                  { color: analysis.averageGainPerTrade >= 0 ? colors.success : colors.error },
                ]}
              />
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>
                @ {simulatedLotSize} lot
              </Text>
            </Card.Body>
          </Card>
        </View>

        {/* Filter Navigation */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {(
              [
                { id: 'all', label: `All Sent (${analysis.totalSignalsSent})` },
                { id: 'closed', label: `Closed (${analysis.closedTradesCount})` },
                { id: 'active', label: `Active (${analysis.activeTradesCount})` },
                { id: 'wins', label: `Wins (${analysis.winningTradesCount})` },
                { id: 'losses', label: `Losses (${analysis.losingTradesCount})` },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => (
              <Button
                key={tab.id}
                variant={activeFilter === tab.id ? 'primary' : 'outline'}
                size="sm"
                onPress={() => setActiveFilter(tab.id)}
                style={activeFilter === tab.id ? styles.activeFilterBtn : { borderColor: colors.border }}
              >
                <Button.Label>{tab.label}</Button.Label>
              </Button>
            ))}
          </ScrollView>

          {/* Pair Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pairFilterScroll}>
            {availablePairs.map((pair) => (
              <Button
                key={pair}
                variant={selectedPair === pair ? 'secondary' : 'ghost'}
                size="sm"
                onPress={() => setSelectedPair(pair)}
                style={styles.pairChip}
              >
                <Button.Label>{pair}</Button.Label>
              </Button>
            ))}
          </ScrollView>
        </View>

        {/* Signals History List */}
        <View style={styles.historyList}>
          {filteredSignals.length === 0 ? (
            <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Card.Body>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No signals found for this filter criteria.
                </Text>
              </Card.Body>
            </Card>
          ) : (
            filteredSignals.map((signal) => {
              const calc = analysis.tradeCalculations[signal.id];
              const isExpanded = !!expandedSimulators[signal.id];
              const isClosed = signal.status === 'closed';
              const isWin = isClosed && (calc?.dynamicPnL ?? 0) >= 0;
              const isLoss = isClosed && (calc?.dynamicPnL ?? 0) < 0;

              return (
                <Animated.View key={signal.id} entering={FadeInDown.springify().damping(15)}>
                  <Card
                    style={[styles.signalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Card.Body>
                      {/* Top Row: Pair, Trade Type, Target Result */}
                      <View style={styles.signalTopRow}>
                        <View style={styles.pairTitleGroup}>
                          {signal.status === 'active' && (
                            <PulsingLiveDot color={colors.success} size={6} />
                          )}
                          <Text style={[styles.signalPair, { color: colors.text }]}>{signal.pair}</Text>
                          <Chip variant="soft" color={signal.type === 'BUY' ? 'success' : 'danger'}>
                            <Chip.Label>{signal.type}</Chip.Label>
                          </Chip>
                        </View>

                        {/* Result / Status Chip */}
                        {isWin && (
                          <Chip variant="soft" color="success">
                            <Chip.Label>{calc?.targetHit ?? 'WIN'} HIT (+{calc?.pips} pips)</Chip.Label>
                          </Chip>
                        )}
                        {isLoss && (
                          <Chip variant="soft" color="danger">
                            <Chip.Label>SL HIT ({calc?.pips} pips)</Chip.Label>
                          </Chip>
                        )}
                        {signal.status === 'active' && (
                          <Chip variant="soft" color="warning">
                            <Chip.Label>LIVE FLOATING</Chip.Label>
                          </Chip>
                        )}
                        {signal.status === 'pending' && (
                          <Chip variant="soft" color="default">
                            <Chip.Label>PENDING</Chip.Label>
                          </Chip>
                        )}
                      </View>

                      {/* Dynamic PnL Banner */}
                      <View style={styles.pnlBannerRow}>
                        <View>
                          <Text style={[styles.sentTimestamp, { color: colors.textSecondary }]}>
                            <Clock size={12} color={colors.textSecondary} /> Sent: {formatDate(signal.timestamp)}
                          </Text>
                          <Text style={[styles.pnlSubText, { color: colors.textSecondary }]}>
                            Calculated for {simulatedLotSize} Lot:
                          </Text>
                        </View>

                        <View style={styles.pnlValueContainer}>
                          <Text
                            style={[
                              styles.pnlAmount,
                              {
                                color:
                                  (calc?.dynamicPnL ?? 0) > 0
                                    ? colors.success
                                    : (calc?.dynamicPnL ?? 0) < 0
                                      ? colors.error
                                      : colors.text,
                              },
                            ]}
                          >
                            {(calc?.dynamicPnL ?? 0) >= 0 ? '+' : ''}${calc?.dynamicPnL?.toFixed(2) ?? '0.00'}
                          </Text>
                          <Text
                            style={[
                              styles.pnlPercentage,
                              {
                                color:
                                  (calc?.dynamicPnL ?? 0) >= 0
                                    ? colors.success
                                    : (calc?.dynamicPnL ?? 0) < 0
                                      ? colors.error
                                      : colors.textSecondary,
                              },
                            ]}
                          >
                            ({(calc?.gainPercent ?? 0) >= 0 ? '+' : ''}
                            {calc?.gainPercent?.toFixed(2) ?? '0.00'}% account)
                          </Text>
                        </View>
                      </View>

                      {/* Price Points Surface */}
                      <Surface
                        style={[
                          styles.pricesSurface,
                          { backgroundColor: colors.background, borderColor: colors.border },
                        ]}
                      >
                        <View style={styles.priceColumn}>
                          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Entry</Text>
                          <Text style={[styles.priceValue, { color: colors.text }]}>
                            {signal.entry_price.toFixed(signal.pair.includes('XAG') ? 3 : 2)}
                          </Text>
                        </View>

                        <View style={styles.priceColumn}>
                          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                            {isClosed ? 'Exit Price' : 'Current'}
                          </Text>
                          <Text
                            style={[
                              styles.priceValue,
                              {
                                color:
                                  (calc?.dynamicPnL ?? 0) >= 0
                                    ? colors.success
                                    : colors.error,
                              },
                            ]}
                          >
                            {calc?.exitPrice.toFixed(signal.pair.includes('XAG') ? 3 : 2)}
                          </Text>
                        </View>

                        <View style={styles.priceColumn}>
                          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Targets</Text>
                          <Text style={[styles.priceValue, { color: colors.text }]}>
                            TP: {signal.take_profit_levels[0]?.toFixed(signal.pair.includes('XAG') ? 2 : 1)}
                          </Text>
                        </View>

                        <View style={styles.priceColumn}>
                          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Stop Loss</Text>
                          <Text style={[styles.priceValue, { color: colors.error }]}>
                            {signal.stop_loss.toFixed(signal.pair.includes('XAG') ? 2 : 1)}
                          </Text>
                        </View>
                      </Surface>

                      {/* Description note */}
                      {signal.description && (
                        <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                          {signal.description}
                        </Text>
                      )}

                      {/* Dynamic Calculator Drawer for this Signal */}
                      <PressableFeedback onPress={() => toggleSignalSimulator(signal.id)}>
                        <View style={styles.toggleSimulatorBar}>
                          <Text style={[styles.toggleSimulatorText, { color: colors.primary }]}>
                            {isExpanded ? 'Hide Target Calculations' : 'View Target P&L Simulator'}
                          </Text>
                          {isExpanded ? (
                            <ChevronUp size={16} color={colors.primary} />
                          ) : (
                            <ChevronDown size={16} color={colors.primary} />
                          )}
                        </View>
                      </PressableFeedback>

                      {isExpanded && (
                        <View style={styles.expandedSimulatorContent}>
                          <Text style={[styles.simulatorSubTitle, { color: colors.textSecondary }]}>
                            Projected Returns at {simulatedLotSize} lot:
                          </Text>
                          {calc?.tpSimulations.map((tp) => (
                            <View key={tp.level} style={styles.tpRow}>
                              <View style={styles.tpLabelGroup}>
                                <CheckCircle2 size={14} color={colors.success} />
                                <Text style={[styles.tpLevelText, { color: colors.text }]}>
                                  Take Profit {tp.level} ({tp.price}):
                                </Text>
                              </View>
                              <Text style={[styles.tpReturnText, { color: colors.success }]}>
                                +${tp.pnl.toFixed(2)} (+{tp.gainPercent.toFixed(2)}%)
                              </Text>
                            </View>
                          ))}
                          <View style={styles.slRow}>
                            <View style={styles.tpLabelGroup}>
                              <XCircle size={14} color={colors.error} />
                              <Text style={[styles.tpLevelText, { color: colors.text }]}>
                                Stop Loss ({calc?.slRisk.price}):
                              </Text>
                            </View>
                            <Text style={[styles.slRiskText, { color: colors.error }]}>
                              -${calc?.slRisk.riskAmount.toFixed(2)} (-{calc?.slRisk.riskPercent.toFixed(2)}%)
                            </Text>
                          </View>
                        </View>
                      )}
                    </Card.Body>
                  </Card>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  calculatorCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calcTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  calcBody: {
    marginTop: 14,
    gap: 12,
  },
  calcSection: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  currentValueTag: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  lotPresetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 6,
  },
  calcInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultsSurface: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 6,
  },
  resultItem: {
    alignItems: 'center',
    flex: 1,
  },
  resultItemLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  resultItemValue: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  resultDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#374151',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48.5%',
    borderRadius: 12,
    borderWidth: 1,
  },
  metricCardBody: {
    padding: 12,
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginVertical: 2,
  },
  metricSub: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
  },
  filterSection: {
    marginBottom: 14,
    gap: 8,
  },
  filterScroll: {
    gap: 6,
  },
  pairFilterScroll: {
    gap: 6,
  },
  activeFilterBtn: {
    borderRadius: 20,
  },
  pairChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
  },
  historyList: {
    gap: 12,
    paddingBottom: 32,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  signalCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  signalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pairTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signalPair: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  pnlBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sentTimestamp: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  pnlSubText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  pnlValueContainer: {
    alignItems: 'flex-end',
  },
  pnlAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  pnlPercentage: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
  pricesSurface: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceColumn: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  descriptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
    marginBottom: 10,
  },
  toggleSimulatorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#374151',
  },
  toggleSimulatorText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  expandedSimulatorContent: {
    marginTop: 8,
    paddingTop: 8,
    gap: 6,
  },
  simulatorSubTitle: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  tpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tpLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tpLevelText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  tpReturnText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
  slRiskText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
  },
});
