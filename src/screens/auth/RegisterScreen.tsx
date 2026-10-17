/* eslint-disable */
import auth from '@react-native-firebase/auth';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/types';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
  Linking,
} from 'react-native';
import { useAppStore } from '../../store/useAppStore';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const handleRegister = async () => {
    const errors: string[] = [];

    if (!name) errors.push('Full name is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!confirmPassword) errors.push('Password confirmation is required');
    if (password !== confirmPassword) errors.push('Passwords do not match');
    if (!agreedToTerms) {
      errors.push(
        'You must confirm you are at least 13 years old and agree to the Terms of Service & Privacy Policy',
      );
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      AccessibilityInfo.announceForAccessibility(
        `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`,
      );
      return;
    }

    setFormErrors([]);

    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      await userCredential.user.updateProfile({ displayName: name });
      useAppStore.getState().updatePreferences({ consentAccepted: true });
    } catch (error) {
      console.error('Error during registration:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'An error occurred during registration';
      setFormErrors([errorMessage]);
      AccessibilityInfo.announceForAccessibility(`Registration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode='contain'
          accessibilityLabel='Kindred app logo'
          accessibilityRole='image'
        />
        <Text style={styles.title} accessibilityRole='header'>
          Create Account
        </Text>
      </View>

      <View style={styles.formContainer}>
        {formErrors.length > 0 && (
          <View style={styles.errorContainer} accessibilityLiveRegion='polite'>
            {formErrors.map((error, index) => (
              <Text key={index} style={styles.errorText} accessibilityRole='text'>
                ⚠ {error}
              </Text>
            ))}
          </View>
        )}

        <TextInput
          style={[styles.input, formErrors.some(e => e.includes('name')) && styles.inputError]}
          placeholder='Full Name'
          value={name}
          onChangeText={setName}
          accessibilityLabel='Full name'
          accessibilityHint='Enter your full name for account registration'
        />
        <TextInput
          style={[styles.input, formErrors.some(e => e.includes('Email')) && styles.inputError]}
          placeholder='Email'
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
          accessibilityLabel='Email address'
          accessibilityHint='Enter your email address for account registration'
        />
        <TextInput
          style={[styles.input, formErrors.some(e => e.includes('Password')) && styles.inputError]}
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel='Password'
          accessibilityHint='Enter a secure password for your account'
        />
        <TextInput
          style={[
            styles.input,
            formErrors.some(e => e.includes('confirmation')) && styles.inputError,
          ]}
          placeholder='Confirm Password'
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel='Confirm password'
          accessibilityHint='Re-enter your password to confirm'
        />

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          accessible={true}
          accessibilityRole='checkbox'
          accessibilityState={{ checked: agreedToTerms }}
          accessibilityLabel='I confirm I am at least 13 years old and agree to the Terms of Service and Privacy Policy'
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm I am at least 13 years old and agree to the{' '}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://kindred.earth/terms')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={styles.linkText}
              onPress={() => Linking.openURL('https://kindred.earth/privacy')}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
          accessible={true}
          accessibilityLabel='Register'
          accessibilityHint='Creates a new account'
          accessibilityRole='button'
        >
          <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            accessible={true}
            accessibilityLabel='Go to Login'
            accessibilityHint='Navigate to login screen'
            accessibilityRole='button'
          >
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff4444',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 5,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  footerLink: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  linkText: {
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
