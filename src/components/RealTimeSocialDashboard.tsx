import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  // ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useDispatch /* useSelector */ } from 'react-redux';

import { webSocketService } from '../services/WebSocketService';
import { useTheme } from '../theme/ThemeProvider';

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
  const dispatch = useDispatch();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [liveChallenges, setLiveChallenges] = useState<LiveChallenge[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<
    'feed' | 'friends' | 'challenges'
  >('feed');

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
    webSocketService.subscribe(
      'achievement_unlocked',
      handleAchievementUnlocked,
    );

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

  const handleFriendStatusUpdate = useCallback(
    (message: Record<string, unknown>) => {
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
    },
    [],
  );

  const handleFriendActivity = useCallback(
    (message: Record<string, unknown>) => {
      const newActivity: ActivityFeedItem = {
        ...message.payload,
        timestamp: new Date(message.timestamp),
        isLive: true,
        reactions: {},
      };

      setActivityFeed(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 items

      // Animate new activity appearance
      animateSlideIn();
    },
    [],
  );

  const handleAchievementUnlocked = useCallback(
    (message: Record<string, unknown>) => {
      const { achievement, userId } = message.payload;

      // Show celebration animation for achievements
      showAchievementCelebration(achievement);

      // Update friend's achievements if it's a friend
      setFriends(prev =>
        prev.map(friend =>
          friend.id === userId
            ? {
                ...friend,
                recentAchievements: [
                  achievement,
                  ...friend.recentAchievements.slice(0, 4),
                ],
              }
            : friend,
        ),
      );
    },
    [],
  );

  const handleChallengeUpdate = useCallback(
    (message: Record<string, unknown>) => {
      const { challengeId, progress, participants } = message.payload;

      setLiveChallenges(prev =>
        prev.map(challenge =>
          challenge.id === challengeId
            ? { ...challenge, progress, participants }
            : challenge,
        ),
      );
    },
    [],
  );

  const handleLeaderboardUpdate = useCallback(
    (message: Record<string, unknown>) => {
      // Handle real-time leaderboard position updates
      const { leaderboard } = message.payload;
      // Update global leaderboard state
      dispatch({ type: 'social/updateLeaderboard', payload: leaderboard });
    },
    [dispatch],
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
    console.warn('🎉 Achievement unlocked:', achievement.title);
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
    <View style={[styles.tabBar, { backgroundColor: theme.colors.surface }]}>
      {(['feed', 'friends', 'challenges'] as const).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            selectedTab === tab && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Ionicons
            name={
              tab === 'feed' ? 'pulse' : tab === 'friends' ? 'people' : 'trophy'
            }
            size={20}
            color={
              selectedTab === tab
                ? theme.colors.onPrimary
                : theme.colors.onSurface
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === tab
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
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
      style={[
        styles.connectionStatus,
        { backgroundColor: isConnected ? '#4CAF50' : '#FF9800' },
      ]}
    >
      <Ionicons
        name={isConnected ? 'wifi' : 'wifi-off'}
        size={12}
        color='white'
      />
      <Text style={styles.connectionText}>
        {isConnected ? 'Live' : 'Reconnecting...'}
      </Text>
    </View>
  );

  const renderActivityFeed = () => (
    <FlatList
      data={activityFeed}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item, index }) => (
        <Animated.View
          style={[
            styles.activityItem,
            { backgroundColor: theme.colors.surface },
            item.isLive &&
              index === 0 && {
                transform: [{ translateX: slideAnim }],
              },
          ]}
        >
          <View style={styles.activityHeader}>
            <View style={styles.userInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text style={styles.avatarText}>{item.userName.charAt(0)}</Text>
              </View>
              <View>
                <Text
                  style={[styles.userName, { color: theme.colors.onSurface }]}
                >
                  {item.userName}
                </Text>
                <Text
                  style={[styles.timestamp, { color: theme.colors.outline }]}
                >
                  {formatTimestamp(item.timestamp)} {item.isLive && '• LIVE'}
                </Text>
              </View>
            </View>
            {item.isLive && (
              <View style={styles.liveIndicator}>
                <Animated.View
                  style={[
                    styles.liveDot,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
              </View>
            )}
          </View>

          <Text
            style={[styles.activityMessage, { color: theme.colors.onSurface }]}
          >
            {item.message}
          </Text>

          {item.carbonImpact && (
            <View style={styles.carbonImpact}>
              <Ionicons name='leaf' size={16} color='#4CAF50' />
              <Text style={styles.carbonText}>
                {item.carbonImpact.toFixed(1)} kg CO₂ saved
              </Text>
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
                <Text style={styles.reactionCount}>
                  {item.reactions[emoji]?.length || 0}
                </Text>
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View
          style={[styles.friendItem, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.friendInfo}>
            <View
              style={[
                styles.friendAvatar,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.friendDetails}>
              <Text
                style={[styles.friendName, { color: theme.colors.onSurface }]}
              >
                {item.name}
              </Text>
              <Text
                style={[styles.friendStats, { color: theme.colors.outline }]}
              >
                {item.carbonSaved.toFixed(1)} kg saved • {item.currentStreak}{' '}
                day streak
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View
          style={[
            styles.challengeItem,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.challengeHeader}>
            <Text
              style={[styles.challengeTitle, { color: theme.colors.onSurface }]}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.challengeType,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.challengeTypeText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                {item.type}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.challengeDescription,
              { color: theme.colors.outline },
            ]}
          >
            {item.description}
          </Text>

          <View style={styles.challengeStats}>
            <Text
              style={[styles.challengeStat, { color: theme.colors.onSurface }]}
            >
              {item.participants} participants
            </Text>
            <Text
              style={[styles.challengeStat, { color: theme.colors.onSurface }]}
            >
              {formatTimeRemaining(item.timeRemaining)} left
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: theme.colors.outline },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${item.progress}%`,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.progressText, { color: theme.colors.onSurface }]}
            >
              {item.progress.toFixed(0)}%
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.challengeButton,
              {
                backgroundColor: item.isParticipating
                  ? theme.colors.outline
                  : theme.colors.primary,
              },
            ]}
            onPress={() => !item.isParticipating && joinChallenge(item.id)}
            disabled={item.isParticipating}
          >
            <Text
              style={[
                styles.challengeButtonText,
                { color: theme.colors.onPrimary },
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
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
  achievementBadge: {
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginLeft: 4,
    width: 24,
  },
  achievementIcon: {
    fontSize: 12,
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityItem: {
    borderRadius: 12,
    elevation: 1,
    marginVertical: 4,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carbonImpact: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  carbonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  challengeButton: {
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  challengeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  challengeHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengeItem: {
    borderRadius: 12,
    elevation: 1,
    marginVertical: 4,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  challengeStat: {
    fontSize: 12,
    fontWeight: '500',
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  challengeType: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  challengeTypeText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  connectionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  friendAvatar: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
    width: 48,
  },
  friendDetails: {
    flex: 1,
  },
  friendInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  friendItem: {
    alignItems: 'center',
    borderRadius: 12,
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendStats: {
    fontSize: 12,
  },
  liveDot: {
    backgroundColor: '#FF0000',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  liveIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
    borderColor: 'white',
    borderRadius: 6,
    borderWidth: 2,
    bottom: 2,
    height: 12,
    position: 'absolute',
    right: 2,
    width: 12,
  },
  progressBar: {
    borderRadius: 3,
    flex: 1,
    height: 6,
    marginRight: 8,
  },
  progressContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  progressFill: {
    borderRadius: 3,
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 32,
  },
  reactionBar: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  reactionButton: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionCount: {
    color: '#666',
    fontSize: 12,
    marginLeft: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  recentAchievements: {
    flexDirection: 'row',
  },
  tabBar: {
    elevation: 2,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  userInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RealTimeSocialDashboard;
