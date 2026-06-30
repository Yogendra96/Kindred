import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { PlayCircle, Article, Question, CaretLeft, CheckCircle } from 'phosphor-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import { spatialColors, typography, animations } from '../../theme/theme';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

// ─── Data imported from ../../data/learningData ───────────────────────────────

const TOPICS = ['All', 'Vegan Journey', 'Diet', 'Energy', 'Transport', 'Waste', 'Nature'];

const ARTICLES = [
  {
    id: 'v1',
    type: 'article',
    topic: 'Vegan Journey',
    title: "Beginner's Guide to a Cruelty-Free Pantry",
    icon: Article,
    readTime: '5 min',
    difficulty: 'Beginner',
    preview:
      'Transitioning to a vegan lifestyle starts in the kitchen. Here are 10 essential swaps that make cruelty-free cooking effortless and delicious.',
  },
  {
    id: 'a1',
    type: 'article',
    topic: 'Diet',
    title: 'Why Plant-Based Diets Cut Your Carbon by 73%',
    icon: Article,
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
    icon: PlayCircle,
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
    icon: Article,
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
    icon: Question,
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
    icon: Article,
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
    icon: PlayCircle,
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
    icon: Question,
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
    icon: Article,
    readTime: '4 min',
    difficulty: 'Beginner',
    preview:
      'An e-bike uses 1% of the energy of an electric car. How this simple technology is quietly transforming urban transport.',
  },
];

const TYPE_COLORS: Record<string, string> = {
  article: '#0A84FF', // blue
  video: '#FF3B30', // red
  quiz: '#BF5AF2', // purple
};

// ─── Content Card ─────────────────────────────────────────────────────────────

interface ArticleItem {
  id: string;
  type: string;
  topic: string;
  title: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  }>;
  readTime: string;
  difficulty: string;
  preview: string;
}

interface ContentCardProps {
  item: ArticleItem;
  completed: boolean;
  onPress: () => void;
  index: number;
}

const ContentCard = ({ item, completed, onPress, index }: ContentCardProps) => {
  const color = TYPE_COLORS[item.type] || '#fff';
  const Icon = item.icon;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ ...animations.spring.gentle, delay: index * 100 }}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <GlassCard style={[styles.card, completed && styles.cardCompleted]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagRow}>
              <View style={[styles.typeTag, { backgroundColor: color + '20' }]}>
                <Icon size={14} color={color} weight='fill' />
                <Text style={[styles.typeText, { color }]}>{item.type.toUpperCase()}</Text>
              </View>
              <View style={styles.diffTag}>
                <Text style={styles.diffText}>{item.difficulty}</Text>
              </View>
            </View>
            {completed && <CheckCircle size={24} color='#34C759' weight='fill' />}
          </View>
          <Text style={[styles.cardTitle, completed && styles.cardTitleCompleted]}>
            {item.title}
          </Text>
          <Text style={styles.cardPreview} numberOfLines={2}>
            {item.preview}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta}>{item.readTime}</Text>
            <View style={styles.topicTag}>
              <Text style={styles.topicTagText}>{item.topic}</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </MotiView>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const LearningCenterScreen = () => {
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(['a1', 'a4']));
  const { showToast } = useToast();
  const navigation = useNavigation();

  const filtered =
    selectedTopic === 'All' ? ARTICLES : ARTICLES.filter(a => a.topic === selectedTopic);

  const progress = Math.round((completedIds.size / ARTICLES.length) * 100);

  const handlePress = (id: string, title: string) => {
    // In a real app this would navigate to content
    if (!completedIds.has(id)) {
      setCompletedIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      showToast(`Completed: ${title}`, 'success');
    } else {
      showToast('Opening again...', 'info');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <MotiView
        style={styles.header}
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={animations.spring.gentle}
      >
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <CaretLeft size={24} color={spatialColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Learning Center</Text>
        </View>
        <Text style={styles.subtitle}>Articles · Videos · Quizzes</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={animations.spring.bouncy}
              style={[styles.progressFill]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {completedIds.size}/{ARTICLES.length} completed
          </Text>
        </View>
      </MotiView>

      {/* Topic filter */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...animations.spring.bouncy, delay: 100 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topicScroll}
          contentContainerStyle={styles.topicContent}
        >
          {TOPICS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.topicPill, selectedTopic === t && styles.topicPillActive]}
              onPress={() => setSelectedTopic(t)}
            >
              <Text style={[styles.topicText, selectedTopic === t && styles.topicTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </MotiView>

      {/* Content list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <ContentCard
            item={item}
            index={index}
            completed={completedIds.has(item.id)}
            onPress={() => handlePress(item.id, item.title)}
          />
        )}
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
  container: { flex: 1, backgroundColor: spatialColors.background },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: spatialColors.glassBorderDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title1, color: spatialColors.textPrimary },
  subtitle: {
    ...typography.body,
    color: spatialColors.textSecondary,
    marginTop: 4,
    marginLeft: 52,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },

  topicScroll: {
    maxHeight: 60,
    minHeight: 60,
  },
  topicContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  topicPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: spatialColors.glassBorderDark,
  },
  topicPillActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    color: spatialColors.textSecondary,
  },
  topicTextActive: {
    color: spatialColors.textPrimary,
  },

  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    padding: 20,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  diffTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '600',
    color: spatialColors.textSecondary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: spatialColors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  cardTitleCompleted: {
    color: spatialColors.textSecondary,
  },
  cardPreview: {
    fontSize: 14,
    color: spatialColors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    fontSize: 13,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },
  topicTag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicTagText: {
    fontSize: 12,
    color: spatialColors.textSecondary,
    fontWeight: '500',
  },

  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: spatialColors.textSecondary,
    fontSize: 16,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    overflow: 'hidden',
  },
});

export default LearningCenterScreen;
