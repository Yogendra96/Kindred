import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useToast } from '../../contexts/ToastContext';
// import { TOPICS, ARTICLES, QUIZ_QUESTIONS, TYPE_COLORS } from '../../data/learningData';
// import type { LearningItem } from '../../data/learningData';

// ─── Data imported from ../../data/learningData ───────────────────────────────

const TOPICS = ['All', 'Diet', 'Energy', 'Transport', 'Waste', 'Nature'];

const ARTICLES = [
  {
    id: 'a1',
    type: 'article',
    topic: 'Diet',
    title: 'Why Plant-Based Diets Cut Your Carbon by 73%',
    emoji: '🌿',
    readTime: '4 min',
    difficulty: 'Beginner',
    preview:
      'Livestock farming accounts for 14.5% of global GHG emissions. Switching just 3 meals a week makes a measurable difference.',
  },
  {
    id: 'a2',
    type: 'video',
    topic: 'Energy',
    title: "Home Solar: A Real Family's First Year",
    emoji: '☀️',
    readTime: '8 min video',
    difficulty: 'Beginner',
    preview:
      'A family in Arizona documents their switch to rooftop solar — costs, savings, and surprises after 12 months.',
  },
  {
    id: 'a3',
    type: 'article',
    topic: 'Transport',
    title: 'The Hidden Carbon Cost of Flying',
    emoji: '✈️',
    readTime: '6 min',
    difficulty: 'Intermediate',
    preview:
      'A single transatlantic flight emits more CO₂ than 3 months of average driving. Here are the numbers and better alternatives.',
  },
  {
    id: 'a4',
    type: 'quiz',
    topic: 'Waste',
    title: 'Can You Guess These Recycling Myths?',
    emoji: '♻️',
    readTime: '3 min quiz',
    difficulty: 'Beginner',
    preview:
      'Test how much you actually know about what goes in the recycling bin — the answers might surprise you.',
  },
  {
    id: 'a5',
    type: 'article',
    topic: 'Nature',
    title: "How Forests Absorb Carbon (And Why We're Losing Them)",
    emoji: '🌳',
    readTime: '5 min',
    difficulty: 'Intermediate',
    preview:
      'Forests store 45% of terrestrial carbon. Deforestation releases it in seconds. Understanding this cycle drives better choices.',
  },
  {
    id: 'a6',
    type: 'video',
    topic: 'Energy',
    title: 'The Spot Difference: Gas vs Induction Cooking',
    emoji: '🔥',
    readTime: '5 min video',
    difficulty: 'Beginner',
    preview:
      'A head-to-head comparison of cooking emissions, energy efficiency, and what actually costs more in your kitchen.',
  },
  {
    id: 'a7',
    type: 'quiz',
    topic: 'Diet',
    title: 'Carbon Footprint of Common Foods — Quiz',
    emoji: '🥩',
    readTime: '4 min quiz',
    difficulty: 'Intermediate',
    preview:
      'From beef to lentils — rank these foods by their CO₂ footprint and see if your instincts are right.',
  },
  {
    id: 'a8',
    type: 'article',
    topic: 'Transport',
    title: 'E-Bikes: The Most Efficient Vehicle Ever?',
    emoji: '🚴',
    readTime: '4 min',
    difficulty: 'Beginner',
    preview:
      "Per kilometre, e-bikes produce less than 1/50th of car emissions. Here's why more cities are going electric-pedal first.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  article: '#1565c0',
  video: '#b71c1c',
  quiz: '#6a1b9a',
};

const ContentCard = ({ item }: { item: (typeof ARTICLES)[0] }) => {
  const { showToast } = useToast();

  const handlePress = () => {
    showToast(
      `${item.title}\nFull ${item.type} experience coming in the next update!`,
      'info',
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTagRow}>
          <View
            style={[
              styles.tag,
              {
                backgroundColor: TYPE_COLORS[item.type] + '20',
                borderColor: TYPE_COLORS[item.type],
              },
            ]}
          >
            <Text style={[styles.tagText, { color: TYPE_COLORS[item.type] }]}>
              {item.type.toUpperCase()}
            </Text>
          </View>
          <View style={styles.diffTag}>
            <Text style={styles.diffText}>{item.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardPreview} numberOfLines={2}>
          {item.preview}
        </Text>
        <Text style={styles.cardMeta}>⏱ {item.readTime}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const LearningCenterScreen = () => {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [completedIds] = useState<Set<string>>(new Set(['a1', 'a4']));

  const filtered =
    selectedTopic === 'All'
      ? ARTICLES
      : ARTICLES.filter(a => a.topic === selectedTopic);

  const progress = Math.round((completedIds.size / ARTICLES.length) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎓 Learning Center</Text>
        <Text style={styles.subtitle}>Articles · Videos · Quizzes</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {completedIds.size}/{ARTICLES.length} completed
          </Text>
        </View>
      </View>

      {/* Topic filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicScroll}
        contentContainerStyle={styles.topicContent}
      >
        {TOPICS.map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.topicPill,
              selectedTopic === t && styles.topicPillActive,
            ]}
            onPress={() => setSelectedTopic(t)}
          >
            <Text
              style={[
                styles.topicText,
                selectedTopic === t && styles.topicTextActive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ContentCard item={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No content yet for this topic.</Text>
          </View>
        }
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#6a1b9a',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 12,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#ce93d8', borderRadius: 3 },
  progressLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  topicScroll: { maxHeight: 52, backgroundColor: 'white' },
  topicContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  topicPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  topicPillActive: { backgroundColor: '#6a1b9a' },
  topicText: { fontSize: 13, fontWeight: '600', color: '#666' },
  topicTextActive: { color: 'white' },

  listContent: { padding: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardLeft: {
    width: 72,
    backgroundColor: '#f3e5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 32 },
  cardBody: { flex: 1, padding: 14 },
  cardTagRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  diffTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  diffText: { fontSize: 9, color: '#888', fontWeight: '600' },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  cardPreview: { fontSize: 12, color: '#666', lineHeight: 17, marginBottom: 6 },
  cardMeta: { fontSize: 11, color: '#aaa' },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#aaa' },
});

export default LearningCenterScreen;
