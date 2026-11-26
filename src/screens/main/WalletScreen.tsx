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
  Modal,
  Share,
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
  Coins,
  Lightning,
  CheckCircle,
  PawPrint,
  ShieldCheck,
  ShareNetwork,
  X,
  Sparkle,
  CaretRight,
} from 'phosphor-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RescueShelter, MealReceipt } from '../../data/rescueShelterData';
import { RESCUE_SHELTERS, DonationTier } from '../../data/rescueShelterData';

type Props = NativeStackScreenProps<any, 'Wallet'>;

const MOCK_BRANDS = [
  { id: 'b1', name: 'Patagonia', offer: '30% Off Storewide', costCents: 500, emoji: '🏔️' },
  { id: 'b2', name: 'Allbirds', offer: 'Free Shipping + 15% Off', costCents: 300, emoji: '👟' },
  { id: 'b3', name: 'Beyond Meat', offer: 'Buy 1 Get 1 Free Coupon', costCents: 200, emoji: '🍔' },
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

const RESCUE_CATEGORIES = ['All', 'Pets', 'Wildlife', 'Marine', 'Farm Sanctuary'] as const;

export default function WalletScreen({ navigation, route }: Props) {
  const wallet = useWallet();
  const transactions = useTransactions();
  const initialTab = route?.params?.initialTab === 'donate' ? 'donate' : 'rewards';
  const targetShelterId = route?.params?.shelterId;

  const [activeTab, setActiveTab] = useState<'rewards' | 'donate'>(initialTab);
  const [upiId, setUpiId] = useState('');
  const [selectedUpiAmount, setSelectedUpiAmount] = useState<number>(100);

  // Local balance deductions & custom donations
  const [localDeductionCents, setLocalDeductionCents] = useState<number>(0);
  const baseBalance = wallet?.balanceCents ?? 0;
  const balanceCents = Math.max(0, baseBalance - localDeductionCents);

  // Rescue Shelters state
  const [shelters, setShelters] = useState<RescueShelter[]>(RESCUE_SHELTERS);
  const [selectedRescueCategory, setSelectedRescueCategory] =
    useState<(typeof RESCUE_CATEGORIES)[number]>('All');
  const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    RESCUE_SHELTERS.forEach(s => {
      map[s.id] = s.donationTiers[0]?.id || 'tier-1';
    });
    return map;
  });
  const [celebrationModal, setCelebrationModal] = useState<{
    receipt: MealReceipt;
    shelterName: string;
    tierTitle: string;
    certId: string;
  } | null>(null);
  const [totalMealsFunded, setTotalMealsFunded] = useState<number>(74620);

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

  const handleSelectTier = (shelterId: string, tierId: string) => {
    setSelectedTiers(prev => ({
      ...prev,
      [shelterId]: tierId,
    }));
  };

  const handleRescueDonate = (shelter: RescueShelter) => {
    const selectedTierId = selectedTiers[shelter.id] || shelter.donationTiers[0]?.id;
    const tier =
      shelter.donationTiers.find(t => t.id === selectedTierId) || shelter.donationTiers[0];
    const cost = tier.costCents;
    const mealsCount = Math.max(1, Math.round(cost / 100));

    const sampleAnimals: Record<string, string[]> = {
      'shelter-1': ['Buster', 'Luna', 'Rocky', 'Oliver', 'Daisy'],
      'shelter-2': ['Barnaby (Owl)', 'Rusty (Fox)', 'Pip (Hedgehog)', 'Hazel (Hare)'],
      'shelter-3': ['Coral (Sea Turtle)', 'Splash (Seal Pup)', 'Finn (Otter)', 'Sunny (Dolphin)'],
      'shelter-4': ['Barnaby (Calf)', 'Clover (Lamb)', 'Henrietta (Hen)', 'Penny (Goat)'],
    };
    const pool = sampleAnimals[shelter.id] || ['Bella', 'Charlie', 'Milo'];
    const chosenAnimal = pool[Math.floor(Math.random() * pool.length)];

    const processDonation = (isDemoSponsor = false) => {
      if (!isDemoSponsor) {
        setLocalDeductionCents(prev => prev + cost);
      }
      setTotalMealsFunded(prev => prev + mealsCount);

      const certId = `KINDRED-${Math.floor(100000 + Math.random() * 900000)}`;
      const newReceipt: MealReceipt = {
        id: `rcpt-${Date.now()}`,
        donorName: 'You (Kindred)',
        animalName: chosenAnimal,
        timeAgo: 'Just now',
        mealsCount,
        emoji: shelter.avatar,
        note: `Funded ${tier.impactTitle}! Fresh bowl delivered with care.`,
      };

      setShelters(prev =>
        prev.map(s => {
          if (s.id === shelter.id) {
            return {
              ...s,
              mealsFundedTotal: s.mealsFundedTotal + mealsCount,
              recentReceipts: [newReceipt, ...s.recentReceipts],
            };
          }
          return s;
        }),
      );

      setCelebrationModal({
        receipt: newReceipt,
        shelterName: shelter.name,
        tierTitle: tier.impactTitle,
        certId,
      });

      showToast(`🐾 Meal funded for ${chosenAnimal}! Certificate generated.`, 'success');
    };

    if (balanceCents < cost) {
      Alert.alert(
        'Sponsor Rescue Meal',
        `Your Kindred Cash balance is $${(balanceCents / 100).toFixed(2)}. Would you like to sponsor ${tier.impactTitle} ($${(cost / 100).toFixed(2)}) using Kindred Community Match Fund?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '🐾 Sponsor via Match Fund',
            onPress: () => processDonation(true),
          },
        ],
      );
      return;
    }

    Alert.alert(
      `Feed Animals at ${shelter.name}`,
      `Donate $${(cost / 100).toFixed(2)} to fund ${tier.impactTitle} (${mealsCount} meal bowl${mealsCount > 1 ? 's' : ''})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `🐾 Feed with $${(cost / 100).toFixed(2)}`,
          onPress: () => processDonation(false),
        },
      ],
    );
  };

  const handleShareCertificate = async () => {
    if (!celebrationModal) return;
    try {
      await Share.share({
        message: `I just funded ${celebrationModal.receipt.mealsCount} rescue meal(s) for ${celebrationModal.receipt.animalName} at ${celebrationModal.shelterName} using @KindredApp! 🐾 Join me in supporting verified local animal rescues: https://kindred.eco/rescue/${celebrationModal.certId}`,
      });
    } catch {
      // User cancelled share
    }
  };

  const filteredShelters =
    selectedRescueCategory === 'All'
      ? shelters
      : shelters.filter(s => s.category === selectedRescueCategory);

  const allRecentReceipts = React.useMemo(() => {
    const list: (MealReceipt & { shelterName: string })[] = [];
    shelters.forEach(s => {
      s.recentReceipts.slice(0, 2).forEach(r => {
        list.push({ ...r, shelterName: s.name });
      });
    });
    return list.sort((a, b) => {
      if (a.timeAgo === 'Just now') return -1;
      if (b.timeAgo === 'Just now') return 1;
      return 0;
    });
  }, [shelters]);

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

        {/* Tabs for Brand Rewards & Animal Rescue Impact */}
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
            <PawPrint
              size={20}
              color={activeTab === 'donate' ? '#000' : '#8E8E93'}
              weight={activeTab === 'donate' ? 'fill' : 'regular'}
            />
            <Text style={[styles.tabText, activeTab === 'donate' && styles.tabTextActive]}>
              🐾 Animal Rescues
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
          <View style={styles.rescueHubContainer}>
            {/* Rescue Hub Hero Banner */}
            <View style={styles.rescueHeroCard}>
              <View style={styles.rescueHeroHeader}>
                <View style={styles.rescueHeroBadge}>
                  <PawPrint size={14} color='#FF6B8B' weight='fill' />
                  <Text style={styles.rescueHeroBadgeText}>Local NGO & Shelter Fund</Text>
                </View>
                <View style={styles.verifiedTag}>
                  <ShieldCheck size={14} color='#38EF7D' weight='fill' />
                  <Text style={styles.verifiedTagText}>100% Direct-to-Bowl</Text>
                </View>
              </View>

              <Text style={styles.rescueHeroTitle}>Feed & Heal Rescue Animals</Text>
              <Text style={styles.rescueHeroDesc}>
                Turn your Kindred Cash or eco-points into life-saving meals, emergency medicine, and
                warm bedding for street animals and native wildlife.
              </Text>

              <View style={styles.rescueHeroStats}>
                <View style={styles.rescueHeroStatItem}>
                  <Text style={styles.rescueHeroStatVal}>{totalMealsFunded.toLocaleString()}</Text>
                  <Text style={styles.rescueHeroStatLbl}>Meals Funded 🐾</Text>
                </View>
                <View style={styles.rescueHeroStatDivider} />
                <View style={styles.rescueHeroStatItem}>
                  <Text style={styles.rescueHeroStatVal}>$1.00</Text>
                  <Text style={styles.rescueHeroStatLbl}>= 1 Full Bowl</Text>
                </View>
                <View style={styles.rescueHeroStatDivider} />
                <View style={styles.rescueHeroStatItem}>
                  <Text style={styles.rescueHeroStatVal}>4 Shelters</Text>
                  <Text style={styles.rescueHeroStatLbl}>Verified Nearby</Text>
                </View>
              </View>

              {/* Swipe to Save Banner */}
              <TouchableOpacity
                testID='wallet-swipe-to-save-banner'
                style={styles.swipeToSaveBanner}
                onPress={() => navigation.navigate('RescueSwipe')}
              >
                <View style={styles.swipeBannerLeft}>
                  <Text style={styles.swipeBannerEmoji}>🐾</Text>
                  <View style={styles.swipeBannerInfo}>
                    <View style={styles.swipeBannerTagRow}>
                      <Text style={styles.swipeBannerBadge}>NEW · SWIPE TO SAVE</Text>
                    </View>
                    <Text style={styles.swipeBannerTitle}>Fund Urgent Animal Bills</Text>
                    <Text style={styles.swipeBannerSub}>
                      Swipe right on cards to sponsor $3–$15 vet bills
                    </Text>
                  </View>
                </View>
                <CaretRight size={18} color='#FF6B8B' weight='bold' />
              </TouchableOpacity>

              {/* Sanctuary Assurance Emergency Pool Banner */}
              <TouchableOpacity
                testID='wallet-assurance-pool-banner'
                style={styles.assurancePoolBanner}
                onPress={() => navigation.navigate('SanctuaryAssurance')}
              >
                <View style={styles.swipeBannerLeft}>
                  <Text style={styles.swipeBannerEmoji}>🛡️</Text>
                  <View style={styles.swipeBannerInfo}>
                    <View style={styles.swipeBannerTagRow}>
                      <Text style={[styles.swipeBannerBadge, { color: '#38EF7D' }]}>
                        DECENTRALIZED HEALTH POOL · $52.4K RESERVES
                      </Text>
                    </View>
                    <Text style={styles.swipeBannerTitle}>Sanctuary Emergency Pool</Text>
                    <Text style={styles.swipeBannerSub}>
                      Cryptographic mutual-aid insuring 1,840 rescued animals
                    </Text>
                  </View>
                </View>
                <CaretRight size={18} color='#38EF7D' weight='bold' />
              </TouchableOpacity>
            </View>

            {/* Rescue Categories */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.rescueCatScroll}
              contentContainerStyle={styles.rescueCatContainer}
            >
              {RESCUE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.rescueCatChip,
                    selectedRescueCategory === cat && styles.rescueCatChipActive,
                  ]}
                  onPress={() => setSelectedRescueCategory(cat)}
                >
                  <Text
                    style={[
                      styles.rescueCatChipText,
                      selectedRescueCategory === cat && styles.rescueCatChipTextActive,
                    ]}
                  >
                    {cat === 'All' ? '🐾 All Rescues' : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Verified Shelters List */}
            <Text style={styles.sectionTitle}>Verified Rescue Sanctuaries</Text>
            {filteredShelters.map(shelter => {
              const activeTierId =
                selectedTiers[shelter.id] || shelter.donationTiers[0]?.id || 'tier-1';
              const activeTier =
                shelter.donationTiers.find(t => t.id === activeTierId) || shelter.donationTiers[0];

              return (
                <View key={shelter.id} style={styles.shelterCard}>
                  {/* Shelter Header */}
                  <View style={styles.shelterHeader}>
                    <View style={styles.shelterAvatarBox}>
                      <Text style={styles.shelterAvatar}>{shelter.avatar}</Text>
                    </View>
                    <View style={styles.shelterHeaderInfo}>
                      <View style={styles.shelterTitleRow}>
                        <Text style={styles.shelterName}>{shelter.name}</Text>
                        {shelter.verified && (
                          <View style={styles.shelterVerifiedPill}>
                            <ShieldCheck size={12} color='#38EF7D' weight='fill' />
                            <Text style={styles.shelterVerifiedText}>Verified</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.shelterSub}>
                        {shelter.cause} · {shelter.distanceKm} km away
                      </Text>
                      <View style={styles.shelterImpactRow}>
                        <PawPrint size={13} color='#FF6B8B' weight='fill' />
                        <Text style={styles.shelterImpactText}>
                          {shelter.mealsFundedTotal.toLocaleString()} meals funded to date
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Shelter Description */}
                  <Text style={styles.shelterDesc}>{shelter.description}</Text>

                  {/* Donation Tiers */}
                  <Text style={styles.tierSectionLabel}>Choose Impact Tier:</Text>
                  <View style={styles.tierRow}>
                    {shelter.donationTiers.map(tier => {
                      const isSelected = activeTier.id === tier.id;
                      return (
                        <TouchableOpacity
                          key={tier.id}
                          style={[styles.tierChip, isSelected && styles.tierChipActive]}
                          onPress={() => handleSelectTier(shelter.id, tier.id)}
                        >
                          <Text
                            style={[
                              styles.tierChipPoints,
                              isSelected && styles.tierChipPointsActive,
                            ]}
                          >
                            ${(tier.costCents / 100).toFixed(2)}
                          </Text>
                          <Text
                            style={[styles.tierChipTitle, isSelected && styles.tierChipTitleActive]}
                            numberOfLines={1}
                          >
                            {tier.impactTitle.split(' ')[0]} {tier.impactTitle.split(' ')[1] || ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Selected Tier Impact Highlight */}
                  <View style={styles.tierDetailBox}>
                    <Text style={styles.tierDetailTitle}>✨ {activeTier.impactTitle}</Text>
                    <Text style={styles.tierDetailDesc}>{activeTier.impactDescription}</Text>
                  </View>

                  {/* Donate CTA */}
                  <TouchableOpacity
                    style={styles.feedMealBtn}
                    onPress={() => handleRescueDonate(shelter)}
                  >
                    <PawPrint size={18} color='#fff' weight='fill' />
                    <Text style={styles.feedMealBtnText}>
                      Feed Rescue Animal · ${(activeTier.costCents / 100).toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Live Meal-Proof Stream */}
            <View style={styles.liveStreamSection}>
              <View style={styles.liveStreamHeader}>
                <PawPrint size={18} color='#38EF7D' weight='fill' />
                <Text style={styles.liveStreamTitle}>Live Rescue Meal Deliveries</Text>
                <View style={styles.liveDot} />
              </View>
              <Text style={styles.liveStreamSub}>
                Real-time bowls and medical packages delivered to verified shelters
              </Text>

              {allRecentReceipts.map(rcpt => (
                <View key={rcpt.id} style={styles.streamItem}>
                  <View style={styles.streamEmojiBox}>
                    <Text style={styles.streamEmoji}>{rcpt.emoji}</Text>
                  </View>
                  <View style={styles.streamContent}>
                    <View style={styles.streamTopRow}>
                      <Text style={styles.streamDonor}>
                        {rcpt.donorName} fed {rcpt.animalName}
                      </Text>
                      <Text style={styles.streamTime}>{rcpt.timeAgo}</Text>
                    </View>
                    <Text style={styles.streamNote}>{rcpt.note}</Text>
                    <View style={styles.streamBadge}>
                      <CheckCircle size={12} color='#38EF7D' weight='fill' />
                      <Text style={styles.streamBadgeText}>
                        {rcpt.mealsCount} bowl{rcpt.mealsCount > 1 ? 's' : ''} at {rcpt.shelterName}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
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

      {/* Celebratory Impact Receipt Modal */}
      {celebrationModal && (
        <Modal
          visible={true}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setCelebrationModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCelebrationModal(null)}
              >
                <X size={20} color='#fff' />
              </TouchableOpacity>

              <View style={styles.modalAvatarContainer}>
                <Text style={styles.modalAvatarEmoji}>{celebrationModal.receipt.emoji}</Text>
                <View style={styles.modalSparkleBadge}>
                  <Sparkle size={14} color='#FFD700' weight='fill' />
                </View>
              </View>

              <Text style={styles.modalTitle}>Rescue Meal Funded! 🐾</Text>
              <Text style={styles.modalSubtitle}>
                Official Kindred Animal Protection Certificate
              </Text>

              {/* Certificate Box */}
              <View style={styles.certBox}>
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Recipient Animal:</Text>
                  <Text style={styles.certValue}>{celebrationModal.receipt.animalName}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Sanctuary / Shelter:</Text>
                  <Text style={styles.certValue}>{celebrationModal.shelterName}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Impact Tier:</Text>
                  <Text style={styles.certValue}>{celebrationModal.tierTitle}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Bowls Provided:</Text>
                  <Text style={[styles.certValue, { color: '#38EF7D' }]}>
                    {celebrationModal.receipt.mealsCount} Nutritious Meal(s)
                  </Text>
                </View>
                <View style={styles.certDivider} />
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Certificate ID:</Text>
                  <Text style={styles.certCode}>{celebrationModal.certId}</Text>
                </View>
                <View style={styles.certRow}>
                  <Text style={styles.certLabel}>Verification:</Text>
                  <Text style={styles.certVerified}>✓ 100% Direct-to-Bowl Verified</Text>
                </View>
              </View>

              <Text style={styles.modalPersonalNote}>
                "{celebrationModal.receipt.animalName} is enjoying a fresh nutritious meal tonight
                thanks to your kindness and dedication to animal welfare."
              </Text>

              {/* Actions */}
              <TouchableOpacity style={styles.shareBtn} onPress={handleShareCertificate}>
                <ShareNetwork size={18} color='#000' weight='bold' />
                <Text style={styles.shareBtnText}>Share Impact Certificate</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.doneBtn} onPress={() => setCelebrationModal(null)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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

  /* Animal Rescue & Shelter Hub Styles */
  rescueHubContainer: { marginBottom: 16 },
  rescueHeroCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 139, 0.35)',
  },
  rescueHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rescueHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 139, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rescueHeroBadgeText: { color: '#FF6B8B', fontSize: 12, fontWeight: '700' },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedTagText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  rescueHeroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  rescueHeroDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  rescueHeroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#262628',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  rescueHeroStatItem: { flex: 1, alignItems: 'center' },
  rescueHeroStatVal: { color: '#fff', fontSize: 16, fontWeight: '800' },
  rescueHeroStatLbl: { color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 },
  rescueHeroStatDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },

  swipeToSaveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 107, 139, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 139, 0.35)',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  swipeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  swipeBannerEmoji: {
    fontSize: 26,
  },
  swipeBannerInfo: {
    flex: 1,
  },
  swipeBannerTagRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  swipeBannerBadge: {
    color: '#FF6B8B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  swipeBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  swipeBannerSub: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 1,
  },
  assurancePoolBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },

  rescueCatScroll: { marginBottom: 16 },
  rescueCatContainer: { gap: 8, paddingVertical: 2 },
  rescueCatChip: {
    backgroundColor: '#262628',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rescueCatChipActive: {
    backgroundColor: 'rgba(255, 107, 139, 0.2)',
    borderColor: '#FF6B8B',
  },
  rescueCatChipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  rescueCatChipTextActive: { color: '#fff' },

  shelterCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shelterHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  shelterAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shelterAvatar: { fontSize: 26 },
  shelterHeaderInfo: { flex: 1 },
  shelterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shelterName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  shelterVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shelterVerifiedText: { color: '#38EF7D', fontSize: 10, fontWeight: '700' },
  shelterSub: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  shelterImpactRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  shelterImpactText: { color: '#FF6B8B', fontSize: 11, fontWeight: '600' },

  shelterDesc: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  tierSectionLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  tierRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tierChip: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tierChipActive: {
    backgroundColor: 'rgba(255, 107, 139, 0.2)',
    borderColor: '#FF6B8B',
  },
  tierChipPoints: { color: '#fff', fontSize: 14, fontWeight: '800' },
  tierChipPointsActive: { color: '#FF6B8B' },
  tierChipTitle: { color: '#8E8E93', fontSize: 11, marginTop: 2, textAlign: 'center' },
  tierChipTitleActive: { color: '#fff', fontWeight: '600' },

  tierDetailBox: {
    backgroundColor: '#262628',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  tierDetailTitle: { color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  tierDetailDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 11, lineHeight: 15 },

  feedMealBtn: {
    backgroundColor: '#FF6B8B',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feedMealBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  /* Live Stream Section */
  liveStreamSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.2)',
  },
  liveStreamHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  liveStreamTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38EF7D',
    marginLeft: 'auto',
  },
  liveStreamSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 },
  streamItem: {
    flexDirection: 'row',
    backgroundColor: '#262628',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  streamEmojiBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  streamEmoji: { fontSize: 18 },
  streamContent: { flex: 1 },
  streamTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  streamDonor: { color: '#fff', fontSize: 12, fontWeight: '700' },
  streamTime: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  streamNote: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4 },
  streamBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streamBadgeText: { color: '#38EF7D', fontSize: 10, fontWeight: '600' },

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

  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF6B8B',
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4 },
  modalAvatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FF6B8B',
  },
  modalAvatarEmoji: { fontSize: 40 },
  modalSparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 2,
  },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { color: '#8E8E93', fontSize: 12, marginBottom: 16 },

  certBox: {
    width: '100%',
    backgroundColor: '#262628',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  certLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  certValue: { color: '#fff', fontSize: 12, fontWeight: '700' },
  certCode: { color: '#FFD700', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  certVerified: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  certDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 8,
  },

  modalPersonalNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 17,
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  shareBtn: {
    backgroundColor: '#38EF7D',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '800' },
  doneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  doneBtnText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
});
