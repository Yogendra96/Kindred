import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { carbonTwinEngine } from '../../services/CarbonTwinEngine';
import { ImmersiveDashboard } from '../../components/ImmersiveDashboard';
import { useToast } from '../../contexts/ToastContext';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import { Dna, Sparkle, Carrot, Car, House, CaretRight } from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { SubScreenHeader } from '../../components/common/SubScreenHeader';

const CarbonTwinScreen = () => {
  const [status, setStatus] = useState('Idle');
  const { showToast } = useToast();
  const user = auth().currentUser;
  const profileName = user?.displayName || 'Eco Explorer';

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleCreateTwin = async () => {
    try {
      HapticFeedbackService.triggerSelection();
      setStatus('Initializing Model...');
      await carbonTwinEngine.createCarbonTwin('current_user', {});
      setStatus('Twin Synchronized ✨');
      showToast('Your Digital Carbon Twin has been updated!', 'success');
    } catch (e) {
      setStatus('Sync Error');
      showToast('Failed to generate Carbon Twin.', 'error');
      console.error(e);
    }
  };

  return (
    <SpaceBackground earthPosition='bottom-left' enableComets={true}>
      <SubScreenHeader title='Carbon Twin' subtitle='AI-Powered Digital Lifestyle Model' />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF'
            colors={['#38EF7D']}
          />
        }
      >
        {/* Bio-Digital Twin Visualization */}
        <View style={styles.dashboardContainer}>
          <ImmersiveDashboard />
        </View>

        <View style={styles.content}>
          <Text style={styles.desc}>
            This engine simulates your carbon footprint against parallel lifestyle choices to find
            the optimal path to Net Zero.
          </Text>

          <GlassCard style={styles.statusBox}>
            <Sparkle size={20} color='#38EF7D' weight='duotone' />
            <Text style={styles.statusLabel}>
              Twin Status for {profileName}: <Text style={styles.statusValue}>{status}</Text>
            </Text>
          </GlassCard>

          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleCreateTwin}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Regenerate Twin Model</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Simulations</Text>

            {/* Simulation Card 1 */}
            <GlassCard style={styles.simulationCard}>
              <View style={styles.simIconContainer}>
                <Carrot size={24} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.simInfo}>
                <Text style={styles.simTitle}>Vegan Diet Switch</Text>
                <Text style={styles.simDesc}>Projected Impact: -1.2 tons CO₂e/year</Text>
              </View>
              <CaretRight size={18} color='rgba(255, 255, 255, 0.4)' />
            </GlassCard>

            {/* Simulation Card 2 */}
            <GlassCard style={styles.simulationCard}>
              <View style={styles.simIconContainer}>
                <Car size={24} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.simInfo}>
                <Text style={styles.simTitle}>Electric Vehicle</Text>
                <Text style={styles.simDesc}>Projected Impact: -2.1 tons CO₂e/year</Text>
              </View>
              <CaretRight size={18} color='rgba(255, 255, 255, 0.4)' />
            </GlassCard>

            {/* Simulation Card 3 */}
            <GlassCard style={styles.simulationCard}>
              <View style={styles.simIconContainer}>
                <House size={24} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.simInfo}>
                <Text style={styles.simTitle}>Remote Work</Text>
                <Text style={styles.simDesc}>Projected Impact: -0.8 tons CO₂e/year</Text>
              </View>
              <CaretRight size={18} color='rgba(255, 255, 255, 0.4)' />
            </GlassCard>
          </View>
        </View>
      </ScrollView>
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  dashboardContainer: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  desc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  statusValue: {
    color: '#38EF7D',
    fontWeight: 'bold',
  },
  regenerateButton: {
    height: 52,
    backgroundColor: '#38EF7D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A0A0C',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  simulationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
    padding: 14,
  },
  simIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simInfo: {
    flex: 1,
  },
  simTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  simDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
});

export default CarbonTwinScreen;
