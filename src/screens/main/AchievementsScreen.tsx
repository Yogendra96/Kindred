import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { Badge } from '../../services/AchievementSystem';
import achievementSystem from '../../services/AchievementSystem';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { Trophy } from 'phosphor-react-native';

const GlassCard = ({ style, children }: any) => (
  <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, overflow: 'hidden' }]}>
    {children}
  </View>
);

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState<Badge[]>([]);

  useEffect(() => {
    // Load all available badges to show what can be unlocked
    const badges = achievementSystem.getAllBadges();
    setAchievements(badges);
  }, []);

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0f2027" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#203a43" stopOpacity="1" />
            <Stop offset="1" stopColor="#2c5364" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
      </Svg>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Trophy size={48} color="#FFD700" weight="duotone" />
          <Text style={styles.title}>Achievements</Text>
          <Text style={styles.subtitle}>Unlock badges to save the planet</Text>
        </View>
        <View style={styles.list}>
          {achievements.map(ach => (
            <GlassCard key={ach.id} style={styles.card}>
              <View style={styles.iconWrapper}>
                <Text style={styles.icon}>{ach.icon}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{ach.name}</Text>
                <Text style={styles.desc}>{ach.description}</Text>
                <Text style={styles.points}>{ach.rewards.points} pts</Text>
              </View>
            </GlassCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f2027' },
  header: { 
    paddingTop: 60, 
    paddingBottom: 24, 
    alignItems: 'center' 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: { fontSize: 32 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  points: { fontSize: 14, fontWeight: 'bold', color: '#38EF7D' },
});

export default AchievementsScreen;
