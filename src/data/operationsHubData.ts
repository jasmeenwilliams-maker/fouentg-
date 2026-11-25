export type OpsNavId =
  | 'dashboard'
  | 'workflow'
  | 'guide'
  | 'sop'
  | 'clients'
  | 'progress'
  | 'checkins'
  | 'actions'
  | 'referrals'
  | 'meds'
  | 'packages'
  | 'payments'
  | 'forms'
  | 'handbook'
  | 'launch'
  | 'books';

export type AlertPreset = 'strict' | 'standard' | 'high';

export interface OpsClient {
  id: string;
  ini: string;
  county: string;
  pkg: string;
  step: number;
  next: string;
  visit: string;
  status: 'Active' | 'Check-in due' | 'On hold' | 'Closed';
  contact: 'Phone' | 'Text' | 'Email' | 'Voicemail';
  packet: 'Not started' | 'Sent' | 'Returned' | 'Complete';
  consent: boolean;
  porch: string;
  needs: string;
}

export interface OpsCheckin {
  client: string;
  date: string;
  type: 'Phone' | 'Home visit' | 'Pill tray review' | 'Self-advocacy check-in' | 'Appointment Accompaniment';
  note: string;
  done: boolean;
}

export interface OpsAction {
  title: string;
  client: string;
  owner: 'Coordinator' | 'Family contact' | 'Client';
  due: string;
  done: boolean;
}

export interface OpsReferral {
  client: string;
  kind: 'LCSW' | 'Provider' | 'Pharmacy' | 'Community resource' | 'Elder Law';
  to: string;
  date: string;
  status: 'Pending' | 'Sent' | 'Closed';
}

export interface OpsPayment {
  client: string;
  amt: number;
  due: string;
  status: 'Paid' | 'Due' | 'Overdue';
}

export interface OpsMed {
  client: string;
  item: string;
  src: 'Client' | 'Provider';
  refill: string;
  pharm: string;
  done: boolean;
}

export interface MMASResponses {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
}

export interface BHLSResponses {
  q1: number;
  q2: number;
  q3: number;
}

export interface OpsDataState {
  preset: AlertPreset;
  clients: OpsClient[];
  checkins: OpsCheckin[];
  actions: OpsAction[];
  referrals: OpsReferral[];
  payments: OpsPayment[];
  meds: OpsMed[];
  mmasResponses: MMASResponses;
  bhlsResponses: BHLSResponses;
  launchDone: Record<string, boolean>;
}

export const OPS_STORAGE_KEY = 'sw_ops_v1';

export function offsetDay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export const OPS_STEPS: ReadonlyArray<readonly [string, string]> = [
  ['Inquiry', 'Same day'],
  ['Fit check', '1 day'],
  ['Send packet', '1 day'],
  ['Packet returned', '5 days'],
  ['Consents', 'with packet'],
  ['Payment', 'before start'],
  ['SDOH check-in', '3 days'],
  ['Welcome call', '3 days'],
  ['Care plan', '7 days'],
  ['Active', 'ongoing'],
];

export const OPS_STEP_FORMS: ReadonlyArray<readonly string[]> = [
  ['01 Inquiry and Discovery Call Notes'],
  ['02 Scope and Eligibility Checklist'],
  ['Intake and Enrollment Packet (8 sections)'],
  ['Packet review checklist; missing signature follow-up'],
  [
    '03 Service Agreement',
    '04 Release of Information',
    '05 Family Communication Authorization',
    '06 LCSW Referral Acknowledgment (if referred)',
  ],
  [
    'Payment Agreement and Authorization',
    'Sliding Scale Request (if requested)',
    'Porch Fund Request (if requested)',
  ],
  ['08 SDOH Self-Advocacy Check-In'],
  ['09 Handbook Acknowledgment and Emergency Contacts'],
  ['SouthernWell Non-Clinical Care Plan', 'Family Communication Plan'],
  ['Check-in schedule; Care Coordination Tasks Log; ongoing documentation'],
];

export const OPS_COUNTIES = [
  'Forrest',
  'Lamar',
  'Jones',
  'Stone',
  'Coast (Harrison/Jackson)',
  'Telephonic (75-100 mi)',
] as const;

export const OPS_COUNTY_COLORS = [
  '#16263B',
  '#B08D57',
  '#2C4361',
  '#7A551E',
  '#4A607A',
  '#C8A977',
] as const;

export const OPS_PACKAGES = ['Essentials', 'Signature', 'Care Navigation', 'À La Carte'] as const;

export const OPS_PORCH_TIERS = [
  'Standard',
  'Tier A (20% off)',
  'Tier B (35% off)',
  'Granny Doris Fund',
] as const;

export const HUB_PRESETS: Record<AlertPreset, { a: number; p: number; r: number }> = {
  strict: { a: 0, p: 0, r: 0 },
  standard: { a: 2, p: 0, r: 1 },
  high: { a: 4, p: 1, r: 3 },
};

export interface OpsNavItem {
  id: OpsNavId;
  label: string;
  icon:
    | 'home'
    | 'compass'
    | 'book'
    | 'clipboard'
    | 'users'
    | 'chart'
    | 'calendar'
    | 'check'
    | 'share'
    | 'pill'
    | 'gift'
    | 'wallet'
    | 'file'
    | 'handbook'
    | 'rocket'
    | 'library';
}

export const OPS_NAV_ITEMS: OpsNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'workflow', label: 'Workflow Pipeline (10 Steps)', icon: 'compass' },
  { id: 'guide', label: 'Workflow Manual', icon: 'book' },
  { id: 'sop', label: 'Standard Operating Procedures', icon: 'clipboard' },
  { id: 'clients', label: 'Client Directory', icon: 'users' },
  { id: 'progress', label: 'Client Progress', icon: 'chart' },
  { id: 'checkins', label: 'Check-Ins', icon: 'calendar' },
  { id: 'actions', label: 'Action Plans', icon: 'check' },
  { id: 'referrals', label: 'Referrals', icon: 'share' },
  { id: 'meds', label: 'Medication Tracker & Check-Ins', icon: 'pill' },
  { id: 'packages', label: 'Care Packages & Rates', icon: 'gift' },
  { id: 'payments', label: 'Payment Tracking', icon: 'wallet' },
  { id: 'forms', label: 'Enrollment & Forms (5 Stages)', icon: 'file' },
  { id: 'handbook', label: 'Client Handbook', icon: 'handbook' },
  { id: 'launch', label: 'Launch Readiness', icon: 'rocket' },
  { id: 'books', label: 'Client Workbooks', icon: 'library' },
];

export const WORKFLOW_GUIDE_SECTIONS = [
  {
    phase: 'Steps 1–3 · Inquiry, Fit & Packet Dispatch',
    sla: 'Day 1 (Same day to 24 hrs)',
    summary:
      'Log every inbound inquiry immediately, confirm Pine Belt / Coast service radius and strict non-clinical eligibility scope (no skilled nursing or medical care is performed), and dispatch the 8-part intake packet.',
    actions: [
      'Record Inquiry & Discovery Call notes (caller, client initials, primary concern).',
      'Confirm zero skilled-nursing exclusions (no wound care, injections, or acute emergency needs).',
      'Assign Client ID (e.g., SW-XX-0000) and send packet via Portal or printed welcome folder.',
    ],
  },
  {
    phase: 'Steps 4–6 · Consents, Retainer & SDOH Check-In',
    sla: 'Days 2–5',
    summary:
      'Audit returned packets for DPOA documentation, HIPAA Releases of Information, scope acknowledgments, and retainer authorization prior to scheduling the baseline home visit.',
    actions: [
      'Verify Service Agreement (Form 03), HIPAA ROI (Form 04), and Family Authorization (Form 05).',
      'Confirm payment method or Granny Doris Porch Fund / Sliding Scale tier.',
      'Complete Social Determinants of Health (SDOH) & BHLS self-advocacy check-in to tailor plain-language supports.',
    ],
  },
  {
    phase: 'Steps 7–10 · Foundation Walkthrough, 5-Tab Binder & Active Coordination',
    sla: 'Day 7 through Ongoing Care',
    summary:
      'Conduct the 90-minute in-home foundation walkthrough, assemble the 5-Tab Care Dossier and EMS Refrigerator Snapshot, and transition into scheduled accompaniment and 24-hour family briefings.',
    actions: [
      'Perform kitchen-table bottle inventory (containers as supplied — zero prescribing or dosing edits).',
      'Deliver laminated EMS Refrigerator Magnet and physical 5-Tab Care Dossier binder.',
      'Maintain recurring phone/home self-advocacy check-ins and send 24-hour post-visit summaries to approved proxies.',
    ],
  },
];

export const SOP_ITEMS = [
  {
    code: 'SOP-01',
    title: 'Strict Non-Clinical Boundary & Scope Escalation',
    owner: 'All Care Coordinators',
    cadence: 'Every client contact',
    summary:
      'No skilled nursing or medical care is performed. Coordinators never diagnose, prescribe, dispense medications from bottles, draw labs, or perform hands-on nursing care. Any urgent distress triggers 911 first, followed immediately by DPOA/family notification.',
  },
  {
    code: 'SOP-02',
    title: 'Medication Container Inventory & Pharmacy Sync',
    owner: 'Lead Care Navigator',
    cadence: 'Baseline + Bi-weekly / Monthly',
    summary:
      'Record medication labels verbatim as supplied by the client or pharmacy. Expired bottles or duplicate containers are flagged in yellow for prescribing provider review—never altered unilaterally.',
  },
  {
    code: 'SOP-03',
    title: '24-Hour Post-Visit Family Briefing SLA',
    owner: 'Accompanying Navigator',
    cadence: 'Within 24 hrs of any appointment',
    summary:
      'Document appointment date, attending provider, non-clinical visit takeaways, updated follow-up dates, and action items for authorized family members in the Portal and phone summary.',
  },
  {
    code: 'SOP-04',
    title: 'HIPAA & Release of Information Verification',
    owner: 'Operations Admin',
    cadence: 'Prior to first provider call',
    summary:
      'No provider office or pharmacy outreach occurs until signed Form 04 ROI and Form 05 Family Communication Authorization are logged in Tab 4 and the encrypted client vault.',
  },
];

export const LAUNCH_CHECKLIST_ITEMS = [
  {
    id: 'llc_ein',
    category: 'Legal & Governance',
    title: 'Mississippi LLC standing, EIN, and General/Professional Liability Binder active',
  },
  {
    id: 'roi_templates',
    category: 'Compliance & Consents',
    title: 'Forms 01–09 (HIPAA ROI, Scope Waiver, DPOA Verification, SDOH) finalized',
  },
  {
    id: 'dossier_stock',
    category: 'Physical 5-Tab Dossiers',
    title: 'Deep Oxford Navy 5-Tab Binders (Brushed Brass SW Crest), Warm Alabaster inserts & EMS Fridge Magnets stocked',
  },
  {
    id: 'hub_phones',
    category: 'Dual-Corridor Dispatch',
    title: 'Pine Belt & Coast Hub direct line (601-554-6067) routed & tested',
  },
  {
    id: 'lcsw_network',
    category: 'Referral Partners',
    title: 'LCSW, Elder Law, Highland Pharmacy & local cardiology liaison contacts verified',
  },
  {
    id: 'porch_fund',
    category: 'Community Equity',
    title: 'Granny Doris Porch Fund & Fixed-Income Sliding Scale caseload allocation set',
  },
];

export function createSeedOpsData(): OpsDataState {
  return {
    preset: 'standard',
    clients: [
      {
        id: 'SW-RM-4081',
        ini: 'R.M.',
        county: 'Forrest',
        pkg: 'Care Navigation',
        step: 3,
        next: offsetDay(2),
        visit: 'In-Home Walkthrough',
        status: 'Active',
        contact: 'Phone',
        packet: 'Complete',
        consent: true,
        porch: 'Standard',
        needs: 'Bottle inventory check, cardiology appointment accompaniment',
      },
      {
        id: 'SW-MC-1102',
        ini: 'M.C.',
        county: 'Coast (Harrison/Jackson)',
        pkg: 'Essentials',
        step: 2,
        next: offsetDay(5),
        visit: 'Discovery Follow-up',
        status: 'Check-in due',
        contact: 'Email',
        packet: 'Sent',
        consent: false,
        porch: 'Tier A (20% off)',
        needs: 'Advance directive organization',
      },
      {
        id: 'SW-AS-3091',
        ini: 'A.S.',
        county: 'Jones',
        pkg: 'Care Navigation',
        step: 5,
        next: offsetDay(7),
        visit: 'Home Visit',
        status: 'Active',
        contact: 'Phone',
        packet: 'Complete',
        consent: true,
        porch: 'Standard',
        needs: 'Pillbox organizer sync, Forrest General follow-up',
      },
      {
        id: 'SW-EV-2044',
        ini: 'E.V.',
        county: 'Coast (Harrison/Jackson)',
        pkg: 'Signature',
        step: 4,
        next: offsetDay(4),
        visit: 'Binder Delivery',
        status: 'Active',
        contact: 'Text',
        packet: 'Returned',
        consent: true,
        porch: 'Standard',
        needs: 'Deliver 5-Tab binder to Ocean Springs residence',
      },
    ],
    checkins: [
      {
        client: 'SW-RM-4081',
        date: offsetDay(2),
        type: 'Home visit',
        note: 'Baseline 90-min in-home walkthrough & pillbox inventory',
        done: false,
      },
      {
        client: 'SW-MC-1102',
        date: offsetDay(1),
        type: 'Phone',
        note: 'Review missing HIPAA waiver signature with Michael (son)',
        done: false,
      },
      {
        client: 'SW-AS-3091',
        date: offsetDay(6),
        type: 'Pill tray review',
        note: 'Bi-weekly pillbox synchronization',
        done: false,
      },
    ],
    actions: [
      {
        title: 'Medication bottle inventory reconciliation for R.M.',
        client: 'SW-RM-4081',
        owner: 'Coordinator',
        due: offsetDay(2),
        done: false,
      },
      {
        title: 'Verify Scope Waiver with proxy',
        client: 'SW-MC-1102',
        owner: 'Family contact',
        due: offsetDay(1),
        done: false,
      },
      {
        title: 'Deliver 5-Tab Dossier Binder to Ocean Springs',
        client: 'SW-EV-2044',
        owner: 'Coordinator',
        due: offsetDay(4),
        done: false,
      },
    ],
    referrals: [
      {
        client: 'SW-RM-4081',
        kind: 'Provider',
        to: 'Forrest General Heart Center (Dr. Sterling)',
        date: offsetDay(-2),
        status: 'Pending',
      },
    ],
    payments: [
      { client: 'SW-MC-1102', amt: 220, due: offsetDay(0), status: 'Due' },
      { client: 'SW-RM-4081', amt: 375, due: offsetDay(-5), status: 'Paid' },
    ],
    meds: [
      {
        client: 'SW-RM-4081',
        item: 'Metoprolol Succinate 50mg BID',
        src: 'Provider',
        refill: offsetDay(4),
        pharm: 'Highland Pharmacy',
        done: false,
      },
      {
        client: 'SW-RM-4081',
        item: 'Lisinopril 10mg Daily',
        src: 'Client',
        refill: offsetDay(12),
        pharm: 'Highland Pharmacy',
        done: false,
      },
      {
        client: 'SW-AS-3091',
        item: 'Atorvastatin 20mg QHS',
        src: 'Provider',
        refill: offsetDay(8),
        pharm: 'CVS Hattiesburg',
        done: false,
      },
    ],
    mmasResponses: { q1: 1, q2: 0, q3: 0, q4: 1, q5: 0, q6: 0, q7: 1, q8: 2 },
    bhlsResponses: { q1: 2, q2: 3, q3: 3 },
    launchDone: {
      llc_ein: true,
      roi_templates: true,
      dossier_stock: true,
      hub_phones: true,
      lcsw_network: false,
      porch_fund: true,
    },
  };
}

export function calculateMMAS(r: MMASResponses): {
  score: number;
  label: string;
  tone: 'navy' | 'brass' | 'crimson';
  recommendation: string;
} {
  let sum = 0;
  if (r.q1 === 1) sum += 1;
  if (r.q2 === 1) sum += 1;
  if (r.q3 === 1) sum += 1;
  if (r.q4 === 1) sum += 1;
  if (r.q5 === 1) sum += 1;
  if (r.q6 === 1) sum += 1;
  if (r.q7 === 1) sum += 1;

  const q8 = r.q8 ?? 4;
  if (q8 === 4) sum += 1.0;
  else if (q8 === 3) sum += 0.75;
  else if (q8 === 2) sum += 0.5;
  else if (q8 === 1) sum += 0.25;

  if (sum === 8) {
    return {
      score: 8,
      label: 'High Adherence',
      tone: 'navy',
      recommendation:
        'Standard monthly pill tray organization and refill reminder calls. Client exhibits optimal routine consistency.',
    };
  }
  if (sum >= 6) {
    return {
      score: sum,
      label: 'Medium Adherence',
      tone: 'brass',
      recommendation:
        'Implement color-coded 7-day pillbox trays with twice-weekly phone reminders. Synchronize refill cycles with Highland Pharmacy.',
    };
  }
  return {
    score: sum,
    label: 'Low Adherence (Support Needed)',
    tone: 'crimson',
    recommendation:
      'Flag for in-home blister-pack transition (Dispill/Bubble-pack). Coordinate appointment accompaniment so client can review routine barriers with prescribing provider.',
  };
}

export function calculateBHLS(r: BHLSResponses): {
  score: number;
  label: string;
  tone: 'navy' | 'brass' | 'crimson';
  recommendation: string;
} {
  const sum = (r.q1 || 3) + (r.q2 || 3) + (r.q3 || 3);
  if (sum >= 13) {
    return {
      score: sum,
      label: 'Adequate Health Literacy',
      tone: 'navy',
      recommendation:
        'Provide standard SouthernWell 5-Tab Binder instructions. Client navigates appointment paperwork independently.',
    };
  }
  if (sum >= 10) {
    return {
      score: sum,
      label: 'Marginal Health Literacy',
      tone: 'brass',
      recommendation:
        'Highlight key dates and provider instructions with yellow markers. Coordinator reviews appointment summaries verbally during post-visit call.',
    };
  }
  return {
    score: sum,
    label: 'Inadequate Health Literacy (Active Advocacy Required)',
    tone: 'crimson',
    recommendation:
      'Priority in-person appointment accompaniment. Coordinator assists with intake paperwork and uses Teach-Back for plain-language non-clinical instructions.',
  };
}
