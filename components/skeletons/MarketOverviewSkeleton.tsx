import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Skeleton, SkeletonGroup, Text } from 'heroui-native';
import { useTheme } from '../../contexts/ThemeContext';

export default function MarketOverviewSkeleton() {
  const { colors, fontSizes } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.medium }]}>
        Market Overview
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <SkeletonGroup isLoading={true} variant="shimmer">
          {[1, 2, 3, 4].map((index) => (
            <Card
              key={index}
              style={[
                styles.marketItem,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Card.Body style={{ padding: 0 }}>
                {/* Ticker placeholder */}
                <Skeleton
                  style={[styles.tickerSkeleton, { backgroundColor: colors.border }]}
                />
                {/* Price and change placeholders */}
                <View style={styles.priceContainer}>
                  <Skeleton
                    style={[styles.priceSkeleton, { backgroundColor: colors.border }]}
                  />
                  <Skeleton
                    style={[styles.changeSkeleton, { backgroundColor: colors.border }]}
                  />
                </View>
              </Card.Body>
            </Card>
          ))}
        </SkeletonGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  marketItem: {
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
  },
  tickerSkeleton: {
    width: 60,
    height: 16,
    borderRadius: 4,
    marginBottom: 10,
  },
  priceContainer: {
    gap: 6,
  },
  priceSkeleton: {
    width: 80,
    height: 14,
    borderRadius: 4,
  },
  changeSkeleton: {
    width: 50,
    height: 12,
    borderRadius: 4,
  },
});
