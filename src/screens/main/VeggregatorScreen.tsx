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
  ShoppingCart,
  Storefront,
  ShieldCheck,
  Plus,
  X,
  MagnifyingGlass,
  CheckCircle,
  Leaf,
  Heart,
  Lightning,
  Sparkle,
  ArrowLeft,
  Drop,
} from 'phosphor-react-native';
import { SpaceBackground } from '../../components/common/SpaceBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { useToast } from '../../contexts/ToastContext';
import type { VeggregatorProduct, VeggregatorBrand } from '../../data/veggregatorData';
import { VEGGREGATOR_BRANDS, VEGGREGATOR_PRODUCTS } from '../../data/veggregatorData';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES = [
  'All',
  'Snacks & Confectionery',
  'Pantry & Cheese',
  'Cloud Kitchen & Meals',
  'Apparel & Living',
  'Wellness & Care',
] as const;

export const VeggregatorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'shop' | 'brands' | 'sell'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart state
  const [cart, setCart] = useState<{ product: VeggregatorProduct; quantity: number }[]>([]);
  const [isCartVisible, setIsCartVisible] = useState(false);

  // Selected product detail modal
  const [selectedProduct, setSelectedProduct] = useState<VeggregatorProduct | null>(null);

  // Selected brand modal
  const [selectedBrand, setSelectedBrand] = useState<VeggregatorBrand | null>(null);

  // Dynamic user-submitted products & brands state
  const [products, setProducts] = useState<VeggregatorProduct[]>(VEGGREGATOR_PRODUCTS);
  const [brands, setBrands] = useState<VeggregatorBrand[]>(VEGGREGATOR_BRANDS);

  // Seller application form state
  const [sellerBrandName, setSellerBrandName] = useState('');
  const [sellerFounder, setSellerFounder] = useState('');
  const [sellerCategory, setSellerCategory] =
    useState<VeggregatorProduct['category']>('Snacks & Confectionery');
  const [sellerProductName, setSellerProductName] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerDescription, setSellerDescription] = useState('');
  const [sellerPledgeAgreed, setSellerPledgeAgreed] = useState(false);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filtered brands
  const filteredBrands = brands.filter(b => {
    return (
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bio.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Cart helpers
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalAnimalsSpared = cart.length;
  const totalCO2Saved = cart.reduce(
    (sum, item) => sum + item.product.impactMetric.co2SavedKg * item.quantity,
    0,
  );

  const handleAddToCart = (product: VeggregatorProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    showToast(`Added ${product.name} to basket!`, 'success');
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter(item => item.quantity > 0),
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCartVisible(false);
    const count = cartItemCount;
    setCart([]);
    Alert.alert(
      '🎉 Kindred Ethical Order Placed!',
      `Thank you for supporting 100% plant-based makers.\n\nItems: ${count}\nTotal: $${cartSubtotal.toFixed(
        2,
      )}\nCO₂ Avoided: ${totalCO2Saved.toFixed(1)} kg\nZero-emission courier dispatched!`,
      [
        {
          text: 'Awesome!',
          onPress: () => showToast('Order confirmed! E-cargo courier in transit.', 'success'),
        },
      ],
    );
  };

  const handleCreateSellerPage = () => {
    if (!sellerBrandName.trim() || !sellerProductName.trim() || !sellerPrice.trim()) {
      showToast('Please fill in your Brand Name, Product, and Price.', 'error');
      return;
    }
    if (!sellerPledgeAgreed) {
      showToast('Please check the 100% Cruelty-Free & Plant-Based pledge.', 'error');
      return;
    }

    const priceNum = parseFloat(sellerPrice) || 9.99;
    const newBrandId = `b-${Date.now()}`;
    const newBrand: VeggregatorBrand = {
      id: newBrandId,
      name: sellerBrandName.trim(),
      tagline: `Artisan ${sellerCategory} by ${sellerFounder.trim() || 'Independent Maker'}`,
      founder: sellerFounder.trim() || 'Community Maker',
      location: 'Community Kitchen / Verified Hub',
      ethicsScore: 100,
      certifications: ['Kindred Community Verified', '100% Plant-Based', 'Zero Animal Testing'],
      bio: sellerDescription.trim() || 'Handmade ethical plant-based essentials crafted with love.',
      joinedYear: 2026,
      avatarEmoji: '✨',
      totalOrdersFulfilled: 1,
      impactScoreSummary: 'Zero animal byproducts. Community verified vendor.',
    };

    const newProduct: VeggregatorProduct = {
      id: `vp-${Date.now()}`,
      name: sellerProductName.trim(),
      tagline: `Handcrafted ${sellerCategory} by ${sellerBrandName.trim()}`,
      brandId: newBrandId,
      brandName: sellerBrandName.trim(),
      category: sellerCategory,
      price: priceNum,
      rating: 5.0,
      reviewCount: 1,
      emoji: '🌱',
      badges: ['Newly Verified', '100% Plant-Based', 'Direct From Maker'],
      impactMetric: {
        animalsSpared: '100% cruelty-free, zero animal ingredients',
        co2SavedKg: 1.5,
        waterSavedLiters: 350,
      },
      ingredientsSummary: 'Pure whole plant ingredients, zero artificial animal-derived additives.',
      description:
        sellerDescription.trim() || 'Freshly made with care by an independent ethical artisan.',
      inStock: true,
      deliveryTime: '2-3 Days Carbon-Neutral',
    };

    setBrands(prev => [newBrand, ...prev]);
    setProducts(prev => [newProduct, ...prev]);

    // Reset form
    setSellerBrandName('');
    setSellerFounder('');
    setSellerProductName('');
    setSellerPrice('');
    setSellerDescription('');
    setSellerPledgeAgreed(false);

    setActiveTab('shop');
    showToast(`Storefront "${newBrand.name}" is now live on Veggregator!`, 'success');
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
            testID='veggregator-back-btn'
          >
            <ArrowLeft size={22} color='#fff' />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Veggregator</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color='#38EF7D' weight='bold' />
                <Text style={styles.verifiedBadgeText}>100% Plant-Based</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Curated ethical brands, snack bars & cloud kitchens</Text>
          </View>

          {/* Cart Icon */}
          <TouchableOpacity
            style={styles.cartHeaderBtn}
            onPress={() => setIsCartVisible(true)}
            testID='open-cart-btn'
            accessibilityLabel='Shopping basket'
          >
            <ShoppingCart size={22} color='#fff' weight='bold' />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'shop' && styles.tabButtonActive]}
            onPress={() => setActiveTab('shop')}
            testID='tab-shop'
          >
            <ShoppingCart
              size={16}
              color={activeTab === 'shop' ? '#38EF7D' : 'rgba(255,255,255,0.6)'}
              weight={activeTab === 'shop' ? 'bold' : 'regular'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'shop' && styles.tabButtonTextActive]}
            >
              Marketplace
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'brands' && styles.tabButtonActive]}
            onPress={() => setActiveTab('brands')}
            testID='tab-brands'
          >
            <Storefront
              size={16}
              color={activeTab === 'brands' ? '#38EF7D' : 'rgba(255,255,255,0.6)'}
              weight={activeTab === 'brands' ? 'bold' : 'regular'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'brands' && styles.tabButtonTextActive]}
            >
              Brand Hub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'sell' && styles.tabButtonActive]}
            onPress={() => setActiveTab('sell')}
            testID='tab-sell'
          >
            <Sparkle
              size={16}
              color={activeTab === 'sell' ? '#38EF7D' : 'rgba(255,255,255,0.6)'}
              weight={activeTab === 'sell' ? 'bold' : 'regular'}
            />
            <Text
              style={[styles.tabButtonText, activeTab === 'sell' && styles.tabButtonTextActive]}
            >
              Sell / Create Page
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body */}
      {activeTab === 'shop' && (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
          {/* Search Bar */}
          <GlassCard style={styles.searchCard}>
            <MagnifyingGlass size={18} color='rgba(255,255,255,0.5)' />
            <TextInput
              style={styles.searchInput}
              placeholder='Search vegan Snickers, cheese, cloud meals...'
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID='veggregator-search-input'
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color='rgba(255,255,255,0.5)' />
              </TouchableOpacity>
            )}
          </GlassCard>

          {/* Category Chips */}
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
                testID={`category-filter-${category}`}
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

          {/* Product Feed */}
          <View style={styles.productsGrid}>
            {filteredProducts.map(product => (
              <GlassCard key={product.id} style={styles.productCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedProduct(product)}
                  testID={`product-card-${product.id}`}
                >
                  {/* Emoji & Delivery speed */}
                  <View style={styles.productCardHeader}>
                    <View style={styles.productEmojiBox}>
                      <Text style={styles.productEmoji}>{product.emoji}</Text>
                    </View>
                    <View style={styles.deliveryBadge}>
                      <Lightning size={12} color='#FBBF24' weight='fill' />
                      <Text style={styles.deliveryText} numberOfLines={1}>
                        {product.deliveryTime}
                      </Text>
                    </View>
                  </View>

                  {/* Brand & Title */}
                  <Text style={styles.productBrandName}>{product.brandName}</Text>
                  <Text style={styles.productTitle} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productTagline} numberOfLines={2}>
                    {product.tagline}
                  </Text>

                  {/* Impact pill */}
                  <View style={styles.impactPill}>
                    <Leaf size={12} color='#38EF7D' weight='fill' />
                    <Text style={styles.impactPillText} numberOfLines={1}>
                      {product.impactMetric.animalsSpared}
                    </Text>
                  </View>

                  {/* Price & Action */}
                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
                      {product.originalPrice && (
                        <Text style={styles.productOriginalPrice}>
                          ${product.originalPrice.toFixed(2)}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.addToCartBtn}
                      onPress={() => handleAddToCart(product)}
                      testID={`buy-btn-${product.id}`}
                      accessibilityLabel={`Add ${product.name} to cart`}
                    >
                      <Plus size={16} color='#000' weight='bold' />
                      <Text style={styles.addToCartBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Brands Hub Tab */}
      {activeTab === 'brands' && (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.sectionHeader}>Verified Ethical Storefronts</Text>
          <Text style={styles.sectionSubheader}>
            Independent vegan businesses, certified cruelty-free, no parent company slaughterhouse
            ties.
          </Text>

          {filteredBrands.map(brand => (
            <GlassCard key={brand.id} style={styles.brandCard}>
              <View style={styles.brandCardHeader}>
                <View style={styles.brandAvatarBox}>
                  <Text style={styles.brandAvatarEmoji}>{brand.avatarEmoji}</Text>
                </View>
                <View style={styles.brandMainInfo}>
                  <Text style={styles.brandTitle}>{brand.name}</Text>
                  <Text style={styles.brandLocation}>📍 {brand.location}</Text>
                  <View style={styles.ethicsScoreRow}>
                    <ShieldCheck size={14} color='#38EF7D' weight='fill' />
                    <Text style={styles.ethicsScoreText}>
                      Kindred Ethics Score: {brand.ethicsScore}/100
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.brandBio}>{brand.bio}</Text>

              {/* Certifications */}
              <View style={styles.certRow}>
                {brand.certifications.map(cert => (
                  <View key={cert} style={styles.certBadge}>
                    <Text style={styles.certBadgeText}>✓ {cert}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.brandFooter}>
                <Text style={styles.fulfilledText}>
                  📦 {brand.totalOrdersFulfilled.toLocaleString()} orders fulfilled
                </Text>
                <TouchableOpacity
                  style={styles.viewStoreBtn}
                  onPress={() => setSelectedBrand(brand)}
                  testID={`view-brand-btn-${brand.id}`}
                >
                  <Text style={styles.viewStoreBtnText}>View Storefront</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      )}

      {/* Sell / Create Brand Page Tab */}
      {activeTab === 'sell' && (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
          <GlassCard style={styles.sellerBanner}>
            <View style={styles.sellerBannerIcon}>
              <Sparkle size={24} color='#38EF7D' weight='fill' />
            </View>
            <View style={styles.sellerBannerText}>
              <Text style={styles.sellerBannerTitle}>Open Your Vegan Storefront</Text>
              <Text style={styles.sellerBannerSubtitle}>
                Sell directly to conscious consumers. Zero animal testing, zero animal byproducts.
              </Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.formCard}>
            <Text style={styles.formLabel}>Brand / Company Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder='e.g. Earthy Delights Co.'
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={sellerBrandName}
              onChangeText={setSellerBrandName}
              testID='seller-brand-name-input'
            />

            <Text style={styles.formLabel}>Founder / Artisan Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder='e.g. Sarah & David'
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={sellerFounder}
              onChangeText={setSellerFounder}
            />

            <Text style={styles.formLabel}>Product Category *</Text>
            <View style={styles.categoryRadioGroup}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.radioChip, sellerCategory === cat && styles.radioChipActive]}
                  onPress={() => setSellerCategory(cat as VeggregatorProduct['category'])}
                >
                  <Text
                    style={[
                      styles.radioChipText,
                      sellerCategory === cat && styles.radioChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>First Product Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder='e.g. Peanut Butter Nougat Snacker Bar'
              placeholderTextColor='rgba(255,255,255,0.4)'
              value={sellerProductName}
              onChangeText={setSellerProductName}
              testID='seller-product-name-input'
            />

            <Text style={styles.formLabel}>Price (USD $) *</Text>
            <TextInput
              style={styles.formInput}
              placeholder='e.g. 4.50'
              placeholderTextColor='rgba(255,255,255,0.4)'
              keyboardType='decimal-pad'
              value={sellerPrice}
              onChangeText={setSellerPrice}
              testID='seller-price-input'
            />

            <Text style={styles.formLabel}>Ingredients / Crafting Story</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder='Detail your plant-based ingredients, sourcing ethics, and packaging...'
              placeholderTextColor='rgba(255,255,255,0.4)'
              multiline
              numberOfLines={4}
              value={sellerDescription}
              onChangeText={setSellerDescription}
            />

            {/* Cruelty-Free Pledge */}
            <TouchableOpacity
              style={styles.pledgeRow}
              onPress={() => setSellerPledgeAgreed(!sellerPledgeAgreed)}
              activeOpacity={0.8}
              testID='seller-pledge-toggle'
            >
              <View style={[styles.checkbox, sellerPledgeAgreed && styles.checkboxActive]}>
                {sellerPledgeAgreed && <CheckCircle size={18} color='#000' weight='fill' />}
              </View>
              <Text style={styles.pledgeText}>
                I certify that all products are 100% plant-based, cruelty-free, and not tested on
                animals.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitSellerBtn}
              onPress={handleCreateSellerPage}
              testID='submit-listing-btn'
            >
              <Text style={styles.submitSellerBtnText}>Publish Verified Storefront</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      )}

      {/* Floating Cart Bar (when cart has items and not visible) */}
      {cartItemCount > 0 && !isCartVisible && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => setIsCartVisible(true)}
          activeOpacity={0.9}
          testID='floating-cart-bar'
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartCount}>{cartItemCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartTitle}>View Basket</Text>
              <Text style={styles.floatingCartSub}>
                Avoids ~{totalCO2Saved.toFixed(1)} kg CO₂ emissions
              </Text>
            </View>
          </View>
          <Text style={styles.floatingCartTotal}>${cartSubtotal.toFixed(2)} →</Text>
        </TouchableOpacity>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          visible={!!selectedProduct}
          transparent
          animationType='slide'
          onRequestClose={() => setSelectedProduct(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalEmojiBox}>
                  <Text style={styles.modalEmoji}>{selectedProduct.emoji}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProduct(null)}>
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalBrand}>{selectedProduct.brandName}</Text>
              <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
              <Text style={styles.modalTagline}>{selectedProduct.tagline}</Text>

              {/* Impact Card */}
              <View style={styles.modalImpactCard}>
                <View style={styles.modalImpactRow}>
                  <Heart size={16} color='#FF6B6B' weight='fill' />
                  <Text style={styles.modalImpactMain}>
                    {selectedProduct.impactMetric.animalsSpared}
                  </Text>
                </View>
                <View style={styles.modalImpactSubRow}>
                  <Text style={styles.modalImpactSub}>
                    🌱 {selectedProduct.impactMetric.co2SavedKg} kg CO₂ saved
                  </Text>
                  <Text style={styles.modalImpactSub}>
                    💧 {selectedProduct.impactMetric.waterSavedLiters} L water conserved
                  </Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>Ingredients & Quality</Text>
              <Text style={styles.modalIngredients}>{selectedProduct.ingredientsSummary}</Text>

              <Text style={styles.modalSectionLabel}>About This Item</Text>
              <Text style={styles.modalDesc}>{selectedProduct.description}</Text>

              <View style={styles.modalActions}>
                <View>
                  <Text style={styles.modalPrice}>${selectedProduct.price.toFixed(2)}</Text>
                  <Text style={styles.modalDelivery}>{selectedProduct.deliveryTime}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalAddBtn}
                  onPress={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  testID='modal-add-to-cart-btn'
                >
                  <ShoppingCart size={18} color='#000' weight='bold' />
                  <Text style={styles.modalAddBtnText}>Add to Basket</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </Modal>
      )}

      {/* Brand Storefront Modal */}
      {selectedBrand && (
        <Modal
          visible={!!selectedBrand}
          transparent
          animationType='slide'
          onRequestClose={() => setSelectedBrand(null)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalEmojiBox}>
                  <Text style={styles.modalEmoji}>{selectedBrand.avatarEmoji}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedBrand(null)}>
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>{selectedBrand.name}</Text>
              <Text style={styles.modalTagline}>{selectedBrand.tagline}</Text>
              <Text style={styles.modalDesc}>
                📍 {selectedBrand.location} • Est. {selectedBrand.joinedYear}
              </Text>
              <Text style={styles.modalDesc}>Founder: {selectedBrand.founder}</Text>

              <View style={styles.brandScoreBanner}>
                <ShieldCheck size={20} color='#38EF7D' weight='fill' />
                <View>
                  <Text style={styles.brandScoreValue}>
                    Kindred Ethics Score: {selectedBrand.ethicsScore}/100
                  </Text>
                  <Text style={styles.brandScoreSummary}>{selectedBrand.impactScoreSummary}</Text>
                </View>
              </View>

              <Text style={styles.modalSectionLabel}>Certifications</Text>
              <View style={styles.certRow}>
                {selectedBrand.certifications.map(c => (
                  <View key={c} style={styles.certBadge}>
                    <Text style={styles.certBadgeText}>✓ {c}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.modalSectionLabel}>Brand Mission</Text>
              <Text style={styles.modalDesc}>{selectedBrand.bio}</Text>

              <TouchableOpacity
                style={styles.modalCloseFullBtn}
                onPress={() => setSelectedBrand(null)}
              >
                <Text style={styles.modalCloseFullBtnText}>Close Storefront</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Modal>
      )}

      {/* Shopping Basket Modal */}
      {isCartVisible && (
        <Modal
          visible={isCartVisible}
          transparent
          animationType='slide'
          onRequestClose={() => setIsCartVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.cartModalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.cartHeaderLeft}>
                  <ShoppingCart size={22} color='#38EF7D' weight='bold' />
                  <Text style={styles.cartModalTitle}>Kindred Basket ({cartItemCount})</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCartVisible(false)}>
                  <X size={20} color='#fff' />
                </TouchableOpacity>
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={styles.emptyCartEmoji}>🌱</Text>
                  <Text style={styles.emptyCartText}>Your basket is currently empty.</Text>
                  <Text style={styles.emptyCartSub}>
                    Browse our vegan Snickers alternatives, cashew cheeses, and cloud meals!
                  </Text>
                </View>
              ) : (
                <ScrollView style={styles.cartList}>
                  {cart.map(item => (
                    <View key={item.product.id} style={styles.cartItemRow}>
                      <Text style={styles.cartItemEmoji}>{item.product.emoji}</Text>
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemTitle} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={styles.cartItemPrice}>
                          ${(item.product.price * item.quantity).toFixed(2)} ($
                          {item.product.price.toFixed(2)} ea)
                        </Text>
                      </View>
                      <View style={styles.cartQtyControls}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleRemoveFromCart(item.product.id)}
                          testID={`remove-item-${item.product.id}`}
                        >
                          <Text style={styles.qtyBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleAddToCart(item.product)}
                          testID={`add-item-${item.product.id}`}
                        >
                          <Text style={styles.qtyBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <View style={styles.cartImpactBox}>
                    <Text style={styles.cartImpactTitle}>🌍 Your Order Impact:</Text>
                    <Text style={styles.cartImpactItem}>
                      • Reduces ~{totalCO2Saved.toFixed(1)} kg greenhouse CO₂ vs dairy/meat
                    </Text>
                    <Text style={styles.cartImpactItem}>
                      • 100% zero-emissions electric cargo delivery
                    </Text>
                  </View>
                </ScrollView>
              )}

              {cart.length > 0 && (
                <View style={styles.cartCheckoutFooter}>
                  <View style={styles.cartSummaryRow}>
                    <Text style={styles.cartSubtotalLabel}>Subtotal</Text>
                    <Text style={styles.cartSubtotalValue}>${cartSubtotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.checkoutBtn}
                    onPress={handleCheckout}
                    testID='checkout-btn'
                  >
                    <Text style={styles.checkoutBtnText}>Checkout With Kindred Cash</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  cartHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#38EF7D',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },

  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 239, 125, 0.3)',
  },
  tabButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },

  categoryScroll: {
    marginBottom: 16,
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

  productsGrid: {
    gap: 14,
  },
  productCard: {
    padding: 14,
    borderRadius: 18,
  },
  productCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productEmojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 24,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  deliveryText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
  },
  productBrandName: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  productTagline: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  impactPillText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '600',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  productPrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  productOriginalPrice: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  addToCartBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },

  // Brands tab
  sectionHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubheader: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 14,
  },
  brandCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },
  brandCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  brandAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandAvatarEmoji: {
    fontSize: 26,
  },
  brandMainInfo: {
    flex: 1,
  },
  brandTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  brandLocation: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 4,
  },
  ethicsScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ethicsScoreText: {
    color: '#38EF7D',
    fontSize: 11,
    fontWeight: '700',
  },
  brandBio: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  certRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  certBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  certBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  brandFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  fulfilledText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  viewStoreBtn: {
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewStoreBtnText: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
  },

  // Seller tab
  sellerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    gap: 12,
  },
  sellerBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 239, 125, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerBannerText: {
    flex: 1,
  },
  sellerBannerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sellerBannerSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
  },
  formCard: {
    padding: 16,
    borderRadius: 18,
  },
  formLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryRadioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  radioChipActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
    borderColor: '#38EF7D',
  },
  radioChipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  radioChipTextActive: {
    color: '#38EF7D',
    fontWeight: '700',
  },
  pledgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
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
    fontSize: 12,
    lineHeight: 16,
  },
  submitSellerBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitSellerBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },

  // Floating Cart
  floatingCartBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38EF7D',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38EF7D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCount: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingCartTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  floatingCartSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  floatingCartTotal: {
    color: '#38EF7D',
    fontSize: 16,
    fontWeight: '800',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    marginBottom: 12,
  },
  modalEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmoji: {
    fontSize: 32,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBrand: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 4,
  },
  modalTagline: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 12,
  },
  modalImpactCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  modalImpactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modalImpactMain: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalImpactSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalImpactSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  modalSectionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  modalIngredients: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  modalDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 14,
    marginTop: 10,
  },
  modalPrice: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  modalDelivery: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '600',
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38EF7D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  modalAddBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },

  // Brand Modal specific
  brandScoreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    borderWidth: 1,
    borderColor: '#38EF7D',
    borderRadius: 14,
    padding: 12,
    marginVertical: 10,
    gap: 10,
  },
  brandScoreValue: {
    color: '#38EF7D',
    fontSize: 13,
    fontWeight: '700',
  },
  brandScoreSummary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseFullBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseFullBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Cart Modal
  cartModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyCartBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCartEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCartSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cartList: {
    maxHeight: 280,
    marginVertical: 10,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  cartItemEmoji: {
    fontSize: 22,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cartItemPrice: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  cartQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  cartImpactBox: {
    backgroundColor: 'rgba(56, 239, 125, 0.08)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    gap: 4,
  },
  cartImpactTitle: {
    color: '#38EF7D',
    fontSize: 12,
    fontWeight: '700',
  },
  cartImpactItem: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  cartCheckoutFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
    marginTop: 8,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cartSubtotalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  cartSubtotalValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: '#38EF7D',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default VeggregatorScreen;
