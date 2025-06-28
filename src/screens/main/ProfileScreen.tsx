import { useTheme } from '../../theme/ThemeProvider';
import { useAppNavigation } from '@hooks/useAppNavigation';
import { useNetworkStatus } from '@hooks/useNetworkStatus';
import auth from '@react-native-firebase/auth';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = () => {
  const user = auth().currentUser;
  const { navigate } = useAppNavigation();
  const { theme, toggleTheme, isHighContrast, toggleHighContrast } = useTheme();
  const { isConnected } = useNetworkStatus();

  const handleLogout = async () => {
    try {
      await auth().signOut();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleEditProfile = () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection.');
      return;
    }
    navigate('Settings', undefined);
  };

  const handlePrivacySettings = () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection.');
      return;
    }
    navigate('Settings', undefined);
  };

  const handleNotifications = () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection.');
      return;
    }
    navigate('Notifications', undefined);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView>
        <View
          style={[styles.header, { borderBottomColor: theme.colors.border }]}
        >
          <Image
            source={{
              uri: user?.photoURL || 'https://via.placeholder.com/150',
            }}
            style={styles.avatar}
          />
          <Text style={[styles.name, { color: theme.colors.text.primary }]}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={[styles.email, { color: theme.colors.text.secondary }]}>
            {user?.email}
          </Text>
        </View>

        <View
          style={[styles.section, { borderBottomColor: theme.colors.border }]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Account Settings
          </Text>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={handleEditProfile}
            accessible={true}
            accessibilityLabel='Edit Profile'
            accessibilityHint='Edit your profile information'
            accessibilityRole='button'
          >
            <Text
              style={[styles.settingText, { color: theme.colors.text.primary }]}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={handlePrivacySettings}
            accessible={true}
            accessibilityLabel='Privacy Settings'
            accessibilityHint='Adjust your privacy preferences'
            accessibilityRole='button'
          >
            <Text
              style={[styles.settingText, { color: theme.colors.text.primary }]}
            >
              Privacy Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={handleNotifications}
            accessible={true}
            accessibilityLabel='Notifications'
            accessibilityHint='Manage notification preferences'
            accessibilityRole='button'
          >
            <Text
              style={[styles.settingText, { color: theme.colors.text.primary }]}
            >
              Notifications
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.section, { borderBottomColor: theme.colors.border }]}
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.text.primary }]}
          >
            Display Settings
          </Text>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={toggleTheme}
            accessible={true}
            accessibilityLabel='Toggle Theme'
            accessibilityHint='Switch between light and dark theme'
            accessibilityRole='button'
          >
            <Text
              style={[styles.settingText, { color: theme.colors.text.primary }]}
            >
              Toggle Theme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { borderBottomColor: theme.colors.border },
            ]}
            onPress={toggleHighContrast}
            accessible={true}
            accessibilityLabel='High Contrast Mode'
            accessibilityHint='Toggle high contrast mode for better visibility'
            accessibilityRole='button'
          >
            <Text
              style={[styles.settingText, { color: theme.colors.text.primary }]}
            >
              {isHighContrast ? 'Disable' : 'Enable'} High Contrast
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessible={true}
          accessibilityLabel='Logout'
          accessibilityHint='Sign out of your account'
          accessibilityRole='button'
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  settingItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
