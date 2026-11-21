import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Skeleton, SkeletonGroup } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function TradeHistorySkeleton() {
  const { colors } = useTheme();

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <SkeletonGroup isLoading={true} variant="shimmer">
        <View style={styles.container}>
          {/* Hero Performance Card Skeleton */}
          <Card
            style={[
              styles.heroCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Card.Body style={styles.heroBody}>
              <View style={styles.heroTop}>
                <Skeleton
                  style={[styles.heroSubtitleSkeleton, { backgroundColor: colors.border }]}
                />
                <Skeleton
                  style={[styles.badgeSkeleton, { backgroundColor: colors.border }]}
                />
              </View>
              <Skeleton
                style={[styles.heroMainValueSkeleton, { backgroundColor: colors.border }]}
              />
              <View style={styles.statsRow}>
                <Skeleton
                  style={[styles.statChipSkeleton, { backgroundColor: colors.border }]}
                />
                <Skeleton
                  style={[styles.statChipSkeleton, { backgroundColor: colors.border }]}
                />
              </View>
            </Card.Body>
          </Card>

          {/* Metrics Grid 3 items */}
          <View style={styles.metricsGrid}>
            {[1, 2, 3].map((m) => (
              <Card
                key={m}
                style={[
                  styles.metricCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Card.Body style={styles.metricBody}>
                  <Skeleton
                    style={[styles.metricIconSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.metricValueSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.metricSubSkeleton, { backgroundColor: colors.border }]}
                  />
                </Card.Body>
              </Card>
            ))}
          </View>

          {/* Trade Log Items Header */}
          <View style={styles.logHeaderRow}>
            <Skeleton
              style={[styles.logTitleSkeleton, { backgroundColor: colors.border }]}
            />
            <Skeleton
              style={[styles.filterChipSkeleton, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Trade Rows */}
          {[1, 2, 3, 4].map((item) => (
            <Card
              key={item}
              style={[
                styles.tradeRowCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Card.Body style={styles.tradeRowBody}>
                <View style={styles.tradeLeft}>
                  <Skeleton
                    style={[styles.tradePairSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.tradeDateSkeleton, { backgroundColor: colors.border }]}
                  />
                </View>
                <View style={styles.tradeRight}>
                  <Skeleton
                    style={[styles.tradeProfitSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.tradePipsSkeleton, { backgroundColor: colors.border }]}
                  />
                </View>
              </Card.Body>
            </Card>
          ))}
        </View>
      </SkeletonGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroBody: {
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubtitleSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 4,
  },
  badgeSkeleton: {
    width: 70,
    height: 22,
    borderRadius: 11,
  },
  heroMainValueSkeleton: {
    width: 170,
    height: 38,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  statChipSkeleton: {
    width: 110,
    height: 26,
    borderRadius: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricBody: {
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  metricIconSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  metricValueSkeleton: {
    width: 60,
    height: 18,
    borderRadius: 4,
  },
  metricSubSkeleton: {
    width: 45,
    height: 10,
    borderRadius: 3,
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  logTitleSkeleton: {
    width: 130,
    height: 20,
    borderRadius: 5,
  },
  filterChipSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
  },
  tradeRowCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  tradeRowBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  tradeLeft: {
    gap: 6,
  },
  tradePairSkeleton: {
    width: 90,
    height: 18,
    borderRadius: 4,
  },
  tradeDateSkeleton: {
    width: 110,
    height: 12,
    borderRadius: 3,
  },
  tradeRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  tradeProfitSkeleton: {
    width: 80,
    height: 18,
    borderRadius: 4,
  },
  tradePipsSkeleton: {
    width: 60,
    height: 12,
    borderRadius: 3,
  },
});
