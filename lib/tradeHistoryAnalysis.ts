import { Signal } from './supabase';

export interface DynamicTradeCalculation {
  signalId: string;
  exitPrice: number;
  points: number;
  pips: number;
  dynamicPnL: number;
  gainPercent: number;
  positionGainPercent: number;
  targetHit?: 'TP1' | 'TP2' | 'TP3' | 'SL' | 'ACTIVE' | 'PENDING';
  tpSimulations: {
    level: number;
    price: number;
    pnl: number;
    gainPercent: number;
  }[];
  slRisk: {
    price: number;
    riskAmount: number;
    riskPercent: number;
  };
}

export interface TradeHistoryAnalysisResult {
  totalSignalsSent: number;
  closedTradesCount: number;
  activeTradesCount: number;
  pendingTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  profitFactor: number;
  averageGainPerTrade: number;
  totalPips: number;
  currentFloatingPnL: number;
  projectedBalance: number;
  totalGainPercentage: number;
  tradeCalculations: Record<string, DynamicTradeCalculation>;
}

/**
 * Returns contract multiplier for a trading pair.
 * e.g., Gold standard lot = 100 oz ($1 move = $100 for 1.0 lot)
 * Silver standard lot = 5000 oz ($1 move = $5000 for 1.0 lot)
 */
export function getContractMultiplier(pair: string): number {
  const normalized = pair.toUpperCase().replace(/\s+/g, '');
  if (normalized.includes('XAU')) return 100;       // Gold: 100 oz per lot
  if (normalized.includes('XAG')) return 5000;      // Silver: 5,000 oz per lot
  if (normalized.includes('BTC')) return 1;         // BTC: 1 coin per lot
  if (normalized.includes('ETH')) return 1;         // ETH: 1 coin per lot
  return 100000;                                   // Standard Forex lot (EUR/USD, etc.)
}

/**
 * Returns pip size for pip counting based on asset.
 */
export function getPipSize(pair: string): number {
  const normalized = pair.toUpperCase().replace(/\s+/g, '');
  if (normalized.includes('XAU')) return 0.1;       // Gold: 1 pip = 0.10
  if (normalized.includes('XAG')) return 0.01;      // Silver: 1 pip = 0.01
  if (normalized.includes('BTC')) return 1.0;       // BTC: 1 pip = $1
  if (normalized.includes('JPY')) return 0.01;      // JPY pairs: 0.01
  return 0.0001;                                   // Standard Forex pip: 0.0001
}

/**
 * Calculates dynamic metrics for an individual trade based on user's simulated lot size.
 */
export function calculateTradeDynamicMetrics(
  signal: Signal,
  lotSize: number,
  accountBalance: number
): DynamicTradeCalculation {
  const multiplier = getContractMultiplier(signal.pair);
  const pipSize = getPipSize(signal.pair);

  // Determine exit/current price
  let exitPrice = signal.current_price ?? signal.entry_price;
  let targetHit: DynamicTradeCalculation['targetHit'] = 'PENDING';

  if (signal.status === 'active') {
    exitPrice = signal.current_price ?? signal.entry_price;
    targetHit = 'ACTIVE';
  } else if (signal.status === 'closed') {
    if (signal.current_price) {
      exitPrice = signal.current_price;
    } else if (signal.pnl && signal.pnl > 0) {
      exitPrice = signal.take_profit_levels[0] ?? signal.entry_price;
    } else {
      exitPrice = signal.stop_loss ?? signal.entry_price;
    }

    // Determine which level was hit
    if (signal.type === 'BUY') {
      if (signal.take_profit_levels[2] && exitPrice >= signal.take_profit_levels[2] - 0.5) {
        targetHit = 'TP3';
      } else if (signal.take_profit_levels[1] && exitPrice >= signal.take_profit_levels[1] - 0.5) {
        targetHit = 'TP2';
      } else if (signal.take_profit_levels[0] && exitPrice >= signal.take_profit_levels[0] - 0.5) {
        targetHit = 'TP1';
      } else if (exitPrice <= signal.stop_loss + 0.5) {
        targetHit = 'SL';
      } else {
        targetHit = (signal.pnl || 0) >= 0 ? 'TP1' : 'SL';
      }
    } else {
      // SELL
      if (signal.take_profit_levels[2] && exitPrice <= signal.take_profit_levels[2] + 0.5) {
        targetHit = 'TP3';
      } else if (signal.take_profit_levels[1] && exitPrice <= signal.take_profit_levels[1] + 0.5) {
        targetHit = 'TP2';
      } else if (signal.take_profit_levels[0] && exitPrice <= signal.take_profit_levels[0] + 0.5) {
        targetHit = 'TP1';
      } else if (exitPrice >= signal.stop_loss - 0.5) {
        targetHit = 'SL';
      } else {
        targetHit = (signal.pnl || 0) >= 0 ? 'TP1' : 'SL';
      }
    }
  }

  // Price difference based on BUY/SELL
  const priceDiff =
    signal.type === 'BUY'
      ? exitPrice - signal.entry_price
      : signal.entry_price - exitPrice;

  const points = priceDiff;
  const pips = Math.round(priceDiff / pipSize);

  // Dynamic PnL in currency ($)
  let dynamicPnL: number;
  if (signal.status === 'pending') {
    dynamicPnL = 0;
  } else if (signal.pnl !== undefined && !signal.current_price) {
    // If exact pnl was stored, scale it proportionally to simulated lot
    dynamicPnL = (signal.pnl / 0.5) * lotSize;
  } else {
    dynamicPnL = priceDiff * multiplier * lotSize;
  }

  const gainPercent = accountBalance > 0 ? (dynamicPnL / accountBalance) * 100 : 0;
  const positionGainPercent =
    signal.entry_price > 0 ? (priceDiff / signal.entry_price) * 100 : 0;

  // TP Simulations for this signal
  const tpSimulations = signal.take_profit_levels.map((tpPrice, idx) => {
    const tpDiff =
      signal.type === 'BUY' ? tpPrice - signal.entry_price : signal.entry_price - tpPrice;
    const tpPnL = tpDiff * multiplier * lotSize;
    return {
      level: idx + 1,
      price: tpPrice,
      pnl: Math.round(tpPnL * 100) / 100,
      gainPercent: accountBalance > 0 ? (tpPnL / accountBalance) * 100 : 0,
    };
  });

  // SL Risk
  const slDiff =
    signal.type === 'BUY'
      ? signal.entry_price - signal.stop_loss
      : signal.stop_loss - signal.entry_price;
  const riskAmount = slDiff * multiplier * lotSize;
  const slRisk = {
    price: signal.stop_loss,
    riskAmount: Math.round(riskAmount * 100) / 100,
    riskPercent: accountBalance > 0 ? (riskAmount / accountBalance) * 100 : 0,
  };

  return {
    signalId: signal.id,
    exitPrice: Math.round(exitPrice * 100) / 100,
    points: Math.round(points * 100) / 100,
    pips,
    dynamicPnL: Math.round(dynamicPnL * 100) / 100,
    gainPercent: Math.round(gainPercent * 100) / 100,
    positionGainPercent: Math.round(positionGainPercent * 100) / 100,
    targetHit,
    tpSimulations,
    slRisk,
  };
}

/**
 * Analyzes all signals, calculating comprehensive performance metrics and dynamic PnL.
 */
export function analyzeAllTrades(
  signals: Signal[],
  lotSize: number,
  accountBalance: number
): TradeHistoryAnalysisResult {
  const calculations: Record<string, DynamicTradeCalculation> = {};

  let closedTradesCount = 0;
  let activeTradesCount = 0;
  let pendingTradesCount = 0;
  let winningTradesCount = 0;
  let losingTradesCount = 0;

  let totalProfit = 0;
  let totalLoss = 0;
  let totalPips = 0;
  let currentFloatingPnL = 0;

  signals.forEach((signal) => {
    const calc = calculateTradeDynamicMetrics(signal, lotSize, accountBalance);
    calculations[signal.id] = calc;

    if (signal.status === 'closed') {
      closedTradesCount++;
      totalPips += calc.pips;
      if (calc.dynamicPnL >= 0) {
        winningTradesCount++;
        totalProfit += calc.dynamicPnL;
      } else {
        losingTradesCount++;
        totalLoss += Math.abs(calc.dynamicPnL);
      }
    } else if (signal.status === 'active') {
      activeTradesCount++;
      currentFloatingPnL += calc.dynamicPnL;
    } else if (signal.status === 'pending') {
      pendingTradesCount++;
    }
  });

  const netProfit = Math.round((totalProfit - totalLoss) * 100) / 100;
  const winRate =
    closedTradesCount > 0
      ? Math.round((winningTradesCount / closedTradesCount) * 1000) / 10
      : 0;

  const profitFactor =
    totalLoss > 0
      ? Math.round((totalProfit / totalLoss) * 100) / 100
      : totalProfit > 0
      ? 99.9
      : 0;

  const averageGainPerTrade =
    closedTradesCount > 0
      ? Math.round((netProfit / closedTradesCount) * 100) / 100
      : 0;

  const projectedBalance =
    Math.round((accountBalance + netProfit + currentFloatingPnL) * 100) / 100;

  const totalGainPercentage =
    accountBalance > 0
      ? Math.round(((projectedBalance - accountBalance) / accountBalance) * 10000) / 100
      : 0;

  return {
    totalSignalsSent: signals.length,
    closedTradesCount,
    activeTradesCount,
    pendingTradesCount,
    winningTradesCount,
    losingTradesCount,
    winRate,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalLoss: Math.round(totalLoss * 100) / 100,
    netProfit,
    profitFactor,
    averageGainPerTrade,
    totalPips,
    currentFloatingPnL: Math.round(currentFloatingPnL * 100) / 100,
    projectedBalance,
    totalGainPercentage,
    tradeCalculations: calculations,
  };
}
