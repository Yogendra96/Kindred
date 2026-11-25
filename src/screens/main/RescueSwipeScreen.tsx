import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Share,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  Heart,
  X,
  Star,
  ArrowCounterClockwise,
  ShieldCheck,
  ShareNetwork,
  Sparkle,
  FileText,
  CheckCircle,
  PawPrint,
  Clock,
  FirstAid,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { AnimalRescueBill } from '../../data/rescueBillsData';
import { RESCUE_BILLS_DATA } from '../../data/rescueBillsData';
import type { AppStackParamList } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const BILL_CATEGORIES = [
  'All',
  'Nutrition',
  'Medical',
  'Emergency Surgery',
  'Shelter & Bedding',
] as const;

export const RescueSwipeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [bills, setBills] = useState<AnimalRescueBill[]>(RESCUE_BILLS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [passedHistory, setPassedHistory] = useState<AnimalRescueBill[]>([]);

  // Impact tracking
  const [sponsoredCount, setSponsoredCount] = useState<number>(0);
  const [totalFundedAmount, setTotalFundedAmount] = useState<number>(0);
  const [karmaEarned, setKarmaEarned] = useState<number>(0);

  // Modals
  const [invoiceModalBill, setInvoiceModalBill] = useState<AnimalRescueBill | null>(null);
  const [celebrationModal, setCelebrationModal] = useState<{
    bill: AnimalRescueBill;
    tier: 'standard' | 'super';
    certId: string;
  } | null>(null);

  // Animated position for swipe card
  const position = useRef(new Animated.ValueXY()).current;

  // Filtered bills based on category
  const filteredBills = useMemo(() => {
    if (selectedCategory === 'All') return bills;
    return bills.filter(b => b.billCategory === selectedCategory);
  }, [bills, selectedCategory]);

  const activeCard = filteredBills[currentIndex] || null;
  const nextCard = filteredBills[currentIndex + 1] || null;

  // Reset card animation position
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  // Swipe Action Handler
  const completeSwipe = (direction: 'left' | 'right' | 'up') => {
    const card = activeCard;
    if (!card) return;

    if (direction === 'right') {
      // Sponsor Bill
      handleSponsorBill(card, 'standard');
    } else if (direction === 'up') {
      // Super Guardian Sponsor
      handleSponsorBill(card, 'super');
    } else {
      // Pass for now
      setPassedHistory(prev => [card, ...prev]);
      showToast(`Skipped ${card.animalName}. Added to history.`, 'info');
      setCurrentIndex(prev => prev + 1);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handleSponsorBill = (bill: AnimalRescueBill, tier: 'standard' | 'super') => {
    const isSuper = tier === 'super';
    const amount = isSuper ? bill.totalBillAmount * 2 : bill.totalBillAmount;
    const karma = isSuper ? 120 : 50;

    setSponsoredCount(prev => prev + 1);
    setTotalFundedAmount(prev => prev + amount);
    setKarmaEarned(prev => prev + karma);

    // Update bill funded percentage
    setBills(prev =>
      prev.map(b =>
        b.id === bill.id ? { ...b, fundedPercent: Math.min(100, b.fundedPercent + 40) } : b,
      ),
    );

    const certId = `RESCUE-${bill.id.slice(5, 12).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    setCelebrationModal({
      bill,
      tier,
      certId,
    });

    showToast(
      isSuper
        ? `⭐ Super Guardian Sponsor! +${karma} Kindred Karma for ${bill.animalName}!`
        : `🐾 Sponsored ${bill.billTitle} for ${bill.animalName}! +${karma} Karma!`,
      'success',
    );

    setCurrentIndex(prev => prev + 1);
    position.setValue({ x: 0, y: 0 });
  };

  const handleRewind = () => {
    if (passedHistory.length === 0 && currentIndex === 0) {
      showToast('No previous bills to rewind.', 'info');
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setPassedHistory(prev => prev.slice(1));
      position.setValue({ x: 0, y: 0 });
      showToast('Restored previous animal rescue bill.', 'info');
    } else {
      showToast('Deck already at beginning.', 'info');
    }
  };

  const handleResetStack = () => {
    setCurrentIndex(0);
    setPassedHistory([]);
    position.setValue({ x: 0, y: 0 });
    showToast('Reset urgent animal bills deck! 🔄', 'info');
  };

  // PanResponder for card drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => completeSwipe('right'));
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => completeSwipe('left'));
        } else if (gesture.dy < -SWIPE_THRESHOLD && Math.abs(gesture.dx) < 80) {
          Animated.timing(position, {
            toValue: { x: gesture.dx, y: -SCREEN_WIDTH },
            duration: 250,
            useNativeDriver: false,
          }).start(() => completeSwipe('up'));
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  // Rotation and Stamp Interpolations
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-25deg', '0deg', '25deg'],
  });

  const animatedCardStyle = {
    transform: [...position.getTranslateTransform(), { rotate }],
  };

  const sponsorOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const passOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const superOpacity = position.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleShareCertificate = async () => {
    if (!celebrationModal) return;
    try {
      await Share.share({
        message: `I just sponsored ${celebrationModal.bill.animalName} (${celebrationModal.bill.species}) at ${celebrationModal.bill.sanctuaryName} with @KindredApp! 🐾 Verify rescue invoice: https://kindred.eco/sponsor/${celebrationModal.certId}`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View style={styles.safeArea}>
      <SpaceBackground>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Go back'
          >
            <ArrowLeft size={22} color='#fff' />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <View style={styles.titleRow}>
              <PawPrint size={20} color='#FF6B8B' weight='fill' />
              <Text style={styles.headerTitle}>Swipe to Save</Text>
            </View>
            <Text style={styles.headerSubtitle}>Direct micro-bills for rescued animals</Text>
          </View>
          <View style={styles.karmaBadge}>
            <Sparkle size={14} color='#38EF7D' weight='fill' />
            <Text style={styles.karmaBadgeText}>+{karmaEarned} Karma</Text>
          </View>
        </View>

        {/* Category Pills */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {BILL_CATEGORIES.map(category => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  testID={`category-filter-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                  onPress={() => {
                    setSelectedCategory(category);
                    setCurrentIndex(0);
                    position.setValue({ x: 0, y: 0 });
                  }}
                >
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live Impact Stats Header */}
        <View style={styles.impactBar}>
          <View style={styles.impactStatItem}>
            <Text style={styles.impactStatVal}>{sponsoredCount}</Text>
            <Text style={styles.impactStatLabel}>Bills Funded</Text>
          </View>
          <View style={styles.impactDivider} />
          <View style={styles.impactStatItem}>
            <Text style={styles.impactStatVal}>${totalFundedAmount.toFixed(2)}</Text>
            <Text style={styles.impactStatLabel}>Given Directly</Text>
          </View>
          <View style={styles.impactDivider} />
          <View style={styles.impactStatItem}>
            <Text style={styles.impactStatVal}>
              {filteredBills.length - currentIndex > 0 ? filteredBills.length - currentIndex : 0}
            </Text>
            <Text style={styles.impactStatLabel}>Bills Awaiting</Text>
          </View>
        </View>

        {/* Card Stack Deck Area */}
        <View style={styles.deckContainer}>
          {activeCard ? (
            <View style={styles.cardStackWrapper}>
              {/* Background next card preview */}
              {nextCard && (
                <View style={[styles.card, styles.nextCardPreview]}>
                  <View style={styles.cardTopBar}>
                    <Text style={styles.animalEmoji}>{nextCard.speciesEmoji}</Text>
                    <View style={styles.animalTitleInfo}>
                      <Text style={styles.animalNameText}>{nextCard.animalName}</Text>
                      <Text style={styles.sanctuaryNameText}>{nextCard.sanctuaryName}</Text>
                    </View>
                    <View style={styles.billPriceBadge}>
                      <Text style={styles.billPriceText}>
                        ${nextCard.totalBillAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Active swipable card */}
              <Animated.View style={[styles.card, animatedCardStyle]} {...panResponder.panHandlers}>
                {/* Swipe Stamp Indicators */}
                <Animated.View
                  style={[styles.stampBox, styles.sponsorStamp, { opacity: sponsorOpacity }]}
                >
                  <Text style={styles.sponsorStampText}>SPONSOR 💚</Text>
                </Animated.View>

                <Animated.View
                  style={[styles.stampBox, styles.passStamp, { opacity: passOpacity }]}
                >
                  <Text style={styles.passStampText}>PASS ❌</Text>
                </Animated.View>

                <Animated.View
                  style={[styles.stampBox, styles.superStamp, { opacity: superOpacity }]}
                >
                  <Text style={styles.superStampText}>SUPER GUARDIAN ⭐</Text>
                </Animated.View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.cardScrollContent}
                >
                  {/* Top Bar: Animal Emoji, Name, Urgency, Sanctuary */}
                  <View style={styles.cardTopBar}>
                    <View style={styles.emojiContainer}>
                      <Text style={styles.animalEmoji}>{activeCard.speciesEmoji}</Text>
                    </View>
                    <View style={styles.animalTitleInfo}>
                      <View style={styles.nameUrgencyRow}>
                        <Text style={styles.animalNameText}>{activeCard.animalName}</Text>
                        <View
                          style={[
                            styles.urgencyBadge,
                            activeCard.urgentLevel === 'Immediate'
                              ? styles.urgencyImmediate
                              : activeCard.urgentLevel === 'High'
                                ? styles.urgencyHigh
                                : styles.urgencyStandard,
                          ]}
                        >
                          <Text style={styles.urgencyText}>{activeCard.urgentLevel}</Text>
                        </View>
                      </View>
                      <Text style={styles.sanctuaryLocationText}>
                        {activeCard.sanctuaryFlag} {activeCard.sanctuaryName} ·{' '}
                        {activeCard.sanctuaryLocation}
                      </Text>
                    </View>
                  </View>

                  {/* Main Bill Hero Box */}
                  <GlassCard style={styles.billHeroCard}>
                    <View style={styles.billHeroHeader}>
                      <View style={styles.billCategoryPill}>
                        <FirstAid size={13} color='#38EF7D' weight='fill' />
                        <Text style={styles.billCategoryText}>{activeCard.billCategory}</Text>
                      </View>
                      <View style={styles.daysLeftPill}>
                        <Clock size={12} color='#F2C94C' weight='fill' />
                        <Text style={styles.daysLeftText}>{activeCard.daysLeft}d left</Text>
                      </View>
                    </View>

                    <Text style={styles.billTitleText}>{activeCard.billTitle}</Text>

                    <View style={styles.billCostRow}>
                      <View>
                        <Text style={styles.billCostLabel}>Bill Total</Text>
                        <Text style={styles.billCostAmount}>
                          ${activeCard.totalBillAmount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.progressBarWrap}>
                        <View style={styles.progressTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${activeCard.fundedPercent}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressPercentText}>
                          {activeCard.fundedPercent}% funded by community
                        </Text>
                      </View>
                    </View>
                  </GlassCard>

                  {/* Story Section */}
                  <View style={styles.storySection}>
                    <Text style={styles.storySectionTitle}>Rescued Animal Story</Text>
                    <Text style={styles.storyBodyText}>{activeCard.story}</Text>
                  </View>

                  {/* Itemized Bill Preview */}
                  <View style={styles.itemizedSection}>
                    <Text style={styles.itemizedTitle}>Itemized Expenses</Text>
                    {activeCard.items.map((item, idx) => (
                      <View key={idx} style={styles.billItemRow}>
                        <CheckCircle size={14} color='#38EF7D' weight='fill' />
                        <Text style={styles.billItemName}>{item.name}</Text>
                        <Text style={styles.billItemPrice}>${item.cost.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Guardian Perk */}
                  <View style={styles.perkBox}>
                    <Sparkle size={16} color='#FF6B8B' weight='fill' />
                    <View style={styles.perkInfo}>
                      <Text style={styles.perkTitle}>Guardian Angel Reward</Text>
                      <Text style={styles.perkDesc}>{activeCard.guardianPerk}</Text>
                    </View>
                  </View>

                  {/* Invoice / Vet Verification Button */}
                  <TouchableOpacity
                    testID='view-invoice-btn'
                    style={styles.viewInvoiceBtn}
                    onPress={() => setInvoiceModalBill(activeCard)}
                  >
                    <FileText size={16} color='#8E8E93' />
                    <Text style={styles.viewInvoiceBtnText}>View Vet Invoice & Verification</Text>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </View>
          ) : (
            /* Empty State when stack completed */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <PawPrint size={48} color='#38EF7D' weight='fill' />
              </View>
              <Text style={styles.emptyTitle}>All Urgent Bills Funded! 🎉</Text>
              <Text style={styles.emptySub}>
                You reviewed all emergency bills in this category. Rescued animals eat and heal
                thanks to compassionate guardians like you!
              </Text>

              <View style={styles.emptyActionsRow}>
                <TouchableOpacity
                  testID='rescue-swipe-reset-btn'
                  style={styles.emptyResetBtn}
                  onPress={handleResetStack}
                >
                  <ArrowCounterClockwise size={18} color='#fff' />
                  <Text style={styles.emptyResetText}>Reset Stack</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyShelterHubBtn}
                  onPress={() => navigation.navigate('Wallet', { initialTab: 'donate' })}
                >
                  <Heart size={18} color='#fff' weight='fill' />
                  <Text style={styles.emptyShelterHubText}>Visit Shelter Hub</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Gesture & Action Buttons (Tinder/Bumble Style) */}
        {activeCard && (
          <View style={styles.actionsBar}>
            {/* Rewind Button */}
            <TouchableOpacity
              testID='rescue-swipe-rewind-btn'
              accessibilityLabel='Rewind previous animal'
              style={[styles.actionBtn, styles.rewindBtn]}
              onPress={handleRewind}
            >
              <ArrowCounterClockwise size={22} color='#F2C94C' weight='bold' />
            </TouchableOpacity>

            {/* Pass / Skip Button (Swipe Left) */}
            <TouchableOpacity
              testID='rescue-swipe-pass-btn'
              accessibilityLabel='Pass to next animal'
              style={[styles.actionBtn, styles.passBtn]}
              onPress={() => completeSwipe('left')}
            >
              <X size={28} color='#FF453A' weight='bold' />
            </TouchableOpacity>

            {/* Super Guardian Button (Swipe Up) */}
            <TouchableOpacity
              testID='rescue-swipe-super-btn'
              accessibilityLabel='Super Guardian sponsor'
              style={[styles.actionBtn, styles.superBtn]}
              onPress={() => completeSwipe('up')}
            >
              <Star size={26} color='#0A84FF' weight='fill' />
            </TouchableOpacity>

            {/* Sponsor Button (Swipe Right) */}
            <TouchableOpacity
              testID='rescue-swipe-sponsor-btn'
              accessibilityLabel="Sponsor this animal's bill"
              style={[styles.actionBtn, styles.sponsorBtn]}
              onPress={() => completeSwipe('right')}
            >
              <Heart size={32} color='#fff' weight='fill' />
            </TouchableOpacity>
          </View>
        )}

        {/* Celebration / Match Modal */}
        <Modal
          visible={!!celebrationModal}
          transparent
          animationType='fade'
          onRequestClose={() => setCelebrationModal(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.celebrationCard}>
              <View style={styles.celebrationEmojiBox}>
                <Text style={styles.celebrationEmoji}>
                  {celebrationModal?.bill.speciesEmoji || '🐾'}
                </Text>
              </View>

              <Text style={styles.celebrationTitle}>
                {celebrationModal?.tier === 'super'
                  ? '⭐ Super Guardian Angel!'
                  : '🎉 Bill Sourced & Funded!'}
              </Text>

              <Text style={styles.celebrationSub}>
                You funded {celebrationModal?.bill.billTitle} ($
                {celebrationModal?.bill.totalBillAmount.toFixed(2)}) for{' '}
                <Text style={styles.boldText}>{celebrationModal?.bill.animalName}</Text> at{' '}
                {celebrationModal?.bill.sanctuaryName}.
              </Text>

              {/* Digital Certificate Box */}
              <View style={styles.certBox}>
                <View style={styles.certHeader}>
                  <ShieldCheck size={16} color='#38EF7D' weight='fill' />
                  <Text style={styles.certHeaderText}>Verified Micro-Grant Certificate</Text>
                </View>
                <Text style={styles.certIdText}>Certificate ID: {celebrationModal?.certId}</Text>
                <Text style={styles.certNoteText}>
                  100% of your pledge is dispatched to veterinary clinic accounts with zero platform
                  deductions.
                </Text>
              </View>

              <View style={styles.celebrationBtnRow}>
                <TouchableOpacity style={styles.shareCertBtn} onPress={handleShareCertificate}>
                  <ShareNetwork size={18} color='#fff' />
                  <Text style={styles.shareCertBtnText}>Share Impact</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='close-celebration-modal-btn'
                  style={styles.continueSwipingBtn}
                  onPress={() => setCelebrationModal(null)}
                >
                  <Text style={styles.continueSwipingBtnText}>Keep Saving Lives</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>

        {/* Vet Invoice & Breakdown Modal */}
        <Modal
          visible={!!invoiceModalBill}
          transparent
          animationType='slide'
          onRequestClose={() => setInvoiceModalBill(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.invoiceSheet}>
              <View style={styles.invoiceHeader}>
                <View style={styles.invoiceTitleRow}>
                  <FileText size={20} color='#38EF7D' weight='fill' />
                  <Text style={styles.invoiceTitle}>Itemized Veterinary Invoice</Text>
                </View>
                <TouchableOpacity
                  testID='close-invoice-modal-btn'
                  onPress={() => setInvoiceModalBill(null)}
                >
                  <X size={20} color='#8E8E93' />
                </TouchableOpacity>
              </View>

              {invoiceModalBill && (
                <ScrollView showsVerticalScrollIndicator={false} style={styles.invoiceBody}>
                  <View style={styles.invoiceMeta}>
                    <Text style={styles.invoicePatient}>
                      Patient: {invoiceModalBill.animalName} ({invoiceModalBill.species})
                    </Text>
                    <Text style={styles.invoiceClinic}>
                      Partner Sanctuary: {invoiceModalBill.sanctuaryName} (
                      {invoiceModalBill.sanctuaryLocation})
                    </Text>
                  </View>

                  <Text style={styles.invoiceTableTitle}>Bill Breakdown</Text>
                  {invoiceModalBill.items.map((it, idx) => (
                    <View key={idx} style={styles.invoiceTableRow}>
                      <Text style={styles.invoiceItemName}>{it.name}</Text>
                      <Text style={styles.invoiceItemCost}>${it.cost.toFixed(2)}</Text>
                    </View>
                  ))}

                  <View style={styles.invoiceTotalRow}>
                    <Text style={styles.invoiceTotalLabel}>Total Authorized Bill</Text>
                    <Text style={styles.invoiceTotalValue}>
                      ${invoiceModalBill.totalBillAmount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.vetAuditBadge}>
                    <ShieldCheck size={18} color='#38EF7D' weight='fill' />
                    <Text style={styles.vetAuditText}>
                      Audited by Kindred Ethical Sanctuary Alliance. Receipts matched against
                      hospital ledger.
                    </Text>
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                style={styles.invoiceCloseActionBtn}
                onPress={() => setInvoiceModalBill(null)}
              >
                <Text style={styles.invoiceCloseActionText}>Done Reviewing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SpaceBackground>
    </View>
  );
};

export default RescueSwipeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  karmaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
  },
  karmaBadgeText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255, 107, 139, 0.2)',
    borderColor: '#FF6B8B',
  },
  categoryText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  impactBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  impactStatItem: {
    alignItems: 'center',
  },
  impactStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  impactStatLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  impactDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deckContainer: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStackWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    height: '98%',
    backgroundColor: '#161622',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'absolute',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  nextCardPreview: {
    transform: [{ scale: 0.94 }, { translateY: 12 }],
    opacity: 0.6,
  },
  cardScrollContent: {
    padding: 18,
    paddingBottom: 24,
  },
  stampBox: {
    position: 'absolute',
    top: 30,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 3,
  },
  sponsorStamp: {
    left: 24,
    borderColor: '#38EF7D',
    transform: [{ rotate: '-15deg' }],
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sponsorStampText: {
    color: '#38EF7D',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  passStamp: {
    right: 24,
    borderColor: '#FF453A',
    transform: [{ rotate: '15deg' }],
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  passStampText: {
    color: '#FF453A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  superStamp: {
    top: 60,
    alignSelf: 'center',
    borderColor: '#0A84FF',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  superStampText: {
    color: '#0A84FF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  cardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  animalEmoji: {
    fontSize: 34,
  },
  animalTitleInfo: {
    flex: 1,
  },
  nameUrgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  animalNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  urgencyImmediate: {
    backgroundColor: 'rgba(255, 69, 58, 0.25)',
  },
  urgencyHigh: {
    backgroundColor: 'rgba(242, 201, 76, 0.25)',
  },
  urgencyStandard: {
    backgroundColor: 'rgba(10, 132, 255, 0.25)',
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sanctuaryLocationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  sanctuaryNameText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  billPriceBadge: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  billPriceText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  billHeroCard: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
  },
  billHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  billCategoryText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
  },
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(242, 201, 76, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  daysLeftText: {
    color: '#F2C94C',
    fontSize: 11,
    fontWeight: '700',
  },
  billTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  billCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  billCostLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  billCostAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38EF7D',
  },
  progressBarWrap: {
    flex: 1,
    marginLeft: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#38EF7D',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  storySection: {
    marginBottom: 14,
  },
  storySectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  storyBodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  itemizedSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  itemizedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  billItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  billItemName: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
  },
  billItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38EF7D',
  },
  perkBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 107, 139, 0.1)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 139, 0.25)',
    marginBottom: 14,
  },
  perkInfo: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  perkDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    lineHeight: 16,
  },
  viewInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewInvoiceBtnText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  emptyIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyResetText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyShelterHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF6B8B',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyShelterHubText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  actionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rewindBtn: {
    backgroundColor: '#201F18',
    borderWidth: 1,
    borderColor: 'rgba(242, 201, 76, 0.4)',
  },
  passBtn: {
    backgroundColor: '#241416',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
  },
  superBtn: {
    backgroundColor: '#121F2D',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.4)',
  },
  sponsorBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#38EF7D',
    shadowColor: '#38EF7D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  celebrationEmojiBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  celebrationEmoji: {
    fontSize: 42,
  },
  celebrationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationSub: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  boldText: {
    color: '#38EF7D',
    fontWeight: '800',
  },
  certBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  certHeaderText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
  },
  certIdText: {
    fontSize: 11,
    color: '#8E8E93',
    fontFamily: 'Courier',
    marginBottom: 6,
  },
  certNoteText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 15,
  },
  celebrationBtnRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  shareCertBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    borderRadius: 16,
  },
  shareCertBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  continueSwipingBtn: {
    flex: 1,
    backgroundColor: '#38EF7D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  continueSwipingBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  invoiceSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  invoiceBody: {
    marginBottom: 16,
  },
  invoiceMeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  invoicePatient: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  invoiceClinic: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  invoiceTableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  invoiceTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  invoiceItemName: {
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  invoiceItemCost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38EF7D',
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  invoiceTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  invoiceTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#38EF7D',
  },
  vetAuditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
  },
  vetAuditText: {
    flex: 1,
    fontSize: 11,
    color: '#38EF7D',
    lineHeight: 15,
  },
  invoiceCloseActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  invoiceCloseActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
