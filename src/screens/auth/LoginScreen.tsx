import React, { useEffect, useState } from 'react';

import {
  AccessibilityInfo,
  Alert,
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
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

import logoImage from '../../assets/logo.png';
import type { AuthStackParamList } from '../../navigation/types';
import { biometricAuthenticationService } from '../../services/BiometricAuthenticationService';
import { Logger } from '../../services/AdvancedLoggingService';
import { loginFailure, loginStart, loginSuccess } from '../../store/slices/authSlice';

// Import logo asset

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>();
  const dispatch = useDispatch();

  useEffect(() => {
    Logger.setScreen('LoginScreen', {
      category: 'auth',
      component: 'LoginScreen',
    });

    const initializeBiometrics = async () => {
      Logger.startTimer('biometric_init');
      
      try {
        Logger.info('Initializing biometric authentication', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'biometric_init',
        });

        await biometricAuthenticationService.initialize();
        const capabilities = await biometricAuthenticationService.getBiometricCapabilities();
        setBiometricsAvailable(capabilities.fingerprint || capabilities.faceId);
        
        Logger.endTimer('biometric_init', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'biometric_init_success',
          biometricsAvailable: capabilities.fingerprint || capabilities.faceId,
          capabilities: JSON.stringify(capabilities),
        });
      } catch (error) {
        Logger.error('Biometrics initialization failed', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'biometric_init_error',
        }, error as Error);
        
        Logger.endTimer('biometric_init', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'biometric_init_failed',
        });
      }
    };

    initializeBiometrics();
  }, []);

  const handleLogin = async () => {
    Logger.startTimer('email_login');
    Logger.info('User initiated email login', {
      category: 'auth',
      component: 'LoginScreen',
      action: 'login_attempt',
      method: 'email',
      hasEmail: !!email,
      hasPassword: !!password,
    });

    const errors: string[] = [];

    if (!email) errors.push('Email is required');
    if (!password) errors.push('Password is required');

    if (errors.length > 0) {
      setFormErrors(errors);
      Logger.warn('Login form validation failed', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'validation_error',
        errors,
        errorCount: errors.length,
      });
      
      AccessibilityInfo.announceForAccessibility(
        `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`,
      );
      
      Logger.endTimer('email_login', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_validation_failed',
      });
      return;
    }

    setFormErrors([]);

    try {
      setLoading(true);
      dispatch(loginStart());

      Logger.info('Attempting Firebase email authentication', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'firebase_auth_attempt',
        email: email.split('@')[1], // Log domain only for privacy
      });

      const userCredential = await auth().signInWithEmailAndPassword(email, password);

      Logger.info('Email login successful', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_success',
        method: 'email',
        userId: userCredential.user.uid,
        userEmail: userCredential.user.email?.split('@')[1], // Domain only
        hasDisplayName: !!userCredential.user.displayName,
        emailVerified: userCredential.user.emailVerified,
      });

      dispatch(
        loginSuccess({
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || '',
        }),
      );

      Logger.setUserId(userCredential.user.uid);

      Logger.endTimer('email_login', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_success',
        userId: userCredential.user.uid,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setFormErrors([errorMessage]);
      dispatch(loginFailure(errorMessage));

      Logger.error('Email login failed', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_error',
        method: 'email',
        errorCode: (error as any)?.code,
        errorMessage,
      }, error as Error);

      AccessibilityInfo.announceForAccessibility(`Login failed: ${errorMessage}`);

      Logger.endTimer('email_login', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    Logger.startTimer('biometric_login');
    Logger.info('User initiated biometric login', {
      category: 'auth',
      component: 'LoginScreen',
      action: 'biometric_login_attempt',
      method: 'biometric',
    });

    try {
      setLoading(true);
      dispatch(loginStart());

      Logger.info('Attempting biometric authentication', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'biometric_auth_attempt',
      });

      const result = await biometricAuthenticationService.authenticateBiometric('fingerprint', {
        prompt: 'Authenticate to login to Kindred',
      });

      Logger.info('Biometric authentication result received', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'biometric_auth_result',
        success: result.success,
        confidence: result.confidence,
        livenessConfirmed: result.livenessConfirmed,
        spoofingDetected: result.spoofingDetected,
        fallbackRequired: result.fallbackRequired,
        errorCount: result.errors.length,
      });

      if (result.success) {
        // In a real app, you'd verify the biometric result with your backend
        Logger.info('Biometric login successful', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'login_success',
          method: 'biometric',
          confidence: result.confidence,
          templateId: result.templateId,
        });

        dispatch(
          loginSuccess({
            id: 'biometric_user',
            email: 'user@example.com',
            name: 'Biometric User',
          }),
        );

        Logger.setUserId('biometric_user');

        Logger.endTimer('biometric_login', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'login_success',
          userId: 'biometric_user',
        });
      } else {
        const errorMessage = result.errors[0]?.message || 'Biometric authentication failed';
        setFormErrors([errorMessage]);
        dispatch(loginFailure(errorMessage));

        Logger.warn('Biometric authentication failed', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'biometric_auth_failed',
          errors: result.errors.map(e => e.message),
          confidence: result.confidence,
          spoofingDetected: result.spoofingDetected,
          fallbackRequired: result.fallbackRequired,
        });

        AccessibilityInfo.announceForAccessibility(`Biometric login failed: ${errorMessage}`);

        Logger.endTimer('biometric_login', {
          category: 'auth',
          component: 'LoginScreen',
          action: 'login_failed',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Biometric login failed';
      setFormErrors([errorMessage]);
      dispatch(loginFailure(errorMessage));

      Logger.error('Biometric login error', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'biometric_login_error',
        errorMessage,
      }, error as Error);

      AccessibilityInfo.announceForAccessibility(`Biometric login failed: ${errorMessage}`);

      Logger.endTimer('biometric_login', {
        category: 'auth',
        component: 'LoginScreen',
        action: 'login_error',
      });
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
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setFormErrors([errorMessage]);
      AccessibilityInfo.announceForAccessibility(`Google sign in failed: ${errorMessage}`);
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
          Welcome to Kindred
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
          style={[styles.input, formErrors.some(e => e.includes('Email')) && styles.inputError]}
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
          style={[styles.input, formErrors.some(e => e.includes('Password')) && styles.inputError]}
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
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
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

        {biometricsAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={loading}
            accessible={true}
            accessibilityLabel='Sign in with biometrics'
            accessibilityHint='Use fingerprint or face ID to sign in'
            accessibilityRole='button'
          >
            <Text style={styles.buttonText}>🔐 Biometric Login</Text>
          </TouchableOpacity>
        )}

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
  biometricButton: {
    backgroundColor: '#34C759',
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
