import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { ShieldCheck, Trophy, CheckSquare } from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { SubScreenHeader } from '../../components/common/SubScreenHeader';

const VerificationCenterScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <SpaceBackground earthPosition='bottom-left' enableComets={true}>
      <SubScreenHeader title='Verification Center' subtitle='Decentralized Trust Network' />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#FFFFFF'
            colors={['#38EF7D']}
          />
        }
      >
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
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
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
});

export default VerificationCenterScreen;
