import { useState } from 'react';
import {
  BookOpen,
  FileDown,
  FileText,
  MapPin,
  ArrowRight,
  Building2,
  CheckCircle2,
  X,
  Printer,
  Utensils,
} from 'lucide-react';
import { DOSSIER_TABS } from '../data/southernWellData';
import { CrestLogo, RegionCard } from './BrandImage';

interface DossierAndGuidesSectionProps {
  onOpenFullDossier: () => void;
  onSelectDistrictConsultation: (district: 'hattiesburg' | 'gulfport') => void;
}

interface GuideResource {
  id: string;
  category: string;
  title: string;
  description: string;
  sections: { heading: string; bullets: string[] }[];
}

const GUIDE_RESOURCES: GuideResource[] = [
  {
    id: 'dossier-overview',
    category: 'Family Overview Guide',
    title: '5-Tab Care Dossier Family Overview Guide',
    description:
      'A comprehensive 5-section guide detailing how SouthernWell Case Management Services organizes provider contacts, medication bottles, visit summaries, and advance care records.',
    sections: [
      {
        heading: 'How the Deep Oxford Navy Linen Binder Works',
        bullets: [
          'Tab 1 — Emergency & Provider Contacts: Verified primary care, specialist, pharmacy, and POA phone tree.',
          'Tab 2 — Master Medication Log: Reconciled prescription & OTC supplement bottle inventory aligned with pharmacy refills.',
          'Tab 3 — Provider Visit Summaries (AVS): Chronological After-Visit Summaries and pre-visit question prep.',
          'Tab 4 — Advance Directives & HIPAA: Signed provider HIPAA releases, Healthcare POA, and hospital preferences.',
          'Tab 5 — Family Briefings & Wellness: Weekly self-advocacy check-in logs and 24-hour post-visit updates.',
        ],
      },
      {
        heading: 'Encrypted Digital Companion Archive',
        bullets: [
          'Mirrors the physical binder inside a HIPAA-aligned folder for out-of-state adult children.',
          'Updated within 24 hours after every accompanied appointment or medication label update.',
        ],
      },
    ],
  },
  {
    id: 'ems-specimen',
    category: 'Sample Specimen Sheet',
    title: 'Emergency Refrigerator Medication Log Specimen',
    description:
      'Single-page rapid-visibility snapshot sheet detailing current medication labels, allergies, preferred hospital, and POA contacts for EMS responders.',
    sections: [
      {
        heading: 'Included Rapid-Reference Blocks',
        bullets: [
          'Client Name, Date of Birth & Known Medication/Food Allergies',
          'Preferred Regional Hospital (Forrest General, Merit Health Wesley, Memorial, or Singing River)',
          'Primary Family Contact / Healthcare Power of Attorney phone numbers',
          'Current Daily Medication Schedule & Advance Directive location inside the home',
        ],
      },
      {
        heading: 'Placement Standard',
        bullets: [
          'Laminated or sleeved copy placed visibly on the kitchen refrigerator door.',
          'Matching copy inserted inside the front clear sleeve of the Master Care Dossier.',
        ],
      },
    ],
  },
  {
    id: 'service-brochure',
    category: 'Service Brochure',
    title: 'SouthernWell Case Management Services Guide',
    description:
      'Full service overview for families, discharge planners, and social workers covering onboarding stages, private-pay tiers, and strictly non-clinical scope.',
    sections: [
      {
        heading: 'Care Navigation Tiers',
        bullets: [
          'Foundation Walkthrough & Care Dossier: $225 one-time flat fee (90-minute in-home walkthrough & binder setup).',
          'Essential Stewardship: $275/mo (bi-weekly self-advocacy check-ins, monthly pillbox audit & family summary).',
          'Comprehensive Care Navigation: $350/mo (weekly check-ins, pharmacy sync & appointment accompaniment).',
          'À La Carte Appointment Advocacy: $75/visit (up to 2 hours; $35/hr thereafter).',
        ],
      },
      {
        heading: 'Community Sliding Scale & Contact',
        bullets: [
          'Tier A (20% off) and Tier B (35% off) spots reserved for income-qualified older adults.',
          'Direct Service Line: 601-554-6067 · jasmeenwilliams@southernwellofsouthms.com',
        ],
      },
    ],
  },
];

export function DossierAndGuidesSection({
  onOpenFullDossier,
  onSelectDistrictConsultation,
}: DossierAndGuidesSectionProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [previewGuide, setPreviewGuide] = useState<GuideResource | null>(null);

  const selectedTab =
    DOSSIER_TABS.find((t) => t.number === activeTab) ?? DOSSIER_TABS[0];

  const handleDownloadGuide = (guide: GuideResource) => {
    const content = [
      `SOUTHERNWELL CASE MANAGEMENT SERVICES — ${guide.title.toUpperCase()}`,
      `SouthernWell of South Mississippi | Founded by Jasmeen Williams, LPN, BS-HHS | 601-554-6067`,
      `Hattiesburg / Pine Belt & Gulfport / Mississippi Gulf Coast`,
      '',
      guide.description,
      '',
      ...guide.sections.flatMap((sec) => [
        sec.heading.toUpperCase(),
        ...sec.bullets.map((b) => `• ${b}`),
        '',
      ]),
      'Non-Clinical Care Navigation & Family Advocacy · No skilled nursing or medical care is performed.',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* =================================================================== */}
      {/* THE SIGNATURE 5-TAB CARE DOSSIER                                    */}
      {/* =================================================================== */}
      <section
        id="care-dossier-overview"
        className="py-16 md:py-24 bg-canvas-muted/50 border-b border-card-border"
      >
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: 5-Tab Narrative Index */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-semibold tracking-widest text-brass-deep uppercase block mb-2">
                  Organized Clarity At Home
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight text-balance">
                  The Signature 5-Tab Care Dossier
                </h2>
                <p className="text-base text-obsidian/80 mt-3 leading-relaxed">
                  Placed prominently on the home counter or kitchen console, this custom Deep Oxford Navy linen binder embossed with the Brushed Brass SW monogram crest holds Warm Alabaster cardstock inserts and serves as the single organized reference for family members, EMS responders, and visiting providers.
                </p>
              </div>

              <div className="space-y-3">
                {DOSSIER_TABS.map((tab) => {
                  const isActive = tab.number === activeTab;
                  return (
                    <button
                      key={tab.number}
                      type="button"
                      onClick={() => setActiveTab(tab.number)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                        isActive
                          ? 'bg-white border-oxford shadow-xs'
                          : 'bg-white/75 border-card-border hover:bg-white hover:border-brass'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums ${
                          isActive
                            ? 'bg-oxford text-brass-light'
                            : 'bg-navy-soft text-oxford'
                        }`}
                      >
                        {tab.number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-heading text-xl font-bold text-obsidian leading-snug">
                          {tab.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-obsidian/75 mt-0.5 leading-relaxed">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Interactive Binder Preview Card */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-card-border shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-card-border mb-5">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-5 h-5 text-oxford" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-obsidian">
                      Physical + Encrypted Archive
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFullDossier}
                    className="text-xs font-semibold text-oxford hover:text-oxford-dark underline cursor-pointer"
                  >
                    Full Interactive View →
                  </button>
                </div>

                {/* Deep Oxford Navy Binder Showcase */}
                <div className="bg-oxford rounded-xl p-5 sm:p-6 text-canvas border border-brass/50">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-white/15">
                    <div className="w-12 h-12 shrink-0">
                      <CrestLogo />
                    </div>
                    <div>
                      <span className="font-heading text-2xl font-bold tracking-wide text-white block leading-none">
                        SouthernWell Care Dossier
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-brass-light font-semibold block mt-1">
                        Tab {selectedTab.number} · {selectedTab.title}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Tab Buttons inside Binder */}
                  <div className="grid grid-cols-5 gap-1.5 my-4">
                    {DOSSIER_TABS.map((tab) => {
                      const active = tab.number === activeTab;
                      return (
                        <button
                          key={tab.number}
                          type="button"
                          onClick={() => setActiveTab(tab.number)}
                          className={`py-2 px-1 rounded text-[11px] font-semibold text-center transition-colors cursor-pointer tabular-nums ${
                            active
                              ? 'bg-canvas text-oxford-dark font-bold'
                              : 'bg-white/10 text-canvas/90 hover:bg-white/20'
                          }`}
                        >
                          Tab {tab.number}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sample Records Table */}
                  <div className="bg-oxford-dark/80 rounded-lg p-4 border border-white/15 space-y-2.5">
                    {selectedTab.sampleRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 last:pb-0 border-b last:border-b-0 border-white/15 text-xs"
                      >
                        <span className="text-canvas/75 font-medium">{row.label}</span>
                        <span className="font-semibold text-white sm:text-right">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Refrigerator EMS Note */}
                <div className="mt-5 p-4 rounded-xl bg-canvas border border-card-border flex items-start gap-3">
                  <Utensils className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                  <div className="text-xs text-obsidian/80 leading-relaxed">
                    <strong className="text-obsidian block">
                      Plus: Laminated Refrigerator EMS Snapshot
                    </strong>
                    Immediate visibility for first responders during emergencies—summarizing allergies, preferred hospital, and POA contacts on Warm Alabaster cardstock.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* DOWNLOADABLE CARE DOSSIER GUIDES & SPECIMENS                    */}
          {/* =============================================================== */}
          <div className="mt-16 pt-14 border-t border-card-border">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <span className="text-xs font-semibold tracking-widest text-brass-deep uppercase block mb-1.5">
                  Preparedness Resources
                </span>
                <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-obsidian">
                  Downloadable Care Dossier Guides &amp; Specimens
                </h3>
                <p className="text-sm text-obsidian/75 mt-1 max-w-2xl">
                  Complimentary Warm Alabaster single-sheet resources designed to help families prepare for provider visits, medication label reviews, and emergency preparedness.
                </p>
              </div>
              <span className="text-xs font-semibold text-oxford whitespace-nowrap">
                Included with Onboarding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {GUIDE_RESOURCES.map((guide) => (
                <div
                  key={guide.id}
                  className="bg-white rounded-xl p-6 border border-card-border flex flex-col justify-between gap-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-slate">
                        {guide.category}
                      </span>
                    </div>
                    <h4 className="font-heading text-xl font-bold text-obsidian leading-snug mb-2">
                      {guide.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-obsidian/75 leading-relaxed">
                      {guide.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-card-border">
                    <button
                      type="button"
                      onClick={() => handleDownloadGuide(guide)}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FileDown className="w-3.5 h-3.5 text-brass-light" />
                      <span>Download Guide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewGuide(guide)}
                      className="py-2.5 px-3 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-obsidian text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* DUAL-DISTRICT COVERAGE IN SOUTH MISSISSIPPI                         */}
      {/* =================================================================== */}
      <section
        id="coverage"
        className="py-16 md:py-24 bg-canvas border-b border-card-border"
      >
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold tracking-widest text-brass-deep uppercase block mb-2">
                Dedicated Regional Footprint
              </span>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight">
                Dual-District Coverage in South Mississippi
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-oxford">
              Standard 25-mile radius included from both corridors
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pine Belt District */}
            <div className="bg-white rounded-2xl p-7 border border-card-border flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-navy-slate block">
                        District 01 · Inland Hub
                      </span>
                      <h3 className="font-heading text-2xl sm:text-3xl font-bold text-obsidian">
                        Pine Belt District
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-oxford whitespace-nowrap tabular-nums">
                    25-mi Radius
                  </span>
                </div>

                <p className="text-sm sm:text-base text-obsidian/80 leading-relaxed">
                  Serving Forrest, Lamar, and Jones counties with regular in-person home visits, appointment accompaniment at Forrest General and Merit Health Wesley, and thorough post-visit logistics.
                </p>

                <div className="text-xs font-semibold text-obsidian/85 flex flex-wrap gap-x-2 gap-y-1">
                  <span>Hattiesburg</span>
                  <span aria-hidden="true">·</span>
                  <span>Laurel</span>
                  <span aria-hidden="true">·</span>
                  <span>Petal</span>
                  <span aria-hidden="true">·</span>
                  <span>Oak Grove</span>
                  <span aria-hidden="true">·</span>
                  <span>Purvis</span>
                </div>

                <div className="p-4 rounded-xl bg-canvas border border-card-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-obsidian">
                    <Building2 className="w-4 h-4 text-oxford" />
                    <span>Primary Provider &amp; Pharmacy Coordination</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-obsidian/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brass-deep shrink-0" />
                      <span>Forrest General Hospital &amp; Hattiesburg Specialists</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brass-deep shrink-0" />
                      <span>Merit Health Wesley &amp; South Central Regional (Laurel)</span>
                    </li>
                  </ul>
                </div>

                <RegionCard
                  corridor="Inland Corridor · 601-554-6067"
                  label="Pine Belt Service Region"
                  highlights="Hattiesburg · Laurel · Petal · Oak Grove · Purvis"
                />
              </div>

              <button
                type="button"
                onClick={() => onSelectDistrictConsultation('hattiesburg')}
                className="w-full sm:w-fit px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Inquire Pine Belt Availability</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-light" />
              </button>
            </div>

            {/* Mississippi Gulf Coast */}
            <div className="bg-white rounded-2xl p-7 border border-card-border flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-navy-slate block">
                        District 02 · Coastal Hub
                      </span>
                      <h3 className="font-heading text-2xl sm:text-3xl font-bold text-obsidian">
                        Mississippi Gulf Coast
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-oxford whitespace-nowrap tabular-nums">
                    25-mi Radius
                  </span>
                </div>

                <p className="text-sm sm:text-base text-obsidian/80 leading-relaxed">
                  Serving families across Harrison and Jackson counties, coordinating closely with Memorial Hospital Gulfport, Singing River Health System, and local specialty centers.
                </p>

                <div className="text-xs font-semibold text-obsidian/85 flex flex-wrap gap-x-2 gap-y-1">
                  <span>Gulfport</span>
                  <span aria-hidden="true">·</span>
                  <span>Biloxi</span>
                  <span aria-hidden="true">·</span>
                  <span>Ocean Springs</span>
                  <span aria-hidden="true">·</span>
                  <span>Long Beach</span>
                  <span aria-hidden="true">·</span>
                  <span>Pass Christian</span>
                  <span aria-hidden="true">·</span>
                  <span>Pascagoula</span>
                </div>

                <div className="p-4 rounded-xl bg-canvas border border-card-border space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-obsidian">
                    <Building2 className="w-4 h-4 text-oxford" />
                    <span>Primary Provider &amp; Pharmacy Coordination</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-obsidian/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brass-deep shrink-0" />
                      <span>Memorial Hospital Gulfport &amp; Biloxi Specialty Centers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brass-deep shrink-0" />
                      <span>Singing River Health System (Ocean Springs &amp; Pascagoula)</span>
                    </li>
                  </ul>
                </div>

                <RegionCard
                  corridor="Coastal Corridor · 601-554-6067"
                  label="Gulf Coast Service Region"
                  highlights="Gulfport · Biloxi · Ocean Springs · Long Beach · Pascagoula"
                />
              </div>

              <button
                type="button"
                onClick={() => onSelectDistrictConsultation('gulfport')}
                className="w-full sm:w-fit px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Inquire Gulf Coast Availability</span>
                <ArrowRight className="w-3.5 h-3.5 text-brass-light" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* GUIDE SPECIMEN PREVIEW MODAL                                        */}
      {/* =================================================================== */}
      {previewGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
          className="fixed inset-0 z-50 bg-oxford-dark/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-card-border shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-oxford text-canvas px-6 py-4 flex items-center justify-between gap-4 border-b border-brass/40">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-brass-light font-semibold block">
                  {previewGuide.category}
                </span>
                <h4
                  id="guide-modal-title"
                  className="font-heading text-xl sm:text-2xl font-bold text-white"
                >
                  {previewGuide.title}
                </h4>
              </div>
              <button
                type="button"
                aria-label="Close guide preview"
                onClick={() => setPreviewGuide(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <p className="text-sm text-obsidian/80 leading-relaxed">
                {previewGuide.description}
              </p>
              {previewGuide.sections.map((sec) => (
                <div
                  key={sec.heading}
                  className="p-4 rounded-xl bg-canvas border border-card-border space-y-2"
                >
                  <h5 className="font-heading text-lg font-bold text-obsidian">
                    {sec.heading}
                  </h5>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-obsidian/80">
                    {sec.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-oxford shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 bg-canvas border-t border-card-border flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg border border-card-border bg-white hover:bg-canvas-muted text-xs font-semibold text-obsidian inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-oxford" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadGuide(previewGuide)}
                className="px-4 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-brass-light" />
                <span>Download Resource</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
