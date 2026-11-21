import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Skeleton, SkeletonGroup } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function SignalCardSkeleton({ count = 3 }: { count?: number }) {
  const { colors } = useTheme();

  return (
    <SkeletonGroup isLoading={true} variant="shimmer">
      {Array.from({ length: count }).map((_, idx) => (
        <Card
          key={idx}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Card.Body style={styles.cardBody}>
            {/* Header: Pair + Status */}
            <View style={styles.header}>
              <View style={styles.pairRow}>
                <Skeleton
                  style={[styles.pairSkeleton, { backgroundColor: colors.border }]}
                />
                <Skeleton
                  style={[styles.badgeSkeleton, { backgroundColor: colors.border }]}
                />
              </View>
              <Skeleton
                style={[styles.statusSkeleton, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Entry Price Row */}
            <View style={styles.priceRow}>
              <Skeleton
                style={[styles.labelSkeleton, { backgroundColor: colors.border }]}
              />
              <Skeleton
                style={[styles.largePriceSkeleton, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Target & SL Grid */}
            <View style={styles.targetGrid}>
              {[1, 2, 3, 4].map((t) => (
                <View
                  key={t}
                  style={[
                    styles.targetCell,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Skeleton
                    style={[styles.targetLabelSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.targetValueSkeleton, { backgroundColor: colors.border }]}
                  />
                </View>
              ))}
            </View>

            {/* Footer Row */}
            <View style={styles.footerRow}>
              <Skeleton
                style={[styles.timestampSkeleton, { backgroundColor: colors.border }]}
              />
              <Skeleton
                style={[styles.buttonSkeleton, { backgroundColor: colors.border }]}
              />
            </View>
          </Card.Body>
        </Card>
      ))}
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pairSkeleton: {
    width: 85,
    height: 22,
    borderRadius: 6,
  },
  badgeSkeleton: {
    width: 50,
    height: 20,
    borderRadius: 10,
  },
  statusSkeleton: {
    width: 60,
    height: 20,
    borderRadius: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labelSkeleton: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  largePriceSkeleton: {
    width: 90,
    height: 22,
    borderRadius: 6,
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  targetCell: {
    flexBasis: '48%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  targetLabelSkeleton: {
    width: 45,
    height: 11,
    borderRadius: 3,
  },
  targetValueSkeleton: {
    width: 65,
    height: 14,
    borderRadius: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  timestampSkeleton: {
    width: 70,
    height: 12,
    borderRadius: 4,
  },
  buttonSkeleton: {
    width: 90,
    height: 28,
    borderRadius: 8,
  },
});
