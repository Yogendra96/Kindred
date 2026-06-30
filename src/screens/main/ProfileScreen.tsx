import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';

import type { StyleProp, ViewStyle } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootState } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { zeroTrustSecurityService } from '../../services/ZeroTrustSecurityService';
import {
  logout,
  clearUserState,
  resetCarbonState,
  resetLocationState,
  resetAnalytics,
  resetSettings,
  updateNotificationSettings,
  updatePrivacySettings,
  updateAppSettings,
} from '../../store';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
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
  Export,
  Trash,
  CaretRight,
  PencilSimple,
  EyeSlash,
  MapPin,
} from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

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
  const dispatch = useDispatch();

  const user = useSelector((state: RootState) => state.user);
  const profile = user?.profile;
  const settings = useSelector((state: RootState) => state.settings);

  const notifications = settings?.notifications?.pushEnabled ?? true;
  const weeklyReport = settings?.notifications?.weeklyReports ?? true;
  const privateProfile = settings?.privacy?.dataSharing ?? false;
  const analytics = settings?.privacy?.analytics ?? true;
  const locationTracking = settings?.privacy?.locationTracking ?? true;
  const darkMode = (settings?.app?.theme ?? 'dark') === 'dark';
  const metricUnits = (settings?.app?.units ?? 'metric') === 'metric';

  const handleToggleNotifications = (value: boolean) => {
    dispatch(updateNotificationSettings({ pushEnabled: value }));
  };

  const handleToggleWeeklyReport = (value: boolean) => {
    dispatch(updateNotificationSettings({ weeklyReports: value }));
  };

  const handleTogglePrivateProfile = (value: boolean) => {
    dispatch(updatePrivacySettings({ dataSharing: value }));
  };

  const handleToggleAnalytics = (value: boolean) => {
    dispatch(updatePrivacySettings({ analytics: value }));
  };

  const handleToggleLocationTracking = (value: boolean) => {
    dispatch(updatePrivacySettings({ locationTracking: value }));
  };

  const handleToggleDarkMode = (value: boolean) => {
    dispatch(updateAppSettings({ theme: value ? 'dark' : 'light' }));
  };

  const handleToggleMetricUnits = (value: boolean) => {
    dispatch(updateAppSettings({ units: value ? 'metric' : 'imperial' }));
  };

  const displayName = profile?.name || 'Eco Explorer';
  const displayEmail = profile?.email || 'hello@kindred.earth';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
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
              // 1. Call Firebase user deletion if logged in
              const currentUser = auth().currentUser;
              if (currentUser) {
                await currentUser.delete();
              }

              // 2. Clear all AsyncStorage caches
              await AsyncStorage.clear();

              // 3. Destroy Zero-Trust Session
              await zeroTrustSecurityService.destroySession();

              // 4. Reset Redux stores
              dispatch(logout());
              dispatch(clearUserState());
              dispatch(resetCarbonState());
              dispatch(resetLocationState());
              dispatch(resetAnalytics());
              dispatch(resetSettings());

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
                        dispatch(logout());
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
    showToast('Profile editing coming in the next update!', 'info');
  };

  return (
    <View style={styles.container}>
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0f2027' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#203a43' stopOpacity='1' />
            <Stop offset='1' stopColor='#2c5364' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <GlassCard style={styles.sectionCard}>
            {[
              {
                icon: <Export size={24} color='#fff' weight='duotone' />,
                label: 'Export My Data',
                onPress: () =>
                  showToast('Your data export will be emailed to you within 24 hours.', 'success'),
              },
              {
                icon: <Trash size={24} color='#FF416C' weight='duotone' />,
                label: 'Delete Account',
                onPress: handleDeleteAccount,
                color: '#FF416C',
              },
            ].map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity style={styles.actionRow} onPress={item.onPress}>
                  <View style={styles.settingIconWrapper}>{item.icon}</View>
                  <Text style={[styles.actionLabel, item.color ? { color: item.color } : null]}>
                    {item.label}
                  </Text>
                  <CaretRight size={20} color='rgba(255,255,255,0.3)' />
                </TouchableOpacity>
                {index === 0 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </GlassCard>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Kindred v1.0.0 · Made with 💚 for the planet</Text>
      </ScrollView>
    </View>
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
    backgroundColor: '#38EF7D',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f2027',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rankText: { fontSize: 14, fontWeight: '600', color: '#38EF7D' },

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

  version: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginBottom: 20,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default ProfileScreen;
