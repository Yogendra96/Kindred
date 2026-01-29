import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RealTimeSocialDashboard } from '../../components/RealTimeSocialDashboard';

const SocialScreen = () => {
  return (
    <View style={styles.container}>
      <RealTimeSocialDashboard />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SocialScreen;
