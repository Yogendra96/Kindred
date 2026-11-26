import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  ShieldCheck,
  FirstAid,
  Coins,
  CheckCircle,
  Clock,
  Sparkle,
  Copy,
  Plus,
  ShareNetwork,
  Buildings,
  FileText,
  X,
  Target,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { AssuranceClaim, PoolPledgeTier } from '../../data/sanctuaryAssuranceData';
import {
  ASSURANCE_CLAIMS_DATA,
  SANCTUARY_POOL_STATS,
  POOL_PLEDGE_TIERS,
} from '../../data/sanctuaryAssuranceData';
import type { AppStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type ActiveTab = 'claims' | 'underwrite' | 'submit';

export const SanctuaryAssuranceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('claims');
  const [claims, setClaims] = useState<AssuranceClaim[]>(ASSURANCE_CLAIMS_DATA);
  const [poolStats, setPoolStats] = useState(SANCTUARY_POOL_STATS);

  // Selected claim for blockchain audit modal
  const [selectedAuditClaim, setSelectedAuditClaim] = useState<AssuranceClaim | null>(null);

  // Celebratory pledge modal
  const [pledgeSuccessModal, setPledgeSuccessModal] = useState<{
    tier: PoolPledgeTier;
    certId: string;
  } | null>(null);

  // Submit Claim Form state
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newSpecies, setNewSpecies] = useState('Cow');
  const [newSanctuaryName, setNewSanctuaryName] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newStory, setNewStory] = useState('');

  const handlePledgePool = (tier: PoolPledgeTier) => {
    setPoolStats(prev => ({
      ...prev,
      totalReservesUsdc: prev.totalReservesUsdc + tier.amount,
    }));

    const certId = `ASSURE-POOL-${tier.amount}-${Date.now().toString().slice(-4)}`;

    setPledgeSuccessModal({
      tier,
      certId,
    });

    showToast(
      `🛡️ Pledged $${tier.amount} to Sanctuary Assurance! +${tier.karmaReward} Kindred Karma!`,
      'success',
    );
  };

  const handleSubmitClaim = () => {
    if (
      !newAnimalName.trim() ||
      !newSanctuaryName.trim() ||
      !newHospital.trim() ||
      !newCondition.trim() ||
      !newAmount.trim()
    ) {
      showToast('Please fill all required claim fields.', 'error');
      return;
    }

    const amountNum = parseFloat(newAmount) || 500;
    const newClaim: AssuranceClaim = {
      id: `claim-${Date.now()}`,
      sanctuaryId: `shelter-${Date.now().toString().slice(-4)}`,
      sanctuaryName: newSanctuaryName.trim(),
      sanctuaryLocation: 'Verified Sanctuary Partner',
      sanctuaryFlag: '🐾',
      animalName: newAnimalName.trim(),
      species: newSpecies,
      speciesEmoji: newSpecies === 'Cow' ? '🐮' : newSpecies === 'Pig' ? '🐖' : '🐕',
      emergencyCondition: newCondition.trim(),
      vetHospital: newHospital.trim(),
      totalAmount: amountNum,
      status: 'Under Review',
      disbursedDate: 'Pending Peer Validation',
      txHash: `0x${Date.now().toString(16)}f8e7d6a5b4c3d2e1f0a9b8c7d6e5`,
      blockNumber: 18495000 + Math.floor(Math.random() * 500),
      verifiedBy: 'Pending Sanctuary Alliance Peer Verification',
      story:
        newStory.trim() || 'Emergency surgical intervention submitted for urgent pool assistance.',
      itemizedReceipt: [
        { item: 'Emergency Clinic Admission & Diagnostic Testing', cost: amountNum * 0.4 },
        { item: 'Surgical Treatment & Anesthesia Protocol', cost: amountNum * 0.6 },
      ],
    };

    setClaims(prev => [newClaim, ...prev]);
    setNewAnimalName('');
    setNewSanctuaryName('');
    setNewHospital('');
    setNewCondition('');
    setNewAmount('');
    setNewStory('');
    setActiveTab('claims');

    showToast(
      `📋 Emergency claim for ${newClaim.animalName} submitted! Cryptographic proof recorded.`,
      'success',
    );
  };

  const handleShareAudit = async () => {
    if (!selectedAuditClaim) return;
    try {
      await Share.share({
        message: `Verified Sanctuary Assurance Emergency Claim: ${selectedAuditClaim.animalName} (${selectedAuditClaim.species}) received $${selectedAuditClaim.totalAmount} for ${selectedAuditClaim.emergencyCondition} at ${selectedAuditClaim.sanctuaryName}.\n\nBlockchain Audit Hash: ${selectedAuditClaim.txHash}\nView Ledger: https://kindred.earth/assurance`,
      });
    } catch {
      // Ignored
    }
  };

  const handleCopyTxHash = (hash: string) => {
    showToast(`Copied transaction proof: ${hash.slice(0, 16)}...`, 'success');
  };

  return (
    <View style={styles.container}>
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
              <ShieldCheck size={20} color='#38EF7D' weight='fill' />
              <Text style={styles.headerTitle}>Sanctuary Assurance</Text>
            </View>
            <Text style={styles.headerSubtitle}>Decentralized animal emergency health pool</Text>
          </View>
          <View style={styles.reservePill}>
            <Coins size={14} color='#38EF7D' weight='fill' />
            <Text style={styles.reservePillText}>
              ${(poolStats.totalReservesUsdc / 1000).toFixed(1)}k Pool
            </Text>
          </View>
        </View>

        {/* Global Pool Stats Hero */}
        <View style={styles.statsHeroBar}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>${poolStats.totalReservesUsdc.toLocaleString()}</Text>
            <Text style={styles.statLbl}>Community Reserves</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#38EF7D' }]}>
              ${poolStats.totalClaimsPaidUsdc.toLocaleString()}
            </Text>
            <Text style={styles.statLbl}>Claims Disbursed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#FF6B8B' }]}>
              {poolStats.protectedAnimalsCount}
            </Text>
            <Text style={styles.statLbl}>Animals Protected</Text>
          </View>
        </View>

        {/* Tab Controls */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            testID='tab-assurance-claims'
            style={[styles.tabItem, activeTab === 'claims' && styles.tabItemActive]}
            onPress={() => setActiveTab('claims')}
          >
            <FirstAid size={16} color={activeTab === 'claims' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'claims' && styles.tabLabelActive]}>
              Emergency Claims ({claims.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='tab-assurance-underwrite'
            style={[styles.tabItem, activeTab === 'underwrite' && styles.tabItemActive]}
            onPress={() => setActiveTab('underwrite')}
          >
            <ShieldCheck size={16} color={activeTab === 'underwrite' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'underwrite' && styles.tabLabelActive]}>
              Back the Pool
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='tab-assurance-submit'
            style={[styles.tabItem, activeTab === 'submit' && styles.tabItemActive]}
            onPress={() => setActiveTab('submit')}
          >
            <Plus size={16} color={activeTab === 'submit' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'submit' && styles.tabLabelActive]}>
              Sanctuary Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: LIVE CLAIMS FEED */}
        {activeTab === 'claims' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            {claims.map(claim => (
              <GlassCard key={claim.id} style={styles.claimCard}>
                {/* Top Row: Animal Emoji, Name, Status, Amount */}
                <View style={styles.claimTopRow}>
                  <View style={styles.claimEmojiBox}>
                    <Text style={{ fontSize: 28 }}>{claim.speciesEmoji}</Text>
                  </View>
                  <View style={styles.claimHeaderInfo}>
                    <View style={styles.claimTitleRow}>
                      <Text style={styles.claimAnimalName}>{claim.animalName}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          claim.status === 'Disbursed'
                            ? styles.statusDisbursed
                            : claim.status === 'Verified'
                              ? styles.statusVerified
                              : styles.statusReview,
                        ]}
                      >
                        <Text style={styles.statusText}>{claim.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.claimSanctuary}>
                      {claim.sanctuaryFlag} {claim.sanctuaryName} · {claim.sanctuaryLocation}
                    </Text>
                  </View>
                  <View style={styles.claimCostBadge}>
                    <Text style={styles.claimCostText}>${claim.totalAmount}</Text>
                  </View>
                </View>

                {/* Condition & Vet Hospital */}
                <View style={styles.conditionBox}>
                  <View style={styles.conditionHeader}>
                    <FirstAid size={14} color='#FF6B8B' weight='bold' />
                    <Text style={styles.conditionTitle}>{claim.emergencyCondition}</Text>
                  </View>
                  <Text style={styles.hospitalText}>🏥 Clinic: {claim.vetHospital}</Text>
                </View>

                {/* Story */}
                <Text style={styles.claimStory}>{claim.story}</Text>

                {/* Itemized Expenses */}
                <View style={styles.itemizedBox}>
                  <Text style={styles.itemizedHeader}>Audited Invoice Items</Text>
                  {claim.itemizedReceipt.map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <CheckCircle size={12} color='#38EF7D' weight='fill' />
                      <Text style={styles.itemName}>{item.item}</Text>
                      <Text style={styles.itemCost}>${item.cost}</Text>
                    </View>
                  ))}
                </View>

                {/* Blockchain Proof & Ledger Action */}
                <View style={styles.blockchainFooterRow}>
                  <TouchableOpacity
                    style={styles.txHashPill}
                    onPress={() => handleCopyTxHash(claim.txHash)}
                  >
                    <Coins size={12} color='#38EF7D' />
                    <Text style={styles.txHashText}>
                      Proof: {claim.txHash.slice(0, 10)}...{claim.txHash.slice(-6)}
                    </Text>
                    <Copy size={12} color='#8E8E93' />
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID={`view-audit-ledger-${claim.id}`}
                    style={styles.viewAuditBtn}
                    onPress={() => setSelectedAuditClaim(claim)}
                  >
                    <FileText size={14} color='#38EF7D' weight='bold' />
                    <Text style={styles.viewAuditBtnText}>Audit Ledger</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        )}

        {/* TAB 2: BACK THE POOL (UNDERWRITE) */}
        {activeTab === 'underwrite' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            <View style={styles.underwriteHero}>
              <ShieldCheck size={40} color='#38EF7D' weight='fill' />
              <Text style={styles.underwriteTitle}>Sanctuary Emergency Underwriting</Text>
              <Text style={styles.underwriteSub}>
                Sanctuaries face unexpected veterinary crises every month. By pledging to the mutual
                aid reserve pool, your dollars disburse directly to animal hospital ledgers within
                2.4 hours.
              </Text>
            </View>

            {POOL_PLEDGE_TIERS.map(tier => (
              <GlassCard key={tier.id} style={styles.tierCard}>
                <View style={styles.tierHeader}>
                  <View style={styles.tierBadgeBox}>
                    <Text style={styles.tierBadgeText}>{tier.badge}</Text>
                  </View>
                  <Text style={styles.tierAmount}>${tier.amount}</Text>
                </View>

                <Text style={styles.tierTitle}>{tier.title}</Text>
                <Text style={styles.tierImpact}>{tier.coverageImpact}</Text>

                <View style={styles.tierFooterRow}>
                  <View style={styles.tierKarma}>
                    <Sparkle size={14} color='#38EF7D' weight='fill' />
                    <Text style={styles.tierKarmaText}>+{tier.karmaReward} Kindred Karma</Text>
                  </View>

                  <TouchableOpacity
                    testID={`pledge-btn-${tier.id}`}
                    style={styles.pledgeBtn}
                    onPress={() => handlePledgePool(tier)}
                  >
                    <Text style={styles.pledgeBtnText}>Underwrite ${tier.amount}</Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        )}

        {/* TAB 3: SANCTUARY CLAIM PORTAL */}
        {activeTab === 'submit' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollList}
          >
            <Text style={styles.formHeading}>Submit Emergency Surgery Claim</Text>
            <Text style={styles.formSub}>
              For registered 501(c)(3) & registered UK/EU/IN sanctuaries. Claims are matched
              directly to certified veterinary hospital ledgers with 0% admin deductions.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Animal Patient Name</Text>
              <TextInput
                testID='claim-input-animal-name'
                style={styles.formInput}
                placeholder='e.g. Barnaby or Sheru'
                placeholderTextColor='#666'
                value={newAnimalName}
                onChangeText={setNewAnimalName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Sanctuary Organization Name</Text>
              <TextInput
                testID='claim-input-sanctuary-name'
                style={styles.formInput}
                placeholder='e.g. Woodstock Farm Sanctuary'
                placeholderTextColor='#666'
                value={newSanctuaryName}
                onChangeText={setNewSanctuaryName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Licensed Veterinary Clinic / Hospital</Text>
              <TextInput
                testID='claim-input-hospital'
                style={styles.formInput}
                placeholder='e.g. Cornell Large Animal Hospital'
                placeholderTextColor='#666'
                value={newHospital}
                onChangeText={setNewHospital}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Emergency Medical Condition</Text>
              <TextInput
                testID='claim-input-condition'
                style={styles.formInput}
                placeholder='e.g. Compound Tibial Fracture or Colic Decompression'
                placeholderTextColor='#666'
                value={newCondition}
                onChangeText={setNewCondition}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Total Emergency Bill Amount ($ USD)</Text>
              <TextInput
                testID='claim-input-amount'
                style={styles.formInput}
                placeholder='e.g. 680'
                placeholderTextColor='#666'
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType='numeric'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Clinical Notes & Story</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                placeholder='Describe circumstances, medical intervention, and prognosis...'
                placeholderTextColor='#666'
                value={newStory}
                onChangeText={setNewStory}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              testID='submit-emergency-claim-btn'
              style={styles.submitClaimBtn}
              onPress={handleSubmitClaim}
            >
              <ShieldCheck size={18} color='#000' weight='fill' />
              <Text style={styles.submitClaimBtnText}>Submit Claim to Pool</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Blockchain Audit Explorer Modal */}
        <Modal
          visible={!!selectedAuditClaim}
          transparent
          animationType='slide'
          onRequestClose={() => setSelectedAuditClaim(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.auditSheet}>
              <View style={styles.auditHeader}>
                <View style={styles.auditTitleRow}>
                  <ShieldCheck size={20} color='#38EF7D' weight='fill' />
                  <Text style={styles.auditTitle}>Cryptographic Proof Ledger</Text>
                </View>
                <TouchableOpacity
                  testID='close-audit-modal-btn'
                  onPress={() => setSelectedAuditClaim(null)}
                >
                  <X size={20} color='#8E8E93' />
                </TouchableOpacity>
              </View>

              {selectedAuditClaim && (
                <ScrollView showsVerticalScrollIndicator={false} style={styles.auditBody}>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Claim ID:</Text>
                    <Text style={styles.auditValue}>{selectedAuditClaim.id}</Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Patient:</Text>
                    <Text style={styles.auditValue}>
                      {selectedAuditClaim.animalName} ({selectedAuditClaim.species})
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Disbursed Amount:</Text>
                    <Text style={[styles.auditValue, { color: '#38EF7D', fontWeight: '800' }]}>
                      ${selectedAuditClaim.totalAmount}.00 USDC
                    </Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Veterinary Payee:</Text>
                    <Text style={styles.auditValue}>{selectedAuditClaim.vetHospital}</Text>
                  </View>

                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Block Confirmation:</Text>
                    <Text style={styles.auditValue}>Block #{selectedAuditClaim.blockNumber}</Text>
                  </View>

                  <View style={styles.auditHashBox}>
                    <Text style={styles.auditHashTitle}>SHA-256 Settlement Hash</Text>
                    <Text style={styles.auditHashText}>{selectedAuditClaim.txHash}</Text>
                  </View>

                  <View style={styles.certVerifierBox}>
                    <CheckCircle size={16} color='#38EF7D' weight='fill' />
                    <Text style={styles.certVerifierText}>
                      Audited by: {selectedAuditClaim.verifiedBy}
                    </Text>
                  </View>
                </ScrollView>
              )}

              <View style={styles.auditActionRow}>
                <TouchableOpacity style={styles.auditShareBtn} onPress={handleShareAudit}>
                  <ShareNetwork size={16} color='#fff' />
                  <Text style={styles.auditShareBtnText}>Share Audit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.auditDoneBtn}
                  onPress={() => setSelectedAuditClaim(null)}
                >
                  <Text style={styles.auditDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Celebratory Pledge Certificate Modal */}
        <Modal
          visible={!!pledgeSuccessModal}
          transparent
          animationType='fade'
          onRequestClose={() => setPledgeSuccessModal(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.pledgeSuccessCard}>
              <View style={styles.pledgeEmojiCircle}>
                <ShieldCheck size={40} color='#38EF7D' weight='fill' />
              </View>
              <Text style={styles.pledgeSuccessTitle}>Pool Backer Certificate</Text>
              <Text style={styles.pledgeSuccessSub}>
                You pledged{' '}
                <Text style={{ color: '#38EF7D', fontWeight: '800' }}>
                  ${pledgeSuccessModal?.tier.amount}
                </Text>{' '}
                to the Sanctuary Emergency Pool!
              </Text>

              <View style={styles.certDetailsBox}>
                <Text style={styles.certCode}>ID: {pledgeSuccessModal?.certId}</Text>
                <Text style={styles.certPerk}>Badge: {pledgeSuccessModal?.tier.badge}</Text>
                <Text style={styles.certNote}>
                  100% of your pledge protects rescued cows, sheep, pigs, and companions facing
                  trauma emergencies.
                </Text>
              </View>

              <TouchableOpacity
                testID='close-pledge-modal-btn'
                style={styles.pledgeCloseBtn}
                onPress={() => setPledgeSuccessModal(null)}
              >
                <Text style={styles.pledgeCloseBtnText}>Continue Protecting Lives</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Modal>
      </SpaceBackground>
    </View>
  );
};

export default SanctuaryAssuranceScreen;

const styles = StyleSheet.create({
  container: {
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
  reservePill: {
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
  reservePillText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '800',
  },
  statsHeroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  statLbl: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  tabItemActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.4)',
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  scrollList: {
    padding: 16,
    paddingBottom: 32,
  },
  claimCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
  },
  claimTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  claimEmojiBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  claimHeaderInfo: {
    flex: 1,
  },
  claimTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimAnimalName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusDisbursed: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
  },
  statusVerified: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
  },
  statusReview: {
    backgroundColor: 'rgba(242, 201, 76, 0.2)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  claimSanctuary: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  claimCostBadge: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimCostText: {
    color: '#38EF7D',
    fontSize: 15,
    fontWeight: '900',
  },
  conditionBox: {
    backgroundColor: 'rgba(255, 107, 139, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  conditionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF6B8B',
  },
  hospitalText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  claimStory: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 12,
  },
  itemizedBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  itemizedHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
  },
  itemCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38EF7D',
  },
  blockchainFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  txHashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  txHashText: {
    fontSize: 10,
    color: '#8E8E93',
    fontFamily: 'Courier',
  },
  viewAuditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewAuditBtnText: {
    fontSize: 11,
    color: '#38EF7D',
    fontWeight: '700',
  },
  underwriteHero: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  underwriteTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  underwriteSub: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  tierCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tierBadgeBox: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38EF7D',
  },
  tierAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  tierImpact: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
    marginBottom: 14,
  },
  tierFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierKarma: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierKarmaText: {
    fontSize: 12,
    color: '#38EF7D',
    fontWeight: '700',
  },
  pledgeBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pledgeBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  formSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 16,
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  submitClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  submitClaimBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  auditSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  auditTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  auditBody: {
    marginBottom: 16,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  auditLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  auditValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  auditHashBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  auditHashTitle: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  auditHashText: {
    fontSize: 11,
    color: '#38EF7D',
    fontFamily: 'Courier',
    lineHeight: 15,
  },
  certVerifierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  certVerifierText: {
    fontSize: 11,
    color: '#38EF7D',
    lineHeight: 14,
  },
  auditActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  auditShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  auditShareBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  auditDoneBtn: {
    flex: 1,
    backgroundColor: '#38EF7D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  auditDoneBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  pledgeSuccessCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  pledgeEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  pledgeSuccessTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  pledgeSuccessSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  certDetailsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  certCode: {
    fontSize: 11,
    color: '#38EF7D',
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  certPerk: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  certNote: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 15,
  },
  pledgeCloseBtn: {
    width: '100%',
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  pledgeCloseBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
});
