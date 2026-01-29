import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import achievementSystem, { Badge } from '../../services/AchievementSystem';

const AchievementsScreen = () => {
  const [achievements, setAchievements] = useState<Badge[]>([]);

  useEffect(() => {
    // Load all available badges to show what can be unlocked
    const badges = achievementSystem.getAllBadges();
    setAchievements(badges);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Achievements</Text>
        <Text style={styles.subtitle}>Unlock badges to save the planet</Text>
      </View>
      <View style={styles.list}>
        {achievements.map(ach => (
          <View key={ach.id} style={styles.card}>
            <Text style={styles.icon}>{ach.icon}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{ach.name}</Text>
              <Text style={styles.desc}>{ach.description}</Text>
              <Text style={styles.points}>{ach.rewards.points} pts</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, backgroundColor: '#FFD700', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 16, color: '#555' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  icon: { fontSize: 32, marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold' },
  desc: { fontSize: 14, color: '#666' },
  points: { fontSize: 14, fontWeight: 'bold', color: '#2e7d32', marginTop: 4 },
});

export default AchievementsScreen;
