import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Button, Card, PressableFeedback, Spinner, Text } from 'heroui-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Database, ExternalLink, Copy, CircleCheck as CheckCircle, Info, Sliders } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSetupSteps, SetupStep } from '../lib/database';
import AboutAppSection from './AboutAppSection';

interface SetupGuideProps {
  visible: boolean;
  onClose: () => void;
}

export default function SetupGuide({ visible, onClose }: SetupGuideProps) {
  const { colors, fontSizes } = useTheme();
  const [activeTab, setActiveTab] = useState<'about' | 'setup'>('about');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSetupSteps();
    }
  }, [visible]);

  const loadSetupSteps = async () => {
    setLoading(true);
    try {
      const steps = await fetchSetupSteps();
      setSetupSteps(steps);
    } catch (error) {
      console.error('Error loading setup steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, stepIndex: number) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    } catch (e) {
      console.log('Clipboard error:', e);
    }
    setCopiedStep(stepIndex);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      backgroundColor: colors.background,
      borderRadius: 22,
      width: '100%',
      maxWidth: 520,
      height: '85%',
      maxHeight: 700,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}18`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabBar: {
      flexDirection: 'row',
      // paddingHorizontal: 16,
      // paddingVertical: 10,
      gap: 8,
      // backgroundColor: colors.surface,
      // borderBottomWidth: 1,
      // borderBottomColor: colors.border,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonInactive: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabTextActive: {
      color: colors.background,
      fontSize: 13,
      fontFamily: 'Inter-Bold',
    },
    tabTextInactive: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: 'Inter-Medium',
    },
    bodyContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      color: colors.text,
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
      marginTop: 16,
    },
    intro: {
      padding: 16,
      backgroundColor: `${colors.primary}10`,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    introText: {
      fontSize: fontSizes.small + 1,
      color: colors.text,
      fontFamily: 'Inter-Regular',
      lineHeight: 20,
    },
    stepsContainer: {
      // padding: 16,
      paddingBottom: 32,
    },
    step: {
      marginBottom: 18,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    stepNumberText: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Bold',
      color: colors.background,
    },
    stepTitle: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
    },
    stepDescription: {
      fontSize: fontSizes.small + 1,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 10,
      lineHeight: 18,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: fontSizes.small + 1,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      flex: 1,
    },
    codeBlock: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    codeText: {
      fontSize: 11,
      fontFamily: 'monospace',
      color: colors.textSecondary,
      lineHeight: 16,
    },
    footer: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    footerText: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop tap to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Card style={styles.modalCard}>
          <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
            {/* Modal Header with Title & Explicit Close Button */}
            {/* <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  {activeTab === 'about' ? (
                    <Info size={20} color={colors.primary} />
                  ) : (
                    <Database size={20} color={colors.primary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {activeTab === 'about' ? 'App Info & Features' : 'Supabase Setup Guide'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {activeTab === 'about' ? 'Trading features & documentation' : 'Database integration instructions'}
                  </Text>
                </View>
              </View>
            </View> */}

            {/* Segmented Tab Switcher */}
            {/* <View style={styles.tabBar}>
              <PressableFeedback
                style={[
                  styles.tabButton,
                  activeTab === 'about' ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}
                onPress={() => setActiveTab('about')}
              >
                <Info size={14} color={activeTab === 'about' ? colors.background : colors.textSecondary} />
                <Text style={activeTab === 'about' ? styles.tabTextActive : styles.tabTextInactive}>
                  About App
                </Text>
              </PressableFeedback>

              <PressableFeedback
                style={[
                  styles.tabButton,
                  activeTab === 'setup' ? styles.tabButtonActive : styles.tabButtonInactive,
                ]}
                onPress={() => setActiveTab('setup')}
              >
                <Database size={14} color={activeTab === 'setup' ? colors.background : colors.textSecondary} />
                <Text style={activeTab === 'setup' ? styles.tabTextActive : styles.tabTextInactive}>
                  Setup Guide
                </Text>
              </PressableFeedback>
              <PressableFeedback onPress={onClose}>
                <View style={styles.closeButton}>
                  <X size={18} color={colors.text} strokeWidth={2.4} />
                </View>
              </PressableFeedback>
            </View> */}

            {/* Active Tab Body */}
            <View style={styles.bodyContainer}>
              {activeTab === 'about' ? (
                <AboutAppSection onClose={onClose} showCampaign={false} />
              ) : loading ? (
                <View style={styles.loadingContainer}>
                  <Spinner size="lg" />
                  <Text style={styles.loadingText}>Loading setup guide...</Text>
                </View>
              ) : (
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 24 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.intro}>
                    <Text style={styles.introText}>
                      Follow these steps to connect your app to Supabase and enable real-time institutional trading signals.
                    </Text>
                  </View>

                  <View style={styles.stepsContainer}>
                    {setupSteps.map((step, index) => (
                      <View key={step.id} style={styles.step}>
                        <View style={styles.stepHeader}>
                          <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{step.step_order}</Text>
                          </View>
                          <Text style={styles.stepTitle}>{step.title}</Text>
                        </View>

                        <Text style={styles.stepDescription}>
                          {step.description}
                        </Text>

                        {step.action_text && (
                          <PressableFeedback
                            onPress={() => step.code_sample && copyToClipboard(step.code_sample, index)}
                          >
                            <View style={styles.actionButton}>
                              <Text style={styles.actionButtonText}>{step.action_text}</Text>
                              {copiedStep === index ? (
                                <CheckCircle size={15} color={colors.success} />
                              ) : step.code_sample ? (
                                <Copy size={15} color={colors.textSecondary} />
                              ) : (
                                <ExternalLink size={15} color={colors.textSecondary} />
                              )}
                            </View>
                          </PressableFeedback>
                        )}

                        {step.code_sample && (
                          <View style={styles.codeBlock}>
                            <Text style={styles.codeText}>{step.code_sample}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerText}>
                      Need help? The app also supports offline mock data if disconnected.
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </Card>
      </View>
    </Modal>
  );
}
