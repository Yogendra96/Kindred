import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';

import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useToast } from '../../contexts/ToastContext';

const BADGES = [
  { emoji: '🌱', label: 'First Step' },
  { emoji: '🔥', label: '7-Day Streak' },
  { emoji: '🌳', label: 'Tree Planter' },
  { emoji: '♻️', label: 'Zero Waster' },
  { emoji: '🚴', label: 'Bike Commuter' },
  { emoji: '🥦', label: 'Meat-Free Week' },
];

const SettingRow = ({
  emoji,
  label,
  sublabel,
  right,
}: {
  emoji: string;
  label: string;
  sublabel?: string;
  right: React.ReactNode;
}) => (
  <View style={styles.settingRow}>
    <Text style={styles.settingEmoji}>{emoji}</Text>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
    </View>
    {right}
  </View>
);

const ProfileScreen = () => {
  const { showToast } = useToast();
  const { profile } = useSelector((state: RootState) => state.user);

  const [notifications, setNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [metricUnits, setMetricUnits] = useState(true);

  const displayName = profile?.name || 'Eco Explorer';
  const displayEmail = profile?.email || 'hello@kindred.earth';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => showToast('Signed out. See you next time! 🌿', 'info'),
      },
    ]);
  };

  const handleEditProfile = () => {
    showToast(
      "Profile editing coming in the next update! You'll be able to upload a photo and update your name.",
      'info',
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleEditProfile}
        >
          <Text style={styles.avatarEmoji}>🌿</Text>
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✎</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{displayEmail}</Text>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>🏅 Eco Intermediate · Level 7</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>152</Text>
          <Text style={styles.statLabel}>kg CO₂ saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>21</Text>
          <Text style={styles.statLabel}>day streak 🔥</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>3,990</Text>
          <Text style={styles.statLabel}>total points</Text>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 Earned Badges</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map(b => (
            <View key={b.label} style={styles.badgeItem}>
              <Text style={styles.badgeEmoji}>{b.emoji}</Text>
              <Text style={styles.badgeLabel}>{b.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Notifications</Text>
        <SettingRow
          emoji='📱'
          label='Push Notifications'
          sublabel='Daily eco tips & reminders'
          right={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ true: '#2e7d32' }}
            />
          }
        />
        <SettingRow
          emoji='📊'
          label='Weekly Report'
          sublabel='Your carbon summary every Sunday'
          right={
            <Switch
              value={weeklyReport}
              onValueChange={setWeeklyReport}
              trackColor={{ true: '#2e7d32' }}
            />
          }
        />
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Privacy</Text>
        <SettingRow
          emoji='👤'
          label='Private Profile'
          sublabel='Hide from public leaderboard'
          right={
            <Switch
              value={privateProfile}
              onValueChange={setPrivateProfile}
              trackColor={{ true: '#2e7d32' }}
            />
          }
        />
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Preferences</Text>
        <SettingRow
          emoji='🌙'
          label='Dark Mode'
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ true: '#2e7d32' }}
            />
          }
        />
        <SettingRow
          emoji='📏'
          label='Metric Units'
          sublabel={metricUnits ? 'kg, km, litres' : 'lbs, miles, gallons'}
          right={
            <Switch
              value={metricUnits}
              onValueChange={setMetricUnits}
              trackColor={{ true: '#2e7d32' }}
            />
          }
        />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Account</Text>
        {[
          {
            emoji: '📤',
            label: 'Export My Data',
            onPress: () =>
              showToast(
                'Your data export will be emailed to you within 24 hours.',
                'success',
              ),
          },
          {
            emoji: '🗑️',
            label: 'Delete Account',
            onPress: () =>
              Alert.alert(
                'Delete Account',
                'This is permanent. Contact support@kindred.earth to proceed.',
              ),
          },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.actionRow}
            onPress={item.onPress}
          >
            <Text style={styles.settingEmoji}>{item.emoji}</Text>
            <Text style={styles.actionLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>
        Kindred v1.0.0 · Made with 💚 for the planet
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 48 },

  header: {
    backgroundColor: '#6f42c1',
    paddingTop: 52,
    paddingBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarEmoji: {
    fontSize: 64,
    backgroundColor: '#ffffff30',
    borderRadius: 48,
    padding: 8,
    overflow: 'hidden',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadgeText: { fontSize: 12, color: '#6f42c1', fontWeight: '700' },
  name: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  rankBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rankText: { color: 'white', fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', margin: 16, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#6f42c1' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },

  section: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 14,
  },

  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { alignItems: 'center', width: 64 },
  badgeEmoji: { fontSize: 32, marginBottom: 4 },
  badgeLabel: { fontSize: 10, color: '#666', textAlign: 'center' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  settingEmoji: { fontSize: 20, width: 32 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, color: '#222' },
  settingSubLabel: { fontSize: 12, color: '#aaa', marginTop: 1 },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionLabel: { flex: 1, fontSize: 15, color: '#333' },
  chevron: { fontSize: 20, color: '#ccc' },

  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fdecea',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e53935',
  },
  signOutText: { color: '#e53935', fontWeight: '700', fontSize: 16 },

  version: { textAlign: 'center', fontSize: 12, color: '#ccc', marginTop: 20 },
});

export default ProfileScreen;
