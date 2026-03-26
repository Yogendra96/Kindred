// @ts-nocheck
/* eslint-disable */
import { modernAPMService } from './ModernAPMService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Share } from 'react-native';

// Types for Social Features
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: {
    city: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  joinDate: string;
  lastActive: string;
  privacy: {
    profileVisible: boolean;
    statsVisible: boolean;
    locationVisible: boolean;
    allowFriendRequests: boolean;
  };
  preferences: {
    notifications: {
      achievements: boolean;
      challenges: boolean;
      friendActivity: boolean;
      leaderboard: boolean;
    };
    units: 'metric' | 'imperial';
    language: string;
  };
  stats: {
    totalCarbonSaved: number;
    streakDays: number;
    activitiesLogged: number;
    challengesCompleted: number;
    badgesEarned: number;
    friendsCount: number;
    rank: number;
    level: number;
    experience: number;
  };
  achievements: string[];
  badges: string[];
}

export interface Friend {
  uid: string;
  displayName: string;
  avatar?: string;
  status: 'pending' | 'accepted' | 'blocked';
  addedDate: string;
  mutualFriends: number;
  lastActivity?: {
    type: string;
    timestamp: string;
    carbonSaved: number;
  };
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromUser: {
    displayName: string;
    avatar?: string;
  };
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'group' | 'global';
  category: 'transport' | 'energy' | 'food' | 'waste' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: {
    start: string;
    end: string;
    durationDays: number;
  };
  target: {
    metric: 'carbon_saved' | 'activities' | 'streak' | 'points';
    value: number;
    unit: string;
  };
  rewards: {
    points: number;
    badges: string[];
    carbonCredits?: number;
  };
  participants: {
    uid: string;
    displayName: string;
    avatar?: string;
    progress: number;
    joinedDate: string;
  }[];
  leaderboard: {
    uid: string;
    displayName: string;
    avatar?: string;
    score: number;
    rank: number;
  }[];
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  isPublic: boolean;
  maxParticipants?: number;
  tags: string[];
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  avatar?: string;
  score: number;
  rank: number;
  change: number; // Position change from last period
  stats: {
    carbonSaved: number;
    activitiesCount: number;
    streakDays: number;
    level: number;
  };
  badges: string[];
  location?: {
    city: string;
    country: string;
  };
}

export interface Leaderboard {
  id: string;
  type: 'global' | 'friends' | 'local' | 'challenge';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time';
  category?: 'transport' | 'energy' | 'food' | 'waste' | 'overall';
  entries: LeaderboardEntry[];
  lastUpdated: string;
  totalParticipants: number;
  userRank?: number;
  userScore?: number;
}

export interface Activity {
  id: string;
  uid: string;
  type:
    | 'carbon_saved'
    | 'challenge_completed'
    | 'badge_earned'
    | 'level_up'
    | 'streak_milestone';
  title: string;
  description: string;
  data: {
    carbonSaved?: number;
    challengeId?: string;
    badgeId?: string;
    level?: number;
    streakDays?: number;
    category?: string;
  };
  timestamp: string;
  isPublic: boolean;
  likes: {
    count: number;
    users: string[];
  };
  comments: {
    id: string;
    uid: string;
    displayName: string;
    avatar?: string;
    text: string;
    timestamp: string;
  }[];
  shares: {
    count: number;
    users: string[];
  };
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  type: 'public' | 'private' | 'invite-only';
  category: 'local' | 'workplace' | 'school' | 'interest' | 'challenge';
  members: {
    uid: string;
    displayName: string;
    avatar?: string;
    role: 'admin' | 'moderator' | 'member';
    joinedDate: string;
  }[];
  stats: {
    totalMembers: number;
    totalCarbonSaved: number;
    activeChallenges: number;
    completedChallenges: number;
  };
  challenges: string[]; // Challenge IDs
  activities: Activity[];
  createdBy: string;
  createdDate: string;
  tags: string[];
  location?: {
    city: string;
    country: string;
    radius?: number; // For local groups
  };
}

class SocialFeaturesService {
  private static instance: SocialFeaturesService;
  private performanceService = modernAPMService;
  private currentUser: UserProfile | null = null;
  private friends: Friend[] = [];
  private activities: Activity[] = [];
  private challenges: Challenge[] = [];
  private groups: Group[] = [];

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): SocialFeaturesService {
    if (!SocialFeaturesService.instance) {
      SocialFeaturesService.instance = new SocialFeaturesService();
    }
    return SocialFeaturesService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadCachedData();
      this.setupAuthListener();
    } catch (error) {
      console.error('Error initializing social features service:', error);
    }
  }

  private setupAuthListener(): void {
    auth().onAuthStateChanged(async user => {
      if (user) {
        await this.loadUserProfile(user.uid);
        await this.syncUserData();
      } else {
        this.currentUser = null;
        this.friends = [];
        this.activities = [];
      }
    });
  }

  // User Profile Management
  public async loadUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      this.performanceService.startTraceSimple('load_user_profile');

      const userDoc = await firestore().collection('users').doc(uid).get();

      if (userDoc.exists) {
        const userData = userDoc.data() as UserProfile;
        this.currentUser = userData;
        await this.saveCachedData();

        await this.performanceService.stopTraceSimple('load_user_profile', {
          user_found: 'true',
        });

        return userData;
      }

      await this.performanceService.stopTraceSimple('load_user_profile', {
        user_found: 'false',
      });

      return null;
    } catch (error) {
      await this.performanceService.stopTraceSimple('load_user_profile', {
        status: 'error',
        error: String(error),
      });
      console.error('Error loading user profile:', error);
      return null;
    }
  }

  public async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const updatedProfile = { ...this.currentUser, ...updates };

      await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .update(updates);

      this.currentUser = updatedProfile;
      await this.saveCachedData();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  // Friend Management
  public async sendFriendRequest(
    toUid: string,
    message?: string,
  ): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const friendRequest: Omit<FriendRequest, 'id'> = {
        fromUid: this.currentUser.uid,
        toUid,
        fromUser: {
          displayName: this.currentUser.displayName,
          avatar: this.currentUser.avatar,
        },
        message,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      await firestore().collection('friendRequests').add(friendRequest);
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  public async respondToFriendRequest(
    requestId: string,
    response: 'accepted' | 'declined',
  ): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const batch = firestore().batch();

      // Update friend request status
      const requestRef = firestore()
        .collection('friendRequests')
        .doc(requestId);
      batch.update(requestRef, { status: response });

      if (response === 'accepted') {
        // Get the friend request to get user IDs
        const requestDoc = await requestRef.get();
        const requestData = requestDoc.data() as FriendRequest;

        // Add to both users' friends collections
        const friend1Ref = firestore()
          .collection('users')
          .doc(requestData.fromUid)
          .collection('friends')
          .doc(requestData.toUid);

        const friend2Ref = firestore()
          .collection('users')
          .doc(requestData.toUid)
          .collection('friends')
          .doc(requestData.fromUid);

        batch.set(friend1Ref, {
          uid: requestData.toUid,
          status: 'accepted',
          addedDate: new Date().toISOString(),
        });

        batch.set(friend2Ref, {
          uid: requestData.fromUid,
          status: 'accepted',
          addedDate: new Date().toISOString(),
        });
      }

      await batch.commit();
      await this.loadFriends();
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }

  public async loadFriends(): Promise<Friend[]> {
    try {
      if (!this.currentUser) return [];

      const friendsSnapshot = await firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('friends')
        .where('status', '==', 'accepted')
        .get();

      const friends: Friend[] = [];

      for (const doc of friendsSnapshot.docs) {
        const friendData = doc.data();
        const friendProfile = await this.loadUserProfile(friendData.uid);

        if (friendProfile) {
          friends.push({
            uid: friendProfile.uid,
            displayName: friendProfile.displayName,
            avatar: friendProfile.avatar,
            status: 'accepted',
            addedDate: friendData.addedDate,
            mutualFriends: 0, // Calculate this separately
          });
        }
      }

      this.friends = friends;
      await this.saveCachedData();
      return friends;
    } catch (error) {
      console.error('Error loading friends:', error);
      return [];
    }
  }

  public getFriends(): Friend[] {
    return this.friends;
  }

  public async removeFriend(friendUid: string): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const batch = firestore().batch();

      // Remove from both users' friends collections
      const friend1Ref = firestore()
        .collection('users')
        .doc(this.currentUser.uid)
        .collection('friends')
        .doc(friendUid);

      const friend2Ref = firestore()
        .collection('users')
        .doc(friendUid)
        .collection('friends')
        .doc(this.currentUser.uid);

      batch.delete(friend1Ref);
      batch.delete(friend2Ref);

      await batch.commit();
      await this.loadFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  }

  // Activity Feed
  public async createActivity(
    activity: Omit<
      Activity,
      'id' | 'uid' | 'timestamp' | 'likes' | 'comments' | 'shares'
    >,
  ): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const newActivity: Omit<Activity, 'id'> = {
        ...activity,
        uid: this.currentUser.uid,
        timestamp: new Date().toISOString(),
        likes: { count: 0, users: [] },
        comments: [],
        shares: { count: 0, users: [] },
      };

      await firestore().collection('activities').add(newActivity);
      await this.loadActivities();
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  public async loadActivities(limit: number = 50): Promise<Activity[]> {
    try {
      if (!this.currentUser) return [];

      // Get activities from user and friends
      const friendUids = this.friends.map(friend => friend.uid);
      const userUids = [this.currentUser.uid, ...friendUids];

      const activitiesSnapshot = await firestore()
        .collection('activities')
        .where('uid', 'in', userUids.slice(0, 10)) // Firestore 'in' limit
        .where('isPublic', '==', true)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      const activities = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];

      this.activities = activities;
      await this.saveCachedData();
      return activities;
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  }

  public async likeActivity(activityId: string): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const activityRef = firestore().collection('activities').doc(activityId);

      await firestore().runTransaction(async transaction => {
        const activityDoc = await transaction.get(activityRef);
        const activityData = activityDoc.data() as Activity;

        const likes = activityData.likes || { count: 0, users: [] };
        const userIndex = likes.users.indexOf(this.currentUser!.uid);

        if (userIndex === -1) {
          // Add like
          likes.users.push(this.currentUser!.uid);
          likes.count = likes.users.length;
        } else {
          // Remove like
          likes.users.splice(userIndex, 1);
          likes.count = likes.users.length;
        }

        transaction.update(activityRef, { likes });
      });

      await this.loadActivities();
    } catch (error) {
      console.error('Error liking activity:', error);
      throw error;
    }
  }

  public async commentOnActivity(
    activityId: string,
    text: string,
  ): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const comment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uid: this.currentUser.uid,
        displayName: this.currentUser.displayName,
        avatar: this.currentUser.avatar,
        text,
        timestamp: new Date().toISOString(),
      };

      await firestore()
        .collection('activities')
        .doc(activityId)
        .update({
          comments: firestore.FieldValue.arrayUnion(comment),
        });

      await this.loadActivities();
    } catch (error) {
      console.error('Error commenting on activity:', error);
      throw error;
    }
  }

  public getActivities(): Activity[] {
    return this.activities;
  }

  // Leaderboards
  public async getLeaderboard(
    type: Leaderboard['type'],
    period: Leaderboard['period'],
    category?: Leaderboard['category'],
    limit: number = 100,
  ): Promise<Leaderboard> {
    try {
      this.performanceService.startTraceSimple('load_leaderboard');

      const query = firestore().collection('leaderboards');

      // Apply filters
      if (type === 'friends' && this.currentUser) {
        const friendUids = this.friends.map(friend => friend.uid);
        friendUids.push(this.currentUser.uid);

        // For friends leaderboard, we need to get user stats and calculate
        const entries = await this.calculateFriendsLeaderboard(
          period,
          category,
        );

        await this.performanceService.stopTraceSimple('load_leaderboard', {
          type,
          period,
          entries_count: entries.length.toString(),
        });

        return {
          id: `${type}_${period}_${category || 'overall'}`,
          type,
          period,
          category,
          entries,
          lastUpdated: new Date().toISOString(),
          totalParticipants: entries.length,
          userRank:
            entries.findIndex(entry => entry.uid === this.currentUser?.uid) + 1,
          userScore: entries.find(entry => entry.uid === this.currentUser?.uid)
            ?.score,
        };
      }

      // For global and local leaderboards
      const leaderboardDoc = await firestore()
        .collection('leaderboards')
        .doc(`${type}_${period}_${category || 'overall'}`)
        .get();

      if (leaderboardDoc.exists) {
        const leaderboardData = leaderboardDoc.data() as Leaderboard;

        await this.performanceService.stopTraceSimple('load_leaderboard', {
          type,
          period,
          entries_count: leaderboardData.entries.length.toString(),
        });

        return leaderboardData;
      }

      // Return empty leaderboard if not found
      await this.performanceService.stopTraceSimple('load_leaderboard', {
        type,
        period,
        entries_count: '0',
      });

      return {
        id: `${type}_${period}_${category || 'overall'}`,
        type,
        period,
        category,
        entries: [],
        lastUpdated: new Date().toISOString(),
        totalParticipants: 0,
      };
    } catch (error) {
      await this.performanceService.stopTraceSimple('load_leaderboard', {
        status: 'error',
        error: String(error),
      });
      console.error('Error loading leaderboard:', error);
      throw error;
    }
  }

  private async calculateFriendsLeaderboard(
    period: Leaderboard['period'],
    category?: Leaderboard['category'],
  ): Promise<LeaderboardEntry[]> {
    try {
      const friendUids = this.friends.map(friend => friend.uid);
      if (this.currentUser) {
        friendUids.push(this.currentUser.uid);
      }

      const entries: LeaderboardEntry[] = [];

      for (const uid of friendUids) {
        const userProfile = await this.loadUserProfile(uid);
        if (userProfile) {
          // Calculate score based on period and category
          const score = this.calculateUserScore(userProfile, period, category);

          entries.push({
            uid: userProfile.uid,
            displayName: userProfile.displayName,
            avatar: userProfile.avatar,
            score,
            rank: 0, // Will be set after sorting
            change: 0, // TODO: Calculate from previous period
            stats: {
              carbonSaved: userProfile.stats.totalCarbonSaved,
              activitiesCount: userProfile.stats.activitiesLogged,
              streakDays: userProfile.stats.streakDays,
              level: userProfile.stats.level,
            },
            badges: userProfile.badges,
            location: userProfile.location
              ? {
                  city: userProfile.location.city,
                  country: userProfile.location.country,
                }
              : undefined,
          });
        }
      }

      // Sort by score and assign ranks
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return entries;
    } catch (error) {
      console.error('Error calculating friends leaderboard:', error);
      return [];
    }
  }

  private calculateUserScore(
    user: UserProfile,
    period: Leaderboard['period'],
    category?: Leaderboard['category'],
  ): number {
    // This is a simplified calculation
    // In a real app, you'd query user activities for the specific period
    let score = user.stats.totalCarbonSaved * 10; // Base score from carbon saved

    // Add bonus points for other activities
    score += user.stats.activitiesLogged * 5;
    score += user.stats.streakDays * 2;
    score += user.stats.challengesCompleted * 50;
    score += user.stats.badgesEarned * 25;

    return Math.round(score);
  }

  // Challenges
  public async loadChallenges(): Promise<Challenge[]> {
    try {
      const challengesSnapshot = await firestore()
        .collection('challenges')
        .where('status', 'in', ['upcoming', 'active'])
        .orderBy('duration.start', 'desc')
        .limit(50)
        .get();

      const challenges = challengesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Challenge[];

      this.challenges = challenges;
      await this.saveCachedData();
      return challenges;
    } catch (error) {
      console.error('Error loading challenges:', error);
      return [];
    }
  }

  public async joinChallenge(challengeId: string): Promise<void> {
    try {
      if (!this.currentUser) throw new Error('No current user');

      const participant = {
        uid: this.currentUser.uid,
        displayName: this.currentUser.displayName,
        avatar: this.currentUser.avatar,
        progress: 0,
        joinedDate: new Date().toISOString(),
      };

      await firestore()
        .collection('challenges')
        .doc(challengeId)
        .update({
          participants: firestore.FieldValue.arrayUnion(participant),
        });

      await this.loadChallenges();
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  public getChallenges(): Challenge[] {
    return this.challenges;
  }

  // Sharing
  public async shareActivity(activity: Activity): Promise<void> {
    try {
      const shareContent = {
        title: 'Check out my carbon saving achievement!',
        message: `${activity.title}\n\n${activity.description}\n\nJoin me on Kindred to track your carbon footprint!`,
        url: 'https://kindred-app.com', // Your app's website
      };

      await Share.share(shareContent);

      // Track share in activity
      if (this.currentUser) {
        await firestore()
          .collection('activities')
          .doc(activity.id)
          .update({
            'shares.users': firestore.FieldValue.arrayUnion(
              this.currentUser.uid,
            ),
            'shares.count': firestore.FieldValue.increment(1),
          });
      }
    } catch (error) {
      console.error('Error sharing activity:', error);
      throw error;
    }
  }

  public async shareChallenge(challenge: Challenge): Promise<void> {
    try {
      const shareContent = {
        title: `Join the "${challenge.title}" challenge!`,
        message: `${challenge.description}\n\nDuration: ${challenge.duration.durationDays} days\nReward: ${challenge.rewards.points} points\n\nJoin me on Kindred!`,
        url: 'https://kindred-app.com',
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing challenge:', error);
      throw error;
    }
  }

  // Search and Discovery
  public async searchUsers(
    query: string,
    limit: number = 20,
  ): Promise<UserProfile[]> {
    try {
      // Note: Firestore doesn't support full-text search natively
      // In a production app, you'd use Algolia or similar service
      const usersSnapshot = await firestore()
        .collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .where('privacy.profileVisible', '==', true)
        .limit(limit)
        .get();

      return usersSnapshot.docs.map(doc => doc.data()) as UserProfile[];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  public async searchChallenges(
    query: string,
    limit: number = 20,
  ): Promise<Challenge[]> {
    try {
      const challengesSnapshot = await firestore()
        .collection('challenges')
        .where('title', '>=', query)
        .where('title', '<=', query + '\uf8ff')
        .where('isPublic', '==', true)
        .limit(limit)
        .get();

      return challengesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Challenge[];
    } catch (error) {
      console.error('Error searching challenges:', error);
      return [];
    }
  }

  // Data Synchronization
  private async syncUserData(): Promise<void> {
    try {
      if (!this.currentUser) return;

      await Promise.all([
        this.loadFriends(),
        this.loadActivities(),
        this.loadChallenges(),
      ]);
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
  }

  // Cache Management
  private async loadCachedData(): Promise<void> {
    try {
      const [userData, friendsData, activitiesData, challengesData] =
        await Promise.all([
          AsyncStorage.getItem('social_current_user'),
          AsyncStorage.getItem('social_friends'),
          AsyncStorage.getItem('social_activities'),
          AsyncStorage.getItem('social_challenges'),
        ]);

      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
      if (friendsData) {
        this.friends = JSON.parse(friendsData);
      }
      if (activitiesData) {
        this.activities = JSON.parse(activitiesData);
      }
      if (challengesData) {
        this.challenges = JSON.parse(challengesData);
      }
    } catch (error) {
      console.error('Error loading cached social data:', error);
    }
  }

  private async saveCachedData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(
          'social_current_user',
          JSON.stringify(this.currentUser),
        ),
        AsyncStorage.setItem('social_friends', JSON.stringify(this.friends)),
        AsyncStorage.setItem(
          'social_activities',
          JSON.stringify(this.activities),
        ),
        AsyncStorage.setItem(
          'social_challenges',
          JSON.stringify(this.challenges),
        ),
      ]);
    } catch (error) {
      console.error('Error saving cached social data:', error);
    }
  }

  public async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('social_current_user'),
        AsyncStorage.removeItem('social_friends'),
        AsyncStorage.removeItem('social_activities'),
        AsyncStorage.removeItem('social_challenges'),
      ]);

      this.currentUser = null;
      this.friends = [];
      this.activities = [];
      this.challenges = [];
    } catch (error) {
      console.error('Error clearing social cache:', error);
    }
  }
}

export default SocialFeaturesService.getInstance();

// Utility functions for social features
export const SocialUtils = {
  // Format user stats for display
  formatUserStats: (stats: UserProfile['stats']) => ({
    carbonSaved: `${stats.totalCarbonSaved.toFixed(1)} kg CO₂`,
    streak: `${stats.streakDays} days`,
    activities: stats.activitiesLogged.toLocaleString(),
    level: `Level ${stats.level}`,
    rank: stats.rank > 0 ? `#${stats.rank}` : 'Unranked',
  }),

  // Calculate experience needed for next level
  getExperienceForNextLevel: (currentLevel: number): number => {
    return currentLevel * 1000; // Simple formula: level * 1000 XP
  },

  // Calculate level from experience
  getLevelFromExperience: (experience: number): number => {
    return Math.floor(experience / 1000) + 1;
  },

  // Format challenge duration
  formatChallengeDuration: (challenge: Challenge): string => {
    const start = new Date(challenge.duration.start);
    const end = new Date(challenge.duration.end);
    const now = new Date();

    if (now < start) {
      const daysUntilStart = Math.ceil(
        (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return `Starts in ${daysUntilStart} days`;
    } else if (now <= end) {
      const daysRemaining = Math.ceil(
        (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return `${daysRemaining} days remaining`;
    } else {
      return 'Completed';
    }
  },

  // Get challenge progress percentage
  getChallengeProgress: (challenge: Challenge, userUid: string): number => {
    const participant = challenge.participants.find(p => p.uid === userUid);
    if (!participant) return 0;

    return Math.min((participant.progress / challenge.target.value) * 100, 100);
  },

  // Format activity timestamp
  formatActivityTime: (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return activityTime.toLocaleDateString();
  },
};
