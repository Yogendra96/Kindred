import 'reflect-metadata';
import { offsetProviderService } from '../../services/OffsetProviderService';

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
