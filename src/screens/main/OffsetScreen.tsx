import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { LinearGradient as SvgLinearGradient, Defs, Stop, Rect } from 'react-native-svg';
import { useSelector, useDispatch } from 'react-redux';
import { ShieldCheck, Certificate, Globe, Info, X, CreditCard } from 'phosphor-react-native';
import { useToast } from '../../contexts/ToastContext';
import HapticFeedbackService from '../../services/HapticFeedbackService';
import type { VerifiedProject } from '../../services/OffsetProviderService';
import { offsetProviderService } from '../../services/OffsetProviderService';
import type { OffsetTransaction } from '../../store/slices/carbonSlice';
import { addOffsetTransaction, updateOffsetSubscription } from '../../store/slices/carbonSlice';
import type { RootState } from '../../store';

interface GlassCardProps {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

const GlassCard = ({ style, children }: GlassCardProps) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

export default function OffsetScreen() {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const history = useSelector((state: RootState) => state.carbon?.history ?? []);
  const offsets = useSelector((state: RootState) => state.carbon?.offsets) ?? {
    transactions: [],
    subscription: {
      active: false,
      tier: 'none',
      monthlyCost: 0,
      offsetTonsPerMonth: 0,
      nextBillingDate: '',
      billingHistory: [],
    },
  };

  const { transactions, subscription } = offsets;

  // Compute average monthly carbon footprint
  const calculateAverageFootprint = () => {
    if (!history || history.length === 0) return 1.2; // fallback default
    const sum = history.reduce((acc, entry) => acc + (entry.footprint?.total ?? 0), 0);
    return parseFloat((sum / history.length).toFixed(2));
  };
  const avgFootprint = calculateAverageFootprint();

  // Screen Tabs
  const [activeTab, setActiveTab] = useState<'offsets' | 'subscription' | 'certs'>('offsets');

  // Modals States
  const [selectedProject, setSelectedProject] = useState<VerifiedProject | null>(null);
  const [purchaseProject, setPurchaseProject] = useState<VerifiedProject | null>(null);
  const [activeCert, setActiveCert] = useState<OffsetTransaction | null>(null);

  // Instant Purchase Form State
  const [offsetTonsText, setOffsetTonsText] = useState('1.0');
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Projects list
  const projects = offsetProviderService.getVerifiedProjects();

  // Dynamic calculations for subscription view
  const subTiers: Array<{
    tier: 'starter' | 'neutral' | 'positive';
    title: string;
    desc: string;
  }> = [
    {
      tier: 'starter',
      title: 'Climate Starter (50%)',
      desc: 'Offsets half of your tracked monthly emissions',
    },
    {
      tier: 'neutral',
      title: 'Carbon Neutral (100%)',
      desc: 'Completely offsets all of your tracked emissions',
    },
    {
      tier: 'positive',
      title: 'Climate Positive (150%)',
      desc: 'Offsets 1.5x of your emissions, creating positive net impact',
    },
  ];

  const getSubCostAndTons = (tierName: 'starter' | 'neutral' | 'positive' | 'none') => {
    return offsetProviderService.calculateSubscriptionCost(tierName, avgFootprint);
  };

  // Lifetime offset aggregation
  const lifetimeTons =
    transactions.reduce((sum, t) => sum + t.tons, 0) +
    subscription.billingHistory.reduce((sum, h) => sum + h.tons, 0);

  const lifetimeCost =
    transactions.reduce((sum, t) => sum + t.cost, 0) +
    subscription.billingHistory.reduce((sum, h) => sum + h.amount, 0);

  // Equivalencies calculation
  const equivalentTrees = Math.round(lifetimeTons * 16.5);

  const handleSubscribeToggle = () => {
    if (subscription.tier === 'none') {
      Alert.alert(
        'Subscription Setup Needed',
        'Please select a subscription tier below before activating the Carbon Neutral Subscription.',
      );
      return;
    }

    const nextActive = !subscription.active;
    const { monthlyCost, tonsOffset } = getSubCostAndTons(subscription.tier);

    dispatch(
      updateOffsetSubscription({
        active: nextActive,
        monthlyCost,
        offsetTonsPerMonth: tonsOffset,
        nextBillingDate: nextActive
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
          : '',
      }),
    );

    HapticFeedbackService.triggerSuccess();
    if (nextActive) {
      showToast('Carbon Neutral Subscription Activated! 🌱', 'success');
    } else {
      showToast('Subscription Paused.', 'info');
    }
  };

  const handleSelectTier = (tierName: 'starter' | 'neutral' | 'positive') => {
    const { monthlyCost, tonsOffset } = getSubCostAndTons(tierName);

    dispatch(
      updateOffsetSubscription({
        tier: tierName,
        active: true,
        monthlyCost,
        offsetTonsPerMonth: tonsOffset,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      }),
    );

    HapticFeedbackService.triggerSuccess();
    showToast(`Upgraded to ${tierName.toUpperCase()} tier!`, 'success');
  };

  const handleInstantPurchase = () => {
    const tons = parseFloat(offsetTonsText);
    if (isNaN(tons) || tons <= 0) {
      showToast('Please enter a valid weight in tons.', 'error');
      return;
    }

    if (cardNumber.length < 16 || expiry.length < 5 || cvv.length < 3) {
      showToast('Please enter valid credit card details.', 'error');
      return;
    }

    setIsProcessingPurchase(true);

    // Simulate payment and registry processing
    setTimeout(() => {
      try {
        if (!purchaseProject) return;

        const tx = offsetProviderService.purchaseOffset(purchaseProject.id, tons);
        dispatch(addOffsetTransaction(tx));

        HapticFeedbackService.triggerSuccess();
        showToast(
          `Retirement successful! Certified Certificate RET-${tx.id.split('-')[1]} generated.`,
          'success',
        );

        // Reset forms
        setIsProcessingPurchase(false);
        setPurchaseProject(null);
        setOffsetTonsText('1.0');
        setCardNumber('');
        setExpiry('');
        setCvv('');
      } catch (error) {
        setIsProcessingPurchase(false);
        showToast('Purchase failed. Please try again.', 'error');
      }
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Svg height='100%' width='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgLinearGradient id='bgGrad' x1='0' y1='0' x2='0' y2='1'>
            <Stop offset='0' stopColor='#0f2027' stopOpacity='1' />
            <Stop offset='0.5' stopColor='#203a43' stopOpacity='1' />
            <Stop offset='1' stopColor='#2c5364' stopOpacity='1' />
          </SvgLinearGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#bgGrad)' />
      </Svg>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Direct Offsetting</Text>
        <Text style={styles.subtitle}>
          Neutralize emissions through verified, audit-proof registry certificates.
        </Text>
      </View>

      {/* Frosted Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'offsets' && styles.tabButtonActive]}
          onPress={() => setActiveTab('offsets')}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'offsets' && styles.tabButtonTextActive]}
          >
            Offsets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'subscription' && styles.tabButtonActive]}
          onPress={() => setActiveTab('subscription')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'subscription' && styles.tabButtonTextActive,
            ]}
          >
            Subscription
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'certs' && styles.tabButtonActive]}
          onPress={() => setActiveTab('certs')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'certs' && styles.tabButtonTextActive]}>
            Certificates
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* TAB 1: OFFSETS LIST & RETIREMENT SUMMARY */}
        {activeTab === 'offsets' && (
          <View>
            <GlassCard style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryVal}>{lifetimeTons.toFixed(2)}</Text>
                  <Text style={styles.summaryLbl}>Tons Retired</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryVal}>${lifetimeCost.toFixed(2)}</Text>
                  <Text style={styles.summaryLbl}>Total Invested</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryVal}>{equivalentTrees}</Text>
                  <Text style={styles.summaryLbl}>Trees Equivalent</Text>
                </View>
              </View>
            </GlassCard>

            <Text style={styles.sectionTitle}>Featured Verified Projects</Text>

            {projects.map(project => (
              <TouchableOpacity
                key={project.id}
                activeOpacity={0.9}
                style={styles.projectTouch}
                onPress={() => setPurchaseProject(project)}
              >
                <ImageBackground
                  source={{ uri: project.image }}
                  style={styles.projectImage}
                  imageStyle={styles.projectImageStyle}
                >
                  <View style={styles.projectOverlay}>
                    <View style={styles.projectTopRow}>
                      <View style={styles.badgeContainer}>
                        <View style={styles.projectBadge}>
                          <ShieldCheck color='#fff' size={14} weight='fill' />
                          <Text style={styles.projectBadgeText}>{project.registryProvider}</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingBadgeText}>★ {project.rating}</Text>
                        </View>
                      </View>
                      <View style={styles.projectPriceBadge}>
                        <Text style={styles.projectPriceText}>${project.costPerTon}/ton</Text>
                      </View>
                    </View>

                    <View style={styles.projectBottomRow}>
                      <View style={styles.projectBottomLeft}>
                        <Text style={styles.projectName}>{project.name}</Text>
                        <Text style={styles.projectLoc}>📍 {project.location}</Text>
                      </View>
                      <View style={styles.projectActions}>
                        <TouchableOpacity
                          style={styles.infoBtn}
                          onPress={() => setSelectedProject(project)}
                        >
                          <Info color='#fff' size={18} weight='bold' />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.buyBtn}
                          onPress={() => setPurchaseProject(project)}
                        >
                          <Text style={styles.buyBtnText}>Offset</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TAB 2: MONTHLY SUBSCRIPTIONS */}
        {activeTab === 'subscription' && (
          <View>
            <GlassCard style={styles.subscriptionCard}>
              <View style={styles.subRow}>
                <View style={styles.subInfo}>
                  <Text style={styles.subTitle}>Auto-Offset Subscription</Text>
                  <Text style={styles.subDesc}>
                    Retires verified carbon credits at the end of each month dynamically based on
                    your tracked emissions profile.
                  </Text>
                  {subscription.active ? (
                    <View style={styles.activeLabel}>
                      <ShieldCheck color='#38EF7D' weight='fill' size={14} />
                      <Text style={styles.activeLabelText}>
                        Active — Next Billing: {subscription.nextBillingDate}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.activeLabelInactive}>
                      <Text style={styles.activeLabelTextInactive}>Paused / Inactive</Text>
                    </View>
                  )}
                </View>
                <Switch
                  value={subscription.active}
                  onValueChange={handleSubscribeToggle}
                  trackColor={{ false: '#444', true: '#38EF7D' }}
                  thumbColor={'#fff'}
                />
              </View>
            </GlassCard>

            <Text style={styles.sectionTitle}>Select Offsetting Tier</Text>
            <Text style={styles.subDescText}>
              Emissions calculations computed based on your current tracked footprint average of{' '}
              <Text style={styles.boldWhiteText}>{avgFootprint} tons/month</Text>.
            </Text>

            {subTiers.map(tier => {
              const details = getSubCostAndTons(tier.tier);
              const isCurrent = subscription.tier === tier.tier;

              return (
                <TouchableOpacity
                  key={tier.tier}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTier(tier.tier)}
                >
                  <GlassCard style={[styles.tierCard, isCurrent && styles.tierCardActive]}>
                    <View style={styles.tierHeader}>
                      <Text style={styles.tierTitle}>{tier.title}</Text>
                      <View style={styles.tierStatusBadge}>
                        <Text style={styles.tierStatusText}>
                          {isCurrent ? 'Current Tier' : 'Select'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.tierDesc}>{tier.desc}</Text>
                    <View style={styles.tierFooter}>
                      <Text style={styles.tierStats}>
                        🌱 Offset:{' '}
                        <Text style={styles.highlightText}>{details.tonsOffset} tons/mo</Text>
                      </Text>
                      <Text style={styles.tierPrice}>${details.monthlyCost}/mo</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* TAB 3: CERTIFICATES & TRANSACTIONS */}
        {activeTab === 'certs' && (
          <View>
            <Text style={styles.sectionTitle}>Retirement History</Text>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Certificate size={48} color='rgba(255,255,255,0.2)' weight='thin' />
                <Text style={styles.emptyText}>No carbon offset retirements found.</Text>
                <Text style={styles.emptySub}>
                  Retire custom weights or configure a subscription to generate legal registry
                  certificates.
                </Text>
              </View>
            ) : (
              transactions.map(tx => (
                <TouchableOpacity key={tx.id} activeOpacity={0.8} onPress={() => setActiveCert(tx)}>
                  <GlassCard style={styles.certCard}>
                    <View style={styles.certIconBox}>
                      <Certificate size={24} color='#38EF7D' weight='fill' />
                    </View>
                    <View style={styles.certInfo}>
                      <View style={styles.certHeader}>
                        <Text style={styles.certProject}>{tx.projectName}</Text>
                        <Text style={styles.certCost}>${tx.cost}</Text>
                      </View>
                      <View style={styles.certMetaRow}>
                        <Text style={styles.certMeta}>
                          {tx.tons} tons • {tx.registryProvider}
                        </Text>
                        <Text style={styles.certDate}>
                          {new Date(tx.date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* MODAL 1: REGISTRY / METHODOLOGY DETAILS */}
      <Modal
        visible={selectedProject !== null}
        animationType='slide'
        transparent
        onRequestClose={() => setSelectedProject(null)}
      >
        <View style={styles.modalBg}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verification Details</Text>
              <TouchableOpacity onPress={() => setSelectedProject(null)}>
                <X size={20} color='#fff' weight='bold' />
              </TouchableOpacity>
            </View>

            {selectedProject && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.detailName}>{selectedProject.name}</Text>
                <Text style={styles.detailLoc}>📍 {selectedProject.location}</Text>

                <View style={styles.divider} />

                <Text style={styles.sectionHeader}>Registry Audit Info</Text>
                <View style={styles.auditRow}>
                  <View style={styles.auditCol}>
                    <Text style={styles.auditVal}>{selectedProject.registryProvider}</Text>
                    <Text style={styles.auditLbl}>Authority</Text>
                  </View>
                  <View style={styles.auditCol}>
                    <Text style={styles.auditVal}>{selectedProject.registryId}</Text>
                    <Text style={styles.auditLbl}>Registry ID</Text>
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.methodTitle}>Standard Methodology</Text>
                  <Text style={styles.methodDesc}>{selectedProject.methodology}</Text>
                </View>

                <Text style={styles.sectionHeader}>Aligned UN Sustainable Goals (SDGs)</Text>
                <View style={styles.sdgGrid}>
                  {selectedProject.sdgs.map(sdg => (
                    <View key={sdg.id} style={styles.sdgCard}>
                      <Text style={styles.sdgIcon}>{sdg.icon}</Text>
                      <Text style={styles.sdgNum}>Goal {sdg.id}</Text>
                      <Text style={styles.sdgName}>{sdg.name}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.registryBtn}
                  onPress={() =>
                    Alert.alert(
                      'External Link',
                      `Navigating to official database: ${selectedProject.registryLink}`,
                    )
                  }
                >
                  <Globe size={18} color='#0f2027' weight='bold' style={styles.btnIcon} />
                  <Text style={styles.registryBtnText}>View on Official Registry</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </Modal>

      {/* MODAL 2: INSTANT RETIREMENT SLIDER & PAYMENT */}
      <Modal
        visible={purchaseProject !== null}
        animationType='slide'
        transparent
        onRequestClose={() => setPurchaseProject(null)}
      >
        <View style={styles.modalBg}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Offset Carbon Now</Text>
              <TouchableOpacity onPress={() => setPurchaseProject(null)}>
                <X size={20} color='#fff' weight='bold' />
              </TouchableOpacity>
            </View>

            {purchaseProject && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                <Text style={styles.purchaseProjectName}>{purchaseProject.name}</Text>
                <Text style={styles.purchaseCostRate}>
                  Rate: ${purchaseProject.costPerTon} / ton CO₂
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Retirement Weight (Tons)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType='decimal-pad'
                    value={offsetTonsText}
                    onChangeText={setOffsetTonsText}
                    placeholder='1.0'
                    placeholderTextColor='rgba(255,255,255,0.3)'
                  />
                  <Text style={styles.costEstimateText}>
                    Cost Estimate:{' '}
                    <Text style={styles.greenBoldText}>
                      ${(parseFloat(offsetTonsText || '0') * purchaseProject.costPerTon).toFixed(2)}
                    </Text>
                  </Text>
                </View>

                <Text style={styles.sectionHeader}>Mock Secure Checkout</Text>
                <GlassCard style={styles.checkoutForm}>
                  <View style={styles.checkoutRow}>
                    <CreditCard size={20} color='rgba(255,255,255,0.5)' style={styles.ccIcon} />
                    <TextInput
                      style={styles.ccInputFlex}
                      keyboardType='number-pad'
                      placeholder='Card Number (16 digits)'
                      placeholderTextColor='rgba(255,255,255,0.3)'
                      maxLength={16}
                      value={cardNumber}
                      onChangeText={setCardNumber}
                    />
                  </View>
                  <View style={styles.checkoutBottomRow}>
                    <TextInput
                      style={styles.ccInputExpiry}
                      placeholder='MM/YY'
                      placeholderTextColor='rgba(255,255,255,0.3)'
                      maxLength={5}
                      value={expiry}
                      onChangeText={setExpiry}
                    />
                    <TextInput
                      style={styles.ccInputCvv}
                      keyboardType='number-pad'
                      placeholder='CVV'
                      placeholderTextColor='rgba(255,255,255,0.3)'
                      maxLength={3}
                      value={cvv}
                      onChangeText={setCvv}
                    />
                  </View>
                </GlassCard>

                <TouchableOpacity
                  style={[styles.confirmBtn, isProcessingPurchase && styles.confirmBtnDisabled]}
                  onPress={handleInstantPurchase}
                  disabled={isProcessingPurchase}
                >
                  <Text style={styles.confirmBtnText}>
                    {isProcessingPurchase
                      ? 'Processing Retirement...'
                      : 'Retire & Generate Certificate'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </Modal>

      {/* MODAL 3: RETIREMENT CERTIFICATE DISPLAY */}
      <Modal
        visible={activeCert !== null}
        animationType='fade'
        transparent
        onRequestClose={() => setActiveCert(null)}
      >
        <View style={styles.modalBg}>
          <GlassCard style={styles.certModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.certModalTitle}>Official Retirement Certificate</Text>
              <TouchableOpacity onPress={() => setActiveCert(null)}>
                <X size={20} color='#fff' weight='bold' />
              </TouchableOpacity>
            </View>

            {activeCert && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.certScrollContent}
              >
                <View style={styles.certFrame}>
                  <Certificate
                    size={64}
                    color='#38EF7D'
                    weight='fill'
                    style={styles.certIconCenter}
                  />
                  <Text style={styles.certDocTitle}>CERTIFICATE OF RETIREMENT</Text>
                  <Text style={styles.certDocSub}>Retured on behalf of Kindred Community User</Text>

                  <View style={styles.certDivider} />

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Registry Standard</Text>
                    <Text style={styles.certDocValue}>{activeCert.registryProvider}</Text>
                  </View>

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Registry Project ID</Text>
                    <Text style={styles.certDocValue}>{activeCert.registryId}</Text>
                  </View>

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Project Name</Text>
                    <Text style={styles.certDocValue}>{activeCert.projectName}</Text>
                  </View>

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Volume Retired</Text>
                    <Text style={styles.certDocValueHighlight}>{activeCert.tons} Tons CO₂e</Text>
                  </View>

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Retirement ID</Text>
                    <Text style={styles.certDocValue}>{activeCert.id}</Text>
                  </View>

                  <View style={styles.certDocRow}>
                    <Text style={styles.certDocLabel}>Retirement Date</Text>
                    <Text style={styles.certDocValue}>
                      {new Date(activeCert.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={() =>
                    Alert.alert('Share Certificate', `Mock Sharing Retirement ID: ${activeCert.id}`)
                  }
                >
                  <Text style={styles.shareBtnText}>Share Retirement Certificate</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2027',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderColor: 'rgba(56, 239, 125, 0.4)',
  },
  tabButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  bottomSpacer: {
    height: 60,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  summaryCard: {
    paddingVertical: 20,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLbl: {
    fontSize: 11,
    color: '#aaa',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  projectTouch: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  projectImage: {
    height: 180,
  },
  projectImageStyle: {
    borderRadius: 16,
  },
  projectOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: 16,
    justifyContent: 'space-between',
  },
  projectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  projectBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectPriceBadge: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectPriceText: {
    color: '#0f2027',
    fontSize: 11,
    fontWeight: '800',
  },
  projectBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  projectBottomLeft: {
    flex: 1,
    paddingRight: 8,
  },
  projectName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectLoc: {
    color: '#ccc',
    fontSize: 12,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buyBtnText: {
    color: '#0f2027',
    fontWeight: '800',
    fontSize: 12,
  },

  // Subscriptions styles
  subscriptionCard: {
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(56, 239, 125, 0.05)',
    borderColor: 'rgba(56, 239, 125, 0.15)',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subInfo: {
    flex: 1,
    paddingRight: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  subDesc: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 10,
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#38EF7D',
  },
  subDescText: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
  },
  tierCard: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  tierCardActive: {
    borderColor: 'rgba(56, 239, 125, 0.5)',
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierStatusBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38EF7D',
  },
  tierDesc: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
    marginBottom: 12,
  },
  tierFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierStats: {
    fontSize: 12,
    color: '#aaa',
  },
  highlightText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#38EF7D',
  },

  // Certificates styles
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  certIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  certInfo: {
    flex: 1,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  certProject: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  certCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  certMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  certMeta: {
    fontSize: 11,
    color: '#aaa',
  },
  certDate: {
    fontSize: 11,
    color: '#aaa',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 16,
  },

  // Modal styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#162830',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalScroll: {
    marginBottom: 20,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailLoc: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38EF7D',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  auditRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  auditCol: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
  },
  auditVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  auditLbl: {
    fontSize: 10,
    color: '#aaa',
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 11,
    color: '#ccc',
    lineHeight: 14,
  },
  sdgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sdgCard: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  sdgIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sdgNum: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#aaa',
    marginBottom: 2,
  },
  sdgName: {
    fontSize: 9,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  registryBtn: {
    backgroundColor: '#38EF7D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  btnIcon: {
    marginRight: 6,
  },
  registryBtnText: {
    color: '#0f2027',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Instant offset form styles
  purchaseProjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  purchaseCostRate: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  costEstimateText: {
    fontSize: 13,
    color: '#ccc',
  },
  checkoutForm: {
    padding: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  checkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  ccIcon: {
    marginRight: 8,
  },
  checkoutBottomRow: {
    flexDirection: 'row',
  },
  confirmBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmBtnDisabled: {
    backgroundColor: 'rgba(56, 239, 125, 0.4)',
  },
  confirmBtnText: {
    color: '#0f2027',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Certificate Modal styles
  certModalCard: {
    backgroundColor: '#111e24',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    marginTop: '15%',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  certScrollContent: {
    paddingBottom: 16,
  },
  certFrame: {
    borderWidth: 2,
    borderColor: '#38EF7D',
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.01)',
    alignItems: 'center',
    marginBottom: 20,
  },
  certIconCenter: {
    marginBottom: 12,
  },
  certDocTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  certDocSub: {
    fontSize: 10,
    color: '#aaa',
    marginBottom: 16,
  },
  certDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(56, 239, 125, 0.3)',
    marginBottom: 16,
  },
  certDocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  certDocLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '600',
  },
  certDocValue: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  shareBtn: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#0f2027',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeLabelInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  activeLabelTextInactive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#aaa',
  },
  boldWhiteText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  greenBoldText: {
    color: '#38EF7D',
    fontWeight: 'bold',
  },
  ccInputFlex: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 4,
    flex: 1,
  },
  ccInputExpiry: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 4,
    flex: 1,
    marginRight: 8,
  },
  ccInputCvv: {
    color: '#fff',
    fontSize: 14,
    paddingVertical: 4,
    width: 80,
  },
  certModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38EF7D',
  },
  certDocValueHighlight: {
    fontSize: 11,
    color: '#38EF7D',
    fontWeight: 'bold',
  },
});
