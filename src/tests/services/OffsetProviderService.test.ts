import 'reflect-metadata';
import { offsetProviderService } from '../../services/OffsetProviderService';
import carbonReducer, {
  addOffsetTransaction,
  updateOffsetSubscription,
  addSubscriptionBillingRecord,
  OffsetTransaction,
} from '../../store/slices/carbonSlice';

describe('OffsetProviderService', () => {
  const service = offsetProviderService;

  it('should list all verified carbon projects with full registry metadata', () => {
    const projects = service.getVerifiedProjects();
    expect(projects.length).toBe(3);

    // Verify Amazon REDD+
    const amazon = projects.find(p => p.id === 'proj-001');
    expect(amazon).toBeDefined();
    expect(amazon?.registryProvider).toBe('Verra');
    expect(amazon?.registryId).toBe('VCS-1622');
    expect(amazon?.methodology).toContain('VM0015');
    expect(amazon?.sdgs.length).toBe(3);

    // Verify Kenya Cookstoves
    const kenya = projects.find(p => p.id === 'proj-003');
    expect(kenya).toBeDefined();
    expect(kenya?.registryProvider).toBe('Gold Standard');
    expect(kenya?.registryId).toBe('GS-4153');
    expect(kenya?.sdgs.length).toBe(4);
  });

  it('should perform secure mock carbon credit retirement transactions', () => {
    const tx = service.purchaseOffset('proj-001', 2.5);

    expect(tx.id).toMatch(/^retire-[A-Z0-9]+$/);
    expect(tx.projectId).toBe('proj-001');
    expect(tx.projectName).toBe('Amazon Rainforest Protection');
    expect(tx.tons).toBe(2.5);
    expect(tx.cost).toBe(30.0); // 12 * 2.5
    expect(tx.registryProvider).toBe('Verra');
    expect(tx.registryId).toBe('VCS-1622');
    expect(tx.certificateUrl).toContain(tx.id);
  });

  it('should fail retirement transaction if project ID is invalid', () => {
    expect(() => service.purchaseOffset('invalid-id', 1.0)).toThrow();
  });

  it('should calculate subscription tier costs dynamically from footprint averages', () => {
    const averageEmissions = 1.44;

    // None Tier
    const noneTier = service.calculateSubscriptionCost('none', averageEmissions);
    expect(noneTier.tonsOffset).toBe(0);
    expect(noneTier.monthlyCost).toBe(0);

    // Starter Tier (50%)
    const starterTier = service.calculateSubscriptionCost('starter', averageEmissions);
    expect(starterTier.tonsOffset).toBe(0.72); // 1.44 * 0.5
    expect(starterTier.monthlyCost).toBe(11.28); // 0.72 * 15.66

    // Neutral Tier (100%)
    const neutralTier = service.calculateSubscriptionCost('neutral', averageEmissions);
    expect(neutralTier.tonsOffset).toBe(1.44);
    expect(neutralTier.monthlyCost).toBe(22.55); // 1.44 * 15.66

    // Positive Tier (150%)
    const positiveTier = service.calculateSubscriptionCost('positive', averageEmissions);
    expect(positiveTier.tonsOffset).toBe(2.16); // 1.44 * 1.5
    expect(positiveTier.monthlyCost).toBe(33.83); // 2.16 * 15.66
  });
});

describe('carbonSlice Offset Reducers', () => {
  const initialEcosystem = {
    health: 0.5,
    treeCount: 0,
    biodiversity: 0.3,
    waterClarity: 0.5,
    airQuality: 0.5,
    lastUpdated: '',
  };

  const initialState = {
    footprint: { total: 0, transportation: 0, food: 0, energy: 0, waste: 0 },
    history: [],
    goals: { target: 0, deadline: '' },
    ecosystem: initialEcosystem,
    offsets: {
      transactions: [],
      subscription: {
        active: false,
        tier: 'none' as const,
        monthlyCost: 0,
        offsetTonsPerMonth: 0,
        nextBillingDate: '',
        billingHistory: [],
      },
    },
    loading: { footprint: false, history: false, goals: false },
    error: null,
  };

  it('should handle addOffsetTransaction action and update ecosystem health', () => {
    const tx: OffsetTransaction = {
      id: 'retire-TEST1234',
      projectId: 'proj-001',
      projectName: 'Amazon Rainforest',
      cost: 12.0,
      tons: 1.0,
      date: new Date().toISOString(),
      certificateUrl: 'http://test.com/cert.pdf',
      registryLink: 'http://test.com/reg',
      registryProvider: 'Verra',
      registryId: 'VCS-1622',
    };

    const state = carbonReducer(initialState, addOffsetTransaction(tx));

    expect(state.offsets.transactions.length).toBe(1);
    expect(state.offsets.transactions[0].id).toBe('retire-TEST1234');
    expect(state.ecosystem.health).toBe(0.55); // 0.5 + 0.05
  });

  it('should handle updateOffsetSubscription action', () => {
    const subUpdate = {
      active: true,
      tier: 'neutral' as const,
      monthlyCost: 15.66,
      offsetTonsPerMonth: 1.0,
      nextBillingDate: '2026-07-28',
    };

    const state = carbonReducer(initialState, updateOffsetSubscription(subUpdate));

    expect(state.offsets.subscription.active).toBe(true);
    expect(state.offsets.subscription.tier).toBe('neutral');
    expect(state.offsets.subscription.monthlyCost).toBe(15.66);
    expect(state.offsets.subscription.nextBillingDate).toBe('2026-07-28');
  });

  it('should handle addSubscriptionBillingRecord action and update ecosystem health', () => {
    const record = {
      id: 'bill-RENEW123',
      date: new Date().toISOString(),
      amount: 15.66,
      tons: 1.0,
    };

    const state = carbonReducer(initialState, addSubscriptionBillingRecord(record));

    expect(state.offsets.subscription.billingHistory.length).toBe(1);
    expect(state.offsets.subscription.billingHistory[0].id).toBe('bill-RENEW123');
    expect(state.ecosystem.health).toBe(0.6); // 0.5 + 0.1
  });
});
