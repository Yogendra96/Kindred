import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        overflow: 'hidden',
      },
    ]}
  >
    {children}
  </View>
);
import { MotiView } from 'moti';
import {
  Leaf,
  Car,
  ForkKnife,
  Lightbulb,
  Trash,
  Camera,
  ShieldCheck,
  Cpu,
  ChartBar,
  GraduationCap,
  Tree,
} from 'phosphor-react-native';

import type { RootState } from '../../store';
import { updateFootprint } from '../../store/slices/carbonSlice';
import { useClimateNotifications } from '../../hooks/useClimateNotifications';
import { spatialColors, animations } from '../../theme/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const carbon = useSelector((state: RootState) => state.carbon);
  const footprint = carbon?.footprint || {
    total: 0,
    transportation: 0,
    food: 0,
    energy: 0,
    waste: 0,
  };
  const error = carbon?.error || null;
  const user = useSelector((state: RootState) => state.user);
  const profile = user?.profile || {
    id: '',
    name: '',
    email: '',
    avatar: null,
    bio: null,
  };

  const handleAddActivity = (type: string, amount: number) => {
    dispatch(
      updateFootprint({
        [type]: footprint[type as keyof typeof footprint] + amount,
      }),
    );
  };

  useClimateNotifications({ lat: 40.7128, lng: -74.006 });

  const getCarbonStatusColor = () => {
    if (footprint.total < 10) return ['#38EF7D', '#11998E']; // Good
    if (footprint.total < 20) return ['#F2C94C', '#F2994A']; // Medium
    return ['#FF416C', '#FF4B2B']; // High
  };

  return (
    <View style={styles.container}>
      {/* Animated Gradient Background */}
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0f2027' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#203a43' stopOpacity='1' />
            <Stop offset='1' stopColor='#2c5364' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={animations.spring.gentle}
          style={styles.header}
        >
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Welcome back{profile.name ? `, ${profile.name}` : ''}</Text>
        </MotiView>

        {/* Footprint Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...animations.spring.bouncy, delay: 100 }}
        >
          <GlassCard style={styles.glassCard}>
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Daily Carbon Footprint</Text>
              <Text style={styles.totalFootprint}>
                {footprint.total.toFixed(1)} <Text style={styles.unit}>kg CO₂</Text>
              </Text>
              <View style={styles.statusBadge}>
                <Leaf size={14} color='#fff' weight='fill' style={{ marginRight: 4 }} />
                <Text style={styles.statusText}>On Track</Text>
              </View>
            </View>
          </GlassCard>
        </MotiView>

        {/* Quick Add Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 200 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Log Activity</Text>
          <View style={styles.actionGrid}>
            {[
              {
                icon: Car,
                label: 'Drive',
                value: 2.5,
                type: 'transportation',
                color: '#FF9A9E',
              },
              {
                icon: ForkKnife,
                label: 'Meat',
                value: 1.2,
                type: 'food',
                color: '#FECFEF',
              },
              {
                icon: Lightbulb,
                label: 'Energy',
                value: 3.1,
                type: 'energy',
                color: '#A18CD1',
              },
              {
                icon: Trash,
                label: 'Waste',
                value: 0.8,
                type: 'waste',
                color: '#84FAB0',
              },
            ].map((item, index) => (
              <MotiView
                key={item.label}
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  ...animations.spring.bouncy,
                  delay: 300 + index * 50,
                }}
              >
                <Pressable onPress={() => handleAddActivity(item.type, item.value)}>
                  {({ pressed }) => (
                    <MotiView
                      animate={{ scale: pressed ? 0.95 : 1 }}
                      transition={animations.timing.quick}
                    >
                      <GlassCard style={styles.actionButton}>
                        <View
                          style={[styles.iconContainer, { backgroundColor: item.color + '30' }]}
                        >
                          <item.icon size={24} color={item.color} weight='duotone' />
                        </View>
                        <Text style={styles.actionLabel}>{item.label}</Text>
                        <Text style={styles.actionValue}>+{item.value}</Text>
                      </GlassCard>
                    </MotiView>
                  )}
                </Pressable>
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Features Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...animations.spring.gentle, delay: 400 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Masterpiece Features</Text>
          <View style={styles.featureList}>
            {[
              { icon: Cpu, label: 'Carbon Twin', route: 'CarbonTwin' },
              { icon: Camera, label: 'AI Vision', route: 'VisionCamera' },
              { icon: ShieldCheck, label: 'Verify', route: 'Verification' },
              { icon: ChartBar, label: 'Analytics', route: 'Analytics' },
              { icon: GraduationCap, label: 'Learn', route: 'LearningCenter' },
              { icon: Tree, label: 'Offset', route: 'Offset' },
            ].map((feat, index) => (
              <Pressable key={feat.label} onPress={() => navigation.navigate(feat.route)}>
                {({ pressed }) => (
                  <MotiView
                    animate={{ scale: pressed ? 0.98 : 1 }}
                    transition={animations.timing.quick}
                  >
                    <GlassCard style={styles.featureRow}>
                      <View style={styles.featureIconWrap}>
                        <feat.icon size={24} color='#fff' weight='duotone' />
                      </View>
                      <Text style={styles.featureRowText}>{feat.label}</Text>
                    </GlassCard>
                  </MotiView>
                )}
              </Pressable>
            ))}
          </View>
        </MotiView>

        {error && (
          <GlassCard style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </GlassCard>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: spatialColors.glassBorderDark,
    marginBottom: 32,
  },
  cardInner: {
    padding: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalFootprint: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
    marginBottom: 16,
  },
  unit: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    width: '100%',
    minWidth: '47%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  actionValue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    fontWeight: '500',
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: spatialColors.glassBorderDark,
    overflow: 'hidden',
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureRowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    overflow: 'hidden',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default HomeScreen;
