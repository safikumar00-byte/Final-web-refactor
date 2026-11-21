import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { Button, Text, Chip, Surface } from 'heroui-native';
import { Mail, MessageCircle, Twitter, Linkedin, CheckCircle, Sparkles, Compass } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppInfo, fetchAppInfo } from '../lib/appInfo';
import CampaignBanner from './CampaignBanner';
import { Campaign, getRandomSignalsPageCampaign } from '../lib/campaigns';
import DigitalMorphHeading from './DigitalMorphHeading';

interface AboutAppSectionProps {
  onClose?: () => void;
  showCampaign?: boolean;
}

export default function AboutAppSection({ showCampaign = true }: AboutAppSectionProps) {
  const { colors, fontSizes } = useTheme();
  const { t } = useLanguage();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppInfo();
    if (showCampaign) {
      loadCampaign();
    }
  }, [showCampaign]);

  const loadAppInfo = async () => {
    try {
      const info = await fetchAppInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Error loading app info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaign = async () => {
    try {
      const randomCampaign = await getRandomSignalsPageCampaign();
      // Sanitize campaign: filter out placeholder/test entries with negative or non-professional titles
      if (
        randomCampaign &&
        randomCampaign.title &&
        !randomCampaign.title.toLowerCase().includes('get the hell out') &&
        !randomCampaign.title.toLowerCase().includes('nothing works out')
      ) {
        setCampaign(randomCampaign);
      } else {
        setCampaign(null);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
  };

  const handleSocialLink = async (url: string | undefined, platform: string) => {
    if (!url) return;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log(`Cannot open ${platform} URL: ${url}`);
      }
    } catch (error) {
      console.error(`Error opening ${platform} link:`, error);
    }
  };

  const handleEmailContact = async () => {
    if (!appInfo?.contact_email) return;

    const emailUrl = `mailto:${appInfo.contact_email}?subject=Trading Signals App Support`;
    try {
      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error('Error opening email:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    contentContainer: {
      // paddingHorizontal: 20,
      // paddingVertical: 16,
      paddingVertical: 40,
    },
    loadingContainer: {
      padding: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      textAlign: 'center',
    },
    campaignContainer: {
      marginBottom: 16,
    },
    brandBadgeRow: {
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 6,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.primary,
      fontFamily: 'Inter-SemiBold',
      marginBottom: 12,
      textAlign: 'center',
    },
    descriptionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    description: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      lineHeight: 22,
      textAlign: 'center',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    featuresSurface: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 10,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    featureText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
      flex: 1,
      lineHeight: 20,
    },
    stepsSurface: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      gap: 12,
      marginBottom: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    stepNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    stepNumberText: {
      fontSize: 11,
      color: colors.background,
      fontFamily: 'Inter-Bold',
    },
    stepText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Regular',
      flex: 1,
      lineHeight: 20,
    },
    socialContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    socialButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    socialButtonText: {
      fontSize: fontSizes.small,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
  });

  if (loading || !appInfo) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Campaign Banner (if active & clean) */}
      {showCampaign && campaign && (
        <View style={styles.campaignContainer}>
          <CampaignBanner campaign={campaign} aspectRatio="1:4" />
        </View>
      )}

      {/* App Title & Subtitle Badge */}
      {/* <View style={styles.brandBadgeRow}>
        <Chip variant="soft" color="accent" size="sm">
          <Chip.Label>Official Trading Intelligence</Chip.Label>
        </Chip>
      </View> */}
      <DigitalMorphHeading
        text={appInfo.title}
        characterHeight={26}
        style={styles.title}
        glowColor="rgba(245, 158, 11, 0.25)"
      />
      <Text style={styles.subtitle}>{appInfo.subtitle}</Text>

      {/* Description Card */}
      <View style={styles.descriptionCard}>
        <Text style={styles.description}>{appInfo.description}</Text>
      </View>

      {/* Key Features Section */}
      <View style={styles.sectionTitleRow}>
        <Sparkles size={18} color="#F59E0B" />
        <DigitalMorphHeading
          text="Key Features"
          characterHeight={22}
          style={styles.sectionTitle}
        />
      </View>

      <Surface style={styles.featuresSurface}>
        {appInfo.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle size={17} color={colors.success} style={{ marginTop: 2 }} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </Surface>

      {/* How to Get Started Section */}
      <View style={styles.sectionTitleRow}>
        <Compass size={18} color={colors.primary} />
        <DigitalMorphHeading
          text="How to Get Started"
          characterHeight={22}
          style={styles.sectionTitle}
        />
      </View>

      <Surface style={styles.stepsSurface}>
        {appInfo.how_to_use.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </Surface>

      {/* Social Links & Support */}
      <View style={styles.socialContainer}>
        {appInfo.contact_email && (
          <Button variant="outline" size="sm" style={styles.socialButton} onPress={handleEmailContact}>
            <Mail size={15} color={colors.primary} />
            <Button.Label style={styles.socialButtonText}>Support</Button.Label>
          </Button>
        )}

        {appInfo.telegram_url && (
          <Button
            variant="outline"
            size="sm"
            style={styles.socialButton}
            onPress={() => handleSocialLink(appInfo.telegram_url, 'Telegram')}
          >
            <MessageCircle size={15} color={colors.secondary} />
            <Button.Label style={styles.socialButtonText}>Telegram</Button.Label>
          </Button>
        )}

        {appInfo.twitter_url && appInfo.twitter_url.startsWith('http') && (
          <Button
            variant="outline"
            size="sm"
            style={styles.socialButton}
            onPress={() => handleSocialLink(appInfo.twitter_url, 'Twitter')}
          >
            <Twitter size={15} color={colors.warning} />
            <Button.Label style={styles.socialButtonText}>Twitter</Button.Label>
          </Button>
        )}

        {appInfo.linkedin_url && appInfo.linkedin_url.startsWith('http') && (
          <Button
            variant="outline"
            size="sm"
            style={styles.socialButton}
            onPress={() => handleSocialLink(appInfo.linkedin_url, 'LinkedIn')}
          >
            <Linkedin size={15} color={colors.primary} />
            <Button.Label style={styles.socialButtonText}>LinkedIn</Button.Label>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
