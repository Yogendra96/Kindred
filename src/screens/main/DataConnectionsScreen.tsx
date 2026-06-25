import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { CaretLeft, EnvelopeSimple, LockKey, CheckCircle } from 'phosphor-react-native';
import { useToast } from '../../contexts/ToastContext';
import { spatialColors, typography, animations } from '../../theme/theme';
import { EmailParserService } from '../../services/EmailParserService';

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        overflow: 'hidden',
      },
    ]}
  >
    {children}
  </View>
);

const DataConnectionsScreen = () => {
  const navigation = useNavigation();
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
    <View style={styles.container}>
      <MotiView
        style={styles.header}
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={animations.spring.gentle}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <CaretLeft size={24} color={spatialColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Data Connections</Text>
        </View>
        <Text style={styles.subtitle}>Automate your footprint tracking safely.</Text>
      </MotiView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: spatialColors.background },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: spatialColors.glassBorderDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title1, color: spatialColors.textPrimary },
  subtitle: {
    ...typography.body,
    color: spatialColors.textSecondary,
    marginTop: 4,
    marginLeft: 52,
  },

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
