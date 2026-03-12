/**
 * learningData.ts — Learning Center data constants
 * Extracted from LearningCenterScreen.tsx (SRP: data ≠ UI).
 */

export const TOPICS = [
  'All',
  'Diet',
  'Energy',
  'Transport',
  'Waste',
  'Nature',
] as const;
export type Topic = (typeof TOPICS)[number];

export type ContentType = 'article' | 'video' | 'quiz';

export interface LearningItem {
  id: string;
  type: ContentType;
  topic: string;
  title: string;
  emoji: string;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  preview: string;
}

export const ARTICLES: LearningItem[] = [
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

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    q: 'Which food has the highest carbon footprint per kg?',
    options: ['Chicken', 'Beef', 'Tofu', 'Rice'],
    correct: 1,
    explanation:
      'Beef produces ~60 kg CO₂ per kg of food — roughly 10× chicken and 100× tofu.',
  },
  {
    q: 'What percentage of global emissions comes from animal agriculture?',
    options: ['5%', '9%', '14.5%', '22%'],
    correct: 2,
    explanation:
      'The FAO estimates livestock is responsible for 14.5% of global greenhouse gas emissions.',
  },
  {
    q: 'Which action saves the most CO₂ per year for an individual?',
    options: ['Recycling', 'Shorter showers', 'Going car-free', 'LED bulbs'],
    correct: 2,
    explanation:
      'Going car-free saves ~2.4 tonnes CO₂/year — far more than any other individual action.',
  },
];

export const TYPE_COLORS: Record<ContentType, string> = {
  article: '#1565c0',
  video: '#b71c1c',
  quiz: '#6a1b9a',
};
