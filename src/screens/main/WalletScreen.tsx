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
  TextInput,
} from 'react-native';
import {
  useWallet,
  useTransactions,
  usePayoutToUPI,
  useRedeemVoucher,
} from '../../hooks/useFirebaseData';
import { useToast } from '../../contexts/ToastContext';
import {
  ArrowLeft,
  Wallet,
  Gift,
  Storefront,
  HandHeart,
  Coins,
  Lightning,
  CheckCircle,
} from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

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

const VOUCHER_OPTIONS = [
  {
    id: 'AMAZON_IN',
    name: 'Amazon Pay India',
    emoji: '🛍️',
    denomination: 250,
    currency: 'INR',
    costCents: 313,
  },
  {
    id: 'FLIPKART',
    name: 'Flipkart Voucher',
    emoji: '🛒',
    denomination: 250,
    currency: 'INR',
    costCents: 313,
  },
  {
    id: 'SWIGGY',
    name: 'Swiggy Food Money',
    emoji: '🍔',
    denomination: 150,
    currency: 'INR',
    costCents: 188,
  },
  {
    id: 'GLOBAL_VISA',
    name: 'Prepaid Visa (Global)',
    emoji: '💳',
    denomination: 5,
    currency: 'USD',
    costCents: 500,
  },
];

export default function WalletScreen({ navigation }: Props) {
  const wallet = useWallet();
  const transactions = useTransactions();
  const balanceCents = wallet?.balanceCents ?? 0;
  const [activeTab, setActiveTab] = useState<'rewards' | 'donate'>('rewards');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiAmount, setSelectedUpiAmount] = useState<number>(100);

  const { payout, isLoading: isUpiLoading } = usePayoutToUPI();
  const { redeemVoucher, isLoading: isVoucherLoading } = useRedeemVoucher();
  const { showToast } = useToast();

  const approxINR = Math.round(balanceCents / 1.25);

  const handleUpiTransfer = async () => {
    if (!upiId.trim()) {
      Alert.alert(
        'UPI ID Required',
        'Please enter your UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm).',
      );
      return;
    }

    const neededCents = Math.round(selectedUpiAmount * 1.25);
    if (balanceCents < neededCents) {
      Alert.alert(
        'Insufficient Balance',
        `You need $${(neededCents / 100).toFixed(2)} to withdraw ₹${selectedUpiAmount}.`,
      );
      return;
    }

    try {
      const res = await payout(selectedUpiAmount, upiId.trim());
      if (res.success) {
        showToast(
          `₹${selectedUpiAmount} transferred via UPI! Ref: ${res.referenceId.slice(-6)}`,
          'success',
        );
        setUpiId('');
      }
    } catch (err: any) {
      Alert.alert('Transfer Error', err.message || 'Failed to complete UPI transfer.');
    }
  };

  const handleRedeemVoucher = async (voucher: (typeof VOUCHER_OPTIONS)[0]) => {
    if (balanceCents < voucher.costCents) {
      Alert.alert('Insufficient Funds', 'You need more Kindred Cash to redeem this voucher.');
      return;
    }

    Alert.alert(
      `Redeem ${voucher.name}?`,
      `Spend $${(voucher.costCents / 100).toFixed(2)} for ${voucher.currency === 'INR' ? '₹' : '$'}${voucher.denomination} ${voucher.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem Now',
          onPress: async () => {
            try {
              const res = await redeemVoucher({
                productId: voucher.id,
                denomination: voucher.denomination,
                currency: voucher.currency as any,
              });
              if (res.success) {
                const codeMsg = res.voucherCode ? `\nCode: ${res.voucherCode}` : '';
                Alert.alert(
                  'Voucher Redeemed! 🎉',
                  `${voucher.name} ready.${codeMsg}\nDetails sent to your email.`,
                );
                showToast(`${voucher.name} redeemed!`, 'success');
              }
            } catch (err: any) {
              Alert.alert('Redemption Failed', err.message || 'Unable to process voucher.');
            }
          },
        },
      ],
    );
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

    const defaultDonation = Math.min(balanceCents, 500); // Up to $5.00 or current balance
    Alert.alert(
      `Donate to ${item.name}`,
      `Donate $${(defaultDonation / 100).toFixed(2)} to support ${item.cause}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Donate $${(defaultDonation / 100).toFixed(2)}`,
          onPress: () => {
            Alert.alert(
              'Thank You! 💚',
              `You have successfully pledged $${(defaultDonation / 100).toFixed(2)} to ${item.name}.`,
            );
          },
        },
      ],
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
          <Text style={styles.balanceSubtext}>
            ≈ ₹{approxINR} INR · Earned from verified impact
          </Text>
        </View>

        {/* Instant UPI Transfer Card (Cashfree) */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutHeader}>
            <Lightning size={20} color='#38EF7D' weight='fill' />
            <Text style={styles.payoutTitle}>Instant UPI Cashout</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Cashfree</Text>
            </View>
          </View>
          <Text style={styles.payoutSubtext}>
            Transfer cash directly to your Indian bank account 24/7
          </Text>

          <TextInput
            style={styles.upiInput}
            placeholder='Enter UPI ID (e.g. mobile@upi or name@okaxis)'
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={upiId}
            onChangeText={setUpiId}
            autoCapitalize='none'
            autoCorrect={false}
          />

          <View style={styles.chipRow}>
            {[50, 100, 250, 500].map(amt => (
              <TouchableOpacity
                key={amt}
                style={[styles.chip, selectedUpiAmount === amt && styles.chipActive]}
                onPress={() => setSelectedUpiAmount(amt)}
              >
                <Text style={[styles.chipText, selectedUpiAmount === amt && styles.chipTextActive]}>
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryActionBtn, isUpiLoading && styles.btnDisabled]}
            onPress={handleUpiTransfer}
            disabled={isUpiLoading}
          >
            {isUpiLoading ? (
              <ActivityIndicator size='small' color='#000' />
            ) : (
              <Text style={styles.primaryActionText}>Transfer ₹{selectedUpiAmount} to Bank</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Digital Vouchers Section (Xoxoday Plum) */}
        <View style={styles.voucherSection}>
          <View style={styles.voucherHeader}>
            <Gift size={20} color='#FF6B9D' weight='duotone' />
            <Text style={styles.voucherTitle}>Digital Vouchers</Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(255, 107, 157, 0.2)' }]}>
              <Text style={[styles.badgeText, { color: '#FF6B9D' }]}>Xoxoday</Text>
            </View>
          </View>
          <Text style={styles.voucherSubtext}>Redeem instant gift vouchers (India & Global)</Text>

          <View style={styles.voucherGrid}>
            {VOUCHER_OPTIONS.map(v => {
              const affordable = balanceCents >= v.costCents;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.voucherCard, !affordable && styles.voucherCardDisabled]}
                  onPress={() => handleRedeemVoucher(v)}
                  disabled={!affordable || isVoucherLoading}
                >
                  <Text style={styles.voucherEmoji}>{v.emoji}</Text>
                  <Text style={styles.voucherName} numberOfLines={1}>
                    {v.name}
                  </Text>
                  <Text style={styles.voucherDenom}>
                    {v.currency === 'INR' ? '₹' : '$'}
                    {v.denomination}
                  </Text>
                  <Text style={styles.voucherCost}>${(v.costCents / 100).toFixed(2)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tabs for Brand Rewards & Local Causes */}
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
  },
  balanceLabel: { color: '#8E8E93', fontSize: 14, marginTop: 12, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  balanceSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 6 },

  payoutCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.2)',
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  payoutTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  badge: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  badgeText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  payoutSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 },
  upiInput: {
    backgroundColor: '#2C2C2E',
    color: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: '#38EF7D' },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chipTextActive: { color: '#000' },
  primaryActionBtn: {
    backgroundColor: '#38EF7D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: { color: '#000', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },

  voucherSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.2)',
  },
  voucherHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  voucherTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  voucherSubtext: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 14 },
  voucherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voucherCard: {
    width: '48%',
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  voucherCardDisabled: { opacity: 0.4 },
  voucherEmoji: { fontSize: 28, marginBottom: 4 },
  voucherName: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  voucherDenom: { color: '#FF6B9D', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  voucherCost: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
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
  historySection: { marginTop: 20 },
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
});
