export const FOUNDER_PORTRAIT_URL = '/assets/aistudio/image__6__5a6dba43.png';

export const BRAND_INFO = {
  brand: 'SouthernWell Case Management Services',
  shortBrand: 'SOUTHERNWELL',
  subtitle: 'SouthernWell of South Mississippi',
  founder: 'Jasmeen Williams, LPN, BS-HHS',
  phone: '601-554-6067',
  email: 'jasmeenwilliams@southernwellofsouthms.com',
  scopeNotice:
    'Strictly non-clinical care coordination and family advocacy—no skilled nursing or medical care is performed.',
  regions: [
    'Hattiesburg, Laurel, Petal & Pine Belt',
    'Gulfport, Biloxi, Ocean Springs & Coast',
  ],
};

export interface AudienceCard {
  id: string;
  kicker: string;
  title: string;
  description: string;
  outcome: string;
  icon: 'flight' | 'schedule' | 'heart';
}

export const AUDIENCE_CARDS: AudienceCard[] = [
  {
    id: 'long-distance',
    kicker: 'Out-of-Town Support',
    title: 'For Long-Distance Adult Children',
    description:
      'You live out of town or out of state and worry about what happens between phone calls. We serve as your boots-on-the-ground family advocate in South Mississippi—attending appointments in person, checking home routines, and sending clear, plain-language updates after every visit.',
    outcome: 'Same-day debriefs & clear logs',
    icon: 'flight',
  },
  {
    id: 'local-families',
    kicker: 'Sandwiched Generation',
    title: 'For Busy Local Families',
    description:
      'You love your parent deeply, but juggling work, kids, pharmacy refills, and specialist calendars is exhausting. We lift the day-to-day logistical weight so your time together is spent simply being family—not acting as an overwhelmed care coordinator.',
    outcome: 'Preserving quality family moments',
    icon: 'schedule',
  },
  {
    id: 'autonomous-adults',
    kicker: 'Autonomous Living',
    title: 'For Older Adults Valuing Independence',
    description:
      'You want to remain safe, organized, and heard at your provider appointments without losing your voice. We organize your records into a personal Care Dossier, prepare questions alongside you, and respect your independence at every step.',
    outcome: 'Dignified voice in every visit',
    icon: 'heart',
  },
];

export interface WorkflowStage {
  stageNumber: number;
  timing: string;
  title: string;
  description: string;
  outcome: string;
  featured?: boolean;
  hasDividerTabs?: boolean;
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    stageNumber: 1,
    timing: 'Stage 1 · Day 1',
    title: 'Initial Consultation & Discovery',
    description:
      'Complimentary 30-minute phone, video, or in-person discovery call to verify service radius (Hattiesburg/Pine Belt & Gulf Coast), confirm strictly non-clinical boundaries, review family needs, and determine recommended tier.',
    outcome: 'Clear fit & care navigation scope',
  },
  {
    stageNumber: 2,
    timing: 'Stage 2 · Days 2–3',
    title: 'Onboarding, Scope Waiver & HIPAA Sync',
    description:
      'Secure client intake, legal authority verification (POA/self), clear non-clinical scope agreement stating no skilled nursing or medical care is performed, and HIPAA releases for primary care offices, specialists, and pharmacies.',
    outcome: 'Authorized records sync',
  },
  {
    stageNumber: 3,
    timing: 'Stage 3 · Days 4–7',
    title: '90-Min In-Home Foundation Walkthrough',
    description:
      'Unhurried kitchen-table visit: comprehensive home safety & fall hazard walkthrough, daily lifestyle review, and full kitchen-table medication & supplement bottle inventory.',
    outcome: 'Full home & bottle inventory',
  },
  {
    stageNumber: 4,
    timing: 'Stage 4 · Days 7–10',
    title: 'Care Dossier Assembly & Provider Sync',
    description:
      'Assembly of the Deep Oxford Navy linen binder embossed with the Brushed Brass SW monogram crest, encrypted digital archive, 5 structured divider tabs, and a laminated refrigerator EMS snapshot.',
    outcome: 'Physical binder + cloud archive',
    hasDividerTabs: true,
  },
  {
    stageNumber: 5,
    timing: 'Stage 5 · Day 11+ Ongoing',
    title: 'Active Stewardship & 24-Hr Briefings',
    description:
      'Scheduled in-home self-advocacy check-ins, proactive pillbox and refill organization, appointment accompaniment with note-taking, and detailed family debrief briefings delivered within 24 hours.',
    outcome: 'Unbroken, responsive advocacy',
    featured: true,
  },
];

export const DOSSIER_TABS = [
  {
    number: 1,
    title: 'Emergency & Provider Contacts',
    shortTitle: 'Contacts & Providers',
    colorTag: 'Deep Oxford Navy',
    description:
      'Verified directory of primary care providers, South Mississippi specialists, preferred hospital system, local pharmacy, and authorized family POA contacts.',
    sampleRows: [
      { label: 'Primary Care Office', value: 'Hattiesburg Clinic — Internal Medicine', detail: '601-268-5600 · Portal Active' },
      { label: 'Cardiology Specialist', value: 'Forrest General Heart & Vascular', detail: 'Next follow-up: Quarterly' },
      { label: 'Community Pharmacy', value: 'Oak Grove Family Pharmacy', detail: 'Auto-sync refills on 1st of month' },
      { label: 'Primary Family Contact (POA)', value: 'Adult Daughter (Houston, TX)', detail: 'Same-day written debrief recipient' },
    ],
  },
  {
    number: 2,
    title: 'Master Medication Log',
    shortTitle: 'Medication Log',
    colorTag: 'Brushed Brass',
    description:
      'Reconciled inventory of prescription bottles, OTC supplements, prescribing provider, label directions, and expiration/refill tracking (as supplied—zero dosing changes).',
    sampleRows: [
      { label: 'Morning Routine (8:00 AM)', value: 'Lisinopril 10mg · Atorvastatin 20mg', detail: 'Verified against bottle labels' },
      { label: 'Evening Routine (8:00 PM)', value: 'Metformin ER 500mg · Vitamin D3', detail: '30-day pillbox checked weekly' },
      { label: 'Pharmacy Sync Status', value: 'All 4 active scripts aligned', detail: 'Zero duplicate bottle flags' },
      { label: 'Over-the-Counter Inventory', value: 'Low-dose Aspirin 81mg (On Label)', detail: 'Logged at annual provider visit' },
    ],
  },
  {
    number: 3,
    title: 'Provider Visit Summaries (AVS)',
    shortTitle: 'Visit Summaries',
    colorTag: 'Warm Alabaster',
    description:
      'Chronological After-Visit Summaries, pre-visit question lists prepared with family, follow-up scheduling, and plain-language action items.',
    sampleRows: [
      { label: 'Recent Primary Visit', value: 'Routine wellness follow-up completed', detail: 'Continue scheduled check-ins; recheck in 90 days' },
      { label: 'Pre-Visit Questions Asked', value: 'Clarified evening fatigue & hydration goals', detail: 'Provider shared timing guidance' },
      { label: 'Lab / Diagnostic Schedule', value: 'Routine bloodwork ordered', detail: 'Scheduled for Tuesday 8:30 AM fasting' },
      { label: 'Next Specialist Appointment', value: 'Ophthalmology Annual Exam', detail: 'Accompaniment booked on calendar' },
    ],
  },
  {
    number: 4,
    title: 'Advance Directives & HIPAA',
    shortTitle: 'Directives & HIPAA',
    colorTag: 'Obsidian Charcoal',
    description:
      'Executed HIPAA release authorizations, Healthcare Power of Attorney copies, and documented personal care preferences.',
    sampleRows: [
      { label: 'Provider HIPAA Releases', value: 'Signed for Primary Care, Cardiology & Pharmacy', detail: 'On file with SouthernWell & offices' },
      { label: 'Healthcare Power of Attorney', value: 'Executed & notarized copy indexed', detail: 'Original stored in home fireproof box' },
      { label: 'Preferred Regional Hospital', value: 'Forrest General / Memorial Gulfport', detail: 'Noted on EMS Refrigerator Snapshot' },
      { label: 'Personal Comfort Preferences', value: 'Unhurried explanations & large-print notes', detail: 'Shared with office care coordinators' },
    ],
  },
  {
    number: 5,
    title: 'Family Briefings & Wellness',
    shortTitle: 'Family Briefings',
    colorTag: 'Slate Navy',
    description:
      'Structured post-visit debriefs, home safety walkthrough observations, nutrition/hydration notes, and monthly family wellness logs.',
    sampleRows: [
      { label: 'Home Safety Walkthrough', value: 'Hallway throw rugs secured; nightlights added', detail: 'Bathroom grab bars verified' },
      { label: 'Weekly Self-Advocacy Check-In', value: 'Appetite steady; walking porch daily', detail: 'Pillbox completely on track' },
      { label: 'Family Briefings Delivered', value: '4 weekly updates sent within 24 hours', detail: 'Shared across 3 sibling emails' },
      { label: 'Community & Social Rhythm', value: 'Attending Wednesday church fellowship', detail: 'Transportation coordinated smoothly' },
    ],
  },
];

export interface PricingTier {
  id: 'foundation' | 'essential' | 'comprehensive' | 'alacarte';
  indexLabel: string;
  title: string;
  price: number;
  unit: string;
  features: string[];
  ctaLabel: string;
  popular?: boolean;
  calculableMonthly?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'foundation',
    indexLabel: '01. Foundational Entry',
    title: 'The Foundation Walkthrough & Care Dossier',
    price: 225,
    unit: 'One-Time Flat Fee',
    features: [
      'Comprehensive non-clinical home safety & daily lifestyle walkthrough',
      'Master physician, specialist & pharmacy directory',
      'Non-clinical medication bottle organization & pillbox audit',
      'Advance care preference organization',
      'Custom Deep Oxford Navy SouthernWell Care Dossier binder embossed with the Brushed Brass SW crest',
    ],
    ctaLabel: 'Inquire Onboarding',
  },
  {
    id: 'essential',
    indexLabel: '02. Bi-Weekly Oversight',
    title: 'Essential Stewardship',
    price: 275,
    unit: '/ month',
    features: [
      '2 scheduled self-advocacy check-ins per month (1 in-home, 1 virtual/phone)',
      'Monthly medication refill & pillbox organization check',
      'Appointment calendar coordination & reminder calls',
      'Monthly structured summary sent to authorized family',
    ],
    ctaLabel: 'Select Essential',
    calculableMonthly: true,
  },
  {
    id: 'comprehensive',
    indexLabel: '03. Weekly Retainer',
    title: 'Comprehensive Care Navigation',
    price: 350,
    unit: '/ month',
    popular: true,
    features: [
      '4 weekly in-home self-advocacy & medication organization check-ins',
      'Proactive pharmacy refill coordination & bottle tracking',
      'Up to 2 in-person appointment accompaniments per month',
      'Same-day post-visit family briefings & plain-language summaries',
      'Warm referrals to vetted South MS licensed social workers (LCSWs), home health & elder law attorneys',
    ],
    ctaLabel: 'Choose Comprehensive',
    calculableMonthly: true,
  },
  {
    id: 'alacarte',
    indexLabel: '04. Targeted Visit Support',
    title: 'À La Carte Appointment Advocacy',
    price: 75,
    unit: '/ visit (Up to 2 hrs; $35/hr thereafter)',
    features: [
      'Pre-visit question preparation with client & family',
      'In-person appointment accompaniment & structured note-taking',
      'Same-day written summary of provider instructions & next steps',
    ],
    ctaLabel: 'Book Single Visit',
  },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is SouthernWell Case Management Services a home health or medical agency?',
    answer:
      'No. Although founded by Jasmeen Williams, LPN, BS-HHS, SouthernWell Case Management Services (SouthernWell of South Mississippi) operates strictly as a non-clinical care navigation and family advocacy service. No skilled nursing or medical care is performed—we do not dispense medications, perform skilled nursing assessments, or provide medical or mental health treatment. Instead, we handle the logistical, organizational, and communication details, and coordinate warm referrals to licensed physicians, home health agencies, and licensed social workers (LCSWs) whenever medical or specialized care is needed.',
  },
  {
    question: 'How do you help with medications if your service is non-clinical?',
    answer:
      'We provide organizational medication oversight only: keeping an up-to-date master list from existing bottle labels, checking expiration dates, helping organize weekly pillboxes strictly according to existing prescription labels, flagging potential refill gaps or duplicate bottles for your pharmacist or doctor to review, and coordinating timely pharmacy refills.',
  },
  {
    question: 'Which areas in South Mississippi do you serve?',
    answer:
      'We serve families across two primary corridors: Hattiesburg & the Pine Belt (including Laurel, Petal, and Oak Grove) and Gulfport & the Mississippi Gulf Coast (including Biloxi, Long Beach, and Ocean Springs).',
  },
  {
    question: 'How do we get started?',
    answer:
      'Begin with a complimentary 30-minute phone, video, or in-person family consultation. We will listen to your current concerns, verify non-clinical boundaries, answer your questions, and recommend the right starting tier.',
  },
];
