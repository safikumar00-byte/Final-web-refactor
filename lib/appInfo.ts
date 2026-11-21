import { supabase } from './supabase';

export interface AppInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  how_to_use: string[];
  contact_email?: string;
  twitter_url?: string;
  linkedin_url?: string;
  telegram_url?: string;
  updated_at: string;
  created_at: string;
}

// Fetch app information
export async function fetchAppInfo(): Promise<AppInfo | null> {
  const defaults = getDefaultAppInfo();

  try {
    const { data, error } = await supabase
      .from('app_info')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('Supabase app_info query returned error or empty, using defaults:', error?.message);
      return defaults;
    }

    // Safely parse and sanitize features array
    let sanitizedFeatures = data.features;
    if (typeof sanitizedFeatures === 'string') {
      try {
        sanitizedFeatures = JSON.parse(sanitizedFeatures);
      } catch {
        sanitizedFeatures = defaults.features;
      }
    }
    if (!Array.isArray(sanitizedFeatures) || sanitizedFeatures.length === 0) {
      sanitizedFeatures = defaults.features;
    }

    // Safely parse and sanitize how_to_use array
    let sanitizedHowToUse = data.how_to_use;
    if (typeof sanitizedHowToUse === 'string') {
      try {
        sanitizedHowToUse = JSON.parse(sanitizedHowToUse);
      } catch {
        sanitizedHowToUse = defaults.how_to_use;
      }
    }
    if (!Array.isArray(sanitizedHowToUse) || sanitizedHowToUse.length === 0) {
      sanitizedHowToUse = defaults.how_to_use;
    }

    return {
      ...defaults,
      ...data,
      title: data.title?.trim() || defaults.title,
      subtitle: data.subtitle?.trim() || defaults.subtitle,
      description: data.description?.trim() || defaults.description,
      features: sanitizedFeatures,
      how_to_use: sanitizedHowToUse,
    };
  } catch (error) {
    console.error('Network error fetching app info, using defaults:', error);
    return defaults;
  }
}

// Update app information (for admin use)
export async function updateAppInfo(updates: Partial<Omit<AppInfo, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_info')
      .update(updates)
      .eq('id', (await fetchAppInfo())?.id);

    if (error) {
      console.error('Error updating app info:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error updating app info:', error);
    return false;
  }
}

// Default fallback app info
function getDefaultAppInfo(): AppInfo {
  return {
    id: 'default',
    title: 'Gold & Silver Trading Signals',
    subtitle: 'Professional Trading Opportunities',
    description: 'Get real-time trading signals for Gold and Silver with professional analysis, technical indicators, and risk management guidance.',
    features: [
      '📊 Real-time Gold & Silver signals',
      '📈 Professional technical analysis',
      '🎯 Risk management tools',
      '💰 Live price tracking',
      '🧮 Advanced trading calculators',
      '🌍 Multi-language support'
    ],
    how_to_use: [
      'Browse live trading signals on the Signals tab',
      'Use calculators to manage risk and position sizing',
      'Monitor live prices and technical indicators',
      'Follow signal updates and profit/loss tracking',
      'Customize settings and preferences'
    ],
    contact_email: 'support@tradingsignals.com',
    telegram_url: 'https://t.me/tradingsignals',
    twitter_url: undefined,
    linkedin_url: undefined,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}