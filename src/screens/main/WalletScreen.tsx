import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWallet, useRedeemGiftCard } from '../../hooks/useFirebaseData';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Wallet, Gift, Storefront, HandHeart, Coins } from 'phosphor-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Wallet'>;

const MOCK_BRANDS = [
  { id: 'b1', name: 'Patagonia', offer: '30% Off Storewide', costCents: 500, emoji: '🏔️' },
  { id: 'b2', name: 'Allbirds', offer: 'Free Shipping + 15% Off', costCents: 300, emoji: '👟' },
  { id: 'b3', name: 'Beyond Meat', offer: 'Buy 1 Get 1 Free Coupon', costCents: 200, emoji: '🍔' },
];

const MOCK_CHARITIES = [
  { id: 'c1', name: 'Brooklyn Community Garden', cause: 'Urban Agriculture', emoji: '🌻' },
  { id: 'c2', name: 'Local Public School', cause: 'School Supplies', emoji: '🎒' },
  { id: 'c3', name: 'City Animal Shelter', cause: 'Pet Rescue & Care', emoji: '🐕' },
];

export default function WalletScreen({ navigation }: Props) {
  const wallet = useWallet();
  const balanceCents = wallet?.balanceCents ?? 0;
  const transactions = (wallet as any)?.transactions ?? [];
  const [activeTab, setActiveTab] = useState<'rewards' | 'donate'>('rewards');
  const { redeem, isLoading } = useRedeemGiftCard();
  const { showToast } = useToast();

  const GIFT_PRESETS = [
    { label: '$5', cents: 500 },
    { label: '$10', cents: 1000 },
    { label: '$25', cents: 2500 },
  ];

  const handleRedeemGiftCard = async (amountCents: number) => {
    if (balanceCents < amountCents) {
      Alert.alert('Insufficient Funds', 'You need more Kindred Cash to redeem this gift card.');
      return;
    }

    try {
      const result = await redeem(amountCents);
      if (result.success) {
        showToast(`Gift card for $${(amountCents / 100).toFixed(2)} ordered!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to redeem gift card.', 'error');
    }
  };

  const handleRedeem = (item: (typeof MOCK_BRANDS)[0]) => {
    if (balanceCents < item.costCents) {
      Alert.alert('Insufficient Funds', 'You need more Kindred Cash to redeem this offer.');
      return;
    }

    Alert.alert(
      'Redeem Offer',
      `Are you sure you want to spend $${(item.costCents / 100).toFixed(2)} on ${item.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => {
            // dispatch(spendBalance({ amountCents: item.costCents, description: `Redeemed ${item.name} Offer` }));
            Alert.alert(
              'Success!',
              `You have unlocked the ${item.offer}. A code will be sent to your email.`,
            );
          },
        },
      ],
    );
  };

  const handleDonate = (item: (typeof MOCK_CHARITIES)[0]) => {
    if (balanceCents <= 0) {
      Alert.alert('Insufficient Funds', 'You need Kindred Cash to make a donation.');
      return;
    }

    Alert.prompt(
      'Donate to ' + item.name,
      `Enter amount to donate (Available: $${(balanceCents / 100).toFixed(2)})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Donate',
          onPress: value => {
            const amount = parseFloat(value ?? '0');
            const cents = Math.floor(amount * 100);
            if (isNaN(cents) || cents <= 0 || cents > balanceCents) {
              Alert.alert('Invalid Amount', 'Please enter a valid amount within your balance.');
              return;
            }
            // dispatch(spendBalance({ amountCents: cents, description: `Donation to ${item.name}` }));
            Alert.alert(
              'Thank You! 💚',
              `You have successfully donated $${(cents / 100).toFixed(2)} to ${item.name}.`,
            );
          },
        },
      ],
      'plain-text',
      (balanceCents / 100).toFixed(2),
      'decimal-pad',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color='#fff' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impact Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Wallet size={32} color='#38EF7D' weight='duotone' />
          <Text style={styles.balanceLabel}>Available Kindred Cash</Text>
          <Text style={styles.balanceAmount}>${(balanceCents / 100).toFixed(2)}</Text>
          <Text style={styles.balanceSubtext}>Earned from your impact activities</Text>
        </View>

        {/* Redeem Gift Cards */}
        <View style={styles.giftCardSection}>
          <View style={styles.giftCardHeader}>
            <Gift size={20} color='#FF6B9D' weight='duotone' />
            <Text style={styles.giftCardTitle}>Redeem Gift Cards</Text>
          </View>
          <Text style={styles.giftCardSubtext}>Swap your Kindred Cash for a digital gift card</Text>
          <View style={styles.giftPresetRow}>
            {GIFT_PRESETS.map(preset => {
              const affordable = balanceCents >= preset.cents;
              return (
                <TouchableOpacity
                  key={preset.cents}
                  style={[styles.giftPresetBtn, !affordable && styles.giftPresetBtnDisabled]}
                  onPress={() => handleRedeemGiftCard(preset.cents)}
                  disabled={!affordable || isLoading}
                  activeOpacity={0.7}
                >
                  {isLoading ? (
                    <ActivityIndicator size='small' color='#fff' />
                  ) : (
                    <Text
                      style={[
                        styles.giftPresetLabel,
                        !affordable && styles.giftPresetLabelDisabled,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'rewards' && styles.tabBtnActive]}
            onPress={() => setActiveTab('rewards')}
          >
            <Storefront
              size={20}
              color={activeTab === 'rewards' ? '#000' : '#8E8E93'}
              weight={activeTab === 'rewards' ? 'fill' : 'regular'}
            />
            <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
              Brand Rewards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'donate' && styles.tabBtnActive]}
            onPress={() => setActiveTab('donate')}
          >
            <HandHeart
              size={20}
              color={activeTab === 'donate' ? '#000' : '#8E8E93'}
              weight={activeTab === 'donate' ? 'fill' : 'regular'}
            />
            <Text style={[styles.tabText, activeTab === 'donate' && styles.tabTextActive]}>
              Local Impact
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'rewards' ? (
          <View>
            <Text style={styles.sectionTitle}>Sustainable Partners</Text>
            {MOCK_BRANDS.map(brand => (
              <View key={brand.id} style={styles.itemCard}>
                <View style={styles.itemEmojiBox}>
                  <Text style={styles.itemEmoji}>{brand.emoji}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{brand.name}</Text>
                  <Text style={styles.itemDesc}>{brand.offer}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleRedeem(brand)}>
                  <Text style={styles.actionBtnText}>${(brand.costCents / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Support Your Community</Text>
            {MOCK_CHARITIES.map(charity => (
              <View key={charity.id} style={styles.itemCard}>
                <View style={styles.itemEmojiBox}>
                  <Text style={styles.itemEmoji}>{charity.emoji}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{charity.name}</Text>
                  <Text style={styles.itemDesc}>{charity.cause}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtnAlt} onPress={() => handleDonate(charity)}>
                  <Text style={styles.actionBtnTextAlt}>Donate</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {transactions.slice(0, 5).map(tx => (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Coins size={20} color={tx.type === 'EARN' ? '#38EF7D' : '#FF416C'} />
                  <Text style={styles.txDesc}>{tx.description}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'EARN' ? '#38EF7D' : '#fff' }]}>
                  {tx.type === 'EARN' ? '+' : '-'}${(tx.amountCents / 100).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  container: { flex: 1 },
  content: { padding: 16 },
  balanceCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.2)',
  },
  balanceLabel: { color: '#8E8E93', fontSize: 14, marginTop: 12, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  balanceSubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: { backgroundColor: '#fff' },
  tabText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#000' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  itemEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemEmoji: { fontSize: 24 },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemDesc: { color: '#8E8E93', fontSize: 13 },
  actionBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  actionBtnAlt: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  actionBtnTextAlt: { color: '#38EF7D', fontWeight: '700', fontSize: 14 },
  historySection: { marginTop: 24 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txDesc: { color: '#fff', fontSize: 15 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  giftCardSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)',
  },
  giftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  giftCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  giftCardSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 16,
  },
  giftPresetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  giftPresetBtn: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftPresetBtnDisabled: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
  },
  giftPresetLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  giftPresetLabelDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
