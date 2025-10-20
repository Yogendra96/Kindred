import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { mockData } from '../../data/mockData';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'activities' | 'insights'
  >('overview');
  const {
    user,
    footprint,
    activities,
    weeklyData,
    achievements,
    recommendations,
    insights,
    challenges,
  } = mockData;

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.userInfo}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.userText}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>
        <View style={styles.streakBadge}>
          <Icon name='flame' size={20} color='#FF6B6B' />
          <Text style={styles.streakText}>{user.stats.streakDays} days</Text>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelLabel}>Level {user.stats.level}</Text>
          <Text style={styles.rankText}>{user.stats.rank} Rank</Text>
        </View>
        <View style={styles.pointsInfo}>
          <Icon name='trophy' size={24} color='#FFD700' />
          <Text style={styles.pointsText}>
            {user.stats.points.toLocaleString()} pts
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFootprintCard = () => (
    <View style={styles.footprintCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Today's Carbon Footprint</Text>
          <Text style={styles.cardSubtitle}>
            Track your environmental impact
          </Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <Icon name='information-circle-outline' size={24} color='#007AFF' />
        </TouchableOpacity>
      </View>

      <View style={styles.footprintMain}>
        <View style={styles.footprintValue}>
          <Text style={styles.footprintNumber}>
            {footprint.total.toFixed(1)}
          </Text>
          <Text style={styles.footprintUnit}>kg CO₂</Text>
        </View>

        <View style={styles.changeIndicator}>
          <Icon
            name={
              footprint.percentageChange < 0 ? 'trending-down' : 'trending-up'
            }
            size={20}
            color={footprint.percentageChange < 0 ? '#4CAF50' : '#FF5252'}
          />
          <Text
            style={[
              styles.changeText,
              { color: footprint.percentageChange < 0 ? '#4CAF50' : '#FF5252' },
            ]}
          >
            {Math.abs(footprint.percentageChange)}% vs yesterday
          </Text>
        </View>
      </View>

      <View style={styles.targetProgress}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetLabel}>
            Daily Target: {footprint.target}kg
          </Text>
          <Text style={styles.targetStatus}>
            {footprint.total > footprint.target ? 'Above' : 'Below'} target
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  (footprint.total / footprint.target) * 100,
                  100,
                )}%`,
                backgroundColor:
                  footprint.total > footprint.target ? '#FF5252' : '#4CAF50',
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.categoryGrid}>
        {[
          {
            icon: '🚗',
            label: 'Transport',
            value: footprint.transportation,
            color: '#FF6384',
          },
          {
            icon: '🍽️',
            label: 'Food',
            value: footprint.food,
            color: '#36A2EB',
          },
          {
            icon: '⚡',
            label: 'Energy',
            value: footprint.energy,
            color: '#FFCE56',
          },
          {
            icon: '♻️',
            label: 'Waste',
            value: footprint.waste,
            color: '#4BC0C0',
          },
        ].map((category, index) => (
          <View
            key={index}
            style={[styles.categoryItem, { borderLeftColor: category.color }]}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={styles.categoryLabel}>{category.label}</Text>
            <Text style={styles.categoryValue}>
              {category.value.toFixed(1)}kg
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderActivitiesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {activities.slice(0, 5).map(activity => (
        <View key={activity.id} style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityEmoji}>{activity.icon}</Text>
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{activity.description}</Text>
            <Text style={styles.activityCategory}>{activity.category}</Text>
            <Text style={styles.activityTime}>
              {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.activityStats}>
            <View style={styles.activityStat}>
              <Icon name='leaf-outline' size={16} color='#4CAF50' />
              <Text style={styles.activitySaved}>
                -{activity.saved.toFixed(1)}kg
              </Text>
            </View>
            <Text style={styles.activityEmissions}>
              {activity.emissions.toFixed(1)}kg CO₂
            </Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addActivityButton}>
        <Icon name='add-circle' size={24} color='#007AFF' />
        <Text style={styles.addActivityText}>Log New Activity</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Insights</Text>
      </View>

      {insights.map(insight => (
        <View
          key={insight.id}
          style={[
            styles.insightCard,
            {
              borderLeftColor:
                insight.priority === 'high' ? '#FF5252' : '#FFA726',
            },
          ]}
        >
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightMessage}>{insight.message}</Text>
          <Text style={styles.insightDate}>
            {new Date(insight.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      ))}

      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Personalized Recommendations</Text>
        {recommendations.slice(0, 3).map(rec => (
          <View key={rec.id} style={styles.recommendationCard}>
            <View style={styles.recHeader}>
              <Text style={styles.recIcon}>{rec.icon}</Text>
              <View style={styles.recContent}>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDescription}>{rec.description}</Text>
              </View>
            </View>
            <View style={styles.recFooter}>
              <View style={styles.recTag}>
                <Text style={styles.recTagText}>{rec.difficulty}</Text>
              </View>
              <Text style={styles.recSaving}>
                Save {rec.potentialSaving}kg/year
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWeeklyChart = () => {
    const maxValue = Math.max(...weeklyData.datasets[0].data);
    const normalizedData = weeklyData.datasets[0].data.map(
      val => (val / maxValue) * 100,
    );

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Progress</Text>
        <Text style={styles.chartSubtitle}>{weeklyData.legend[0]}</Text>

        <View style={styles.customChart}>
          <View style={styles.chartBars}>
            {weeklyData.labels.map((label, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${normalizedData[index]}%`,
                        backgroundColor:
                          weeklyData.datasets[0].data[index] > 8
                            ? '#FF5252'
                            : '#4CAF50',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{label}</Text>
                <Text style={styles.barValue}>
                  {weeklyData.datasets[0].data[index].toFixed(1)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderAchievements = () => (
    <View style={styles.achievementsSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.achievementsScroll}
      >
        {achievements.map(achievement => (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              { opacity: achievement.unlocked ? 1 : 0.6 },
            ]}
          >
            <Text style={styles.achievementIcon}>
              {achievement.title.split(' ')[0]}
            </Text>
            <Text style={styles.achievementTitle} numberOfLines={2}>
              {achievement.title.substring(2)}
            </Text>
            {achievement.unlocked ? (
              <View style={styles.unlockedBadge}>
                <Icon name='checkmark-circle' size={20} color='#4CAF50' />
              </View>
            ) : (
              <View style={styles.progressContainer}>
                <View style={styles.achievementProgress}>
                  <View
                    style={[
                      styles.achievementProgressFill,
                      { width: `${achievement.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{achievement.progress}%</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderChallenges = () => (
    <View style={styles.challengesSection}>
      <Text style={styles.sectionTitle}>Active Challenges</Text>
      {challenges.map(challenge => (
        <View key={challenge.id} style={styles.challengeCard}>
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeDescription}>
                {challenge.description}
              </Text>
            </View>
          </View>
          <View style={styles.challengeProgress}>
            <View style={styles.challengeProgressBar}>
              <View
                style={[
                  styles.challengeProgressFill,
                  { width: `${challenge.progress}%` },
                ]}
              />
            </View>
            <Text style={styles.challengeProgressText}>
              {challenge.progress}%
            </Text>
          </View>
          <View style={styles.challengeFooter}>
            <View style={styles.participantsInfo}>
              <Icon name='people' size={16} color='#666' />
              <Text style={styles.participantsText}>
                {challenge.participants.toLocaleString()} participants
              </Text>
            </View>
            <View style={styles.rewardInfo}>
              <Icon name='trophy' size={16} color='#FFD700' />
              <Text style={styles.rewardText}>+{challenge.reward} pts</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
        onPress={() => setSelectedTab('overview')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'overview' && styles.activeTabText,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'activities' && styles.activeTab]}
        onPress={() => setSelectedTab('activities')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'activities' && styles.activeTabText,
          ]}
        >
          Activities
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, selectedTab === 'insights' && styles.activeTab]}
        onPress={() => setSelectedTab('insights')}
      >
        <Text
          style={[
            styles.tabText,
            selectedTab === 'insights' && styles.activeTabText,
          ]}
        >
          Insights
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderFootprintCard()}
        {renderTabs()}

        {selectedTab === 'overview' && (
          <>
            {renderWeeklyChart()}
            {renderAchievements()}
            {renderChallenges()}
          </>
        )}

        {selectedTab === 'activities' && renderActivitiesTab()}
        {selectedTab === 'insights' && renderInsightsTab()}

        <View style={styles.demoNotice}>
          <Icon name='information-circle' size={20} color='#007AFF' />
          <Text style={styles.demoText}>
            🎉 Demo Mode - Sign up to track your real carbon footprint!
          </Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signUpButton}>
            <Text style={styles.signUpText}>Get Started Free</Text>
            <Icon name='arrow-forward' size={20} color='white' />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  userText: {
    justifyContent: 'center',
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footprintCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  infoButton: {
    padding: 4,
  },
  footprintMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footprintValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  footprintNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footprintUnit: {
    fontSize: 18,
    color: '#666',
    marginLeft: 8,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  targetProgress: {
    marginBottom: 20,
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
  },
  targetStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginRight: '2%',
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  tabContent: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  customChart: {
    width: '100%',
    marginTop: 10,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    paddingBottom: 40,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barWrapper: {
    height: 150,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  barValue: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  achievementsSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  achievementsScroll: {
    marginTop: 10,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    minHeight: 40,
  },
  unlockedBadge: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  achievementProgress: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  challengesSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  challengeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 40,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  activityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activitySaved: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  activityEmissions: {
    fontSize: 13,
    color: '#666',
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  insightMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  insightDate: {
    fontSize: 12,
    color: '#999',
  },
  recommendationsSection: {
    marginTop: 24,
  },
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  recDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  recFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  recSaving: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 12,
  },
  demoText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  signUpButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default HomeScreen;
