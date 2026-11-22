import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'bolt-expo-nativewind',
  slug: 'bolt-expo-nativewind',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/8ce373b5-978a-43ad-a4cb-3ad8feb6e149',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  android: {
    googleServicesFile: './google-services.json',
    package: 'com.safikumar00.boltexponativewind',
    permissions: ['NOTIFICATIONS'],
  },
  plugins: [
    'expo-notifications',
    'expo-localization',
    'expo-router',
    'expo-secure-store',
    'expo-font',
    'expo-web-browser',
  ],
  extra: {
    ...(config?.extra || {}),
    eas: {
      projectId: '8ce373b5-978a-43ad-a4cb-3ad8feb6e149',
    },
  },
});
