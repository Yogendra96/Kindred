import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSelector, useDispatch } from 'react-redux';
import { acceptPrivacyConsent } from '../../store/slices/settingsSlice';
import type { RootState } from '../../store';
import { Shield, EyeSlash, MapPin, Database } from 'phosphor-react-native';
import HapticFeedbackService from '../../services/HapticFeedbackService';

export const PrivacyConsentModal: React.FC = () => {
  const dispatch = useDispatch();
  const consentAccepted = useSelector(
    (state: RootState) => state.settings?.privacy?.consentAccepted ?? false,
  );

  const handleAgree = () => {
    HapticFeedbackService.triggerSuccess();
    dispatch(acceptPrivacyConsent());
  };

  const handleOpenPrivacyPolicy = async () => {
    HapticFeedbackService.triggerSelection();
    const url = 'https://kindred.earth/privacy';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open privacy policy link:', error);
    }
  };

  return (
    <Modal
      visible={!consentAccepted}
      animationType='fade'
      transparent={true}
      statusBarTranslucent={true}
      presentationStyle='overFullScreen'
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView tint='dark' intensity={85} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.androidBackdrop]} />
        )}

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <View style={styles.shieldIconContainer}>
                  <Shield size={44} color='#38EF7D' weight='duotone' />
                </View>
                <Text style={styles.title}>Your Privacy, Our Priority</Text>
                <Text style={styles.subtitle}>
                  Kindred is built from the ground up to protect your personal information. Before
                  we start, please review and accept how we handle your data:
                </Text>
              </View>

              <View style={styles.cardsContainer}>
                {/* Location Consent */}
                <View style={styles.consentCard}>
                  <View style={styles.cardHeader}>
                    <MapPin size={24} color='#38EF7D' weight='duotone' />
                    <Text style={styles.cardTitle}>Eco-Location Tracking</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    We process your device coordinates and movement data locally on your device to
                    automatically detect eco-friendly commutes (walking, cycling, public transit).
                    Your real-time coordinates never leave your device.
                  </Text>
                </View>

                {/* Analytics Consent */}
                <View style={styles.consentCard}>
                  <View style={styles.cardHeader}>
                    <EyeSlash size={24} color='#38EF7D' weight='duotone' />
                    <Text style={styles.cardTitle}>Anonymized Telemetry</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    We collect anonymized performance telemetry and crash logs to monitor
                    application health and stability. No personal identifiers (like your email or
                    name) are ever shared or transmitted.
                  </Text>
                </View>

                {/* Storage Consent */}
                <View style={styles.consentCard}>
                  <View style={styles.cardHeader}>
                    <Database size={24} color='#38EF7D' weight='duotone' />
                    <Text style={styles.cardTitle}>Local Secure Storage</Text>
                  </View>
                  <Text style={styles.cardDescription}>
                    Your carbon savings cache, activity history, and settings preferences are stored
                    securely in your device's local storage and encrypted local keychain.
                  </Text>
                </View>
              </View>

              <Text style={styles.complianceNote}>
                By agreeing, you consent to our secure, local-first data practices in compliance
                with GDPR, CCPA, and global privacy standards.
              </Text>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.agreeButton}
                onPress={handleAgree}
                activeOpacity={0.8}
              >
                <Text style={styles.agreeButtonText}>Agree & Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.policyButton}
                onPress={handleOpenPrivacyPolicy}
                activeOpacity={0.7}
              >
                <Text style={styles.policyButtonText}>Read Full Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidBackdrop: {
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    padding: 20,
    justifyContent: 'space-between',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shieldIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  consentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
  complianceNote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  footer: {
    gap: 12,
    marginTop: 10,
  },
  agreeButton: {
    height: 52,
    backgroundColor: '#38EF7D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  agreeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0C',
  },
  policyButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textDecorationLine: 'underline',
  },
});

export default PrivacyConsentModal;
