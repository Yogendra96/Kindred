/* eslint-disable */
import { webSocketService } from '../services/WebSocketService';
import { useTheme } from '../theme/ThemeProvider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastActivity: Date;
  carbonSaved: number;
  currentStreak: number;
  recentAchievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  carbonImpact: number;
}

interface LiveChallenge {
  id: string;
  title: string;
  description: string;
  participants: number;
  timeRemaining: number;
  progress: number;
  reward: string;
  type: 'daily' | 'weekly' | 'community' | 'global';
  isParticipating: boolean;
}

interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'carbon_save' | 'achievement' | 'challenge_complete' | 'milestone';
  message: string;
  timestamp: Date;
  carbonImpact?: number;
  reactions: { [emoji: string]: string[] };
  isLive: boolean;
}

const { width } = Dimensions.get('window');

export const RealTimeSocialDashboard: React.FC = () => {
  const theme = useTheme();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [liveChallenges, setLiveChallenges] = useState<LiveChallenge[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'feed' | 'friends' | 'challenges'>('feed');

  // Animated values for real-time updates
  const pulseAnim = useMemo(() => new Animated.Value(1), []);
  const slideAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    initializeRealTimeFeatures();
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const initializeRealTimeFeatures = async () => {
    try {
      // Initialize WebSocket connection
      await webSocketService.initialize();
      await webSocketService.connect();

      // Subscribe to real-time events
      setupEventSubscriptions();

      // Join user's social rooms
      await joinSocialRooms();

      setIsConnected(true);
    } catch (error) {
      console.error('Failed to initialize real-time features:', error);
    }
  };

  const setupEventSubscriptions = () => {
    // Friend status updates
    webSocketService.subscribe('friend_status', handleFriendStatusUpdate);

    // Activity feed updates
    webSocketService.subscribe('friend_activity', handleFriendActivity);

    // Achievement notifications
    webSocketService.subscribe('achievement_unlocked', handleAchievementUnlocked);

    // Challenge updates
    webSocketService.subscribe('challenge_update', handleChallengeUpdate);

    // Live leaderboard updates
    webSocketService.subscribe('leaderboard_update', handleLeaderboardUpdate);

    // Connection status
    webSocketService.subscribe('connection_lost', handleConnectionLost);
    webSocketService.subscribe('connection_restored', handleConnectionRestored);
  };

  const joinSocialRooms = async () => {
    try {
      // Join global activity feed
      await webSocketService.joinRoom('global_feed');

      // Join friends room
      await webSocketService.joinRoom('friends_updates');

      // Join challenges room
      await webSocketService.joinRoom('live_challenges');

      // Join user's location-based room (if location permission granted)
      const userLocation = await getUserLocation();
      if (userLocation) {
        await webSocketService.joinRoom(`location_${userLocation.city}`);
      }
    } catch (error) {
      console.error('Failed to join social rooms:', error);
    }
  };

  const handleFriendStatusUpdate = useCallback((message: any) => {
    const { friendId, status, carbonSaved, streak } = message.payload;

    setFriends(prev =>
      prev.map(friend =>
        friend.id === friendId
          ? {
              ...friend,
              isOnline: status === 'online',
              lastActivity: new Date(),
              carbonSaved: carbonSaved || friend.carbonSaved,
              currentStreak: streak || friend.currentStreak,
            }
          : friend,
      ),
    );

    // Animate friend status change
    animatePulse();
  }, []);

  const handleFriendActivity = useCallback((message: any) => {
    const newActivity: ActivityFeedItem = {
      ...message.payload,
      timestamp: new Date(message.timestamp),
      isLive: true,
      reactions: {},
    };

    setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 items

    // Animate new activity appearance
    animateSlideIn();
  }, []);

  const handleAchievementUnlocked = useCallback((message: any) => {
    const { achievement, userId } = message.payload;

    // Show celebration animation for achievements
    showAchievementCelebration(achievement);

    // Update friend's achievements if it's a friend
    setFriends(prev =>
      prev.map(friend =>
        friend.id === userId
          ? {
              ...friend,
              recentAchievements: [achievement, ...friend.recentAchievements.slice(0, 4)],
            }
          : friend,
      ),
    );
  }, []);

  const handleChallengeUpdate = useCallback((message: any) => {
    const { challengeId, progress, participants } = message.payload;

    setLiveChallenges(prev =>
      prev.map(challenge =>
        challenge.id === challengeId ? { ...challenge, progress, participants } : challenge,
      ),
    );
  }, []);

  const handleLeaderboardUpdate = useCallback(
    (message: any) => {
      // Handle real-time leaderboard position updates
      const { leaderboard } = message.payload;
      // Redux dispatch of 'social/updateLeaderboard' removed: this component has
      // no access to a dispatch function. Wire up once the store supports it.
      void leaderboard;
    },
    [],
  );

  const handleConnectionLost = useCallback(() => {
    setIsConnected(false);
  }, []);

  const handleConnectionRestored = useCallback(() => {
    setIsConnected(true);
  }, []);

  const animatePulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateSlideIn = () => {
    slideAnim.setValue(-width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showAchievementCelebration = (achievement: Achievement) => {
    // Trigger celebration animation/modal
    console.log('🎉 Achievement unlocked:', achievement.title);
  };

  const getUserLocation = async (): Promise<{ city: string } | null> => {
    // Implementation would get user's location
    return { city: 'san_francisco' };
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh social data
      await refreshSocialData();
    } catch (error) {
      console.error('Failed to refresh social data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const refreshSocialData = async () => {
    // Fetch latest friends, challenges, and activity data
    // This would typically call your API
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      await webSocketService.sendMessage({
        id: `join_${challengeId}_${Date.now()}`,
        type: 'join_challenge',
        payload: { challengeId },
        timestamp: Date.now(),
        priority: 'high',
      });

      setLiveChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId
            ? {
                ...challenge,
                isParticipating: true,
                participants: challenge.participants + 1,
              }
            : challenge,
        ),
      );
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };

  const reactToActivity = async (activityId: string, emoji: string) => {
    try {
      await webSocketService.sendMessage({
        id: `react_${activityId}_${Date.now()}`,
        type: 'activity_reaction',
        payload: { activityId, emoji },
        timestamp: Date.now(),
        priority: 'normal',
      });
    } catch (error) {
      console.error('Failed to react to activity:', error);
    }
  };

  const renderTabBar = () => (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        },
      ]}
    >
      {(['feed', 'friends', 'challenges'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            selectedTab === tab
              ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                }
              : {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                },
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Ionicons
            name={tab === 'feed' ? 'pulse' : tab === 'friends' ? 'people' : 'trophy'}
            size={18}
            color={selectedTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === tab ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
              },
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderConnectionStatus = () => (
    <View
      style={[styles.connectionStatus, { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' }]}
    >
      <Ionicons name={isConnected ? 'wifi' : 'wifi-off'} size={12} color='white' />
      <Text style={styles.connectionText}>{isConnected ? 'Live' : 'Reconnecting...'}</Text>
    </View>
  );

  const renderActivityFeed = () => (
    <FlatList
      data={activityFeed}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item, index }) => (
        <Animated.View
          style={[
            styles.activityItem,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
            item.isLive &&
              index === 0 && {
                transform: [{ translateX: slideAnim }],
              },
          ]}
        >
          <View style={styles.activityHeader}>
            <View style={styles.userInfo}>
              <View style={[styles.avatar, { backgroundColor: '#38EF7D' }]}>
                <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={[styles.userName, { color: '#FFFFFF' }]}>{item.userName}</Text>
                <Text style={[styles.timestamp, { color: 'rgba(255, 255, 255, 0.5)' }]}>
                  {formatTimestamp(item.timestamp)} {item.isLive && '• LIVE'}
                </Text>
              </View>
            </View>
            {item.isLive && (
              <View style={styles.liveIndicator}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
              </View>
            )}
          </View>

          <Text style={[styles.activityMessage, { color: 'rgba(255, 255, 255, 0.9)' }]}>
            {item.message}
          </Text>

          {item.carbonImpact && (
            <View style={styles.carbonImpact}>
              <Ionicons name='leaf' size={16} color='#4CAF50' />
              <Text style={styles.carbonText}>{item.carbonImpact.toFixed(1)} kg CO₂ saved</Text>
            </View>
          )}

          <View style={styles.reactionBar}>
            {['👍', '🎉', '💚', '🔥'].map(emoji => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionButton}
                onPress={() => reactToActivity(item.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{item.reactions[emoji]?.length || 0}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    />
  );

  const renderFriendsList = () => (
    <FlatList
      data={friends}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View
          style={[
            styles.friendItem,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <View style={styles.friendInfo}>
            <View style={[styles.friendAvatar, { backgroundColor: '#38EF7D' }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.friendDetails}>
              <Text style={[styles.friendName, { color: '#FFFFFF' }]}>{item.name}</Text>
              <Text style={[styles.friendStats, { color: 'rgba(255, 255, 255, 0.5)' }]}>
                {item.carbonSaved.toFixed(1)} kg saved • {item.currentStreak} day streak
              </Text>
            </View>
          </View>

          {item.recentAchievements.length > 0 && (
            <View style={styles.recentAchievements}>
              {item.recentAchievements.slice(0, 3).map(achievement => (
                <View key={achievement.id} style={styles.achievementBadge}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    />
  );

  const renderLiveChallenges = () => (
    <FlatList
      data={liveChallenges}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      renderItem={({ item }) => (
        <View
          style={[
            styles.challengeItem,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <View style={styles.challengeHeader}>
            <Text style={[styles.challengeTitle, { color: '#FFFFFF' }]}>{item.title}</Text>
            <View
              style={[
                styles.challengeType,
                {
                  backgroundColor: 'rgba(56, 239, 125, 0.15)',
                  borderWidth: 1,
                  borderColor: '#38EF7D',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                },
              ]}
            >
              <Text style={[styles.challengeTypeText, { color: '#38EF7D' }]}>{item.type}</Text>
            </View>
          </View>

          <Text style={[styles.challengeDescription, { color: 'rgba(255, 255, 255, 0.6)' }]}>
            {item.description}
          </Text>

          <View style={styles.challengeStats}>
            <Text style={[styles.challengeStat, { color: 'rgba(255, 255, 255, 0.5)' }]}>
              {item.participants} participants
            </Text>
            <Text style={[styles.challengeStat, { color: 'rgba(255, 255, 255, 0.5)' }]}>
              {formatTimeRemaining(item.timeRemaining)} left
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: '#38EF7D',
                    width: `${item.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: '#FFFFFF' }]}>
              {item.progress.toFixed(0)}%
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.challengeButton,
              {
                backgroundColor: item.isParticipating
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.08)',
                borderColor: item.isParticipating
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(255, 255, 255, 0.18)',
                borderWidth: 1,
              },
            ]}
            onPress={() => !item.isParticipating && joinChallenge(item.id)}
            disabled={item.isParticipating}
          >
            <Text
              style={[
                styles.challengeButtonText,
                { color: item.isParticipating ? 'rgba(255, 255, 255, 0.4)' : '#FFFFFF' },
              ]}
            >
              {item.isParticipating ? 'Participating' : 'Join Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return `${Math.floor(minutes / 1440)}d`;
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      {renderConnectionStatus()}
      {renderTabBar()}

      <View style={styles.content}>
        {selectedTab === 'feed' && renderActivityFeed()}
        {selectedTab === 'friends' && renderFriendsList()}
        {selectedTab === 'challenges' && renderLiveChallenges()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  connectionText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  activityItem: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  liveIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  activityMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  carbonImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  carbonText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  reactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 12,
  },
  recentAchievements: {
    flexDirection: 'row',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  achievementIcon: {
    fontSize: 12,
  },
  challengeItem: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  challengeType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeTypeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeStat: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  challengeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RealTimeSocialDashboard;
