import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Surface, Text } from 'heroui-native';
import { useTheme } from '../contexts/ThemeContext';

interface AssetSwitcherProps {
  selectedAsset: 'XAU/USD' | 'BTC/USD';
  onAssetChange: (asset: 'XAU/USD' | 'BTC/USD') => void;
}

export default function AssetSwitcher({ selectedAsset, onAssetChange }: AssetSwitcherProps) {
  const { colors, fontSizes } = useTheme();

  const assets = [
    { symbol: 'XAU/USD', name: 'Gold', emoji: '🪙' },
    { symbol: 'BTC/USD', name: 'BTC', emoji: '🥈' },
  ];

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 20,
      marginBottom: 16,
    },
    assetButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    assetButtonActive: {
      backgroundColor: colors.primary,
    },
    assetEmoji: {
      fontSize: 16,
    },
    assetText: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
    },
    assetTextActive: {
      color: colors.background,
    },
  });

  return (
    <Surface style={styles.container}>
      {assets.map((asset) => (
        <Button
          key={asset.symbol}
          variant={selectedAsset === asset.symbol ? 'primary' : 'ghost'}
          style={[
            styles.assetButton,
            selectedAsset === asset.symbol && styles.assetButtonActive,
          ]}
          onPress={() => onAssetChange(asset.symbol as 'XAU/USD' | 'BTC/USD')}
        >
          <Text style={styles.assetEmoji}>{asset.emoji}</Text>
          <Button.Label
            style={[
              styles.assetText,
              selectedAsset === asset.symbol && styles.assetTextActive,
            ]}
          >
            {asset.name}
          </Button.Label>
        </Button>
      ))}
    </Surface>
  );
}