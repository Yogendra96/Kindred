import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';
import { carbonTwinEngine } from '../../services/CarbonTwinEngine';

const CarbonTwinScreen = () => {
  const [status, setStatus] = useState('Idle');

  const handleCreateTwin = async () => {
    try {
      setStatus('Initializing Twin...');
      // In a real app we pass user data here
      await carbonTwinEngine.createCarbonTwin('current_user', {});
      setStatus('Twin Created! 🌿');
      Alert.alert('Success', 'Your Digital Carbon Twin has been generated!');
    } catch (e) {
      setStatus('Error creating twin');
      console.error(e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧬 Carbon Twin</Text>
        <Text style={styles.subtitle}>AI-Powered Digital Lifestyle Model</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.desc}>
          This engine simulates your carbon usage across parallel realities to
          find the optimal path to Net Zero.
        </Text>
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Status: {status}</Text>
        </View>
        <Button title='Generate My Twin' onPress={handleCreateTwin} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Simulations</Text>
          <Text>• Vegan Diet Switch</Text>
          <Text>• EV Adoption</Text>
          <Text>• Remote Work Impact</Text>
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
  content: { padding: 20 },
  desc: { fontSize: 16, color: '#333', marginBottom: 20, lineHeight: 22 },
  statusBox: {
    padding: 15,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusLabel: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
});

export default CarbonTwinScreen;
