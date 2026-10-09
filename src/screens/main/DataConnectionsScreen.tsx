import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MotiView } from 'moti';
import { EnvelopeSimple, LockKey, CheckCircle } from 'phosphor-react-native';
import { useToast } from '../../contexts/ToastContext';
import { spatialColors, typography, animations } from '../../theme/theme';
import { EmailParserService } from '../../services/EmailParserService';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { SubScreenHeader } from '../../components/common/SubScreenHeader';

const DataConnectionsScreen = () => {
  const { showToast } = useToast();

  const [isConnected, setIsConnected] = useState(EmailParserService.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (isConnected) {
      // Disconnect flow
      EmailParserService.disconnect();
      setIsConnected(false);
      showToast('Email disconnected', 'info');
      return;
    }

    setIsConnecting(true);

    // Simulate OAuth flow
    setTimeout(() => {
      EmailParserService.connect();
      setIsConnected(true);
      setIsConnecting(false);
      showToast('Email securely connected!', 'success');

      // Trigger a sync
      EmailParserService.syncReceipts();
    }, 1500);
  };

  return (
    <SpaceBackground earthPosition='bottom-left' enableComets={true}>
      <SubScreenHeader
        title='Data Connections'
        subtitle='Automate your footprint tracking safely.'
      />

      <ScrollView contentContainerStyle={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...animations.spring.bouncy, delay: 100 }}
        >
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <EnvelopeSimple size={28} color={spatialColors.primary} weight='duotone' />
              </View>
              <View style={styles.statusBadge}>
                {isConnected ? (
                  <>
                    <CheckCircle size={14} color='#34C759' weight='fill' />
                    <Text style={[styles.statusText, { color: '#34C759' }]}>Connected</Text>
                  </>
                ) : (
                  <Text style={styles.statusText}>Not Connected</Text>
                )}
              </View>
            </View>

            <Text style={styles.cardTitle}>Email Receipt Parsing</Text>
            <Text style={styles.cardDescription}>
              Connect your Gmail or Outlook to automatically track flights, rides, and purchases.
            </Text>

            <View style={styles.privacyBox}>
              <LockKey size={16} color={spatialColors.textSecondary} />
              <Text style={styles.privacyText}>
                We use a specialized, secure local AI model. Your personal emails are never read or
                stored. We only look for digital receipts.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, isConnected && styles.buttonDisconnect]}
              onPress={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color='white' />
              ) : (
                <Text style={styles.buttonText}>
                  {isConnected ? 'Disconnect Account' : 'Connect Email Account'}
                </Text>
              )}
            </TouchableOpacity>
          </GlassCard>
        </MotiView>
      </ScrollView>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  card: {
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: spatialColors.textSecondary,
  },
  cardTitle: {
    ...typography.title2,
    color: spatialColors.textPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    ...typography.body,
    color: spatialColors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  privacyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 12,
    marginBottom: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: spatialColors.textSecondary,
    lineHeight: 18,
  },
  button: {
    backgroundColor: spatialColors.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisconnect: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: spatialColors.glassBorderDark,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default DataConnectionsScreen;
