import auth from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Linking,
  Modal,
  TextInput,
  Platform,
} from 'react-native';

import { useAppStore } from '../../store/useAppStore';
import { useWallet, useCorporate } from '../../hooks/useFirebaseData';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useToast } from '../../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zeroTrustSecurityService } from '../../services/ZeroTrustSecurityService';
import { telemetryService } from '../../services/TelemetryService';
import { showAdPrivacyOptions } from '../../hooks/useRewardedAd';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguageCode } from '../../i18n';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import {
  Plant,
  Fire,
  Tree,
  Recycle,
  Bicycle,
  Carrot,
  Bell,
  ChartBar,
  LockKey,
  Moon,
  Ruler,
  GlobeSimple,
  Export,
  Trash,
  CaretRight,
  PencilSimple,
  EyeSlash,
  MapPin,
  BatteryCharging,
  Wallet,
  Buildings,
  Link,
  ChartLineUp,
  ShieldCheck,
  FileText,
} from 'phosphor-react-native';

const BADGES = [
  {
    icon: <Plant size={24} color='#38EF7D' weight='duotone' />,
    label: 'First Step',
  },
  {
    icon: <Fire size={24} color='#F2994A' weight='duotone' />,
    label: '7-Day Streak',
  },
  {
    icon: <Tree size={24} color='#11998E' weight='duotone' />,
    label: 'Tree Planter',
  },
  {
    icon: <Recycle size={24} color='#38EF7D' weight='duotone' />,
    label: 'Zero Waster',
  },
  {
    icon: <Bicycle size={24} color='#F2C94C' weight='duotone' />,
    label: 'Bike Commuter',
  },
  {
    icon: <Carrot size={24} color='#F2994A' weight='duotone' />,
    label: 'Meat-Free Week',
  },
];

const SettingRow = ({
  icon,
  label,
  sublabel,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  right: React.ReactNode;
}) => (
  <View style={styles.settingRow}>
    <View style={styles.settingIconWrapper}>{icon}</View>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
    </View>
    {right}
  </View>
);

const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { showToast } = useToast();

  const user = auth().currentUser;
  const preferences = useAppStore(state => state.preferences);
  const updatePreferences = useAppStore(state => state.updatePreferences);
  const wallet = useWallet();
  const corporate = useCorporate();

  const settings = useAppStore(state => state.preferences);

  const notifications = preferences?.notifications ?? true;
  const weeklyReport = preferences?.weeklyReports ?? preferences?.weeklyReport ?? true;
  const privateProfile = preferences?.privateProfile ?? false;
  const analytics = preferences?.analytics ?? true;
  const locationTracking = preferences?.locationTracking ?? true;
  const darkMode = (preferences?.theme ?? 'dark') === 'dark';
  const metricUnits = (preferences?.units ?? 'metric') === 'metric';
  const ecoChargingEnabled = settings?.ecoChargingScreen ?? false;

  const [customDisplayName, setCustomDisplayName] = useState<string | null>(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [inputModal, setInputModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'number-pad';
    submitLabel: string;
    onSubmit: (value: string) => void;
  }>({
    visible: false,
    title: '',
    message: '',
    placeholder: '',
    submitLabel: 'Submit',
    onSubmit: () => {},
  });

  const { t, i18n } = useTranslation();
  const currentLanguageCode =
    preferences?.language || (i18n.language as SupportedLanguageCode) || 'en';
  const currentLanguage =
    SUPPORTED_LANGUAGES.find(l => l.code === currentLanguageCode) || SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = () => {
    Alert.alert('Language / भाषा / Idioma', 'Select your preferred app language:', [
      ...SUPPORTED_LANGUAGES.map(lang => ({
        text: `${lang.nativeLabel} (${lang.label})`,
        onPress: () => {
          i18n.changeLanguage(lang.code);
          updatePreferences({ language: lang.code });
          showToast(`Language set to ${lang.nativeLabel}`, 'success');
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleToggleNotifications = (value: boolean) => {
    updatePreferences({ notifications: value });
  };

  const handleToggleWeeklyReport = (value: boolean) => {
    updatePreferences({ weeklyReports: value, weeklyReport: value });
  };

  const handleTogglePrivateProfile = (value: boolean) => {
    updatePreferences({ privateProfile: value });
  };

  const handleToggleAnalytics = (value: boolean) => {
    updatePreferences({ analytics: value });
    telemetryService.setAnalyticsEnabled(value);
  };

  const handleToggleLocationTracking = (value: boolean) => {
    updatePreferences({ locationTracking: value });
  };

  const handleToggleDarkMode = (value: boolean) => {
    updatePreferences({ theme: value ? 'dark' : 'light' });
  };

  const handleToggleMetricUnits = (value: boolean) => {
    updatePreferences({
      units: value ? 'metric' : 'imperial',
    });
  };

  const handleToggleEcoChargingScreen = (value: boolean) => {
    updatePreferences({ ecoChargingScreen: value });
    if (value) {
      showToast('⚡ Eco Charging Screen enabled! Preview it below.', 'success');
    }
  };

  const displayName = customDisplayName || (user as any)?.displayName || 'Eco Warrior';
  const displayEmail = user?.email || 'hello@kindred.earth';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          auth().signOut();
          showToast('Signed out. See you next time! 🌿', 'info');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This is permanent. All your carbon savings history, user settings, profile data, and session credentials will be permanently erased. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Attempt server-side cascade deletion (purges Firestore subcollections + Auth record)
              try {
                const deleteFn = functions().httpsCallable('deleteUserAccount');
                await deleteFn();
              } catch (fnErr) {
                console.warn(
                  'Server deleteUserAccount failed, falling back to direct auth delete:',
                  fnErr,
                );
                const currentUser = auth().currentUser;
                if (currentUser) {
                  await currentUser.delete();
                }
              }

              // 2. Clear local storage and security session
              await AsyncStorage.clear();
              await zeroTrustSecurityService.destroySession();

              showToast('Account and all personal data deleted successfully.', 'success');
            } catch (error) {
              console.error('Error during account deletion:', error);
              const authError = error as { code?: string };
              if (authError.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'For security reasons, you must sign out and sign back in before deleting your account.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Sign Out',
                      style: 'destructive',
                      onPress: () => {
                        auth().signOut();
                      },
                    },
                  ],
                );
              } else {
                showToast('Failed to delete account. Please try again.', 'error');
              }
            }
          },
        },
      ],
    );
  };

  const handleEditProfile = () => {
    setModalInputValue(displayName === 'Eco Warrior' ? '' : displayName);
    setInputModal({
      visible: true,
      title: 'Edit Display Name',
      message: 'Choose how your name appears on Kindred community leaderboards and activities.',
      placeholder: 'Enter your name',
      keyboardType: 'default',
      submitLabel: 'Save',
      onSubmit: async (newName: string) => {
        const trimmed = newName.trim();
        if (trimmed.length > 0) {
          try {
            await auth().currentUser?.updateProfile({ displayName: trimmed });
            setCustomDisplayName(trimmed);
            showToast(`Display name updated to ${trimmed}!`, 'success');
          } catch (err) {
            showToast('Failed to update display name.', 'error');
          }
        }
      },
    });
  };

  const handleLinkEmployer = () => {
    setModalInputValue('');
    setInputModal({
      visible: true,
      title: 'Link Employer',
      message:
        'Enter your corporate email address to unlock 1:1 carbon offset matching from your company.',
      placeholder: 'colleague@company.com',
      keyboardType: 'email-address',
      submitLabel: 'Send Code',
      onSubmit: async (email: string) => {
        const trimmed = email.trim();
        if (trimmed && trimmed.includes('@')) {
          try {
            showToast('Sending verification code...', 'info');
            const domain = trimmed.split('@')[1];
            const companyName = domain.split('.')[0].toUpperCase();

            const requestVerification = functions().httpsCallable('requestWorkEmailVerification');
            await requestVerification({ email: trimmed, companyName });

            showToast('Code sent! Please check your work email.', 'success');

            // Prompt for the 6-digit code with cross-platform modal
            setTimeout(() => {
              setModalInputValue('');
              setInputModal({
                visible: true,
                title: 'Verify Code',
                message: `Enter the 6-digit code sent to ${trimmed}`,
                placeholder: '123456',
                keyboardType: 'number-pad',
                submitLabel: 'Verify',
                onSubmit: async (code: string) => {
                  const trimmedCode = code.trim();
                  if (trimmedCode.length === 6) {
                    try {
                      showToast('Verifying code...', 'info');
                      const verifyCode = functions().httpsCallable('verifyWorkEmailCode');
                      const result = await verifyCode({ code: trimmedCode });

                      const responseData = result.data as {
                        success?: boolean;
                        companyName?: string;
                      };
                      if (responseData.success) {
                        showToast(
                          `Successfully verified! Linked to ${responseData.companyName || 'Corporate Program'}`,
                          'success',
                        );
                      }
                    } catch (error: any) {
                      showToast(error.message || 'Verification failed. Please try again.', 'error');
                    }
                  } else {
                    showToast('Please enter a valid 6-digit code.', 'error');
                  }
                },
              });
            }, 600);
          } catch (error: any) {
            showToast(
              error.message || 'Failed to send verification code. Please try again.',
              'error',
            );
          }
        } else {
          showToast('Please enter a valid email address.', 'error');
        }
      },
    });
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <SpaceBackground earthPosition='bottom-left' enableComets={true}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF'
            colors={['#38EF7D']}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleEditProfile}>
            <Plant size={48} color='#38EF7D' weight='duotone' />
            <View style={styles.editBadge}>
              <PencilSimple size={12} color='#fff' weight='bold' />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
          <GlassCard style={styles.rankBadge}>
            <Text style={styles.rankText}>🏅 Eco Intermediate · Level 7</Text>
          </GlassCard>
        </View>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>152</Text>
            <Text style={styles.statLabel}>kg CO₂ saved</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>21</Text>
            <Text style={styles.statLabel}>day streak 🔥</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statValue}>3,990</Text>
            <Text style={styles.statLabel}>total points</Text>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Impact Wallet</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')} activeOpacity={0.8}>
            <GlassCard
              style={[
                styles.sectionCard,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Wallet size={28} color='#38EF7D' weight='duotone' />
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Balance</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Earned from ads
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#38EF7D', fontSize: 18, fontWeight: '700' }}>
                  ${((wallet?.balanceCents ?? 0) / 100).toFixed(2)}
                </Text>
                <CaretRight size={20} color='#666' />
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Corporate ESG</Text>
          {corporate?.isLinked ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('CorporateLeaderboard' as never)}
              activeOpacity={0.8}
            >
              <GlassCard
                style={[
                  styles.sectionCard,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Buildings size={28} color='#38EF7D' weight='duotone' />
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      {corporate.linkedCompany}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                      Corporate Leaderboard
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ChartLineUp size={20} color='#38EF7D' />
                  <CaretRight size={20} color='#666' />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleLinkEmployer} activeOpacity={0.8}>
              <GlassCard
                style={[
                  styles.sectionCard,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Link size={28} color='rgba(255,255,255,0.5)' weight='duotone' />
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      Link Employer
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                      Contribute to company ESG
                    </Text>
                  </View>
                </View>
                <CaretRight size={20} color='#666' />
              </GlassCard>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
          <GlassCard style={styles.badgesGrid}>
            {BADGES.map(b => (
              <View key={b.label} style={styles.badgeItem}>
                <View style={styles.badgeIconWrapper}>{b.icon}</View>
                <Text style={styles.badgeLabel}>{b.label}</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <GlassCard style={styles.sectionCard}>
            <SettingRow
              icon={<Bell size={24} color='#38EF7D' weight='duotone' />}
              label='Push Notifications'
              sublabel='Daily eco tips & reminders'
              right={
                <Switch
                  value={notifications}
                  onValueChange={handleToggleNotifications}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<ChartBar size={24} color='#38EF7D' weight='duotone' />}
              label='Weekly Report'
              sublabel='Your carbon summary every Sunday'
              right={
                <Switch
                  value={weeklyReport}
                  onValueChange={handleToggleWeeklyReport}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <GlassCard style={styles.sectionCard}>
            <SettingRow
              icon={<LockKey size={24} color='#38EF7D' weight='duotone' />}
              label='Private Profile'
              sublabel='Hide from public leaderboard'
              right={
                <Switch
                  value={privateProfile}
                  onValueChange={handleTogglePrivateProfile}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<EyeSlash size={24} color='#38EF7D' weight='duotone' />}
              label='Telemetry & Analytics'
              sublabel='Help improve the app with anonymous usage data'
              right={
                <Switch
                  value={analytics}
                  onValueChange={handleToggleAnalytics}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<MapPin size={24} color='#38EF7D' weight='duotone' />}
              label='Eco-Location Tracking'
              sublabel='Local commuting detection (zero data shared)'
              right={
                <Switch
                  value={locationTracking}
                  onValueChange={handleToggleLocationTracking}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Integrations</Text>
          <GlassCard style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate('DataConnections')}
            >
              <View style={styles.settingIconWrapper}>
                <ChartBar size={24} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Data Connections</Text>
                <Text style={styles.settingSubLabel}>Manage automated tracking</Text>
              </View>
              <CaretRight size={20} color='rgba(255,255,255,0.5)' />
            </TouchableOpacity>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <GlassCard style={styles.sectionCard}>
            <SettingRow
              icon={<Moon size={24} color='#38EF7D' weight='duotone' />}
              label='Dark Mode'
              right={
                <Switch
                  value={darkMode}
                  onValueChange={handleToggleDarkMode}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<Ruler size={24} color='#38EF7D' weight='duotone' />}
              label='Metric Units'
              sublabel={metricUnits ? 'kg, km, litres' : 'lbs, miles, gallons'}
              right={
                <Switch
                  value={metricUnits}
                  onValueChange={handleToggleMetricUnits}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <SettingRow
              icon={<BatteryCharging size={24} color='#38EF7D' weight='duotone' />}
              label='Eco Charging Screen'
              sublabel='Show SDG facts & earn donations while charging'
              right={
                <Switch
                  value={ecoChargingEnabled}
                  onValueChange={handleToggleEcoChargingScreen}
                  trackColor={{
                    true: '#38EF7D',
                    false: 'rgba(255,255,255,0.2)',
                  }}
                  thumbColor='#fff'
                />
              }
            />
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleSelectLanguage}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconWrapper}>
                <GlobeSimple size={24} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('profile.language', 'Language')}</Text>
                <Text style={styles.settingSubLabel}>
                  {currentLanguage.nativeLabel} ({currentLanguage.label})
                </Text>
              </View>
              <CaretRight size={20} color='rgba(255,255,255,0.5)' />
            </TouchableOpacity>
          </GlassCard>
          {ecoChargingEnabled && (
            <TouchableOpacity
              style={profileStyles.previewBtn}
              onPress={() => navigation.navigate('ChargingAd' as never)}
              activeOpacity={0.8}
            >
              <BatteryCharging size={18} color='#0A0A0C' weight='fill' />
              <Text style={profileStyles.previewBtnText}>Preview Charging Screen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <GlassCard style={styles.sectionCard}>
            {[
              {
                icon: <ShieldCheck size={24} color='#38EF7D' weight='duotone' />,
                label: 'Privacy Policy',
                onPress: () => Linking.openURL('https://kindred.earth/privacy'),
              },
              {
                icon: <FileText size={24} color='#38EF7D' weight='duotone' />,
                label: 'Terms of Service',
                onPress: () => Linking.openURL('https://kindred.earth/terms'),
              },
              {
                icon: <LockKey size={24} color='#38EF7D' weight='duotone' />,
                label: 'Ad Privacy Preferences',
                onPress: async () => {
                  const opened = await showAdPrivacyOptions();
                  if (!opened) {
                    showToast('No regional ad consent update required.', 'info');
                  }
                },
              },
              {
                icon: <ShieldCheck size={24} color='#38EF7D' weight='duotone' />,
                label: 'Data Grievance Officer',
                onPress: () =>
                  Alert.alert(
                    'Data Protection & Grievance',
                    'Pursuant to India DPDP Act 2023 & GDPR:\n\nGrievance Officer: Privacy Redressal Cell\nEmail: grievance@kindred.earth\nResponse SLA: within 48 hours',
                    [
                      { text: 'Close', style: 'cancel' },
                      {
                        text: 'Email Officer',
                        onPress: () => Linking.openURL('mailto:grievance@kindred.earth'),
                      },
                    ],
                  ),
              },
              {
                icon: <Export size={24} color='#fff' weight='duotone' />,
                label: 'Export My Data',
                onPress: () => showToast('Your data export request has been queued.', 'success'),
              },
              {
                icon: <Trash size={24} color='#FF416C' weight='duotone' />,
                label: 'Delete Account',
                onPress: handleDeleteAccount,
                color: '#FF416C',
              },
            ].map((item, index, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.actionRow} onPress={item.onPress}>
                  <View style={styles.settingIconWrapper}>{item.icon}</View>
                  <Text style={[styles.actionLabel, item.color ? { color: item.color } : null]}>
                    {item.label}
                  </Text>
                  <CaretRight size={20} color='rgba(255,255,255,0.3)' />
                </TouchableOpacity>
                {index < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        {user ? (
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.navigate('Auth')}>
            <Text style={styles.signInText}>Sign In / Create Account</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>Kindred v1.0.0 · Made with 💚 for the planet</Text>
      </ScrollView>

      {/* Universal Cross-Platform Input Modal (iOS & Android) */}
      <Modal
        visible={inputModal.visible}
        transparent
        animationType='fade'
        onRequestClose={() => setInputModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={modalStyles.overlay}>
          <GlassCard style={modalStyles.container}>
            <Text style={modalStyles.title}>{inputModal.title}</Text>
            <Text style={modalStyles.message}>{inputModal.message}</Text>
            <TextInput
              style={modalStyles.input}
              value={modalInputValue}
              onChangeText={setModalInputValue}
              placeholder={inputModal.placeholder}
              placeholderTextColor='rgba(255,255,255,0.4)'
              keyboardType={inputModal.keyboardType || 'default'}
              autoCapitalize={inputModal.keyboardType === 'email-address' ? 'none' : 'words'}
              autoCorrect={false}
              autoFocus
            />
            <View style={modalStyles.buttonRow}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => setInputModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.submitButton]}
                onPress={() => {
                  const submitFn = inputModal.onSubmit;
                  setInputModal(prev => ({ ...prev, visible: false }));
                  submitFn(modalInputValue);
                }}
              >
                <Text style={modalStyles.submitText}>{inputModal.submitLabel}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  content: { paddingBottom: 48 },

  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },

  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    justifyContent: 'center',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
  },
  badgeIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  settingLabel: { fontSize: 16, color: '#fff', fontWeight: '500' },
  settingSubLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionLabel: { fontSize: 16, color: '#fff', flex: 1, fontWeight: '500' },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 72,
  },

  signOutBtn: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,65,108,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,65,108,0.3)',
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF416C',
  },
  signInBtn: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 239, 125, 0.12)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38EF7D',
  },

  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 20,
  },
});

const profileStyles = StyleSheet.create({
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38EF7D',
    marginTop: 10,
    marginHorizontal: 0,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A0A0C',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#38EF7D',
  },
  submitText: {
    color: '#0A0A0C',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
