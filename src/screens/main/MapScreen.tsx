import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MapScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Map</Text>
        <Text style={styles.subtitle}>Eco-friendly locations</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>
          ✅ Map screen placeholder{'\n\n'}
          This will show eco-friendly locations,{'\n'}
          carbon tracking routes, and more.{'\n\n'}
          Next steps: Add maps, geolocation, and Firebase.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#28a745',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    color: '#333',
  },
});

export default MapScreen;
