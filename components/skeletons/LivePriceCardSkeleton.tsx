import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Card, Skeleton, SkeletonGroup } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function LivePriceCardSkeleton() {
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.livePriceCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Card.Body style={{ padding: 0 }}>
        <SkeletonGroup isLoading={true} variant="shimmer">
          {/* Header Row */}
          <View style={styles.livePriceHeader}>
            <View style={{ gap: 6 }}>
              <Skeleton
                style={[styles.pairTitleSkeleton, { backgroundColor: colors.border }]}
              />
              <Skeleton
                style={[styles.timestampSkeleton, { backgroundColor: colors.border }]}
              />
            </View>
            <Skeleton
              style={[styles.changeBadgeSkeleton, { backgroundColor: colors.border }]}
            />
          </View>

          {/* Large Price Value */}
          <Skeleton
            style={[styles.priceValueSkeleton, { backgroundColor: colors.border }]}
          />

          {/* Stats 3 Columns Row */}
          <View style={styles.statsRow}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.statItem}>
                <Skeleton
                  style={[styles.statLabelSkeleton, { backgroundColor: colors.border }]}
                />
                <Skeleton
                  style={[styles.statValueSkeleton, { backgroundColor: colors.border }]}
                />
              </View>
            ))}
          </View>
        </SkeletonGroup>
      </Card.Body>
    </Card>
  );
}

const styles = StyleSheet.create({
  livePriceCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  livePriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pairTitleSkeleton: {
    width: 100,
    height: 24,
    borderRadius: 6,
  },
  timestampSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 4,
  },
  changeBadgeSkeleton: {
    width: 70,
    height: 24,
    borderRadius: 12,
  },
  priceValueSkeleton: {
    width: 160,
    height: 38,
    borderRadius: 8,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statLabelSkeleton: {
    width: 40,
    height: 12,
    borderRadius: 4,
  },
  statValueSkeleton: {
    width: 55,
    height: 16,
    borderRadius: 4,
  },
});
