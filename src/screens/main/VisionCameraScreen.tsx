import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SmartCameraCapture } from '../../components/SmartCameraCapture';
import type { ImageClassificationResult } from '../../services/AIVisionService';
import { useToast } from '../../contexts/ToastContext';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { SubScreenHeader } from '../../components/common/SubScreenHeader';

type CameraMode = 'waste' | 'food' | 'transport' | 'energy';

const VisionCameraScreen = () => {
  const { showToast } = useToast();

  const [activeMode, setActiveMode] = useState<CameraMode | null>(null);

  const handleResult = (result: ImageClassificationResult) => {
    setActiveMode(null);
    showToast(
      `Detected: ${result.subcategory || result.category} (${(result.confidence * 100).toFixed(
        0,
      )}%)\nImpact: ${result.carbonImpact.toFixed(2)}kg CO₂`,
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
    <SpaceBackground earthPosition='bottom-right' enableComets={true}>
      <SubScreenHeader title='Reality Lens' />

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
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
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
