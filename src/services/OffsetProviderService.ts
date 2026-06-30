import type { OffsetTransaction } from '../store/slices/carbonSlice';

export interface VerifiedProject {
  id: string;
  name: string;
  description: string;
  location: string;
  costPerTon: number;
  rating: number;
  totalOffset: number;
  image: string;
  registryProvider: 'Gold Standard' | 'Verra';
  registryId: string;
  methodology: string;
  registryLink: string;
  sdgs: {
    id: number;
    name: string;
    description: string;
    icon: string;
  }[];
}

const VERIFIED_PROJECTS: VerifiedProject[] = [
  {
    id: 'proj-001',
    name: 'Amazon Rainforest Protection',
    description:
      'Preserve 10,000 acres of pristine tropical forest in Acre State, protecting critical biodiversity and preventing unplanned deforestation.',
    location: 'Acre State, Brazil',
    costPerTon: 12,
    rating: 4.9,
    totalOffset: 50000,
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400',
    registryProvider: 'Verra',
    registryId: 'VCS-1622',
    methodology: 'VM0015 (Methodology for Avoided Unplanned Deforestation)',
    registryLink: 'https://registry.verra.org/app/projectDetail/VCS/1622',
    sdgs: [
      {
        id: 13,
        name: 'Climate Action',
        description: 'Take urgent action to combat climate change.',
        icon: '⚡',
      },
      {
        id: 15,
        name: 'Life on Land',
        description: 'Protect, restore and promote sustainable use of terrestrial ecosystems.',
        icon: '🌳',
      },
      {
        id: 8,
        name: 'Decent Work',
        description: 'Promote sustained, inclusive and sustainable economic growth.',
        icon: '💼',
      },
    ],
  },
  {
    id: 'proj-002',
    name: 'Texas Renewable Wind Farm',
    description:
      'Support utility-scale wind power generation across West Texas, displacing fossil-fuel grid generation with clean, green wind energy.',
    location: 'West Texas, USA',
    costPerTon: 15,
    rating: 4.7,
    totalOffset: 75000,
    image: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?w=400',
    registryProvider: 'Verra',
    registryId: 'VCS-1422',
    methodology: 'ACM0002 (Grid-connected electricity generation from renewable sources)',
    registryLink: 'https://registry.verra.org/app/projectDetail/VCS/1422',
    sdgs: [
      {
        id: 13,
        name: 'Climate Action',
        description: 'Take urgent action to combat climate change.',
        icon: '⚡',
      },
      {
        id: 7,
        name: 'Clean Energy',
        description: 'Ensure access to affordable, reliable, sustainable modern energy.',
        icon: '☀️',
      },
    ],
  },
  {
    id: 'proj-003',
    name: 'Kenya Clean Cookstoves',
    description:
      'Distribute fuel-efficient, secondary-combustion cookstoves to rural households, lowering local firewood demand and reducing indoor air pollution.',
    location: 'Nyanza Province, Kenya',
    costPerTon: 20,
    rating: 4.8,
    totalOffset: 30000,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
    registryProvider: 'Gold Standard',
    registryId: 'GS-4153',
    methodology: 'TP-DD-001 (Thermal energy efficiency in household cookstoves)',
    registryLink: 'https://registry.goldstandard.org/projects/details/4153',
    sdgs: [
      {
        id: 13,
        name: 'Climate Action',
        description: 'Take urgent action to combat climate change.',
        icon: '⚡',
      },
      {
        id: 3,
        name: 'Good Health',
        description: 'Ensure healthy lives and promote well-being for all.',
        icon: '❤️',
      },
      {
        id: 5,
        name: 'Gender Equality',
        description: 'Achieve gender equality and empower all women and girls.',
        icon: '♀️',
      },
      {
        id: 15,
        name: 'Life on Land',
        description: 'Protect, restore and promote sustainable use of terrestrial ecosystems.',
        icon: '🌳',
      },
    ],
  },
];

export class OffsetProviderService {
  private static instance: OffsetProviderService;

  private constructor() {}

  public static getInstance(): OffsetProviderService {
    if (!OffsetProviderService.instance) {
      OffsetProviderService.instance = new OffsetProviderService();
    }
    return OffsetProviderService.instance;
  }

  public getVerifiedProjects(): VerifiedProject[] {
    return VERIFIED_PROJECTS;
  }

  public purchaseOffset(projectId: string, tons: number): OffsetTransaction {
    const project = VERIFIED_PROJECTS.find(p => p.id === projectId);
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found.`);
    }

    const transactionId = `retire-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    const cost = parseFloat((project.costPerTon * tons).toFixed(2));
    const date = new Date().toISOString();

    return {
      id: transactionId,
      projectId,
      projectName: project.name,
      cost,
      tons,
      date,
      certificateUrl: `https://kindred-earth.org/certificates/${transactionId}.pdf`,
      registryLink: project.registryLink,
      registryProvider: project.registryProvider,
      registryId: project.registryId,
    };
  }

  public calculateSubscriptionCost(
    tier: 'none' | 'starter' | 'neutral' | 'positive',
    averageMonthlyFootprintTons: number,
  ): { monthlyCost: number; tonsOffset: number } {
    if (tier === 'none') {
      return { monthlyCost: 0, tonsOffset: 0 };
    }

    // Average cost per ton is dynamic based on project blend, using ~$15.66 weighted average
    const costPerTon = 15.66;
    let multiplier = 0;

    switch (tier) {
      case 'starter':
        multiplier = 0.5; // offsets 50%
        break;
      case 'neutral':
        multiplier = 1.0; // offsets 100%
        break;
      case 'positive':
        multiplier = 1.5; // offsets 150% (Climate Positive)
        break;
    }

    const tonsOffset = parseFloat((averageMonthlyFootprintTons * multiplier).toFixed(2));
    const monthlyCost = parseFloat((tonsOffset * costPerTon).toFixed(2));

    return { monthlyCost, tonsOffset };
  }
}

export const offsetProviderService = OffsetProviderService.getInstance();
