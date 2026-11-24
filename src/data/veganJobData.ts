/**
 * veganJobData.ts — Cruelty-Free Careers & Ethical Job Board
 *
 * Curated opportunities at verified 100% plant-based companies,
 * alternative protein innovators, animal sanctuaries, and climate non-profits.
 */

export interface VeganJob {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  verifiedCompany: boolean;
  category: 'Tech & Science' | 'Sanctuary & Animals' | 'Culinary & Food' | 'Marketing & Ops';
  workplaceType: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  employmentType: 'Full-time' | 'Part-time' | 'Fellowship' | 'Contract';
  salaryRange: string;
  experienceLevel: 'Entry' | 'Mid-Level' | 'Senior' | 'Lead';
  postedAgo: string;
  description: string;
  requirements: string[];
  impactStatement: string;
  tags: string[];
  applyUrl?: string;
  isBookmarked?: boolean;
}

export const VEGAN_JOBS: VeganJob[] = [
  {
    id: 'job-1',
    title: 'Food Scientist – Plant-Based Dairy Innovation',
    company: 'Silk & Oat Labs',
    companyLogo: '🥛',
    verifiedCompany: true,
    category: 'Tech & Science',
    workplaceType: 'Hybrid',
    location: 'Brooklyn, NY',
    employmentType: 'Full-time',
    salaryRange: '$115,000 – $140,000 / yr',
    experienceLevel: 'Mid-Level',
    postedAgo: '1d ago',
    description:
      'Lead formulation and sensory testing for next-generation fermented cashew & oat artisanal cheeses that replicate true meltability without cow exploitation.',
    requirements: [
      'Degree in Food Science, Biochemistry, or equivalent experience',
      '3+ years formulating plant-based emulsions or fermentation',
      'Passion for advancing the ethical food transition',
    ],
    impactStatement: 'Replaces ~45,000 kg of dairy per production batch.',
    tags: ['Fermentation', 'Food Science', 'R&D', 'Biochemistry'],
    isBookmarked: false,
  },
  {
    id: 'job-2',
    title: 'Sanctuary Animal Care Specialist & Rescue Fellow',
    company: 'Catskill Sanctuary Foundation',
    companyLogo: '🐮',
    verifiedCompany: true,
    category: 'Sanctuary & Animals',
    workplaceType: 'On-site',
    location: 'Saugerties, NY',
    employmentType: 'Full-time',
    salaryRange: '$52,000 – $65,000 / yr + On-site Housing',
    experienceLevel: 'Entry',
    postedAgo: '2d ago',
    description:
      'Provide daily compassionate medical care, nutritional feeding, pasture enrichment, and rehabilitation for 200+ rescued cows, sheep, goats, and pigs.',
    requirements: [
      'Experience with large animal handling or veterinary assistance',
      'Ability to work outdoors in all weather conditions with physical stamina',
      'Strong commitment to animal liberation and cruelty-free ethics',
    ],
    impactStatement: 'Provides direct lifetime sanctuary for rescued farm animals.',
    tags: ['Animal Care', 'Sanctuary', 'Veterinary', 'Ethical Living'],
    isBookmarked: false,
  },
  {
    id: 'job-3',
    title: 'Senior Full-Stack Engineer (Climate & Supply Chain)',
    company: 'CrueltyFree Carbon OS',
    companyLogo: '🌿',
    verifiedCompany: true,
    category: 'Tech & Science',
    workplaceType: 'Remote',
    location: 'Remote (US & Global)',
    employmentType: 'Full-time',
    salaryRange: '$140,000 – $175,000 / yr + Equity',
    experienceLevel: 'Senior',
    postedAgo: '3d ago',
    description:
      'Build real-time supply chain transparency tools tracing plant-based ingredients from regenerative farms to supermarket shelves with zero deforestation.',
    requirements: [
      '5+ years TypeScript, React Native / React, and Node.js or Go',
      'Experience architecting high-scale distributed APIs & telemetry',
      'Dedicated to building software that shifts humanity away from factory farming',
    ],
    impactStatement: 'Empowers 1.2M consumers to verify zero-cruelty supply chains.',
    tags: ['TypeScript', 'React Native', 'Node.js', 'Remote'],
    isBookmarked: true,
  },
  {
    id: 'job-4',
    title: 'Head Chef & Kitchen Director (100% Plant-Based)',
    company: 'Green Botanica Kitchen',
    companyLogo: '🍲',
    verifiedCompany: true,
    category: 'Culinary & Food',
    workplaceType: 'On-site',
    location: 'Manhattan, NY',
    employmentType: 'Full-time',
    salaryRange: '$85,000 – $105,000 / yr',
    experienceLevel: 'Lead',
    postedAgo: '4d ago',
    description:
      'Curate and execute an innovative seasonal fine-dining menu featuring zero-waste foraged ingredients, house-made ferments, and vibrant vegan comfort classics.',
    requirements: [
      'Proven leadership in upscale plant-based dining or Michelin-recognized kitchens',
      'Deep mastery of fermentation, seasonal vegetable butchery, and pastry',
      'Food safety certification & team mentorship excellence',
    ],
    impactStatement: 'Serves 4,000+ cruelty-free gourmet plates every month.',
    tags: ['Culinary', 'Fine Dining', 'Kitchen Lead', 'Zero Waste'],
    isBookmarked: false,
  },
  {
    id: 'job-5',
    title: 'Growth Marketing & Animal Advocacy Campaigner',
    company: 'The Humane League & Partners',
    companyLogo: '📢',
    verifiedCompany: true,
    category: 'Marketing & Ops',
    workplaceType: 'Remote',
    location: 'Remote (Anywhere)',
    employmentType: 'Full-time',
    salaryRange: '$70,000 – $88,000 / yr',
    experienceLevel: 'Mid-Level',
    postedAgo: '5d ago',
    description:
      'Design digital advocacy campaigns, mobilize college campus initiatives, and partner with food corporations to adopt progressive plant-forward policies.',
    requirements: [
      '3+ years in growth marketing, social media advocacy, or non-profit campaigns',
      'Proven track record running viral social campaigns and coalition building',
      'Passionate communicator committed to institutional animal welfare reform',
    ],
    impactStatement: 'Influenced 30+ corporate cage-free and plant-based pledges.',
    tags: ['Advocacy', 'Marketing', 'Campaigns', 'Remote'],
    isBookmarked: false,
  },
  {
    id: 'job-6',
    title: 'Biomaterials Research Fellow – Mycelium Leather',
    company: 'BioWeave Materials',
    companyLogo: '🍄',
    verifiedCompany: true,
    category: 'Tech & Science',
    workplaceType: 'Hybrid',
    location: 'Boston, MA',
    employmentType: 'Fellowship',
    salaryRange: '$68,000 / yr Fellowship Stipend',
    experienceLevel: 'Entry',
    postedAgo: '1w ago',
    description:
      'Investigate fungal mycelium cultivation and eco-tanning chemistry to replace animal leather in luxury footwear, watches, and automotive interiors.',
    requirements: [
      'Background in Mycology, Material Science, Polymer Chemistry, or Bioengineering',
      'Hands-on aseptic laboratory culture and tensile testing experience',
      'Excitement for replacing slaughtered animal hides with renewable fungal matrices',
    ],
    impactStatement: 'Zero toxic chrome tanning and 100% cruelty-free textiles.',
    tags: ['Mycelium', 'Biomaterials', 'Materials Science', 'Fellowship'],
    isBookmarked: false,
  },
];
