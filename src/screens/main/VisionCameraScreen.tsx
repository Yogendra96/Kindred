import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SmartCameraCapture } from '../../components/SmartCameraCapture';
import type { ImageClassificationResult } from '../../services/AIVisionService';
import { useToast } from '../../contexts/ToastContext';

type CameraMode = 'waste' | 'food' | 'transport' | 'energy';

const VisionCameraScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [activeMode, setActiveMode] = useState<CameraMode | null>(null);

  const handleResult = (result: ImageClassificationResult) => {
    setActiveMode(null);
    showToast(
      `Detected: ${result.subcategory || result.category} (${(
        result.confidence * 100
      ).toFixed(0)}%)\nImpact: ${result.carbonImpact.toFixed(2)}kg CO₂`,
      'success',
    );
  };

  const MODES: {
    id: CameraMode;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    desc: string;
  }[] = [
    {
      id: 'waste',
      icon: 'trash-bin',
      title: 'Smart Waste',
      desc: 'Recycling classification',
    },
    {
      id: 'food',
      icon: 'restaurant',
      title: 'Food Carbon',
      desc: 'Meal footprint analysis',
    },
    {
      id: 'transport',
      icon: 'car',
      title: 'Transport',
      desc: 'Vehicle emission detection',
    },
    {
      id: 'energy',
      icon: 'speedometer',
      title: 'Energy Reader',
      desc: 'Automatic meter reading',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name='arrow-back' size={28} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.title}>📷 Reality Lens</Text>
      </View>

      <Text style={styles.promptText}>
        Select a lens mode below to analyze real-world carbon impact:
      </Text>

      {/* Mode Grid */}
      <View style={styles.gridContainer}>
        {MODES.map(mode => (
          <TouchableOpacity
            key={mode.id}
            style={styles.modeCard}
            onPress={() => setActiveMode(mode.id)}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={mode.icon} size={36} color='#4CAF50' />
            </View>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeDesc}>{mode.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera Modal overlay */}
      {activeMode && (
        <SmartCameraCapture
          mode={activeMode}
          visible={true}
          onResult={handleResult}
          onClose={() => setActiveMode(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1E1E1E',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  promptText: {
    color: '#aaa',
    fontSize: 16,
    padding: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  gridContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  modeCard: {
    width: '45%',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modeDesc: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default VisionCameraScreen;
