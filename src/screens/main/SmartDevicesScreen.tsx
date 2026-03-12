/**
 * SmartDevicesScreen.tsx
 * UI layer for IoTIntegrationService — connects/manages smart home devices
 * and shows real-time carbon impact from each connected device.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { useToast } from '../../contexts/ToastContext';

// ─── Mock connected state (backed by IoTIntegrationService) ──────────────────

const DEVICE_CATALOG = [
  {
    type: 'thermostat' as const,
    emoji: '🌡️',
    name: 'Smart Thermostat',
    brands: ['Nest', 'Ecobee', 'Honeywell'],
    description: 'Optimize heating & cooling based on clean-grid windows',
    savingsLabel: '↓ 0.8 kg CO₂/day when auto-scheduled',
    color: '#e53935',
  },
  {
    type: 'car' as const,
    emoji: '🚗',
    name: 'Connected Vehicle',
    brands: ['Tesla', 'BMW', 'Ford', 'GM'],
    description: 'Track EV charging, efficiency, and trip emissions',
    savingsLabel: '↓ 4.6 kg CO₂ per clean-grid charge',
    color: '#1565c0',
  },
  {
    type: 'fitness_tracker' as const,
    emoji: '⌚',
    name: 'Fitness Tracker',
    brands: ['Apple Health', 'Fitbit', 'Garmin', 'Google Fit'],
    description: 'Credit CO₂ saved from walking & cycling instead of driving',
    savingsLabel: '↑ ~0.4 kg CO₂ saved per km active commute',
    color: '#388e3c',
  },
  {
    type: 'solar_panel' as const,
    emoji: '☀️',
    name: 'Solar / Smart Meter',
    brands: ['Enphase', 'SolarEdge', 'Tesla Powerwall'],
    description: 'Monitor solar generation and home energy export',
    savingsLabel: '↓ up to 3 kg CO₂/day on sunny days',
    color: '#f57f17',
  },
  {
    type: 'smart_plug' as const,
    emoji: '🔌',
    name: 'Smart Plug',
    brands: ['TP-Link Kasa', 'Meross', 'Amazon Smart Plug'],
    description: 'Auto-schedule high-draw appliances to low-carbon grid times',
    savingsLabel: '↓ 0.3 kg CO₂/day with optimal scheduling',
    color: '#6a1b9a',
  },
];

const AUTOMATION_PRESETS = [
  {
    emoji: '🌙',
    label: 'Night Eco Mode',
    description: 'Lower thermostat 2°C between 22:00–06:00',
    saving: 0.6,
  },
  {
    emoji: '☀️',
    label: 'Solar Charging',
    description: 'Charge EV only when grid renewables > 70%',
    saving: 1.8,
  },
  {
    emoji: '⚡',
    label: 'Peak Avoidance',
    description: 'Shift dishwasher/washer to 01:00–06:00',
    saving: 0.4,
  },
  {
    emoji: '🚶',
    label: 'Walk Bonus',
    description: 'Log CO₂ credit when Fitbit detects commute walk',
    saving: 0.4,
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const DeviceCard = ({
  catalog,
  connected,
  onConnect,
  onDisconnect,
  loading,
}: {
  catalog: (typeof DEVICE_CATALOG)[0];
  connected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  loading: boolean;
}) => (
  <View style={[styles.deviceCard, connected && styles.deviceCardConnected]}>
    <View
      style={[styles.deviceIcon, { backgroundColor: catalog.color + '18' }]}
    >
      <Text style={styles.deviceEmoji}>{catalog.emoji}</Text>
    </View>
    <View style={styles.deviceBody}>
      <View style={styles.deviceHeader}>
        <Text style={styles.deviceName}>{catalog.name}</Text>
        {connected && <Text style={styles.connectedBadge}>● Connected</Text>}
      </View>
      <Text style={styles.deviceBrands}>{catalog.brands.join(' · ')}</Text>
      <Text style={styles.deviceDesc}>{catalog.description}</Text>
      <View style={styles.savingsChip}>
        <Text style={styles.savingsText}>🌱 {catalog.savingsLabel}</Text>
      </View>
    </View>
    <View style={styles.deviceAction}>
      {loading ? (
        <ActivityIndicator size='small' color={catalog.color} />
      ) : connected ? (
        <TouchableOpacity style={styles.disconnectBtn} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Remove</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.connectBtn, { backgroundColor: catalog.color }]}
          onPress={onConnect}
        >
          <Text style={styles.connectText}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const AutomationRow = ({
  preset,
  enabled,
  onToggle,
}: {
  preset: (typeof AUTOMATION_PRESETS)[0];
  enabled: boolean;
  onToggle: (val: boolean) => void;
}) => (
  <View style={styles.automationRow}>
    <Text style={styles.automationEmoji}>{preset.emoji}</Text>
    <View style={styles.automationInfo}>
      <Text style={styles.automationLabel}>{preset.label}</Text>
      <Text style={styles.automationDesc}>{preset.description}</Text>
      <Text style={styles.automationSaving}>
        ↓ {preset.saving} kg CO₂/day when active
      </Text>
    </View>
    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ true: '#2e7d32' }}
      thumbColor={enabled ? '#4caf50' : '#ccc'}
    />
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const SmartDevicesScreen = () => {
  const { showToast } = useToast();
  const [connectedTypes, setConnectedTypes] = useState<Set<string>>(new Set());
  const [loadingTypes, setLoadingTypes] = useState<Set<string>>(new Set());
  const [automations, setAutomations] = useState<Record<string, boolean>>({
    'Night Eco Mode': false,
    'Solar Charging': false,
    'Peak Avoidance': false,
    'Walk Bonus': false,
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [totalSavingKg, setTotalSavingKg] = useState(0);

  // Recalculate total savings
  useEffect(() => {
    const connectedSavings = DEVICE_CATALOG.filter(d =>
      connectedTypes.has(d.type),
    ).reduce(
      (s, d) => s + parseFloat(d.savingsLabel.match(/[\d.]+/)?.[0] ?? '0'),
      0,
    );
    const automationSavings = AUTOMATION_PRESETS.filter(
      p => automations[p.label],
    ).reduce((s, p) => s + p.saving, 0);
    setTotalSavingKg(
      parseFloat((connectedSavings + automationSavings).toFixed(1)),
    );
  }, [connectedTypes, automations]);

  const handleConnect = useCallback(
    (catalog: (typeof DEVICE_CATALOG)[0]) => {
      const brandButtons = catalog.brands.map(brand => ({
        text: brand,
        onPress: async () => {
          setLoadingTypes(prev => new Set([...prev, catalog.type]));
          await new Promise(r => setTimeout(r, 1200));
          setConnectedTypes(prev => new Set([...prev, catalog.type]));
          setLoadingTypes(prev => {
            const next = new Set(prev);
            next.delete(catalog.type);
            return next;
          });
          showToast(
            '✅ Connected! ' +
              `${brand} ${catalog.name} is now syncing with Kindred.`,
            'success',
          );
        },
      }));
      Alert.alert(
        `Connect ${catalog.name}`,
        `Choose your ${catalog.name} brand:\n${catalog.brands.join(
          ', ',
        )}\n\nYou'll be asked to sign in to authorise Kindred.`,
        [...brandButtons, { text: 'Cancel', style: 'cancel' as const }],
      );
    },
    [showToast],
  );

  const handleDisconnect = useCallback(
    (catalog: (typeof DEVICE_CATALOG)[0]) => {
      Alert.alert(
        'Remove Device',
        `Remove ${catalog.name}? Kindred will stop syncing this device's data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setConnectedTypes(prev => {
                const next = new Set(prev);
                next.delete(catalog.type);
                return next;
              });
            },
          },
        ],
      );
    },
    [],
  );

  const handleAutomationToggle = useCallback(
    (label: string, val: boolean) => {
      setAutomations(prev => ({ ...prev, [label]: val }));
      if (val) {
        showToast(
          '🤖 Rule Enabled: ' +
            `"${label}" is now active. Kindred will optimise your devices automatically.`,
          'success',
        );
      }
    },
    [showToast],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔌 Smart Devices</Text>
        <Text style={styles.subtitle}>Connect · Automate · Save Carbon</Text>
        {connectedTypes.size > 0 && (
          <View style={styles.headerStats}>
            <Text style={styles.headerStat}>
              {connectedTypes.size} device{connectedTypes.size > 1 ? 's' : ''}{' '}
              connected
            </Text>
            <Text style={styles.headerDot}>·</Text>
            <Text style={styles.headerStat}>
              ↓ {totalSavingKg} kg CO₂/day potential
            </Text>
          </View>
        )}
      </View>

      {/* Auto-sync toggle */}
      <View style={styles.globalToggleRow}>
        <View>
          <Text style={styles.globalToggleLabel}>Auto-Sync</Text>
          <Text style={styles.globalToggleSubLabel}>
            Sync all devices every 15 minutes
          </Text>
        </View>
        <Switch
          value={autoSyncEnabled}
          onValueChange={setAutoSyncEnabled}
          trackColor={{ true: '#2e7d32' }}
        />
      </View>

      {/* Device catalog */}
      <Text style={styles.sectionTitle}>📡 Your Devices</Text>
      {DEVICE_CATALOG.map(catalog => (
        <DeviceCard
          key={catalog.type}
          catalog={catalog}
          connected={connectedTypes.has(catalog.type)}
          loading={loadingTypes.has(catalog.type)}
          onConnect={() => handleConnect(catalog)}
          onDisconnect={() => handleDisconnect(catalog)}
        />
      ))}

      {/* Automation rules */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
        🤖 Automation Rules
      </Text>
      <Text style={styles.sectionSubTitle}>
        Let Kindred automatically schedule your devices around clean-grid
        windows
      </Text>
      <View style={styles.automationCard}>
        {AUTOMATION_PRESETS.map((preset, i) => (
          <React.Fragment key={preset.label}>
            <AutomationRow
              preset={preset}
              enabled={automations[preset.label]}
              onToggle={val => handleAutomationToggle(preset.label, val)}
            />
            {i < AUTOMATION_PRESETS.length - 1 && (
              <View style={styles.divider} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Total impact */}
      {totalSavingKg > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            🌍 Your estimated smart device savings
          </Text>
          <Text style={styles.totalValue}>{totalSavingKg} kg CO₂/day</Text>
          <Text style={styles.totalSub}>
            {(totalSavingKg * 365).toFixed(0)} kg/year ·{' '}
            {(((totalSavingKg * 365) / 1000) * 2.47).toFixed(2)} acres of forest
            equivalent
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 48 },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a237e',
  },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 8,
  },
  headerStat: { fontSize: 12, color: 'white', fontWeight: '600' },
  headerDot: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  globalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  globalToggleLabel: { fontSize: 15, fontWeight: '600', color: '#222' },
  globalToggleSubLabel: { fontSize: 12, color: '#aaa', marginTop: 2 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionSubTitle: {
    fontSize: 13,
    color: '#888',
    marginHorizontal: 16,
    marginBottom: 12,
    lineHeight: 18,
  },

  deviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deviceCardConnected: { borderWidth: 1.5, borderColor: '#4caf50' },
  deviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceEmoji: { fontSize: 26 },
  deviceBody: { flex: 1 },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#222' },
  connectedBadge: { fontSize: 11, color: '#4caf50', fontWeight: '700' },
  deviceBrands: { fontSize: 11, color: '#aaa', marginBottom: 4 },
  deviceDesc: { fontSize: 13, color: '#555', lineHeight: 17, marginBottom: 8 },
  savingsChip: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  savingsText: { fontSize: 11, color: '#388e3c', fontWeight: '600' },
  deviceAction: { marginLeft: 8, justifyContent: 'center' },
  connectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  connectText: { color: 'white', fontSize: 13, fontWeight: '700' },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e53935',
  },
  disconnectText: { color: '#e53935', fontSize: 12, fontWeight: '600' },

  automationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  automationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  automationEmoji: { fontSize: 24, width: 36 },
  automationInfo: { flex: 1, marginRight: 12 },
  automationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  automationDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 2,
  },
  automationSaving: { fontSize: 11, color: '#4caf50', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f5f5f5', marginVertical: 2 },

  totalCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#1a237e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  totalValue: { fontSize: 36, fontWeight: '900', color: 'white' },
  totalSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SmartDevicesScreen;
