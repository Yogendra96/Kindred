import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowLeft,
  QrCode,
  ShareNetwork,
  DownloadSimple,
  Copy,
  PencilSimple,
  Users,
  CheckCircle,
  ShieldCheck,
  Sparkle,
  ArrowUpRight,
  Camera,
  Phone,
  EnvelopeSimple,
  Globe,
  Plus,
  Trash,
  MapPin,
  Heart,
  MagnifyingGlass,
  UserCheck,
  X,
  Buildings,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import { QRCodeSvg } from '../../utils/qrCodeHelper';
import type { EthicalCardProfile, EthicalLink, CardTheme } from '../../data/ethicalCardData';
import { MY_ETHICAL_CARD, SAVED_ETHICAL_CONTACTS, generateVCard } from '../../data/ethicalCardData';
import type { AppStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

type ActiveTab = 'card' | 'scan' | 'rolodex' | 'edit';

export const EthicalCardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ActiveTab>('card');
  const [profile, setProfile] = useState<EthicalCardProfile>(MY_ETHICAL_CARD);
  const [savedContacts, setSavedContacts] = useState<EthicalCardProfile[]>(SAVED_ETHICAL_CONTACTS);

  // Rolodex search
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner manual input & matched modal
  const [manualUsernameInput, setManualUsernameInput] = useState('');
  const [connectionModal, setConnectionModal] = useState<EthicalCardProfile | null>(null);

  // Edit form state
  const [editName, setEditName] = useState(profile.name);
  const [editPronouns, setEditPronouns] = useState(profile.pronouns);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editOrg, setEditOrg] = useState(profile.organization);
  const [editBio, setEditBio] = useState(profile.bio);
  const [editEmail, setEditEmail] = useState(profile.email);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editWebsite, setEditWebsite] = useState(profile.website);
  const [editTheme, setEditTheme] = useState<CardTheme>(profile.theme);
  const [editLinks, setEditLinks] = useState<EthicalLink[]>(profile.links);

  // Add Link Modal
  const [isAddLinkModalVisible, setIsAddLinkModalVisible] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkCategory, setNewLinkCategory] = useState<EthicalLink['category']>('Professional');

  const publicUrl = `https://kindred.earth/u/${profile.username}`;

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return savedContacts;
    return savedContacts.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q)),
    );
  }, [savedContacts, searchQuery]);

  // Actions
  const handleShareLink = async () => {
    try {
      await Share.share({
        title: `${profile.name} — Kindred Ethical Card`,
        message: `Connect with ${profile.name} (${profile.title} at ${profile.organization}) on Kindred: ${publicUrl}\n\nTree-free, zero-waste digital card & ethical bio.`,
      });
    } catch {
      // Ignored
    }
  };

  const handleCopyLink = () => {
    showToast(`Copied public profile link: ${publicUrl}`, 'success');
  };

  const handleDownloadVCard = (targetProfile: EthicalCardProfile = profile) => {
    const vcard = generateVCard(targetProfile);
    showToast(`vCard for ${targetProfile.name} ready! Ready to save to contacts.`, 'success');
  };

  const handleConnectUser = (newContact: EthicalCardProfile) => {
    if (savedContacts.some(c => c.id === newContact.id)) {
      showToast(`${newContact.name} is already in your Ethical Rolodex!`, 'info');
      setConnectionModal(newContact);
      return;
    }

    setSavedContacts(prev => [newContact, ...prev]);
    setConnectionModal(newContact);
    showToast(
      `🤝 Ethical Connection Made! +25 Kindred Karma for connecting with ${newContact.name}!`,
      'success',
    );
  };

  const handleScanManual = () => {
    const q = manualUsernameInput.trim().toLowerCase();
    if (!q) return;

    const match = SAVED_ETHICAL_CONTACTS.find(
      c => c.username.toLowerCase() === q || c.name.toLowerCase().includes(q),
    );

    if (match) {
      handleConnectUser(match);
      setManualUsernameInput('');
    } else {
      // Create ad-hoc contact
      const generatedContact: EthicalCardProfile = {
        id: `card-${Date.now()}`,
        username: q.replace(/\s+/g, '-'),
        name: manualUsernameInput.trim(),
        pronouns: 'they/them',
        title: 'Ethical Community Member',
        organization: 'Kindred Network',
        bio: 'Passionate climate & animal advocate.',
        avatarEmoji: '🌍',
        location: 'Global',
        email: `${q}@kindred.earth`,
        phone: '+1 (555) 012-3456',
        website: `https://kindred.earth/u/${q}`,
        theme: 'midnight-emerald',
        impact: {
          yearsPlantBased: 2.0,
          co2AvoidedKg: 950,
          animalLivesProtected: 180,
          karmaScore: 500,
        },
        endorsedSanctuary: MY_ETHICAL_CARD.endorsedSanctuary,
        links: [],
        tags: ['Network Member'],
      };
      handleConnectUser(generatedContact);
      setManualUsernameInput('');
    }
  };

  const handleSaveProfile = () => {
    setProfile(prev => ({
      ...prev,
      name: editName,
      pronouns: editPronouns,
      title: editTitle,
      organization: editOrg,
      bio: editBio,
      email: editEmail,
      phone: editPhone,
      website: editWebsite,
      theme: editTheme,
      links: editLinks,
    }));
    setActiveTab('card');
    showToast('✨ Ethical Card & Bio Hub updated successfully!', 'success');
  };

  const handleAddNewLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and URL for your link.');
      return;
    }

    const newLink: EthicalLink = {
      id: `link-${Date.now()}`,
      title: newLinkTitle.trim(),
      url: newLinkUrl.trim(),
      icon: newLinkUrl.includes('linkedin')
        ? 'linkedin'
        : newLinkUrl.includes('github')
          ? 'github'
          : newLinkUrl.includes('substack')
            ? 'substack'
            : newLinkUrl.includes('instagram')
              ? 'instagram'
              : 'website',
      category: newLinkCategory,
    };

    setEditLinks(prev => [...prev, newLink]);
    setNewLinkTitle('');
    setNewLinkUrl('');
    setIsAddLinkModalVisible(false);
    showToast('Added new custom bio link!', 'success');
  };

  const handleDeleteLink = (linkId: string) => {
    setEditLinks(prev => prev.filter(l => l.id !== linkId));
    showToast('Link removed.', 'info');
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      showToast('Could not open link.', 'error');
    });
  };

  const getThemeGradient = (theme: CardTheme) => {
    switch (theme) {
      case 'solar-flora':
        return { borderColor: '#F2994A', accentColor: '#F2C94C' };
      case 'deep-forest':
        return { borderColor: '#11998E', accentColor: '#38EF7D' };
      case 'cosmic-violet':
        return { borderColor: '#9B51E0', accentColor: '#00F2FE' };
      default:
        return { borderColor: '#38EF7D', accentColor: '#38EF7D' };
    }
  };

  const currentTheme = getThemeGradient(profile.theme);

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
              <QrCode size={20} color={currentTheme.accentColor} weight='bold' />
              <Text style={styles.headerTitle}>Ethical Card & Bio</Text>
            </View>
            <Text style={styles.headerSubtitle}>Tree-free digital card & public bio hub</Text>
          </View>
          <View style={styles.karmaBadge}>
            <Sparkle size={14} color='#38EF7D' weight='fill' />
            <Text style={styles.karmaBadgeText}>+{profile.impact.karmaScore} Karma</Text>
          </View>
        </View>

        {/* Tab Navigation Controls */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            testID='tab-my-card'
            style={[styles.tabItem, activeTab === 'card' && styles.tabItemActive]}
            onPress={() => setActiveTab('card')}
          >
            <QrCode size={18} color={activeTab === 'card' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'card' && styles.tabLabelActive]}>
              My Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='tab-scan-qr'
            style={[styles.tabItem, activeTab === 'scan' && styles.tabItemActive]}
            onPress={() => setActiveTab('scan')}
          >
            <Camera size={18} color={activeTab === 'scan' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'scan' && styles.tabLabelActive]}>
              Scan QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='tab-rolodex'
            style={[styles.tabItem, activeTab === 'rolodex' && styles.tabItemActive]}
            onPress={() => setActiveTab('rolodex')}
          >
            <Users size={18} color={activeTab === 'rolodex' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'rolodex' && styles.tabLabelActive]}>
              Rolodex ({savedContacts.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID='tab-edit-bio'
            style={[styles.tabItem, activeTab === 'edit' && styles.tabItemActive]}
            onPress={() => setActiveTab('edit')}
          >
            <PencilSimple size={18} color={activeTab === 'edit' ? '#fff' : '#8E8E93'} />
            <Text style={[styles.tabLabel, activeTab === 'edit' && styles.tabLabelActive]}>
              Edit Bio
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: MY CARD (DISPLAY) */}
        {activeTab === 'card' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cardScrollContainer}
          >
            {/* Visual Business Card */}
            <GlassCard style={[styles.digitalCardHero, { borderColor: currentTheme.borderColor }]}>
              {/* Card Top Row */}
              <View style={styles.cardTopRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarEmoji}>{profile.avatarEmoji}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <View style={styles.nameVerifiedRow}>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <ShieldCheck size={18} color='#38EF7D' weight='fill' />
                  </View>
                  <Text style={styles.pronounsText}>({profile.pronouns})</Text>
                  <Text style={styles.profileTitleText}>{profile.title}</Text>
                  <View style={styles.orgLocationRow}>
                    <Buildings size={12} color='#8E8E93' />
                    <Text style={styles.orgText}>{profile.organization}</Text>
                    <Text style={styles.bulletDot}>·</Text>
                    <MapPin size={12} color='#8E8E93' />
                    <Text style={styles.locationText}>{profile.location}</Text>
                  </View>
                </View>
              </View>

              {/* Bio Statement */}
              <Text style={styles.bioText}>{profile.bio}</Text>

              {/* Impact Badges */}
              <View style={styles.impactBadgesRow}>
                <View style={styles.impactBadge}>
                  <Text style={styles.impactBadgeValue}>{profile.impact.yearsPlantBased} yrs</Text>
                  <Text style={styles.impactBadgeLabel}>🌱 Plant-Based</Text>
                </View>
                <View style={styles.impactBadge}>
                  <Text style={styles.impactBadgeValue}>
                    {profile.impact.co2AvoidedKg.toLocaleString()} kg
                  </Text>
                  <Text style={styles.impactBadgeLabel}>🌍 CO₂ Avoided</Text>
                </View>
                <View style={styles.impactBadge}>
                  <Text style={styles.impactBadgeValue}>{profile.impact.animalLivesProtected}</Text>
                  <Text style={styles.impactBadgeLabel}>🐮 Lives Spared</Text>
                </View>
              </View>

              {/* On-Screen QR Code Box */}
              <View style={styles.qrCodeBox}>
                <Text style={styles.qrCodeTitle}>Scan to Exchange & Save Contact</Text>
                <View style={styles.qrCodeCanvas}>
                  <QRCodeSvg value={publicUrl} size={190} padding={2} />
                </View>
                <Text style={styles.qrCodeHint}>
                  Point camera or Kindred lens to open public bio hub
                </Text>
              </View>

              {/* 1-Tap Action Toolbar */}
              <View style={styles.actionToolbar}>
                <TouchableOpacity
                  testID='download-vcard-btn'
                  style={styles.actionBtnPrimary}
                  onPress={() => handleDownloadVCard(profile)}
                >
                  <DownloadSimple size={16} color='#000' weight='bold' />
                  <Text style={styles.actionBtnPrimaryText}>Save to Contacts (.vcf)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='share-card-btn'
                  style={styles.actionBtnSecondary}
                  onPress={handleShareLink}
                >
                  <ShareNetwork size={16} color='#fff' />
                  <Text style={styles.actionBtnSecondaryText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='copy-bio-url-btn'
                  style={styles.actionBtnSecondary}
                  onPress={handleCopyLink}
                >
                  <Copy size={16} color='#fff' />
                  <Text style={styles.actionBtnSecondaryText}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Endorsed Sanctuary Cause */}
            <GlassCard style={styles.sanctuaryBanner}>
              <View style={styles.sanctuaryBannerTop}>
                <Text style={styles.sanctuaryEmoji}>{profile.endorsedSanctuary.emoji}</Text>
                <View style={styles.sanctuaryInfo}>
                  <Text style={styles.sanctuarySub}>Endorsed Sanctuary</Text>
                  <Text style={styles.sanctuaryTitle}>{profile.endorsedSanctuary.name}</Text>
                  <Text style={styles.sanctuaryTagline}>{profile.endorsedSanctuary.tagline}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.sponsorCauseBtn}
                onPress={() =>
                  navigation.navigate('Wallet', {
                    initialTab: 'donate',
                    shelterId: profile.endorsedSanctuary.id,
                  })
                }
              >
                <Heart size={16} color='#fff' weight='fill' />
                <Text style={styles.sponsorCauseBtnText}>Sponsor with Me ($3.00)</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Linktree-Style Bio Links Section */}
            <View style={styles.bioLinksSection}>
              <Text style={styles.sectionHeading}>Featured Bio Links</Text>
              {profile.links.map(link => (
                <TouchableOpacity
                  key={link.id}
                  style={styles.bioLinkItem}
                  onPress={() => handleOpenLink(link.url)}
                >
                  <View style={styles.bioLinkLeft}>
                    <Globe size={18} color='#38EF7D' weight='duotone' />
                    <View>
                      <Text style={styles.bioLinkTitle}>{link.title}</Text>
                      <Text style={styles.bioLinkCategory}>{link.category}</Text>
                    </View>
                  </View>
                  <ArrowUpRight size={16} color='#8E8E93' />
                </TouchableOpacity>
              ))}
            </View>

            {/* Tree-Free Carbon Footprint Note */}
            <View style={styles.treeFreeFootnote}>
              <ShieldCheck size={16} color='#38EF7D' weight='fill' />
              <Text style={styles.treeFreeText}>
                Zero-Paper Business Card: Saves ~45 liters of water and eliminates disposable card
                waste every year.
              </Text>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: SCAN QR (CAMERA / EXCHANGE) */}
        {activeTab === 'scan' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scanScrollContainer}
          >
            <View style={styles.cameraFrameBox}>
              <View style={styles.scanReticle}>
                <View style={[styles.cornerBracket, styles.topLeftBracket]} />
                <View style={[styles.cornerBracket, styles.topRightBracket]} />
                <View style={[styles.cornerBracket, styles.bottomLeftBracket]} />
                <View style={[styles.cornerBracket, styles.bottomRightBracket]} />
                <QrCode size={72} color='rgba(56, 239, 125, 0.4)' />
                <Text style={styles.scanReticleText}>Align Kindred QR Code</Text>
              </View>
            </View>

            <Text style={styles.scanInstructions}>
              Scan another member's on-screen or printed Kindred card to instantly save their
              contact, verified climate badges, and exchange +25 Kindred Karma!
            </Text>

            {/* Quick Simulation Buttons (Testing & Offline Demo) */}
            <View style={styles.simulationBox}>
              <Text style={styles.simulationTitle}>Quick Scan Simulation (Tap to Test)</Text>
              <View style={styles.simulationBtnRow}>
                <TouchableOpacity
                  testID='simulate-scan-elena'
                  style={styles.simulationBtn}
                  onPress={() => handleConnectUser(SAVED_ETHICAL_CONTACTS[0])}
                >
                  <Text style={styles.simulationBtnText}>🍄 Dr. Elena Rostova</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='simulate-scan-priya'
                  style={styles.simulationBtn}
                  onPress={() => handleConnectUser(SAVED_ETHICAL_CONTACTS[1])}
                >
                  <Text style={styles.simulationBtnText}>🐕 Priya Sharma</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Manual Lookup Option */}
            <View style={styles.manualInputBox}>
              <Text style={styles.manualInputTitle}>Or Enter Username / Handle</Text>
              <View style={styles.manualInputRow}>
                <TextInput
                  testID='manual-username-input'
                  style={styles.manualInput}
                  placeholder='e.g. elena-rostova or chef-marcus'
                  placeholderTextColor='#666'
                  value={manualUsernameInput}
                  onChangeText={setManualUsernameInput}
                  autoCapitalize='none'
                />
                <TouchableOpacity
                  testID='manual-connect-btn'
                  style={styles.manualConnectBtn}
                  onPress={handleScanManual}
                >
                  <Text style={styles.manualConnectBtnText}>Exchange</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {/* TAB 3: ETHICAL ROLODEX (SAVED NETWORK) */}
        {activeTab === 'rolodex' && (
          <View style={styles.rolodexContainer}>
            {/* Search Bar */}
            <View style={styles.searchRow}>
              <MagnifyingGlass size={18} color='#8E8E93' />
              <TextInput
                testID='rolodex-search-input'
                style={styles.searchInput}
                placeholder='Search by name, title, or biomaterial...'
                placeholderTextColor='#666'
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color='#8E8E93' />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.rolodexList}
            >
              {filteredContacts.map(contact => (
                <GlassCard key={contact.id} style={styles.contactCard}>
                  <View style={styles.contactTopRow}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.avatarEmojiSmall}>{contact.avatarEmoji}</Text>
                    </View>
                    <View style={styles.contactHeaderInfo}>
                      <View style={styles.contactNameRow}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <UserCheck size={16} color='#38EF7D' weight='fill' />
                      </View>
                      <Text style={styles.contactTitle}>{contact.title}</Text>
                      <Text style={styles.contactOrg}>
                        {contact.organization} · {contact.location}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.contactBio}>{contact.bio}</Text>

                  {/* Impact Pills */}
                  <View style={styles.contactImpactRow}>
                    <View style={styles.contactImpactPill}>
                      <Text style={styles.contactImpactText}>
                        🌱 {contact.impact.yearsPlantBased}y vegan
                      </Text>
                    </View>
                    <View style={styles.contactImpactPill}>
                      <Text style={styles.contactImpactText}>
                        🌍 {contact.impact.co2AvoidedKg}kg CO₂
                      </Text>
                    </View>
                    <View style={styles.contactImpactPill}>
                      <Text style={styles.contactImpactText}>
                        ✨ +{contact.impact.karmaScore} karma
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons for Contact */}
                  <View style={styles.contactActionsRow}>
                    <TouchableOpacity
                      style={styles.contactActionBtn}
                      onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                    >
                      <Phone size={14} color='#38EF7D' weight='bold' />
                      <Text style={styles.contactActionBtnText}>Call</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactActionBtn}
                      onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                    >
                      <EnvelopeSimple size={14} color='#38EF7D' weight='bold' />
                      <Text style={styles.contactActionBtnText}>Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactActionBtn}
                      onPress={() => handleDownloadVCard(contact)}
                    >
                      <DownloadSimple size={14} color='#38EF7D' weight='bold' />
                      <Text style={styles.contactActionBtnText}>.vcf</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.contactActionBtn}
                      onPress={() => handleOpenLink(contact.website)}
                    >
                      <Globe size={14} color='#38EF7D' weight='bold' />
                      <Text style={styles.contactActionBtnText}>Bio</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}

              {filteredContacts.length === 0 && (
                <View style={styles.emptyContactsBox}>
                  <Users size={36} color='#666' />
                  <Text style={styles.emptyContactsTitle}>No matching contacts found</Text>
                  <Text style={styles.emptyContactsSub}>
                    Try searching for another specialty or scan someone's QR code.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* TAB 4: EDIT BIO & CUSTOM LINKS */}
        {activeTab === 'edit' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.editScrollContainer}
          >
            <Text style={styles.editSectionTitle}>Profile Information</Text>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                testID='input-edit-name'
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Pronouns</Text>
                <TextInput
                  style={styles.formInput}
                  value={editPronouns}
                  onChangeText={setEditPronouns}
                />
              </View>
              <View style={[styles.formGroup, { flex: 2, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>Job Title</Text>
                <TextInput style={styles.formInput} value={editTitle} onChangeText={setEditTitle} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Organization / Company / Sanctuary</Text>
              <TextInput style={styles.formInput} value={editOrg} onChangeText={setEditOrg} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Bio Statement</Text>
              <TextInput
                style={[styles.formInput, styles.textAreaInput]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType='email-address'
                autoCapitalize='none'
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Phone (for vCard)</Text>
              <TextInput
                style={styles.formInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType='phone-pad'
              />
            </View>

            {/* Custom Links Management */}
            <View style={styles.linksManagementHeader}>
              <Text style={styles.editSectionTitle}>Custom Bio Links ({editLinks.length})</Text>
              <TouchableOpacity
                testID='btn-open-add-link-modal'
                style={styles.addLinkSmallBtn}
                onPress={() => setIsAddLinkModalVisible(true)}
              >
                <Plus size={14} color='#000' weight='bold' />
                <Text style={styles.addLinkSmallBtnText}>Add Link</Text>
              </TouchableOpacity>
            </View>

            {editLinks.map(link => (
              <View key={link.id} style={styles.editLinkRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editLinkTitle}>{link.title}</Text>
                  <Text style={styles.editLinkUrl} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <TouchableOpacity
                  testID={`delete-link-${link.id}`}
                  onPress={() => handleDeleteLink(link.id)}
                  style={styles.deleteLinkBtn}
                >
                  <Trash size={16} color='#FF453A' />
                </TouchableOpacity>
              </View>
            ))}

            {/* Save Profile Button */}
            <TouchableOpacity
              testID='save-profile-btn'
              style={styles.saveProfileBtn}
              onPress={handleSaveProfile}
            >
              <CheckCircle size={18} color='#000' weight='fill' />
              <Text style={styles.saveProfileBtnText}>Save Ethical Card</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Celebratory Connection Modal */}
        <Modal
          visible={!!connectionModal}
          transparent
          animationType='fade'
          onRequestClose={() => setConnectionModal(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.connectionCard}>
              <View style={styles.connectionEmojiCircle}>
                <Text style={styles.connectionEmojiText}>
                  {connectionModal?.avatarEmoji || '🤝'}
                </Text>
              </View>
              <Text style={styles.connectionTitle}>Ethical Connection Made!</Text>
              <Text style={styles.connectionSub}>
                You exchanged contacts with{' '}
                <Text style={styles.connectionBold}>{connectionModal?.name}</Text> (
                {connectionModal?.title} at {connectionModal?.organization}).
              </Text>

              <View style={styles.karmaAwardBox}>
                <Sparkle size={18} color='#38EF7D' weight='fill' />
                <Text style={styles.karmaAwardText}>+25 Kindred Karma Awarded</Text>
              </View>

              <View style={styles.connectionBtnRow}>
                <TouchableOpacity
                  style={styles.connectionPrimaryBtn}
                  onPress={() => {
                    if (connectionModal) handleDownloadVCard(connectionModal);
                    setConnectionModal(null);
                  }}
                >
                  <DownloadSimple size={16} color='#000' weight='bold' />
                  <Text style={styles.connectionPrimaryBtnText}>Save to Contacts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID='close-connection-modal-btn'
                  style={styles.connectionSecondaryBtn}
                  onPress={() => setConnectionModal(null)}
                >
                  <Text style={styles.connectionSecondaryBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>

        {/* Add Link Modal */}
        <Modal
          visible={isAddLinkModalVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setIsAddLinkModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.addLinkSheet}>
              <View style={styles.addLinkHeader}>
                <Text style={styles.addLinkHeaderTitle}>Add Bio Link</Text>
                <TouchableOpacity onPress={() => setIsAddLinkModalVisible(false)}>
                  <X size={20} color='#8E8E93' />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Link Title</Text>
                <TextInput
                  testID='input-new-link-title'
                  style={styles.formInput}
                  placeholder='e.g. Mycelium Leather Prototype'
                  placeholderTextColor='#666'
                  value={newLinkTitle}
                  onChangeText={setNewLinkTitle}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>URL</Text>
                <TextInput
                  testID='input-new-link-url'
                  style={styles.formInput}
                  placeholder='https://...'
                  placeholderTextColor='#666'
                  value={newLinkUrl}
                  onChangeText={setNewLinkUrl}
                  autoCapitalize='none'
                />
              </View>

              <TouchableOpacity
                testID='submit-add-link-btn'
                style={styles.saveProfileBtn}
                onPress={handleAddNewLink}
              >
                <Text style={styles.saveProfileBtnText}>Add to Card</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SpaceBackground>
    </View>
  );
};

export default EthicalCardScreen;

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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
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
  cardScrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  digitalCardHero: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 34,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  pronounsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  profileTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38EF7D',
    marginTop: 2,
  },
  orgLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  orgText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  bulletDot: {
    color: '#666',
    fontSize: 11,
  },
  locationText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  bioText: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
  },
  impactBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  impactBadge: {
    alignItems: 'center',
    flex: 1,
  },
  impactBadgeValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  impactBadgeLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  qrCodeBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  qrCodeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  qrCodeCanvas: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 8,
    backgroundColor: '#fff',
  },
  qrCodeHint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 12,
    textAlign: 'center',
  },
  actionToolbar: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnPrimaryText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  actionBtnSecondaryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sanctuaryBanner: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 139, 0.3)',
    marginBottom: 16,
  },
  sanctuaryBannerTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  sanctuaryEmoji: {
    fontSize: 32,
  },
  sanctuaryInfo: {
    flex: 1,
  },
  sanctuarySub: {
    fontSize: 10,
    color: '#FF6B8B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sanctuaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  sanctuaryTagline: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  sponsorCauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6B8B',
    paddingVertical: 10,
    borderRadius: 12,
  },
  sponsorCauseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bioLinksSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  bioLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bioLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bioLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  bioLinkCategory: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  treeFreeFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
  },
  treeFreeText: {
    flex: 1,
    fontSize: 11,
    color: '#38EF7D',
    lineHeight: 15,
  },
  scanScrollContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cameraFrameBox: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 300,
    backgroundColor: '#161622',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scanReticle: {
    width: 200,
    height: 200,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerBracket: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38EF7D',
  },
  topLeftBracket: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRightBracket: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeftBracket: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRightBracket: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanReticleText: {
    fontSize: 12,
    color: '#38EF7D',
    fontWeight: '700',
    marginTop: 12,
  },
  scanInstructions: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 320,
  },
  simulationBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  simulationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  simulationBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simulationBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  simulationBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  manualInputBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 18,
    padding: 16,
  },
  manualInputTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  manualConnectBtn: {
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualConnectBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  rolodexContainer: {
    flex: 1,
    padding: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  rolodexList: {
    paddingBottom: 24,
  },
  contactCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  contactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmojiSmall: {
    fontSize: 24,
  },
  contactHeaderInfo: {
    flex: 1,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  contactTitle: {
    fontSize: 13,
    color: '#38EF7D',
    fontWeight: '600',
  },
  contactOrg: {
    fontSize: 11,
    color: '#8E8E93',
  },
  contactBio: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
    marginBottom: 10,
  },
  contactImpactRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  contactImpactPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  contactImpactText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 239, 125, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactActionBtnText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContactsBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContactsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  emptyContactsSub: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  editScrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  editSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 14,
  },
  formRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  textAreaInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  linksManagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  addLinkSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38EF7D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addLinkSmallBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  editLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  editLinkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  editLinkUrl: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteLinkBtn: {
    padding: 8,
  },
  saveProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#38EF7D',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
  },
  saveProfileBtnText: {
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
  connectionCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  connectionEmojiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionEmojiText: {
    fontSize: 36,
  },
  connectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
  },
  connectionSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  connectionBold: {
    color: '#38EF7D',
    fontWeight: '700',
  },
  karmaAwardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  karmaAwardText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
  },
  connectionBtnRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  connectionPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
  },
  connectionPrimaryBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  connectionSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 14,
  },
  connectionSecondaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  addLinkSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 20,
  },
  addLinkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addLinkHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
});
