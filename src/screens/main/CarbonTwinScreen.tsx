import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { carbonTwinEngine } from '../../services/CarbonTwinEngine';
import { ImmersiveDashboard } from '../../components/ImmersiveDashboard';
import { useToast } from '../../contexts/ToastContext';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import type { RootState } from '../../store';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { Dna, Sparkle, Carrot, Car, House, CaretRight } from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

const CarbonTwinScreen = () => {
  const [status, setStatus] = useState('Idle');
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const profileName = user?.profile?.name || 'Eco Explorer';

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
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0f2027' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#203a43' stopOpacity='1' />
            <Stop offset='1' stopColor='#2c5364' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <Dna size={32} color='#38EF7D' weight='duotone' />
          </View>
          <Text style={styles.title}>Carbon Twin</Text>
          <Text style={styles.subtitle}>AI-Powered Digital Lifestyle Model</Text>
        </View>

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
                <Text style={styles.simTitle}>EV Adoption</Text>
                <Text style={styles.simDesc}>Projected Impact: -2.4 tons CO₂e/year</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
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
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
});

export default CarbonTwinScreen;
