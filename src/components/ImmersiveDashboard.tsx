// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Animated, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/ThemeProvider';
import { ImmersiveCarbonVisualizationEngineService } from '../services/ImmersiveCarbonVisualizationEngine';
import type { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';

export const ImmersiveDashboard: React.FC = () => {
  const { theme } = useTheme();
  // Select ecosystem state from Redux
  const ecosystem = useSelector((state: RootState) => state.carbon.ecosystem);

  // Animation values for visual feedback
  const treeScale = useRef(new Animated.Value(1)).current;
  const healthOpacity = useRef(new Animated.Value(0)).current;

  // Engine instance (we use a ref to keep it persistent but not trigger re-renders)
  const engine = useRef(new ImmersiveCarbonVisualizationEngineService());

  const [engineInitialized, setEngineInitialized] = useState(false);

  // Initialize Engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        await engine.current.initialize();
        setEngineInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Immersive Engine:', error);
      }
    };
    initEngine();
  }, []);

  // Sync Redux State -> Engine & Visual Feedback
  useEffect(() => {
    if (!engineInitialized) return;

    // 1. Update the internal engine state (logic layer)
    engine.current.updateWorldState({
      health: ecosystem.health,
      treeCount: ecosystem.treeCount,
      biodiversity: ecosystem.biodiversity,
      waterClarity: ecosystem.waterClarity,
      airQuality: ecosystem.airQuality,
    });

    // 2. Trigger UI Animations (Visual Feedback Layer)

    // Scale up trees slightly when count changes
    Animated.sequence([
      Animated.spring(treeScale, {
        toValue: 1.2,
        useNativeDriver: true,
      }),
      Animated.spring(treeScale, {
        toValue: 1.0,
        useNativeDriver: true,
      }),
    ]).start();

    // Flash health overlay if health improves
    Animated.sequence([
      Animated.timing(healthOpacity, {
        toValue: 0.3,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(healthOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ecosystem, engineInitialized, treeScale, healthOpacity]);

  // Derived styling based on state
  // Sky color shifts from Grey (polluted) to Blue (clean) based on airQuality
  const getSkyColors = () => {
    const quality = ecosystem.airQuality || 0.5;
    if (quality > 0.8) return ['#4facfe', '#00f2fe']; // Clear Blue
    if (quality > 0.4) return ['#89f7fe', '#66a6ff']; // Hazy Blue
    return ['#bdc3c7', '#2c3e50']; // Smoggy Grey
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. Dynamic Ambience (Sky/Fog) */}
      <LinearGradient
        colors={getSkyColors()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* 2. 3D Representation (Simplified 2D placeholder for React Native View) */}
      <View style={styles.worldContainer}>
        {/* Ground */}
        <View
          style={[
            styles.ground,
            {
              backgroundColor: `rgba(46, 204, 113, ${0.3 + ecosystem.health * 0.7})`,
            },
          ]}
        />

        {/* Trees (Instanced via mapped views for this prototype) */}
        <View style={styles.treeContainer}>
          {Array.from({ length: Math.min(ecosystem.treeCount, 20) }).map((_, i) => (
            <Animated.Text
              key={i}
              style={[styles.treeEmoji, { transform: [{ scale: treeScale }] }]}
            >
              🌳
            </Animated.Text>
          ))}
          {ecosystem.treeCount > 20 && (
            <Text style={styles.moreTrees}>+{ecosystem.treeCount - 20} more...</Text>
          )}
        </View>

        {/* Water (Updated by waterClarity) */}
        <View style={[styles.water, { opacity: 0.5 + ecosystem.waterClarity * 0.5 }]} />
      </View>

      {/* 3. Feedback Overlay */}
      <Animated.View
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          { backgroundColor: '#fff', opacity: healthOpacity },
        ]}
        pointerEvents='none'
      />

      {/* 4. Stats HUD */}
      <View style={styles.hud}>
        <View style={styles.statBadge}>
          <Text style={styles.statLabel}>Health</Text>
          <Text style={styles.statValue}>{(ecosystem.health * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statLabel}>Trees</Text>
          <Text style={styles.statValue}>{ecosystem.treeCount}</Text>
        </View>
      </View>

      <Text style={styles.debugText}>Bio-Digital Twin Active</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10,
  },
  worldContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '40%',
    borderTopLeftRadius: 50, // Hill effect
    borderTopRightRadius: 50,
  },
  water: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '15%',
    backgroundColor: '#3498db',
  },
  treeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: '10%', // Sit on ground
    paddingHorizontal: 20,
  },
  treeEmoji: {
    fontSize: 24,
    margin: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  moreTrees: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    borderRadius: 4,
  },
  hud: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'column',
    gap: 8,
  },
  statBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  debugText: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
});
