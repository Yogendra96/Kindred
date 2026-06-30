import React from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { ShieldCheck, Trophy, CheckSquare } from 'phosphor-react-native';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

const VerificationCenterScreen = () => {
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
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <ShieldCheck size={32} color='#38EF7D' weight='duotone' />
          </View>
          <Text style={styles.title}>Verification Center</Text>
          <Text style={styles.subtitle}>Decentralized Trust Network</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.info}>
            Your carbon data is verified by a network of peers and experts to ensure accuracy and
            prevent greenwashing.
          </Text>

          {/* Reputation Score Card */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Trophy size={22} color='#38EF7D' weight='duotone' />
              <Text style={styles.cardTitle}>Your Reputation Score</Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.score}>850</Text>
              <Text style={styles.scoreMax}>/ 1000</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Excellent Validator</Text>
            </View>
          </GlassCard>

          {/* Pending Validations Card */}
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <CheckSquare size={22} color='#38EF7D' weight='duotone' />
              <Text style={styles.cardTitle}>Pending Validations</Text>
            </View>
            <Text style={styles.empty}>No items need your review today.</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  info: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  score: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#38EF7D',
  },
  scoreMax: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 239, 125, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#38EF7D',
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 18,
  },
});

export default VerificationCenterScreen;
