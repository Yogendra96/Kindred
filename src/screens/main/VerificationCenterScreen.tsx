import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const VerificationCenterScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Verification Center</Text>
        <Text style={styles.subtitle}>Decentralized Trust Network</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.info}>
          Your carbon data is verified by a network of peers and experts to
          ensure accuracy and prevent greenwashing.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Reputation Score</Text>
          <Text style={styles.score}>850 / 1000</Text>
          <Text style={styles.status}>Excellent Validator</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pending Validations</Text>
          <Text style={styles.empty}>No items need your review today.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: { padding: 30, backgroundColor: '#4834d4', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#dff9fb', marginTop: 5 },
  content: { padding: 20 },
  info: { fontSize: 16, color: '#535c68', marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
  },
  score: { fontSize: 36, fontWeight: 'bold', color: '#4834d4' },
  status: { fontSize: 16, color: '#2ecc71', marginTop: 5, fontWeight: '600' },
  empty: { fontStyle: 'italic', color: '#95a5a6' },
});

export default VerificationCenterScreen;
