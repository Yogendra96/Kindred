import React, { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';

import LoggingDashboard from '../../components/LoggingDashboard';
import { useAdvancedLogging } from '../../hooks/useAdvancedLogging';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';

const SettingsScreen = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [loggingDashboardVisible, setLoggingDashboardVisible] = useState(false);

  // Advanced logging with performance tracking
  const log = useAdvancedLogging({
    component: 'SettingsScreen',
    screen: 'SettingsScreen',
    category: 'user',
    autoTrackLifecycle: true,
    autoTrackPerformance: true,
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth().signOut();
              dispatch(logout());
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightComponent,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      accessible={true}
      accessibilityRole='button'
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={20} color='#34C759' />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightComponent || (
        <Icon name='chevron-forward' size={20} color='#8E8E93' />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Customize your Kindred experience
        </Text>
      </View>

      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <SettingItem
          icon='person-outline'
          title='Account Information'
          subtitle={user.email || 'Update your profile details'}
        />
        
        <SettingItem
          icon='shield-checkmark-outline'
          title='Privacy & Security'
          subtitle='Manage your privacy settings'
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <SettingItem
          icon='notifications-outline'
          title='Notifications'
          subtitle='Push notifications and alerts'
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C75940' }}
              thumbColor={notificationsEnabled ? '#34C759' : '#F4F3F4'}
            />
          }
        />
        
        <SettingItem
          icon='finger-print-outline'
          title='Biometric Login'
          subtitle='Use fingerprint or Face ID'
          rightComponent={
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C75940' }}
              thumbColor={biometricsEnabled ? '#34C759' : '#F4F3F4'}
            />
          }
        />
        
        <SettingItem
          icon='moon-outline'
          title='Dark Mode'
          subtitle='Appearance preference'
          rightComponent={
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#E5E5EA', true: '#34C75940' }}
              thumbColor={darkModeEnabled ? '#34C759' : '#F4F3F4'}
            />
          }
        />
      </View>

      {/* Carbon Tracking Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Carbon Tracking</Text>
        
        <SettingItem
          icon='leaf-outline'
          title='Carbon Goals'
          subtitle='Set your emission reduction targets'
        />
        
        <SettingItem
          icon='analytics-outline'
          title='Data & Analytics'
          subtitle='Manage your carbon data'
        />
        
        <SettingItem
          icon='location-outline'
          title='Location Services'
          subtitle='For automatic activity tracking'
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <SettingItem
          icon='help-circle-outline'
          title='Help & FAQ'
          subtitle='Get help and find answers'
        />
        
        <SettingItem
          icon='mail-outline'
          title='Contact Support'
          subtitle='Reach out to our team'
        />
        
        <SettingItem
          icon='document-text-outline'
          title='Terms & Privacy'
          subtitle='Legal information'
        />
      </View>

      {/* Developer Section (only in development) */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          
          <SettingItem
            icon='bug-outline'
            title='Logging Dashboard'
            subtitle='View app logs and analytics'
            onPress={() => {
              log.trackButtonPress('logging_dashboard');
              setLoggingDashboardVisible(true);
            }}
          />
          
          <SettingItem
            icon='analytics-outline'
            title='Performance Metrics'
            subtitle='View component performance data'
            onPress={() => {
              log.trackButtonPress('performance_metrics');
              const analytics = log.getComponentAnalytics();
              Alert.alert(
                'Component Analytics',
                `Total Logs: ${analytics.totalLogs}\nRender Count: ${analytics.renderCount}\nComponent Age: ${Math.round(analytics.componentAge / 1000)}s\nErrors: ${analytics.errorCount}`,
              );
            }}
          />
          
          <SettingItem
            icon='code-outline'
            title='Clear Logs'
            subtitle='Clear all stored logs'
            onPress={() => {
              Alert.alert(
                'Clear Logs',
                'Are you sure you want to clear all logs?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                      log.trackUserAction('clear_logs');
                      // Clear logs logic would go here
                      Alert.alert('Success', 'Logs cleared successfully');
                    },
                  },
                ],
              );
            }}
          />
        </View>
      )}

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessible={true}
          accessibilityRole='button'
          accessibilityLabel='Logout from account'
        >
          <Icon name='log-out-outline' size={20} color='#FF3B30' />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
        <Text style={styles.copyrightText}>© 2025 Kindred</Text>
      </View>
      
      {/* Logging Dashboard Modal */}
      <LoggingDashboard
        visible={loggingDashboardVisible}
        onClose={() => {
          log.trackUserAction('close_logging_dashboard');
          setLoggingDashboardVisible(false);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C75920',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 12,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default SettingsScreen;