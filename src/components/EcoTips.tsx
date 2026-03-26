import type { CarbonData } from './CarbonFootprintCard';
import { Ionicons } from '@expo/vector-icons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';

interface EcoTip {
  id: string;
  title: string;
  description: string;
  category: 'transportation' | 'food' | 'energy' | 'waste';
  impact: number;
  completed?: boolean;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: keyof CarbonData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any; // Replace with proper icon type from your assets
  potentialSavings: number;
}

interface Props {
  carbonData: CarbonData;
  onTipPress?: (tip: Tip) => void;
}

const EcoTips: React.FC<Props> = ({ carbonData, onTipPress }) => {
  const { theme } = useTheme();
  const [_tips, setTips] = useState<EcoTip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const unsubscribe = firestore()
      .collection('eco_tips')
      .where('active', '==', true)
      .onSnapshot(async snapshot => {
        // Get user's completed tips
        const userTipsDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('completed_tips')
          .get();

        const completedTipIds = new Set(userTipsDoc.docs.map(doc => doc.id));

        const fetchedTips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          completed: completedTipIds.has(doc.id),
        })) as EcoTip[];

        setTips(fetchedTips);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const _handleTipCompletion = async (tip: EcoTip) => {
    const user = auth().currentUser;
    if (!user) return;

    const tipRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('completed_tips')
      .doc(tip.id);

    try {
      if (!tip.completed) {
        await tipRef.set({
          completedAt: firestore.FieldValue.serverTimestamp(),
          impact: tip.impact,
        });
      } else {
        await tipRef.delete();
      }

      setTips(currentTips =>
        currentTips.map(t =>
          t.id === tip.id ? { ...t, completed: !t.completed } : t,
        ),
      );
    } catch (error) {
      console.error('Error updating tip completion:', error);
    }
  };

  const _getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transportation':
        return 'car';
      case 'food':
        return 'restaurant';
      case 'energy':
        return 'flash';
      case 'waste':
        return 'trash';
      default:
        return 'help-circle';
    }
  };

  const personalizedTips: Tip[] = useMemo(() => {
    const allTips: Tip[] = [
      // Transport tips
      {
        id: 't1',
        title: 'Switch to Public Transport',
        description:
          'Using public transportation can reduce your carbon emissions by up to 50% compared to driving alone.',
        impact: 'high',
        category: 'transport',
        icon: require('@assets/icons/bus.png'),
        potentialSavings: 2.5,
      },
      {
        id: 't2',
        title: 'Consider Electric Vehicles',
        description:
          'Electric vehicles produce zero direct emissions and can significantly reduce your carbon footprint.',
        impact: 'high',
        category: 'transport',
        icon: require('@assets/icons/electric-car.png'),
        potentialSavings: 3.0,
      },
      // Energy tips
      {
        id: 'e1',
        title: 'Switch to LED Bulbs',
        description:
          'LED bulbs use up to 90% less energy than traditional bulbs and last much longer.',
        impact: 'medium',
        category: 'energy',
        icon: require('@assets/icons/lightbulb.png'),
        potentialSavings: 0.3,
      },
      {
        id: 'e2',
        title: 'Install Solar Panels',
        description:
          'Solar panels can significantly reduce your reliance on grid electricity and lower emissions.',
        impact: 'high',
        category: 'energy',
        icon: require('@assets/icons/solar-panel.png'),
        potentialSavings: 4.0,
      },
      // Food tips
      {
        id: 'f1',
        title: 'Reduce Meat Consumption',
        description:
          'Having one meat-free day per week can reduce your food carbon footprint significantly.',
        impact: 'high',
        category: 'food',
        icon: require('@assets/icons/vegetable.png'),
        potentialSavings: 0.8,
      },
      {
        id: 'f2',
        title: 'Buy Local Produce',
        description:
          'Local food requires less transportation and often uses fewer preservatives.',
        impact: 'medium',
        category: 'food',
        icon: require('@assets/icons/local-market.png'),
        potentialSavings: 0.4,
      },
      // Waste tips
      {
        id: 'w1',
        title: 'Start Composting',
        description:
          'Composting organic waste reduces methane emissions from landfills.',
        impact: 'medium',
        category: 'waste',
        icon: require('@assets/icons/compost.png'),
        potentialSavings: 0.5,
      },
      {
        id: 'w2',
        title: 'Improve Recycling',
        description:
          'Proper recycling can reduce waste-related emissions by up to 30%.',
        impact: 'medium',
        category: 'waste',
        icon: require('@assets/icons/recycle.png'),
        potentialSavings: 0.6,
      },
    ];

    // Sort tips based on potential impact and user's carbon data
    return allTips
      .sort((a, b) => {
        const aCategoryImpact = carbonData[a.category];
        const bCategoryImpact = carbonData[b.category];
        if (aCategoryImpact === bCategoryImpact) {
          return b.potentialSavings - a.potentialSavings;
        }
        return bCategoryImpact - aCategoryImpact;
      })
      .slice(0, 5); // Show top 5 most relevant tips
  }, [carbonData]);

  const getImpactColor = (impact: Tip['impact']): string => {
    switch (impact) {
      case 'high':
        return theme.colors.success;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.error;
      default:
        return theme.colors.text.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size='large' color='#2ecc71' />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Personalized Eco Tips
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {personalizedTips.map(tip => (
          <TouchableOpacity
            key={tip.id}
            style={[
              styles.tipCard,
              { backgroundColor: theme.colors.background },
            ]}
            onPress={() => onTipPress?.(tip)}
          >
            <Image source={tip.icon} style={styles.icon} />
            <View style={styles.tipContent}>
              <Text
                style={[styles.tipTitle, { color: theme.colors.text.primary }]}
              >
                {tip.title}
              </Text>
              <Text
                style={[
                  styles.tipDescription,
                  { color: theme.colors.text.secondary },
                ]}
                numberOfLines={2}
              >
                {tip.description}
              </Text>
              <View style={styles.impactContainer}>
                <Text
                  style={[
                    styles.impactLabel,
                    { color: theme.colors.text.secondary },
                  ]}
                >
                  Impact:
                </Text>
                <Text
                  style={[
                    styles.impactValue,
                    { color: getImpactColor(tip.impact) },
                  ]}
                >
                  {tip.impact.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.savings, { color: theme.colors.success }]}>
                Potential savings: {tip.potentialSavings.toFixed(1)}t CO₂e/year
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 16,
  },
  tipCard: {
    width: 280,
    borderRadius: 12,
    marginRight: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  impactLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  impactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  savings: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default React.memo(EcoTips);
