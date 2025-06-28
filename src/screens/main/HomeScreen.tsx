import ActivityTracker from '../../components/ActivityTracker';
import CarbonFootprintCard from '../../components/CarbonFootprintCard';
import EcoTips from '../../components/EcoTips';
import type { RootState } from '../../store';
import {
  updateFootprint,
  setFootprintLoading,
  setHistoryLoading,
  setHistory,
  setError,
} from '../../store/slices/carbonSlice';
import CacheManager from '../../utils/cacheManager';
import { calculateCarbonFootprint } from '../../utils/carbonCalculator';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

const FOOTPRINT_CACHE_KEY = 'carbon_footprint';
const HISTORY_CACHE_KEY = 'footprint_history';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { footprint, goals, history, loading, error } = useSelector(
    (state: RootState) => state.carbon,
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);

  const checkConnectivity = useCallback(async () => {
    const networkState = await NetInfo.fetch();
    setIsOnline(!!networkState.isConnected);
    return networkState.isConnected;
  }, []);

  const fetchData = useCallback(
    async (forceFetch = false) => {
      const user = auth().currentUser;
      if (!user) return;

      try {
        // Fetch current footprint
        dispatch(setFootprintLoading(true));

        const footprintData = await CacheManager.getWithNetwork(
          {
            key: FOOTPRINT_CACHE_KEY,
            ttl: forceFetch ? 0 : CACHE_TTL,
          },
          calculateCarbonFootprint,
        );

        if (footprintData) {
          dispatch(updateFootprint(footprintData));
        }

        // Fetch historical data
        dispatch(setHistoryLoading(true));

        const fetchHistory = async () => {
          const historySnapshot = await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('footprint_history')
            .orderBy('date', 'desc')
            .limit(7)
            .get();

          return historySnapshot.docs.map(doc => ({
            date: doc.id,
            ...doc.data(),
          }));
        };

        const historyData = await CacheManager.getWithNetwork(
          {
            key: HISTORY_CACHE_KEY,
            ttl: forceFetch ? 0 : CACHE_TTL,
          },
          fetchHistory,
        );

        if (historyData) {
          dispatch(setHistory(historyData));
        }

        dispatch(setError(null));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        dispatch(setError(errorMessage));

        if (await checkConnectivity()) {
          Alert.alert(
            'Error',
            'Failed to update data. Please try again later.',
          );
        }
      } finally {
        dispatch(setFootprintLoading(false));
        dispatch(setHistoryLoading(false));
      }
    },
    [dispatch, checkConnectivity],
  );

  useEffect(() => {
    fetchData();

    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(!!state.isConnected);
      if (state.isConnected) {
        fetchData(true); // Force fetch when coming back online
      }
    });

    const user = auth().currentUser;
    if (!user) return;

    // Set up real-time listener for footprint updates
    const unsubscribeFirestore = firestore()
      .collection('user_activities')
      .doc(user.uid)
      .onSnapshot(async doc => {
        if (isOnline) {
          try {
            const newFootprint = await calculateCarbonFootprint();
            dispatch(updateFootprint(newFootprint));
            await CacheManager.set({ key: FOOTPRINT_CACHE_KEY }, newFootprint);
          } catch (error) {
            console.error('Error updating footprint:', error);
          }
        }
      });

    return () => {
      unsubscribeNetInfo();
      unsubscribeFirestore();
    };
  }, [dispatch, fetchData, isOnline]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  if (loading.footprint && loading.history) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#2ecc71' />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Carbon Impact</Text>
        <Text style={styles.subtitle}>
          Track and reduce your environmental footprint
        </Text>
      </View>

      {!isOnline && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>
            You're offline - viewing cached data
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <CarbonFootprintCard
        total={footprint.total}
        target={goals.target}
        categories={footprint}
        history={history}
      />

      <ActivityTracker />

      <EcoTips />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  offlineContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  offlineText: {
    color: '#ef6c00',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default HomeScreen;
