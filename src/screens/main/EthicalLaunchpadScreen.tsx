import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  MagnifyingGlass,
  X,
  Sparkle,
  Plus,
  Heart,
  CheckCircle,
  ShieldCheck,
  Lightning,
  CaretUp,
  Target,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { EthicalProject, BackerPerk } from '../../data/ethicalLaunchpadData';
import { ETHICAL_PROJECTS } from '../../data/ethicalLaunchpadData';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  'All',
  'Alt-Protein & Dairy',
  'Biomaterials',
  'Zero-Waste Snacks',
  'Animal Tech',
  'Circular Fashion',
] as const;

export const EthicalLaunchpadScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<EthicalProject[]>(ETHICAL_PROJECTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected project for backer/detail modal
  const [selectedProject, setSelectedProject] = useState<EthicalProject | null>(null);
  const [selectedPerk, setSelectedPerk] = useState<BackerPerk | null>(null);

  // Submit innovation modal
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newCategory, setNewCategory] = useState<EthicalProject['category']>('Alt-Protein & Dairy');
  const [newFounder, setNewFounder] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newAnimalImpact, setNewAnimalImpact] = useState('');
  const [newPledgeAgreed, setNewPledgeAgreed] = useState(false);

  // Filtered projects
  const filteredProjects = projects.filter(project => {
    const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesName = project.name.toLowerCase().includes(query);
    const matchesTagline = project.tagline.toLowerCase().includes(query);
    const matchesFounder = project.founder.toLowerCase().includes(query);

    return matchesCategory && (matchesName || matchesTagline || matchesFounder);
  });

  const handleToggleUpvote = (projectId: string) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          const isUpvoted = !p.userUpvoted;
          const newCount = isUpvoted ? p.upvotesCount + 1 : p.upvotesCount - 1;
          if (isUpvoted) {
            showToast('▲ Upvoted! +10 Kindred Karma for supporting plant innovation.', 'success');
          }
          return { ...p, userUpvoted: isUpvoted, upvotesCount: newCount };
        }
        return p;
      }),
    );
  };

  const handleOpenBacking = (project: EthicalProject) => {
    setSelectedProject(project);
    setSelectedPerk(project.perks[0] || null);
  };

  const handleConfirmPledge = () => {
    if (!selectedProject || !selectedPerk) return;

    const perkTitle = selectedPerk.title;
    const perkAmount = selectedPerk.amount;
    const projName = selectedProject.name;

    // Update state to increment funds and backers
    setProjects(prev =>
      prev.map(p => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            fundsRaised: p.fundsRaised + perkAmount,
            backersCount: p.backersCount + 1,
          };
        }
        return p;
      }),
    );

    setSelectedProject(null);

    Alert.alert(
      '🎉 Seed Micro-Backing Confirmed!',
      `You backed ${projName} with $${perkAmount}.\n\nReward: ${perkTitle}\nEstimated Delivery: ${selectedPerk.estimatedDelivery}\n\nThank you for accelerating cruelty-free alternatives!`,
      [
        {
          text: 'Awesome!',
          onPress: () => showToast('Backing pledged! Backer certificate issued.', 'success'),
        },
      ],
    );
  };

  const handleSubmitInnovation = () => {
    if (!newTitle.trim() || !newTagline.trim() || !newFounder.trim()) {
      showToast('Please fill in title, tagline, and founder name.', 'error');
      return;
    }
    if (!newPledgeAgreed) {
      showToast('Please accept the cruelty-free innovation pledge.', 'error');
      return;
    }

    const goalNum = parseFloat(newGoal) || 25000;
    const newProj: EthicalProject = {
      id: `proj-${Date.now()}`,
      name: newTitle.trim(),
      tagline: newTagline.trim(),
      category: newCategory,
      founder: newFounder.trim(),
      location: 'Kindred Global Collective',
      avatarEmoji: '💡',
      upvotesCount: 1,
      userUpvoted: true,
      fundsRaised: 250,
      fundingGoal: goalNum,
      backersCount: 1,
      daysLeft: 30,
      animalImpactTarget:
        newAnimalImpact.trim() || 'Accelerates transition to 100% plant-based living.',
      story: newTagline.trim(),
      milestones: [
        { title: 'Project launched on Kindred Ethical Launchpad', completed: true },
        { title: 'Prototype refinement and community feedback', completed: false },
        { title: 'Commercial batch production rollout', completed: false },
      ],
      perks: [
        {
          id: `perk-${Date.now()}`,
          amount: 25,
          title: 'Founding Backer Taster & Recognition',
          description: 'Early access sample kit and digital Kindred Backer NFT/Certificate.',
          estimatedDelivery: 'Dec 2026',
          backersClaimed: 1,
        },
      ],
    };

    setProjects(prev => [newProj, ...prev]);
    setIsSubmitModalVisible(false);

    // Reset form
    setNewTitle('');
    setNewTagline('');
    setNewFounder('');
    setNewGoal('');
    setNewAnimalImpact('');
    setNewPledgeAgreed(false);

    showToast(`Innovation "${newProj.name}" is now live on the launchpad!`, 'success');
  };

  return (
    <SpaceBackground earthPosition='bottom-right' enableComets={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel='Go back'
            testID='launchpad-back-btn'
          >
            <ArrowLeft size={22} color='#fff' />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Ethical Launchpad</Text>
              <View style={styles.verifiedBadge}>
                <Sparkle size={14} color='#38EF7D' weight='bold' />
                <Text style={styles.verifiedBadgeText}>Product Hunt for Plant Tech</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Upvote & micro-back cruelty-free seed innovations</Text>
          </View>

          {/* Launch Innovation Button */}
          <TouchableOpacity
            style={styles.launchHeaderBtn}
            onPress={() => setIsSubmitModalVisible(true)}
            testID='open-launch-modal-btn'
            accessibilityLabel='Submit a plant innovation'
          >
            <Plus size={16} color='#000' weight='bold' />
            <Text style={styles.launchHeaderBtnText}>Launch</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <GlassCard style={styles.searchCard}>
          <MagnifyingGlass size={18} color='rgba(255,255,255,0.5)' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search precision cheese, mushroom sneakers, candy bars...'
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID='launchpad-search-input'
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color='rgba(255,255,255,0.5)' />
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
              testID={`launch-category-${category}`}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Projects List */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.projectsList}>
          {filteredProjects.map(project => {
            const percentFunded = Math.min(
              100,
              Math.round((project.fundsRaised / project.fundingGoal) * 100),
            );

            return (
              <GlassCard key={project.id} style={styles.projectCard}>
                <View style={styles.cardTopRow}>
                  {/* Upvote Button on Left */}
                  <TouchableOpacity
                    style={[styles.upvoteBtn, project.userUpvoted && styles.upvoteBtnActive]}
                    onPress={() => handleToggleUpvote(project.id)}
                    testID={`upvote-btn-${project.id}`}
                  >
                    <CaretUp
                      size={20}
                      color={project.userUpvoted ? '#000' : '#38EF7D'}
                      weight='bold'
                    />
                    <Text
                      style={[
                        styles.upvoteCountText,
                        project.userUpvoted && styles.upvoteCountTextActive,
                      ]}
                    >
                      {project.upvotesCount}
                    </Text>
                  </TouchableOpacity>

                  {/* Main Project Summary */}
                  <TouchableOpacity
                    style={styles.projectMainTouch}
                    activeOpacity={0.85}
                    onPress={() => handleOpenBacking(project)}
                    testID={`project-card-${project.id}`}
                  >
                    <View style={styles.projectHeaderLine}>
                      <Text style={styles.projectEmoji}>{project.avatarEmoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.projectName}>{project.name}</Text>
                        <Text style={styles.projectFounder}>
                          By {project.founder} • {project.location}
                        </Text>
                      </View>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{project.category}</Text>
                      </View>
                    </View>

                    <Text style={styles.projectTagline} numberOfLines={2}>
                      {project.tagline}
                    </Text>

                    {/* Animal Impact Target */}
                    <View style={styles.impactRow}>
                      <Heart size={14} color='#FF6B6B' weight='fill' />
                      <Text style={styles.impactText} numberOfLines={1}>
                        {project.animalImpactTarget}
                      </Text>
                    </View>

                    {/* Progress Bar & Stats */}
                    <View style={styles.fundingBarContainer}>
                      <View style={styles.fundingBarTrack}>
                        <View style={[styles.fundingBarFill, { width: `${percentFunded}%` }]} />
                      </View>
                      <View style={styles.fundingStatsRow}>
                        <Text style={styles.fundingRaisedText}>
                          ${project.fundsRaised.toLocaleString()}{' '}
                          <Text style={styles.fundingGoalText}>
                            / ${project.fundingGoal.toLocaleString()} ({percentFunded}%)
                          </Text>
                        </Text>
                        <Text style={styles.fundingBackersText}>
                          👥 {project.backersCount} Backers • {project.daysLeft}d left
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Back CTA Button */}
                <TouchableOpacity
                  style={styles.backProjectCta}
                  onPress={() => handleOpenBacking(project)}
                  testID={`back-cta-${project.id}`}
                >
                  <Lightning size={16} color='#000' weight='fill' />
                  <Text style={styles.backProjectCtaText}>Back This Innovation</Text>
                </TouchableOpacity>
              </GlassCard>
            );
          })}

          {filteredProjects.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>No Innovations Found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or choosing another innovation category.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Backing & Innovation Details Modal */}
      {selectedProject && (
        <Modal
          visible={!!selectedProject}
          transparent
          animationType='slide'
          onRequestClose={() => setSelectedProject(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalEmojiBox}>
                  <Text style={styles.modalEmoji}>{selectedProject.avatarEmoji}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProject(null)}>
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalCategory}>{selectedProject.category}</Text>
              <Text style={styles.modalTitle}>{selectedProject.name}</Text>
              <Text style={styles.modalTagline}>{selectedProject.tagline}</Text>
              <Text style={styles.modalFounder}>
                Founder: {selectedProject.founder} ({selectedProject.location})
              </Text>

              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {/* Animal Impact Card */}
                <View style={styles.modalImpactCard}>
                  <Heart size={16} color='#FF6B6B' weight='fill' />
                  <Text style={styles.modalImpactText}>{selectedProject.animalImpactTarget}</Text>
                </View>

                {/* Founder Story */}
                <Text style={styles.modalSectionLabel}>The Innovation Story</Text>
                <Text style={styles.modalStory}>{selectedProject.story}</Text>

                {/* Milestones */}
                <Text style={styles.modalSectionLabel}>Development Milestones</Text>
                <View style={styles.milestonesList}>
                  {selectedProject.milestones.map((m, i) => (
                    <View key={i} style={styles.milestoneRow}>
                      <CheckCircle
                        size={16}
                        color={m.completed ? '#38EF7D' : 'rgba(255,255,255,0.3)'}
                        weight={m.completed ? 'fill' : 'regular'}
                      />
                      <Text style={[styles.milestoneText, m.completed && styles.milestoneTextDone]}>
                        {m.title}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Backer Perks Selector */}
                <Text style={styles.modalSectionLabel}>Select Backer Seed Perk</Text>
                <View style={styles.perksList}>
                  {selectedProject.perks.map(perk => (
                    <TouchableOpacity
                      key={perk.id}
                      style={[
                        styles.perkCard,
                        selectedPerk?.id === perk.id && styles.perkCardActive,
                      ]}
                      onPress={() => setSelectedPerk(perk)}
                    >
                      <View style={styles.perkHeader}>
                        <Text style={styles.perkAmount}>${perk.amount}</Text>
                        <Text style={styles.perkClaimed}>{perk.backersClaimed} Claimed</Text>
                      </View>
                      <Text style={styles.perkTitle}>{perk.title}</Text>
                      <Text style={styles.perkDesc}>{perk.description}</Text>
                      <Text style={styles.perkDelivery}>
                        Est. Delivery: {perk.estimatedDelivery}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Action */}
              <View style={styles.modalFooterActions}>
                <TouchableOpacity
                  style={styles.pledgeConfirmBtn}
                  onPress={handleConfirmPledge}
                  testID='confirm-pledge-btn'
                >
                  <Lightning size={18} color='#000' weight='fill' />
                  <Text style={styles.pledgeConfirmBtnText}>
                    Pledge ${selectedPerk?.amount || 25} to Innovation
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}

      {/* Submit Innovation Modal */}
      {isSubmitModalVisible && (
        <Modal
          visible={isSubmitModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setIsSubmitModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.submitModalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.submitModalTitle}>Launch a Plant Innovation</Text>
                  <Text style={styles.submitModalSub}>
                    Get discovered and backed by conscious investors and consumers
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setIsSubmitModalVisible(false)}
                >
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }}>
                <Text style={styles.formLabel}>Innovation Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. MycoCheese or BioSilk App'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={newTitle}
                  onChangeText={setNewTitle}
                  testID='innovation-title-input'
                />

                <Text style={styles.formLabel}>One-Sentence Tagline *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='What makes this revolutionary for animals and planet?'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={newTagline}
                  onChangeText={setNewTagline}
                  testID='innovation-tagline-input'
                />

                <Text style={styles.formLabel}>Founder / Team Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. Elena Rostova & Lab Team'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={newFounder}
                  onChangeText={setNewFounder}
                  testID='innovation-founder-input'
                />

                <Text style={styles.formLabel}>Seed Funding Goal ($ USD) *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. 50000'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  keyboardType='numeric'
                  value={newGoal}
                  onChangeText={setNewGoal}
                  testID='innovation-goal-input'
                />

                <Text style={styles.formLabel}>Animal Impact Target</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g. Replaces 5,000 cattle hides annually'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={newAnimalImpact}
                  onChangeText={setNewAnimalImpact}
                />

                <TouchableOpacity
                  style={styles.pledgeRow}
                  onPress={() => setNewPledgeAgreed(!newPledgeAgreed)}
                  activeOpacity={0.8}
                  testID='innovation-pledge-toggle'
                >
                  <View style={[styles.checkbox, newPledgeAgreed && styles.checkboxActive]}>
                    {newPledgeAgreed && <CheckCircle size={18} color='#000' weight='fill' />}
                  </View>
                  <Text style={styles.pledgeText}>
                    I certify that this project is 100% cruelty-free, animal-free, and adheres to
                    ethical open innovation standards.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitLaunchBtn}
                  onPress={handleSubmitInnovation}
                  testID='submit-innovation-btn'
                >
                  <Text style={styles.submitLaunchBtnText}>Publish to Launchpad</Text>
                </TouchableOpacity>
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      )}
    </SpaceBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadgeText: {
    color: '#38EF7D',
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  launchHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  launchHeaderBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },

  categoryScroll: {
    marginBottom: 8,
  },
  categoryContent: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },

  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  projectsList: {
    gap: 14,
  },
  projectCard: {
    padding: 16,
    borderRadius: 18,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  upvoteBtn: {
    width: 48,
    height: 60,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upvoteBtnActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  upvoteCountText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '800',
    marginTop: -2,
  },
  upvoteCountTextActive: {
    color: '#000',
  },
  projectMainTouch: {
    flex: 1,
  },
  projectHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  projectEmoji: {
    fontSize: 22,
  },
  projectName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  projectFounder: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '600',
  },
  projectTagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    marginBottom: 10,
  },
  impactText: {
    color: '#FF8787',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  fundingBarContainer: {
    gap: 4,
  },
  fundingBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fundingBarFill: {
    height: '100%',
    backgroundColor: '#38EF7D',
    borderRadius: 3,
  },
  fundingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundingRaisedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  fundingGoalText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  fundingBackersText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  backProjectCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38EF7D',
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  backProjectCtaText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },

  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategory: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  modalFounder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginBottom: 10,
  },
  modalImpactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  modalImpactText: {
    color: '#FF8787',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalSectionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modalStory: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  milestonesList: {
    gap: 6,
    marginBottom: 12,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  milestoneTextDone: {
    color: '#fff',
    fontWeight: '600',
  },
  perksList: {
    gap: 10,
    marginBottom: 14,
  },
  perkCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 12,
  },
  perkCardActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderColor: '#38EF7D',
  },
  perkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  perkAmount: {
    color: '#38EF7D',
    fontSize: 16,
    fontWeight: '800',
  },
  perkClaimed: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  perkTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  perkDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  perkDelivery: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
  modalFooterActions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginTop: 6,
  },
  pledgeConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  pledgeConfirmBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },

  // Submit modal
  submitModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  submitModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  submitModalSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  formLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
  },
  pledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#38EF7D',
    borderColor: '#38EF7D',
  },
  pledgeText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    lineHeight: 15,
  },
  submitLaunchBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitLaunchBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default EthicalLaunchpadScreen;
