import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { carbonTwinEngine } from '../../services/CarbonTwinEngine';
import { ImmersiveDashboard } from '../../components/ImmersiveDashboard';
import { useToast } from '../../contexts/ToastContext';

const CarbonTwinScreen = () => {
  const [status, setStatus] = useState('Idle');
  const { showToast } = useToast();

  const handleCreateTwin = async () => {
    try {
      setStatus('Initializing Twin...');
      // In a real app we pass user data here
      await carbonTwinEngine.createCarbonTwin('current_user', {});
      setStatus('Twin Created! 🌿');
      showToast('Your Digital Carbon Twin has been generated!', 'success');
    } catch (e) {
      setStatus('Error creating twin');
      showToast('Failed to generate Carbon Twin.', 'error');
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧬 Carbon Twin</Text>
        <Text style={styles.subtitle}>AI-Powered Digital Lifestyle Model</Text>
      </View>

      {/* Bio-Digital Twin Visualization */}
      <View style={styles.dashboardContainer}>
        <ImmersiveDashboard />
      </View>

      <View style={styles.content}>
        <Text style={styles.desc}>
          This engine simulates your carbon usage across parallel realities to
          find the optimal path to Net Zero.
        </Text>

        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Engine Status: {status}</Text>
        </View>

        <Button title='Regenerate Twin Model' onPress={handleCreateTwin} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Simulations</Text>
          <View style={styles.simulationCard}>
            <Text style={styles.simTitle}>🌱 Vegan Diet Switch</Text>
            <Text style={styles.simDesc}>
              Projected Impact: -1.2 tons CO2e/year
            </Text>
          </View>
          <View style={styles.simulationCard}>
            <Text style={styles.simTitle}>🚗 EV Adoption</Text>
            <Text style={styles.simDesc}>
              Projected Impact: -2.4 tons CO2e/year
            </Text>
          </View>
          <View style={styles.simulationCard}>
            <Text style={styles.simTitle}>🏠 Remote Work</Text>
            <Text style={styles.simDesc}>
              Projected Impact: -0.8 tons CO2e/year
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 30, backgroundColor: '#2c3e50', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ecf0f1' },
  subtitle: { fontSize: 16, color: '#bdc3c7', marginTop: 5 },
  dashboardContainer: { padding: 10 },
  content: { padding: 20 },
  desc: { fontSize: 16, color: '#333', marginBottom: 20, lineHeight: 22 },
  statusBox: {
    padding: 10,
    backgroundColor: '#f1c40f',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    opacity: 0.8,
  },
  statusLabel: { fontSize: 14, fontWeight: '600', color: '#2c3e50' },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  simulationCard: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  simTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  simDesc: { fontSize: 14, color: '#7f8c8d', marginTop: 4 },
});

export default CarbonTwinScreen;
