import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useNavigation } from '@react-navigation/native';
import {
  CaretLeft,
  Buildings,
  GlobeHemisphereWest,
  UsersThree,
  Trophy,
  TrendUp,
} from 'phosphor-react-native';
import { useCorporate, useSDG } from '../../hooks/useFirebaseData';

const MOCK_COMPANIES = [
  { name: 'GOOGLE', domain: 'google.com', points: 154200, employees: 4200 },
  { name: 'MICROSOFT', domain: 'microsoft.com', points: 148900, employees: 3950 },
  { name: 'APPLE', domain: 'apple.com', points: 135000, employees: 3100 },
  { name: 'PATAGONIA', domain: 'patagonia.com', points: 89000, employees: 850 },
  { name: 'AMAZON', domain: 'amazon.com', points: 76000, employees: 9200 },
];

export default function CorporateLeaderboardScreen() {
  const navigation = useNavigation();
  const corporate = useCorporate();
  const sdg = useSDG();

  // Calculate total points for user (mocked based on ESG score)
  const userTotalPoints = Math.floor((sdg?.esg?.total ?? 0) * 150) || 150;

  // Insert or update the user's linked company into the mock list
  let companies = [...MOCK_COMPANIES];
  if (corporate?.isLinked && corporate?.linkedCompany) {
    const existingIndex = companies.findIndex(c => c.name === corporate?.linkedCompany);
    if (existingIndex >= 0) {
      companies[existingIndex].points += userTotalPoints;
    } else {
      companies.push({
        name: corporate?.linkedCompany ?? 'Unknown',
        domain: corporate?.companyDomain ?? '',
        points: userTotalPoints * 150, // Mock aggregate base
        employees: 42, // Mock base
      });
    }
  }

  // Sort by points descending
  companies.sort((a, b) => b.points - a.points);

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <SpaceBackground earthPosition='bottom-right' enableComets>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <CaretLeft size={24} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Global ESG Leaderboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User's Corporate Contribution Card */}
        {corporate?.isLinked && (
          <GlassCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIconWrapper}>
                <Buildings size={32} color='#38EF7D' weight='duotone' />
              </View>
              <View style={styles.heroTitles}>
                <Text style={styles.heroLabel}>Your Employer</Text>
                <Text style={styles.heroCompany}>{corporate?.linkedCompany}</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <Text style={styles.statValue}>
                  {companies
                    .find(c => c.name === corporate?.linkedCompany)
                    ?.points.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total ESG Score</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={[styles.statValue, { color: '#38EF7D' }]}>+{userTotalPoints}</Text>
                <Text style={styles.statLabel}>Your Contribution</Text>
              </View>
            </View>
          </GlassCard>
        )}

        <View style={styles.sectionHeader}>
          <Trophy size={24} color='#F2C94C' weight='fill' />
          <Text style={styles.sectionTitle}>Top Enterprises</Text>
        </View>

        {/* Leaderboard List */}
        <View style={styles.leaderboardContainer}>
          {companies.map((company, index) => {
            const isUserCompany = corporate?.isLinked && company.name === corporate?.linkedCompany;
            return (
              <GlassCard
                key={company.name}
                style={[styles.rankCard, isUserCompany && styles.rankCardHighlighted]}
              >
                <View style={styles.rankLeft}>
                  <View style={styles.rankNumberContainer}>
                    <Text style={styles.rankNumberText}>{getRankMedal(index)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.companyName, isUserCompany && { color: '#38EF7D' }]}>
                      {company.name}
                    </Text>
                    <View style={styles.companyMeta}>
                      <UsersThree size={14} color='rgba(255,255,255,0.5)' />
                      <Text style={styles.metaText}>
                        {company.employees.toLocaleString()} employees
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rankRight}>
                  <Text style={styles.pointsText}>{company.points.toLocaleString()}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </GlassCard>
            );
          })}
        </View>
      </ScrollView>
    </SpaceBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
    backgroundColor: 'rgba(56,239,125,0.05)',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(56,239,125,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitles: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroCompany: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  leaderboardContainer: {
    gap: 12,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  rankCardHighlighted: {
    backgroundColor: 'rgba(56,239,125,0.1)',
    borderColor: 'rgba(56,239,125,0.3)',
    borderWidth: 1,
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rankNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  rankRight: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  pointsLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
});
