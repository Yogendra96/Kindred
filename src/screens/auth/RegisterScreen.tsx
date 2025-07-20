import React, { useState } from 'react';

import {
  AccessibilityInfo,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

// Import logo asset
import logoImage from '../../assets/logo.png';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigation = useNavigation();

  const handleRegister = async () => {
    const errors: string[] = [];

    if (!name) errors.push('Full name is required');
    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');
    if (!confirmPassword) errors.push('Password confirmation is required');
    if (password !== confirmPassword) errors.push('Passwords do not match');

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
          source={logoImage}
          style={styles.logo}
          resizeMode='contain'
          accessibilityLabel='Kindred app logo'
          accessibilityRole='image'
        />
        <Text style={styles.title} accessibilityRole='header' accessibilityLevel={1}>
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
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('name'))}
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
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('Email'))}
        />
        <TextInput
          style={[styles.input, formErrors.some(e => e.includes('Password')) && styles.inputError]}
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel='Password'
          accessibilityHint='Enter a secure password for your account'
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('Password'))}
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
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('confirmation'))}
        />

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
});

export default RegisterScreen;
