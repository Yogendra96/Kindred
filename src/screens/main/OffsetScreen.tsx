import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
} from 'react-native';
import { useToast } from '../../contexts/ToastContext';
import { mockOffsetProjects } from '../../data/mockData';
import { Leaf, CheckCircle, ShieldCheck, Tree, CaretRight } from 'phosphor-react-native';

const GlassCard = ({ style, children }: any) => (
  <View
    style={[
      style,
      {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
      },
    ]}
  >
    {children}
  </View>
);

export default function OffsetScreen() {
  const { showToast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribeToggle = () => {
    const newValue = !isSubscribed;
    setIsSubscribed(newValue);
    if (newValue) {
      showToast('Carbon Neutral Subscription Activated! 🌱', 'success');
    } else {
      showToast('Subscription Paused.', 'info');
    }
  };

  const handlePurchase = (projectName: string) => {
    showToast(`Successfully purchased offsets for ${projectName}! 🌍`, 'success');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Direct Offsetting</Text>
        <Text style={styles.subtitle}>
          Take immediate action to neutralize your carbon footprint through verified global
          projects.
        </Text>
      </View>

      <GlassCard style={styles.subscriptionCard}>
        <View style={styles.subRow}>
          <View style={styles.subInfo}>
            <Text style={styles.subTitle}>Carbon Neutral Subscription</Text>
            <Text style={styles.subDesc}>
              Automatically purchase offsets at the end of each month to neutralize your tracked
              footprint.
            </Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck color='#38EF7D' weight='fill' size={16} />
              <Text style={styles.verifiedText}>Verified by Gold Standard</Text>
            </View>
          </View>
          <Switch
            value={isSubscribed}
            onValueChange={handleSubscribeToggle}
            trackColor={{ false: '#444', true: '#38EF7D' }}
            thumbColor={'#fff'}
          />
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>Featured Projects</Text>

      {mockOffsetProjects.map(project => (
        <TouchableOpacity
          key={project.id}
          activeOpacity={0.8}
          onPress={() => handlePurchase(project.name)}
        >
          <ImageBackground
            source={{ uri: project.image }}
            style={styles.projectImage}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.projectOverlay}>
              <View style={styles.projectTopRow}>
                {project.verified && (
                  <View style={styles.projectBadge}>
                    <ShieldCheck color='#fff' size={14} weight='bold' />
                    <Text style={styles.projectBadgeText}>Verified</Text>
                  </View>
                )}
                <View style={styles.projectPriceBadge}>
                  <Text style={styles.projectPriceText}>${project.costPerTon} / ton</Text>
                </View>
              </View>

              <View style={styles.projectBottomRow}>
                <View>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectLoc}>{project.location}</Text>
                </View>
                <TouchableOpacity
                  style={styles.buyBtn}
                  onPress={() => handlePurchase(project.name)}
                >
                  <Text style={styles.buyBtnText}>Offset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 22,
  },
  subscriptionCard: {
    padding: 20,
    marginBottom: 32,
    backgroundColor: 'rgba(56, 239, 125, 0.05)',
    borderColor: 'rgba(56, 239, 125, 0.2)',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subInfo: {
    flex: 1,
    paddingRight: 16,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subDesc: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38EF7D',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  projectImage: {
    height: 200,
    marginBottom: 16,
    borderRadius: 16,
  },
  projectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  projectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  projectBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  projectPriceBadge: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectPriceText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  projectBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  projectName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  projectLoc: {
    color: '#ddd',
    fontSize: 14,
  },
  buyBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buyBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
