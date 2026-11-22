import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface ResponsiveAppContainerProps {
  children: React.ReactNode;
}

/**
 * ResponsiveAppContainer:
 * - On desktop web (viewport width > 768px):
 *   - Centers the application horizontally with a maximum width of ~440px.
 *   - Minimum height: 100dvh / 100%.
 *   - Dark outer background consistent with application theme (#07090E).
 *   - Subtle shadow and clean lateral borders.
 *   - Prevents horizontal overflow; scrolling happens within application content areas.
 *   - Bottom navigation stays fixed inside the application container, not browser viewport.
 * - On mobile browsers (viewport width <= 768px) and native devices:
 *   - Renders full width (100%), preserving all native touch areas, safe areas, and bottom navigation.
 * - Dedicated presentation route (/desktop-preview):
 *   - Bypasses the 440px constraint so the desktop mock-up studio operates full width.
 */
export default function ResponsiveAppContainer({ children }: ResponsiveAppContainerProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const pathname = usePathname();

  const isPreviewRoute = pathname === '/desktop-preview' || pathname?.includes('desktop-preview');
  const isDesktopWeb = Platform.OS === 'web' && width > 768 && !isPreviewRoute;

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
    minHeight: Platform.select({ web: '100dvh' as any, default: '100%' }),
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
    flex: 1,
    width: '100%',
    maxWidth: 440,
    height: '100%',
    minHeight: Platform.select({ web: '100dvh' as any, default: '100%' }),
    maxHeight: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 0 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.06)',
      } as any,
      default: {
        elevation: 12,
      },
    }),
  },
});
