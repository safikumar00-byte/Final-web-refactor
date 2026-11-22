import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveAppContainerProps {
  children: React.ReactNode;
}

/**
 * ResponsiveAppContainer:
 * - On desktop web (viewport width > 500px): Centers the mobile application shell
 *   with an optimal max-width (~440px), elegant neutral desktop background, subtle borders and shadow.
 * - On mobile browsers (viewport width <= 500px) and native devices: Renders full width (100%),
 *   preserving all native touch areas, safe areas, and bottom navigation.
 */
export default function ResponsiveAppContainer({ children }: ResponsiveAppContainerProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  const isDesktopWeb = Platform.OS === 'web' && width > 500;

  if (!isDesktopWeb) {
    return <View style={styles.mobileContainer}>{children}</View>;
  }

  return (
    <View style={styles.desktopOuterBackground}>
      {/* Subtle ambient light gradient behind device */}
      <View style={styles.desktopBackdropGlow} />

      {/* Centered Mobile Application Frame */}
      <View
        style={[
          styles.desktopAppFrame,
          {
            backgroundColor: colors.background,
            borderColor: colors.border || '#1E293B',
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopOuterBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#07090E',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  desktopBackdropGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(245, 158, 11, 0.03)',
    top: '15%',
    filter: 'blur(80px)' as any,
    pointerEvents: 'none' as any,
  },
  desktopAppFrame: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      } as any,
      default: {
        elevation: 12,
      },
    }),
  },
});
