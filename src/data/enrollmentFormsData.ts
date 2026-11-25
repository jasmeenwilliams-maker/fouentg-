export type FormFieldItem =
  | { kind: 'field'; key: string; label: string; inputType: 'text' | 'date' | 'datetime-local' }
  | { kind: 'textarea'; key: string; label: string }
  | { kind: 'choices'; key: string; label: string; options: string[]; single?: boolean }
  | { kind: 'note'; text: string }
  | { kind: 'initials'; key: string; text: string }
  | { kind: 'signature'; key: string; label: string }
  | { kind: 'table'; key: string; headers: string[]; rows: string[]; fixedFirstCol?: boolean }
  | { kind: 'fixed'; label: string; value: string };

export interface FormSection {
  title: string;
  items: FormFieldItem[];
}

export interface EnrollmentStage {
  index: number;
  shortLabel: string;
  heading: string;
  subtitle: string;
  sections: FormSection[];
}

export const ENROLLMENT_STAGES: EnrollmentStage[] = [
  {
    index: 0,
    shortLabel: 'Stage 1',
    heading: 'Stage 1 of 5 · Initial Consultation',
    subtitle:
      'Inquiry & Discovery Call Form (30-Minute Consultation) — Phone, Video, or In-Person',
    sections: [
      {
        title: '1. Contact & Geographic Service Review',
        items: [
          { kind: 'field', key: 's1_date_of_call', label: 'Date of Call', inputType: 'date' },
          {
            kind: 'choices',
            key: 's1_format',
            label: 'Consultation Format',
            options: ['Phone', 'Video', 'In-Person'],
            single: true,
          },
          { kind: 'field', key: 's1_inquirer_name', label: 'Inquirer Full Name', inputType: 'text' },
          {
            kind: 'field',
            key: 's1_relationship',
            label: 'Relationship to Client',
            inputType: 'text',
          },
          { kind: 'field', key: 's1_phone', label: 'Phone Number', inputType: 'text' },
          { kind: 'field', key: 's1_email', label: 'Email Address', inputType: 'text' },
          { kind: 'field', key: 'client', label: 'Client Legal Name', inputType: 'text' },
          { kind: 'field', key: 's1_age', label: 'Age (Target 70–95)', inputType: 'text' },
          { kind: 'field', key: 's1_city_zip', label: 'Client City / Zip Code', inputType: 'text' },
          { kind: 'field', key: 's1_referral_source', label: 'Referral Source', inputType: 'text' },
          {
            kind: 'choices',
            key: 's1_radius',
            label: 'Service Radius Verification',
            options: [
              'Within 25-mile standard travel radius (Hattiesburg/Pine Belt or Gulfport/Coast)',
              'Outside 25-mile radius (note additional mileage fee policy)',
            ],
            single: true,
          },
        ],
      },
      {
        title: '2. Needs & Support Review',
        items: [
          {
            kind: 'choices',
            key: 's1_caller_profile',
            label: 'Primary Caller Profile',
            options: [
              'Older Adult Seeking Independence',
              'Busy Local Adult Child',
              'Long-Distance Adult Child',
            ],
            single: true,
          },
          {
            kind: 'choices',
            key: 's1_pain_points',
            label: 'Primary Pain Points & Support Goals (check all that apply)',
            options: [
              'Medication / pillbox confusion, duplicate bottles, or pharmacy refill gaps',
              'Need accompaniment, family advocacy, and structured notes for provider appointments',
              'Disorganized health records / lack of an emergency 1-page EMS snapshot',
              'Need routine non-clinical home safety & self-advocacy check-ins',
              'Transition or professional referral support (LCSW, Elder Law Attorney, Licensed Home Health)',
            ],
          },
          {
            kind: 'textarea',
            key: 's1_notes',
            label: 'Additional Consultation Notes & Family Concerns',
          },
        ],
      },
      {
        title: '3. Non-Clinical Boundary Review (Mandatory)',
        items: [
          {
            kind: 'choices',
            key: 's1_acute_check',
            label: 'Skilled Nursing or Medical Care Check',
            options: [
              'No skilled nursing or medical care needed (eligible for SouthernWell Case Management Services)',
              'Yes — requires skilled nursing, wound care, injections, or emergency care (refer to Home Health / 911)',
            ],
            single: true,
          },
          {
            kind: 'choices',
            key: 's1_verbal_scope',
            label: 'Verbal Scope Disclosure',
            options: [
              'Confirmed: explained that SouthernWell Case Management Services (SouthernWell of South Mississippi) is a private-pay, strictly non-clinical care navigation and family advocacy service. No skilled nursing or medical care is performed.',
            ],
          },
        ],
      },
      {
        title: '4. Recommended Service Tier & Sliding Scale Check',
        items: [
          {
            kind: 'choices',
            key: 's1_onboarding',
            label: 'Required Onboarding',
            options: ['Foundation Walkthrough — $225 flat fee (Tier A: $180 | Tier B: $145)'],
          },
          {
            kind: 'choices',
            key: 's1_recommended_tier',
            label: 'Recommended Ongoing Tier',
            options: [
              'Essential Stewardship ($275/mo | Tier A: $220 | Tier B: $180)',
              'Comprehensive Care Navigation ($350/mo | Tier A: $280 | Tier B: $228)',
              'À La Carte Appointment Advocacy ($75/visit)',
            ],
            single: true,
          },
          {
            kind: 'choices',
            key: 's1_sliding_scale',
            label: 'Fixed-Income Sliding Scale Requested?',
            options: [
              'Yes (include Self-Attestation Form in Stage 2 packet)',
              'No (standard private-pay rates)',
            ],
            single: true,
          },
        ],
      },
    ],
  },
  {
    index: 1,
    shortLabel: 'Stage 2',
    heading: 'Stage 2 of 5 · Days 2–3 Onboarding',
    subtitle:
      'Client Intake, Scope Waiver & HIPAA Authorization Packet — complete and sign before scheduling the 90-Minute In-Home Foundation Walkthrough',
    sections: [
      {
        title: '1. Client & Legal Authority Verification',
        items: [
          { kind: 'field', key: 'client', label: 'Client Full Legal Name', inputType: 'text' },
          { kind: 'field', key: 's2_dob', label: 'Date of Birth', inputType: 'date' },
          { kind: 'field', key: 's2_address', label: 'Primary Residential Address', inputType: 'text' },
          { kind: 'field', key: 's2_phone', label: 'Home / Cell Phone', inputType: 'text' },
          {
            kind: 'choices',
            key: 's2_signatory_status',
            label: 'Legal Signatory Status',
            options: [
              'Client (self — competent to contract)',
              'Authorized Healthcare/Financial POA (attach POA copy)',
            ],
            single: true,
          },
          { kind: 'field', key: 's2_poa_name', label: 'POA / Responsible Party Name', inputType: 'text' },
          { kind: 'field', key: 's2_poa_contact', label: 'POA Phone / Email', inputType: 'text' },
        ],
      },
      {
        title: '2. Non-Clinical Scope of Services Acknowledgment',
        items: [
          {
            kind: 'note',
            text: 'By initialing each item, the Client and/or Responsible Party acknowledges and agrees to the non-clinical boundaries of SouthernWell Case Management Services (SouthernWell of South Mississippi):',
          },
          {
            kind: 'initials',
            key: 's2_init_no_medical',
            text: 'No Skilled Nursing or Medical Care: SouthernWell Case Management Services performs no skilled nursing or medical care—we do NOT place pills in a client’s mouth, administer injections, apply medicated patches, perform wound care, or take vital signs for medical diagnosis.',
          },
          {
            kind: 'initials',
            key: 's2_init_logistical',
            text: 'Logistical Medication Support Only: Weekly pillbox organization and medication list reconciliation are performed strictly according to existing prescription bottle labels and After-Visit Summaries (AVS).',
          },
          {
            kind: 'initials',
            key: 's2_init_emergency',
            text: 'Emergency Protocol: In the event of an urgent health emergency, SouthernWell Case Management Services will immediately dial 911 and notify designated family emergency contacts.',
          },
        ],
      },
      {
        title: '3. Provider HIPAA & Family Communication Authorization',
        items: [
          {
            kind: 'note',
            text: 'I authorize the following healthcare providers, offices, and pharmacies to share relevant care records, medication lists, and After-Visit Summaries with SouthernWell Case Management Services:',
          },
          {
            kind: 'table',
            key: 's2_providers_table',
            headers: ['Provider / Pharmacy Role', 'Name / Office', 'Phone / Fax / Location'],
            rows: [
              'Primary Care Physician (PCP)',
              'Key Specialist #1',
              'Key Specialist #2',
              'Primary Pharmacy',
            ],
            fixedFirstCol: true,
          },
          {
            kind: 'note',
            text: 'Authorized Family Recipients (to receive 24-hour Post-Visit Briefings and Care Dossier updates):',
          },
          {
            kind: 'table',
            key: 's2_family_table',
            headers: ['Recipient Full Name', 'Relationship', 'Email Address', 'Cell Phone'],
            rows: ['1.', '2.'],
            fixedFirstCol: true,
          },
        ],
      },
      {
        title: '4. Onboarding Fee & Authorization Signature',
        items: [
          {
            kind: 'choices',
            key: 's2_fee_remitted',
            label: 'Foundation Walkthrough Fee Remitted',
            options: [
              '$225 Standard',
              '$180 Tier A (20% Sliding Scale)',
              '$145 Tier B (35% Sliding Scale)',
            ],
            single: true,
          },
          {
            kind: 'signature',
            key: 's2_signature',
            label: 'Client or Authorized POA Signature',
          },
          {
            kind: 'field',
            key: 's2_printed_name',
            label: 'Printed Name & Title (Self / POA)',
            inputType: 'text',
          },
          { kind: 'field', key: 's2_sign_date', label: 'Date', inputType: 'date' },
        ],
      },
    ],
  },
  {
    index: 2,
    shortLabel: 'Stage 3',
    heading: 'Stage 3 of 5 · Days 4–7 In-Home Visit',
    subtitle:
      '90-Minute In-Home Foundation Walkthrough Form — Non-Clinical Home Walkthrough, Care Dossier Intake & Bottle Inventory',
    sections: [
      {
        title: '1. Support Profile & Emergency Preferences',
        items: [
          { kind: 'field', key: 'client', label: 'Client Legal Name', inputType: 'text' },
          { kind: 'field', key: 's3_date', label: 'Walkthrough Date', inputType: 'date' },
          {
            kind: 'choices',
            key: 's3_hospital',
            label: 'Preferred Hospital System',
            options: [
              'Forrest General',
              'Merit Health Wesley',
              'Memorial Health',
              'Singing River',
              'Other',
            ],
            single: true,
          },
          { kind: 'field', key: 's3_hospital_other', label: 'If other, specify', inputType: 'text' },
          {
            kind: 'textarea',
            key: 's3_allergies',
            label: 'Known Allergies (Drug / Food / Environmental)',
          },
          {
            kind: 'choices',
            key: 's3_directives',
            label: 'Existing Advance Directives Located in Home',
            options: [
              'Healthcare Power of Attorney (POA)',
              'Living Will',
              'DNR / POLST',
              'None located (flag for Elder Law referral)',
            ],
          },
        ],
      },
      {
        title: '2. Non-Clinical Home Safety & Lifestyle Walkthrough',
        items: [
          {
            kind: 'choices',
            key: 's3_hazards',
            label: 'Environmental & Fall Hazards Observed',
            options: [
              'Loose throw rugs',
              'Dim hallways / stairs',
              'Cluttered walkways / cords',
              'Missing bathroom grab bars',
              'None noted',
            ],
          },
          {
            kind: 'choices',
            key: 's3_mobility',
            label: 'Mobility & Assistive Devices',
            options: [
              'Independent',
              'Cane',
              'Walker / Rollator',
              'Wheelchair',
              'Equipment check needed (tips/brakes)',
            ],
          },
          {
            kind: 'choices',
            key: 's3_pantry',
            label: 'Pantry & Refrigerator Status',
            options: ['Well-stocked & fresh', 'Needs grocery/meal support'],
            single: true,
          },
          {
            kind: 'textarea',
            key: 's3_hydration_notes',
            label: 'Hydration & Meal Routine Notes',
          },
          {
            kind: 'textarea',
            key: 's3_safety_recs',
            label: 'Home Safety Recommendations & Action Items',
          },
        ],
      },
      {
        title: '3. Kitchen-Table Medication Bottle Inventory',
        items: [
          {
            kind: 'choices',
            key: 's3_audit_prep',
            label: 'Inventory Preparation',
            options: [
              'All Rx bottles, OTC supplements, vitamins, eye drops & inhalers gathered',
              'Compared against most recent provider After-Visit Summary (AVS)',
              'Weekly pillbox organized strictly per bottle labels',
            ],
          },
          {
            kind: 'table',
            key: 's3_meds_table',
            headers: [
              'Medication / Supplement Name & Dose',
              'Bottle Directions',
              'Discrepancy Flagged (Duplicate / Expired / Low Refill)',
            ],
            rows: ['1.', '2.', '3.', '4.', '5.', '6.'],
            fixedFirstCol: true,
          },
          {
            kind: 'textarea',
            key: 's3_yellow_questions',
            label: 'Yellow-Flagged Questions for Prescribing Provider or Pharmacist Clarification',
          },
        ],
      },
    ],
  },
  {
    index: 3,
    shortLabel: 'Stage 4',
    heading: 'Stage 4 of 5 · Days 7–10 Back-Office Setup',
    subtitle:
      'Care Dossier Assembly & Provider Sync Checklist — internal quality-control verification completed prior to Active Stewardship launch',
    sections: [
      {
        title: 'Client & Coordinator',
        items: [
          { kind: 'field', key: 'client', label: 'Client Legal Name', inputType: 'text' },
          {
            kind: 'field',
            key: 's4_folder_id',
            label: 'Digital Folder ID (LASTNAME_Firstname_DOB-YYYY)',
            inputType: 'text',
          },
          {
            kind: 'fixed',
            label: 'Care Coordinator',
            value: 'Jasmeen Williams, LPN, BS-HHS',
          },
          { kind: 'field', key: 's4_launch_date', label: 'Target Launch Date', inputType: 'date' },
        ],
      },
      {
        title: '1. Physical Care Dossier Binder Assembly',
        items: [
          {
            kind: 'choices',
            key: 's4_binder_check',
            label: 'Checklist',
            options: [
              'Assembled Deep Oxford Navy linen binder embossed with the Brushed Brass SW monogram crest and 5 color-coded divider tabs (Tab 1: Emergency & Provider Contacts | Tab 2: Master Medication Log | Tab 3: Provider Visit Summaries (AVS) | Tab 4: Advance Directives & HIPAA Releases | Tab 5: Family Briefing & Self-Advocacy Notes)',
              'Printed 1-Page EMS Master Snapshot Sheet and inserted into front clear sleeve of binder',
              'Prepared duplicate laminated/sleeved 1-Page EMS Master Snapshot Sheet for client’s refrigerator door',
            ],
          },
        ],
      },
      {
        title: '2. Encrypted Digital Workspace Setup',
        items: [
          {
            kind: 'choices',
            key: 's4_digital_check',
            label: 'Checklist',
            options: [
              'Created HIPAA-compliant encrypted client directory using naming convention LASTNAME_Firstname_DOB-YYYY',
              'Uploaded signed Stage 2 Intake Agreement, Scope Waiver, POA documents, and Provider HIPAA Releases',
              'Uploaded baseline After-Visit Summaries (AVS) and dated Master Medication Bottle Log',
            ],
          },
        ],
      },
      {
        title: '3. Provider Sync, Pharmacy Coordination & Warm Referrals',
        items: [
          {
            kind: 'choices',
            key: 's4_provider_sync',
            label: 'Checklist',
            options: [
              'Faxed or hand-delivered executed HIPAA Authorization forms to Primary Care Provider and specialists',
              'Synced medication list and refill schedule with client’s primary pharmacy',
            ],
          },
          {
            kind: 'choices',
            key: 's4_warm_referrals',
            label: 'Warm Professional Referrals Initiated (if identified during Stage 3)',
            options: [
              'Licensed Social Worker (LCSW)',
              'Elder Law Attorney',
              'Licensed Home Health Agency',
              'None needed at launch',
            ],
          },
        ],
      },
      {
        title: '4. Family Onboarding & 30-Day Action Plan',
        items: [
          {
            kind: 'choices',
            key: 's4_onboarding_check',
            label: 'Checklist',
            options: [
              'Delivered personalized 30-Day Stewardship Action Plan to all authorized family recipients',
              'Confirmed recurring schedule for monthly self-advocacy check-ins and upcoming appointments',
            ],
          },
          {
            kind: 'signature',
            key: 's4_qc_signature',
            label: 'Quality-Control Sign-Off (Jasmeen Williams, LPN, BS-HHS)',
          },
          { kind: 'field', key: 's4_completed_date', label: 'Date Completed', inputType: 'date' },
        ],
      },
    ],
  },
  {
    index: 4,
    shortLabel: 'Stage 5',
    heading: 'Stage 5 of 5 · Day 11+ Ongoing Coordination',
    subtitle:
      'Active Stewardship Self-Advocacy Check-In & Appointment Accompaniment Log — complete within 24 hours of every scheduled check-in or provider visit',
    sections: [
      {
        title: 'Visit Details',
        items: [
          { kind: 'field', key: 'client', label: 'Client Legal Name', inputType: 'text' },
          {
            kind: 'field',
            key: 's5_visit_datetime',
            label: 'Visit Date & Time',
            inputType: 'datetime-local',
          },
          {
            kind: 'choices',
            key: 's5_service_plan',
            label: 'Active Service Plan',
            options: [
              'Essential ($275/mo)',
              'Comprehensive ($350/mo)',
              'À La Carte ($75)',
            ],
            single: true,
          },
          {
            kind: 'choices',
            key: 's5_visit_location',
            label: 'Visit Location',
            options: ['Client Home', 'Provider Office', 'Virtual'],
            single: true,
          },
        ],
      },
      {
        title: '1. Non-Clinical Self-Advocacy & Home Environment Check-In',
        items: [
          {
            kind: 'textarea',
            key: 's5_mood_cognition',
            label: 'Mood, Energy & Daily Engagement Notes',
          },
          {
            kind: 'textarea',
            key: 's5_nutrition_safety',
            label: 'Nutrition, Hydration & Home Safety Check',
          },
          {
            kind: 'choices',
            key: 's5_pillbox_check',
            label: 'Medication & Pillbox Logistical Check',
            options: [
              'Pillbox organized per bottle labels',
              'Refills synced with pharmacy',
              'N/A',
            ],
          },
        ],
      },
      {
        title: '2. Appointment Accompaniment & Care Navigation Summary (if applicable)',
        items: [
          {
            kind: 'field',
            key: 's5_provider_specialty',
            label: 'Provider & Specialty Seen',
            inputType: 'text',
          },
          {
            kind: 'field',
            key: 's5_next_appt',
            label: 'Next Scheduled Appointment (Date/Time)',
            inputType: 'datetime-local',
          },
          {
            kind: 'textarea',
            key: 's5_provider_takeaways',
            label: 'Key Provider Takeaways, Label Updates & Follow-Up Action Items',
          },
        ],
      },
      {
        title: '3. 24-Hour Post-Visit Family Briefing Confirmation',
        items: [
          {
            kind: 'choices',
            key: 's5_briefing_sent',
            label: 'Family Briefing Sent?',
            options: ['Yes', 'Pending'],
            single: true,
          },
          {
            kind: 'choices',
            key: 's5_delivery_method',
            label: 'Delivery Method',
            options: ['Encrypted Email', 'Family Portal'],
            single: true,
          },
          {
            kind: 'field',
            key: 's5_timestamp_sent',
            label: 'Timestamp Sent',
            inputType: 'datetime-local',
          },
        ],
      },
    ],
  },
];
