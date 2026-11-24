import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import {
  ArrowLeft,
  Briefcase,
  MagnifyingGlass,
  MapPin,
  BookmarkSimple,
  ShareNetwork,
  ShieldCheck,
  Sparkle,
  CheckCircle,
  X,
  Globe,
  PaperPlaneTilt,
} from 'phosphor-react-native';
import { useToast } from '../../contexts/ToastContext';
import type { VeganJob } from '../../data/veganJobData';
import { VEGAN_JOBS } from '../../data/veganJobData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'VeganJobs'>;

const CATEGORIES = [
  'All',
  'Tech & Science',
  'Sanctuary & Animals',
  'Culinary & Food',
  'Marketing & Ops',
] as const;

const WORKPLACE_TYPES = ['All', 'Remote', 'Hybrid', 'On-site'] as const;

export default function VeganJobsScreen({ navigation }: Props) {
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [selectedWorkplace, setSelectedWorkplace] =
    useState<(typeof WORKPLACE_TYPES)[number]>('All');
  const [onlySaved, setOnlySaved] = useState(false);

  // Job data state (supports bookmarking and application tracking)
  const [jobs, setJobs] = useState<VeganJob[]>(VEGAN_JOBS);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Apply Modal state
  const [applyingJob, setApplyingJob] = useState<VeganJob | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('user@kindred.earth');

  // Filter logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Saved filter
      if (onlySaved && !job.isBookmarked) return false;

      // Category filter
      if (selectedCategory !== 'All' && job.category !== selectedCategory) return false;

      // Workplace filter
      if (selectedWorkplace !== 'All' && job.workplaceType !== selectedWorkplace) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesLocation = job.location.toLowerCase().includes(q);
        const matchesTags = job.tags.some(t => t.toLowerCase().includes(q));
        const matchesDesc = job.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCompany && !matchesLocation && !matchesTags && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, onlySaved, selectedCategory, selectedWorkplace, searchQuery]);

  const handleToggleBookmark = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          const nextSaved = !j.isBookmarked;
          showToast(nextSaved ? 'Job saved to bookmarks.' : 'Job removed from bookmarks.', 'info');
          return { ...j, isBookmarked: nextSaved };
        }
        return j;
      }),
    );
  };

  const handleShareJob = async (job: VeganJob) => {
    try {
      await Share.share({
        message: `Check out this cruelty-free career opportunity: "${job.title}" at ${job.company} (${job.salaryRange})! 🌿 Apply via @KindredApp: https://kindred.earth/jobs/${job.id}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleSubmitApplication = () => {
    if (!applyingJob) return;
    const jobId = applyingJob.id;
    const company = applyingJob.company;
    const title = applyingJob.title;

    setAppliedJobIds(prev => [...prev, jobId]);
    setApplyingJob(null);
    setCoverNote('');

    showToast(`🎉 Application submitted for ${title} at ${company}!`, 'success');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          testID='back-btn'
        >
          <ArrowLeft size={24} color='#fff' />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cruelty-Free Careers</Text>
          <Text style={styles.headerSubtitle}>Verified 100% Ethical & Plant-Based</Text>
        </View>
        <TouchableOpacity
          onPress={() => setOnlySaved(prev => !prev)}
          style={[styles.savedFilterBtn, onlySaved && styles.savedFilterBtnActive]}
          testID='saved-jobs-toggle'
        >
          <BookmarkSimple
            size={20}
            color={onlySaved ? '#38EF7D' : 'rgba(255,255,255,0.6)'}
            weight={onlySaved ? 'fill' : 'regular'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MagnifyingGlass size={18} color='rgba(255,255,255,0.4)' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search role, skill, company (e.g. Science, Cashew)'
            placeholderTextColor='rgba(255,255,255,0.4)'
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <X size={16} color='#fff' />
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Mission Card */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color='#38EF7D' weight='fill' />
              <Text style={styles.verifiedBadgeText}>100% Animal-Free Mission</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statPillText}>{jobs.length} Active Positions</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Work Where Your Values Matter</Text>
          <Text style={styles.heroSub}>
            Every employer on Kindred is vetted: zero animal testing, zero slaughterhouse supply
            chains, and authentic cruelty-free impact.
          </Text>
        </View>

        {/* Workplace Type Segmented Filter */}
        <View style={styles.workplaceSegment}>
          {WORKPLACE_TYPES.map(type => {
            const isActive = selectedWorkplace === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.workplaceBtn, isActive && styles.workplaceBtnActive]}
                onPress={() => setSelectedWorkplace(type)}
                testID={`workplace-filter-${type}`}
              >
                <Text style={[styles.workplaceBtnText, isActive && styles.workplaceBtnTextActive]}>
                  {type === 'All' ? 'All Sites' : type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScroll}
          contentContainerStyle={styles.catContainer}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, isActive && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.catChipText, isActive && styles.catChipTextActive]}>
                  {cat === 'All' ? '🌱 All Categories' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Job Listings List */}
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🔎</Text>
            <Text style={styles.emptyTitle}>No Matching Roles Found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search terms or clearing your filters to see all cruelty-free jobs.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedWorkplace('All');
                setOnlySaved(false);
              }}
            >
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredJobs.map(job => {
            const hasApplied = appliedJobIds.includes(job.id);

            return (
              <View key={job.id} style={styles.jobCard}>
                {/* Header: Logo, Title, Company */}
                <View style={styles.jobHeader}>
                  <View style={styles.companyLogoBox}>
                    <Text style={styles.companyLogoText}>{job.companyLogo}</Text>
                  </View>

                  <View style={styles.jobTitleBlock}>
                    <View style={styles.titleRow}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                    </View>
                    <View style={styles.companyRow}>
                      <Text style={styles.companyName}>{job.company}</Text>
                      {job.verifiedCompany && (
                        <View style={styles.companyVerifiedPill}>
                          <ShieldCheck size={12} color='#38EF7D' weight='fill' />
                          <Text style={styles.companyVerifiedText}>Verified Ethical</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Bookmark Button */}
                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={() => handleToggleBookmark(job.id)}
                    testID={`bookmark-${job.id}`}
                  >
                    <BookmarkSimple
                      size={20}
                      color={job.isBookmarked ? '#38EF7D' : 'rgba(255,255,255,0.4)'}
                      weight={job.isBookmarked ? 'fill' : 'regular'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Badges: Salary, Workplace, Location */}
                <View style={styles.metaBadgeRow}>
                  <View style={styles.salaryBadge}>
                    <Text style={styles.salaryText}>{job.salaryRange}</Text>
                  </View>
                  <View style={styles.workplaceBadge}>
                    {job.workplaceType === 'Remote' ? (
                      <Globe size={12} color='#2B86FA' weight='bold' />
                    ) : (
                      <MapPin size={12} color='#F2C94C' weight='bold' />
                    )}
                    <Text style={styles.workplaceText}>{job.workplaceType}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{job.employmentType}</Text>
                  </View>
                </View>

                {/* Location & Posted Time */}
                <View style={styles.locationRow}>
                  <MapPin size={12} color='rgba(255,255,255,0.4)' />
                  <Text style={styles.locationText}>
                    {job.location} · {job.postedAgo}
                  </Text>
                </View>

                {/* Impact Statement Box */}
                <View style={styles.impactBox}>
                  <Sparkle size={14} color='#38EF7D' weight='fill' />
                  <Text style={styles.impactText}>{job.impactStatement}</Text>
                </View>

                {/* Description */}
                <Text style={styles.jobDesc}>{job.description}</Text>

                {/* Skills/Tags */}
                <View style={styles.tagsRow}>
                  {job.tags.map(tag => (
                    <View key={tag} style={styles.jobTagPill}>
                      <Text style={styles.jobTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Actions: Share & Quick Apply */}
                <View style={styles.jobActions}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareJob(job)}
                    testID={`share-${job.id}`}
                  >
                    <ShareNetwork size={18} color='#fff' weight='bold' />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.applyBtn, hasApplied && styles.applyBtnDisabled]}
                    onPress={() => {
                      if (!hasApplied) {
                        setApplyingJob(job);
                      }
                    }}
                    disabled={hasApplied}
                    testID={`apply-${job.id}`}
                  >
                    {hasApplied ? (
                      <>
                        <CheckCircle size={18} color='#38EF7D' weight='fill' />
                        <Text style={styles.applyBtnTextApplied}>Applied ✓</Text>
                      </>
                    ) : (
                      <>
                        <PaperPlaneTilt size={16} color='#000' weight='fill' />
                        <Text style={styles.applyBtnText}>1-Click Quick Apply</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Quick Apply Modal */}
      {applyingJob && (
        <Modal
          visible={true}
          transparent={true}
          animationType='fade'
          onRequestClose={() => setApplyingJob(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setApplyingJob(null)}>
                <X size={20} color='#fff' />
              </TouchableOpacity>

              <View style={styles.modalLogoBox}>
                <Text style={{ fontSize: 32 }}>{applyingJob.companyLogo}</Text>
              </View>

              <Text style={styles.modalJobTitle}>{applyingJob.title}</Text>
              <Text style={styles.modalCompanySub}>
                {applyingJob.company} · {applyingJob.workplaceType}
              </Text>

              <View style={styles.verifiedApplicationPill}>
                <ShieldCheck size={14} color='#38EF7D' weight='fill' />
                <Text style={styles.verifiedApplicationText}>
                  Kindred Verified Ethical Applicant
                </Text>
              </View>

              {/* Applicant Info Summary */}
              <View style={styles.modalInputBlock}>
                <Text style={styles.inputLabel}>Applicant Profile Email:</Text>
                <TextInput
                  style={styles.textInput}
                  value={applicantEmail}
                  onChangeText={setApplicantEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                />
              </View>

              <View style={styles.modalInputBlock}>
                <Text style={styles.inputLabel}>Personal Note / Why this mission excites you:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder='e.g. As an ethical vegan, I am deeply committed to your mission of cruelty-free innovation...'
                  placeholderTextColor='rgba(255,255,255,0.4)'
                  value={coverNote}
                  onChangeText={setCoverNote}
                  multiline={true}
                  numberOfLines={4}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSubmitApplication}
                testID='submit-application-btn'
              >
                <PaperPlaneTilt size={18} color='#000' weight='fill' />
                <Text style={styles.modalSubmitBtnText}>Submit Ethical Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0A0E12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 },
  savedFilterBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  savedFilterBtnActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
  },

  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    marginLeft: 8,
    padding: 0,
  },
  clearSearchBtn: { padding: 4 },

  heroBanner: {
    backgroundColor: '#161B22',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  statPill: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 16 },

  workplaceSegment: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  workplaceBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  workplaceBtnActive: { backgroundColor: '#fff' },
  workplaceBtnText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  workplaceBtnTextActive: { color: '#000', fontWeight: '700' },

  catScroll: { marginBottom: 16 },
  catContainer: { gap: 8 },
  catChip: {
    backgroundColor: '#161B22',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderColor: '#38EF7D',
  },
  catChipText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: '#38EF7D', fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
  },
  resetBtnText: { color: '#000', fontSize: 12, fontWeight: '700' },

  jobCard: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  companyLogoBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyLogoText: { fontSize: 24 },
  jobTitleBlock: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  jobTitle: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  companyName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  companyVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  companyVerifiedText: { color: '#38EF7D', fontSize: 10, fontWeight: '700' },
  bookmarkBtn: { padding: 4 },

  metaBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  salaryBadge: {
    backgroundColor: 'rgba(56, 239, 125, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  salaryText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },
  workplaceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workplaceText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  typeBadge: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '500' },

  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  locationText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  impactBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  impactText: { color: '#38EF7D', fontSize: 11, fontWeight: '600', flex: 1 },

  jobDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  jobTagPill: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  jobTagText: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '500' },

  jobActions: { flexDirection: 'row', gap: 8 },
  shareBtn: {
    backgroundColor: '#21262D',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  applyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38EF7D',
    paddingVertical: 11,
    borderRadius: 12,
  },
  applyBtnDisabled: { backgroundColor: '#21262D', borderWidth: 1, borderColor: '#38EF7D' },
  applyBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },
  applyBtnTextApplied: { color: '#38EF7D', fontSize: 13, fontWeight: '800' },

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
    backgroundColor: '#161B22',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.25)',
  },
  modalCloseBtn: { alignSelf: 'flex-end', padding: 4 },
  modalLogoBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalJobTitle: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  modalCompanySub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  verifiedApplicationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 14,
  },
  verifiedApplicationText: { color: '#38EF7D', fontSize: 11, fontWeight: '700' },

  modalInputBlock: { width: '100%', marginBottom: 12 },
  inputLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  textInput: {
    backgroundColor: '#21262D',
    borderRadius: 10,
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  modalSubmitBtn: {
    backgroundColor: '#38EF7D',
    borderRadius: 14,
    width: '100%',
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  modalSubmitBtnText: { color: '#000', fontSize: 14, fontWeight: '800' },
});
