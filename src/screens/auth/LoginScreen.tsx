import type { AuthStackParamList } from '../../navigation/types';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import React from 'react';
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
} from 'react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();

  const handleLogin = async () => {
    const errors: string[] = [];

    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) {
      setFormErrors(errors);
      AccessibilityInfo.announceForAccessibility(
        `Form has ${errors.length} error${
          errors.length > 1 ? 's' : ''
        }: ${errors.join(', ')}`,
      );
      return;
    }

    setFormErrors([]);

    try {
      setLoading(true);
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Login failed';
      setFormErrors([errorMessage]);
      AccessibilityInfo.announceForAccessibility(
        `Login failed: ${errorMessage}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Google sign in failed';
      setFormErrors([errorMessage]);
      AccessibilityInfo.announceForAccessibility(
        `Google sign in failed: ${errorMessage}`,
      );
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
        <Text
          style={styles.title}
          accessibilityRole='header'
          accessibilityLevel={1}
        >
          Welcome to Kindred
        </Text>
      </View>

      <View style={styles.formContainer}>
        {formErrors.length > 0 && (
          <View style={styles.errorContainer} accessibilityLiveRegion='polite'>
            {formErrors.map((error, index) => (
              <Text
                key={index}
                style={styles.errorText}
                accessibilityRole='text'
              >
                ⚠ {error}
              </Text>
            ))}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            formErrors.some(e => e.includes('Email')) && styles.inputError,
          ]}
          placeholder='Email'
          value={email}
          onChangeText={setEmail}
          autoCapitalize='none'
          keyboardType='email-address'
          accessibilityLabel='Email address'
          accessibilityHint='Enter your email address to log in'
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('Email'))}
        />
        <TextInput
          style={[
            styles.input,
            formErrors.some(e => e.includes('Password')) && styles.inputError,
          ]}
          placeholder='Password'
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel='Password'
          accessibilityHint='Enter your password to log in'
          accessibilityRequired={true}
          accessibilityInvalid={formErrors.some(e => e.includes('Password'))}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
          accessible={true}
          accessibilityLabel='Login'
          accessibilityHint='Log in to your account'
          accessibilityRole='button'
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessible={true}
          accessibilityLabel='Sign in with Google'
          accessibilityHint='Sign in using your Google account'
          accessibilityRole='button'
        >
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            accessible={true}
            accessibilityLabel='Go to Register'
            accessibilityHint='Navigate to registration screen'
            accessibilityRole='button'
          >
            <Text style={styles.footerLink}>Sign up</Text>
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
  loginButton: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: '#4285F4',
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

export default LoginScreen;
