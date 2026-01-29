import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';

const VisionCameraScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 AI Carbon Vision</Text>
      </View>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>Camera Feed Placeholder</Text>
        <Text style={styles.subText}>
          (Requires actual device camera permission)
        </Text>
      </View>
      <View style={styles.controls}>
        <Text style={styles.desc}>
          Point your camera at any product or receipt to instantly analyze its
          carbon footprint.
        </Text>
        <Button
          title='Capture & Analyze'
          onPress={() => console.log('Capture')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  placeholderText: { color: '#888', fontSize: 20 },
  subText: { color: '#555', marginTop: 10 },
  controls: {
    padding: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  desc: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
});

export default VisionCameraScreen;
