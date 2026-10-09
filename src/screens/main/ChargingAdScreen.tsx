/**
 * ChargingAdScreen.tsx
 * Voluntary eco-charging screen that shows programmatic ads and rotating
 * eco-trivia/SDG facts to generate micro-donations for UN SDG causes.
 * Triggered by user opt-in when device is charging.
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { X, Play } from 'phosphor-react-native';

const { width } = Dimensions.get('window');

// ─── Eco Trivia Data ──────────────────────────────────────────────────────────

const ECO_TRIVIA = [
  {
    type: 'fact',
    emoji: '🥦',
    label: 'Random Fact',
    text: 'Going vegan for one year saves ~1.5 tonnes of CO₂ — equivalent to a flight from London to New York.',
  },
  {
    type: 'sdg',
    emoji: '🌡️',
    label: 'SDG 13 · Climate Action',
    text: 'Global temperatures have risen 1.1°C since pre-industrial times. Every fraction of a degree matters.',
  },
  {
    type: 'game_theory',
    emoji: '🧮',
    label: 'Game Theory',
    text: 'If every person in your city avoided meat once a week, the combined impact would equal removing 500,000 cars from the road.',
  },
  {
    type: 'nudge',
    emoji: '📱',
    label: 'Behavioral Insight',
    text: 'People who log just 3 eco-actions per week reduce their carbon footprint 18% faster than those who track monthly.',
  },
  {
    type: 'sdg',
    emoji: '🌊',
    label: 'SDG 14 · Life Below Water',
    text: '8 million tonnes of plastic enter the ocean every year. Choosing secondhand goods keeps plastic out of landfills.',
  },
  {
    type: 'fact',
    emoji: '⚡',
    label: 'Energy Fact',
    text: 'Switching to LED bulbs and smart plugs can cut your home energy bill by up to 30% — and reduces demand on the grid.',
  },
  {
    type: 'game_theory',
    emoji: '🤝',
    label: 'Collective Action',
    text: 'When 10% of a community adopts an eco-habit, the social norm shifts. You could be that tipping-point person.',
  },
  {
    type: 'sdg',
    emoji: '🏙️',
    label: 'SDG 11 · Sustainable Cities',
    text: 'Walking or cycling instead of driving just 3 times a week can save over 200 kg of CO₂ per year.',
  },
  {
    type: 'fact',
    emoji: '🌿',
    label: 'Veganism',
    text: 'A plant-based diet requires 18x less land, 13x less water, and produces 10x fewer greenhouse gases than a meat-heavy diet.',
  },
  {
    type: 'nudge',
    emoji: '♻️',
    label: 'Minimalism',
    text: "Buying one less item of fast fashion per month reduces your water footprint by ~2,700 litres — that's 3 years of drinking water.",
  },
];

// ─── SDG Cause Options ────────────────────────────────────────────────────────

const SDG_CAUSES = [
  { id: 7, label: 'SDG 7 · Clean Energy', emoji: '⚡' },
  { id: 11, label: 'SDG 11 · Sustainable Cities', emoji: '🏙️' },
  { id: 12, label: 'SDG 12 · Responsible Consumption', emoji: '♻️' },
  { id: 13, label: 'SDG 13 · Climate Action', emoji: '🌡️' },
  { id: 15, label: 'SDG 15 · Life on Land', emoji: '🌿' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const ChargingAdScreen: React.FC = () => {
  const navigation = useNavigation();
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [selectedCause, setSelectedCause] = useState(SDG_CAUSES[3]); // Default: Climate Action
  const [donationCents, setDonationCents] = useState(0);
  const [adPlaying, setAdPlaying] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const coinAnim = useRef(new Animated.Value(0)).current;

  const trivia = ECO_TRIVIA[triviaIndex];

  // Pulse glow animation on background
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 2800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Auto-rotate trivia every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => {
        setTriviaIndex(i => (i + 1) % ECO_TRIVIA.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Simulate an ad play — adds micro-donation
  const handlePlayAd = () => {
    if (adPlaying) return;
    setAdPlaying(true);

    // Simulate a 5-second ad, then credit donation
    setTimeout(() => {
      // 2 cents generated. 1 to cause, 1 to user's wallet
      setDonationCents(c => c + 1);
      // dispatch(addEarnings({ amountCents: 1, description: `Watched ad for ${selectedCause.label}` }));

      Animated.sequence([
        Animated.timing(coinAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(coinAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      setAdPlaying(false);
    }, 5000);
  };

  const triviaColors: Record<string, string> = {
    fact: '#38EF7D',
    sdg: '#2B86FA',
    game_theory: '#F2C94C',
    nudge: '#FF6B6B',
  };

  return (
    <SpaceBackground earthPosition='center-left' enableComets={true} cometStyle='tapered'>
      {/* Dismiss button */}
      <TouchableOpacity
        style={styles.dismissBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <X size={22} color='rgba(255,255,255,0.7)' weight='bold' />
      </TouchableOpacity>

      {/* Pulsing planet glow blob */}
      <Animated.View style={[styles.glowBlob, { transform: [{ scale: pulseAnim }] }]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* SDG Cause selector */}
        <GlassCard style={styles.causeCard}>
          <Text style={styles.causeTitle}>🌍 Currently earning for</Text>
          <View style={styles.causeRow}>
            {SDG_CAUSES.map(cause => (
              <TouchableOpacity
                key={cause.id}
                style={[styles.causeChip, selectedCause.id === cause.id && styles.causeChipActive]}
                onPress={() => setSelectedCause(cause)}
                activeOpacity={0.8}
              >
                <Text style={styles.causeChipEmoji}>{cause.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.causeSelected}>{selectedCause.label}</Text>
        </GlassCard>

        {/* Donation counter */}
        <GlassCard style={styles.donationCard}>
          <Text style={styles.donationLabel}>Donated so far</Text>
          <Animated.Text
            style={[
              styles.donationAmount,
              {
                transform: [
                  {
                    scale: coinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.25],
                    }),
                  },
                ],
              },
            ]}
          >
            ${(donationCents / 100).toFixed(2)}
          </Animated.Text>
          <Text style={styles.donationSub}>→ {selectedCause.label}</Text>
        </GlassCard>

        {/* Rotating Eco-Trivia Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <GlassCard style={styles.triviaCard}>
            <View style={styles.triviaLabelRow}>
              <View
                style={[
                  styles.triviaLabelDot,
                  { backgroundColor: triviaColors[trivia.type] ?? '#38EF7D' },
                ]}
              />
              <Text style={[styles.triviaLabel, { color: triviaColors[trivia.type] ?? '#38EF7D' }]}>
                {trivia.label}
              </Text>
            </View>
            <Text style={styles.triviaEmoji}>{trivia.emoji}</Text>
            <Text style={styles.triviaText}>{trivia.text}</Text>
          </GlassCard>
        </Animated.View>

        {/* Play Ad Button */}
        <TouchableOpacity
          style={[styles.playBtn, adPlaying && styles.playBtnLoading]}
          onPress={handlePlayAd}
          activeOpacity={0.85}
          disabled={adPlaying}
        >
          <Play size={18} color={adPlaying ? 'rgba(255,255,255,0.5)' : '#0A0A0C'} weight='fill' />
          <Text style={[styles.playBtnText, adPlaying && styles.playBtnTextLoading]}>
            {adPlaying ? 'Ad playing... (+$0.02 after)' : 'Play Ad to Donate'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.voluntaryNote}>
          Watching ads is completely optional. You can exit anytime.
        </Text>
      </View>
    </SpaceBackground>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dismissBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  glowBlob: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(56,239,125,0.04)',
    alignSelf: 'center',
    top: '15%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'center',
    gap: 14,
  },
  causeCard: {
    padding: 16,
    alignItems: 'center',
  },
  causeTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  causeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  causeChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  causeChipActive: {
    backgroundColor: 'rgba(56,239,125,0.2)',
    borderColor: '#38EF7D',
  },
  causeChipEmoji: { fontSize: 20 },
  causeSelected: {
    fontSize: 12,
    color: '#38EF7D',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  donationCard: {
    padding: 20,
    alignItems: 'center',
  },
  donationLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  donationAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#38EF7D',
    letterSpacing: -1,
  },
  donationSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  triviaCard: {
    padding: 18,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  triviaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  triviaLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  triviaLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  triviaEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  triviaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 20,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#38EF7D',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
    width: width - 40,
    alignSelf: 'center',
  },
  playBtnLoading: {
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
    shadowOpacity: 0,
    elevation: 0,
  },
  playBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0A0C',
  },
  playBtnTextLoading: {
    color: 'rgba(255,255,255,0.5)',
  },
  voluntaryNote: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

export default ChargingAdScreen;
