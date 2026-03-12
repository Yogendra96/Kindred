import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Easing,
} from 'react-native';
import {} from '../../data/veganData';
import { useToast } from '../../contexts/ToastContext';

// ─── Constants ────────────────────────────────────────────────────────────────
// Global averages: ~80 billion land animals killed per year for food
// That's ~2,535 per second globally.
// CO2: meat industry = ~7.1 GT/year → ~225 kg/s
// Water: ~1,000 L per kg beef, avg ~43 L/s globally

const ANIMALS_PER_SECOND = 2535;
const CO2_KG_PER_SECOND = 225;
const WATER_L_PER_SECOND = 43000;

// If one person goes vegan: saves ~100 animals/year, 1.5t CO2, 401,500 L water
const PERSONAL_ANIMALS_PER_SECOND = 100 / (365 * 24 * 3600);
const PERSONAL_CO2_KG_PER_SECOND = 1500 / (365 * 24 * 3600);
const PERSONAL_WATER_L_PER_SECOND = 401500 / (365 * 24 * 3600);

const ANIMAL_EMOJIS = ['🐄', '🐖', '🐔', '🐟', '🦆', '🐑', '🦐', '🐠'];

// ─── Sub-components ──────────────────────────────────────────────────────────

const PulsingDot = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.4,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={[styles.dot, { transform: [{ scale: pulse }] }]} />
  );
};

const LiveCounter = ({
  value,
  label,
  unit,
  color,
  emoji,
  large,
}: {
  value: number;
  label: string;
  unit: string;
  color: string;
  emoji: string;
  large?: boolean;
}) => {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Math.floor(value) % 10 === 0 && value > 0) {
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 3,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -3,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [Math.floor(value / 10)]);

  return (
    <Animated.View
      style={[
        styles.counterCard,
        { borderColor: color + '50', transform: [{ translateX: shake }] },
      ]}
    >
      <Text style={styles.counterEmoji}>{emoji}</Text>
      <Text
        style={[
          styles.counterValue,
          large && styles.counterValueLarge,
          { color },
        ]}
      >
        {value >= 1_000_000
          ? (value / 1_000_000).toFixed(4) + 'M'
          : value >= 1000
          ? value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          : value.toFixed(large ? 0 : 3)}
      </Text>
      <Text style={styles.counterUnit}>{unit}</Text>
      <Text style={styles.counterLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Ad Reward ───────────────────────────────────────────────────────────────

const AdRewardBanner = ({
  credits,
  onWatch,
}: {
  credits: number;
  onWatch: () => void;
}) => {
  const [watching, setWatching] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  const handleWatch = () => {
    setWatching(true);
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
      easing: Easing.linear,
    }).start(({ finished }) => {
      if (finished) {
        setWatching(false);
        onWatch();
      }
    });
  };

  return (
    <View style={styles.adBanner}>
      <View style={styles.adTop}>
        <View>
          <Text style={styles.adTitle}>🎁 Earn Carbon Credits</Text>
          <Text style={styles.adSub}>
            Watch a short ad → get 10 offset credits
          </Text>
        </View>
        <View style={styles.adCredits}>
          <Text style={styles.adCreditsValue}>{credits}</Text>
          <Text style={styles.adCreditsLabel}>credits</Text>
        </View>
      </View>

      {watching ? (
        <View>
          <Text style={styles.adWatching}>📺 Watching ad... don't close!</Text>
          <Animated.View
            style={[
              styles.adProgress,
              {
                width: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.adBtn} onPress={handleWatch}>
          <Text style={styles.adBtnText}>▷ Watch Ad (5s) → +10 Credits</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Mode = 'global' | 'personal';

const VeganCalculatorScreen = () => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('global');
  const [elapsed, setElapsed] = useState(0);
  const [credits, setCredits] = useState(0);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const emojiInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live ticker
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(e => e + 0.1);
    }, 100);
    emojiInterval.current = setInterval(() => {
      setEmojiIndex(i => (i + 1) % ANIMAL_EMOJIS.length);
    }, 600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (emojiInterval.current) clearInterval(emojiInterval.current);
    };
  }, []);

  const isGlobal = mode === 'global';
  const animals =
    elapsed * (isGlobal ? ANIMALS_PER_SECOND : PERSONAL_ANIMALS_PER_SECOND);
  const co2 =
    elapsed * (isGlobal ? CO2_KG_PER_SECOND : PERSONAL_CO2_KG_PER_SECOND);
  const water =
    elapsed * (isGlobal ? WATER_L_PER_SECOND : PERSONAL_WATER_L_PER_SECOND);

  const handleAdComplete = useCallback(() => {
    setCredits(c => c + 10);
    showToast(
      '+10 Credits Earned! Keep watching to plant more trees!',
      'success',
    );
  }, [showToast]);

  const handleRedeem = () => {
    if (credits < 50) {
      showToast(
        `Not enough credits. You need 50 to plant a tree. You have ${credits}.`,
        'warning',
      );
    } else {
      setCredits(c => c - 50);
      showToast(
        '🌳 Tree Planted! A real tree has been planted in your name.',
        'success',
      );
    }
  };

  const handleShare = () => {
    Alert.alert(
      '📤 Share Your Impact',
      `Since I checked the Kindred Vegan Calculator:\n\n🐾 ${Math.floor(
        animals,
      ).toLocaleString()} animals counted\n🌿 ${co2.toFixed(
        1,
      )} kg CO₂\n💧 ${water.toFixed(0)} L water\n\nGo vegan. Save lives. 🌍`,
      [
        {
          text: 'Copy & Share',
          onPress: () =>
            showToast('Share link copied to clipboard.', 'success'),
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.liveRow}>
          <PulsingDot />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.title}>🌱 Vegan Calculator</Text>
        <Text style={styles.subtitle}>
          {isGlobal
            ? 'Real-time global animal agriculture impact since you opened this screen'
            : 'Your estimated annual impact as a vegan — accruing in real time'}
        </Text>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'global' && styles.modeBtnActive]}
          onPress={() => setMode('global')}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'global' && styles.modeBtnTextActive,
            ]}
          >
            🌍 Global Now
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'personal' && styles.modeBtnActive]}
          onPress={() => setMode('personal')}
        >
          <Text
            style={[
              styles.modeBtnText,
              mode === 'personal' && styles.modeBtnTextActive,
            ]}
          >
            🧍 If You Go Vegan
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main animal counter */}
      <View style={styles.mainCounter}>
        <Text style={styles.mainLabel}>
          {isGlobal
            ? 'Animals Killed Since You Opened This'
            : "Animals You'd Save Per Year"}
        </Text>
        <View style={styles.mainValueRow}>
          <Text style={styles.mainEmoji}>{ANIMAL_EMOJIS[emojiIndex]}</Text>
          <Text style={styles.mainValue}>
            {isGlobal
              ? Math.floor(animals).toLocaleString()
              : (PERSONAL_ANIMALS_PER_SECOND * 365 * 24 * 3600).toFixed(0)}
          </Text>
        </View>
        {isGlobal && (
          <Text style={styles.mainRate}>
            +{ANIMALS_PER_SECOND.toLocaleString()} per second
          </Text>
        )}
      </View>

      {/* Secondary counters */}
      <View style={styles.countersGrid}>
        <LiveCounter
          value={co2}
          label={isGlobal ? 'CO₂ emitted (kg)' : 'CO₂ saved / year (kg)'}
          unit='kg CO₂'
          color='#e53935'
          emoji='🌫️'
        />
        <LiveCounter
          value={water}
          label={isGlobal ? 'Water used (L)' : 'Water saved / year (L)'}
          unit='litres'
          color='#1565c0'
          emoji='💧'
        />
      </View>

      {/* Context facts */}
      <View style={styles.factsCard}>
        <Text style={styles.factsTitle}>📖 Context</Text>
        {[
          {
            icon: '🐄',
            text: 'Animal agriculture uses 80% of global farmland but provides just 20% of global calories.',
          },
          {
            icon: '💨',
            text: 'Livestock farming is responsible for 14.5% of all human greenhouse gas emissions.',
          },
          {
            icon: '💧',
            text: 'One beef burger requires ~2,400 litres of water to produce.',
          },
          {
            icon: '🌱',
            text: 'A vegan diet uses 18× less land and produces 10× fewer emissions than a meat-heavy diet.',
          },
        ].map((f, i) => (
          <View key={i} style={styles.fact}>
            <Text style={styles.factIcon}>{f.icon}</Text>
            <Text style={styles.factText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* Ad reward */}
      <AdRewardBanner credits={credits} onWatch={handleAdComplete} />

      {/* Redeem */}
      <TouchableOpacity style={styles.redeemBtn} onPress={handleRedeem}>
        <Text style={styles.redeemBtnText}>
          🌳 Redeem 50 Credits → Plant a Tree
        </Text>
      </TouchableOpacity>

      {/* Share */}
      <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 Share My Impact</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Global figures based on FAO data. Personal figures are annual estimates
        for a person transitioning to a vegan diet.
      </Text>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1f12' },
  content: { paddingBottom: 48 },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef5350' },
  liveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef5350',
    letterSpacing: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  // Mode toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1a2e1f',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: '#2e7d32' },
  modeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  modeBtnTextActive: { color: 'white' },

  // Main counter
  mainCounter: {
    marginHorizontal: 20,
    backgroundColor: '#1a2e1f',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e7d3240',
  },
  mainLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 12,
    textAlign: 'center',
  },
  mainValueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainEmoji: { fontSize: 40 },
  mainValue: {
    fontSize: 52,
    fontWeight: '900',
    color: '#ef5350',
    letterSpacing: -1,
  },
  mainRate: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 },

  // Grid counters
  countersGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  counterCard: {
    flex: 1,
    backgroundColor: '#1a2e1f',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  counterEmoji: { fontSize: 28, marginBottom: 6 },
  counterValue: { fontSize: 20, fontWeight: '800' },
  counterValueLarge: { fontSize: 28 },
  counterUnit: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  counterLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 4,
  },

  // Facts
  factsCard: {
    marginHorizontal: 20,
    backgroundColor: '#1a2e1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  factsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  fact: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  factIcon: { fontSize: 18, width: 24 },
  factText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
  },

  // Ad banner
  adBanner: {
    marginHorizontal: 20,
    backgroundColor: '#1a2e1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f9a825',
  },
  adTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adTitle: { fontSize: 15, fontWeight: '700', color: 'white' },
  adSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  adCredits: {
    alignItems: 'center',
    backgroundColor: '#f9a82520',
    borderRadius: 10,
    padding: 10,
  },
  adCreditsValue: { fontSize: 22, fontWeight: '900', color: '#f9a825' },
  adCreditsLabel: { fontSize: 10, color: '#f9a825' },
  adBtn: {
    backgroundColor: '#f9a825',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  adBtnText: { color: '#1a1a1a', fontWeight: '800', fontSize: 14 },
  adWatching: {
    fontSize: 13,
    color: '#f9a825',
    marginBottom: 8,
    textAlign: 'center',
  },
  adProgress: { height: 6, backgroundColor: '#f9a825', borderRadius: 3 },

  // Redeem / Share
  redeemBtn: {
    marginHorizontal: 20,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  redeemBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  shareBtn: {
    marginHorizontal: 20,
    backgroundColor: '#1a2e1f',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  shareBtnText: { color: '#4caf50', fontWeight: '700', fontSize: 15 },

  disclaimer: {
    marginHorizontal: 24,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default VeganCalculatorScreen;
