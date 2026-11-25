import { useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  Phone,
  Pill,
  FileText,
  FileCheck2,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';
import { DOSSIER_TABS } from '../data/southernWellData';
import { CrestLogo } from './BrandImage';
import { MasterWorkbookPanel } from './MasterWorkbookPanel';
import { SheetsSyncControl } from './SheetsSyncControl';

interface CareDossierScreenProps {
  onBookConsultation: () => void;
  onBackToOverview: () => void;
}

const TAB_ICONS = [Phone, Pill, FileText, FileCheck2, ClipboardList];

export function CareDossierScreen({
  onBookConsultation,
  onBackToOverview,
}: CareDossierScreenProps) {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [clientName, setClientName] = useState('Eleanor Vance (Sample)');
  const [allergies, setAllergies] = useState('Penicillin (Hives) · Sulfa');
  const [preferredHospital, setPreferredHospital] = useState(
    'Forrest General Hospital — Hattiesburg'
  );
  const [emergencyContact, setEmergencyContact] = useState(
    'Margaret Vance (Daughter) · 601-555-0142'
  );
  const [copiedEms, setCopiedEms] = useState(false);

  const selectedTabData =
    DOSSIER_TABS.find((t) => t.number === activeTab) ?? DOSSIER_TABS[0];

  const handleCopyEms = async () => {
    const text = [
      'SOUTHERNWELL CASE MANAGEMENT SERVICES — REFRIGERATOR EMS SNAPSHOT',
      `Client: ${clientName}`,
      `Known Allergies: ${allergies}`,
      `Preferred Hospital: ${preferredHospital}`,
      `Emergency Contact (POA): ${emergencyContact}`,
      'Care Navigator: Jasmeen Williams, LPN, BS-HHS · 601-554-6067',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEms(true);
      window.setTimeout(() => setCopiedEms(false), 2400);
    } catch {
      setCopiedEms(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-canvas min-h-[calc(100vh-5rem)]">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-card-border">
          <div className="max-w-2xl">
            <button
              type="button"
              onClick={onBackToOverview}
              className="text-xs font-semibold uppercase tracking-wider text-oxford hover:text-oxford-dark transition-colors mb-3 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>← Back to Service Overview</span>
            </button>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-obsidian leading-tight">
              Inside the Master Care Dossier
            </h1>
            <p className="text-base text-obsidian/80 mt-3 leading-relaxed">
              Every onboarding begins with a Deep Oxford Navy linen binder embossed with the Brushed Brass SW monogram crest, Warm Alabaster cardstock inserts, and an encrypted digital archive. Explore the five structured divider tabs and preview the laminated Refrigerator EMS Snapshot.
            </p>
          </div>
          <button
            type="button"
            onClick={onBookConsultation}
            className="inline-flex items-center justify-center px-6 py-3 rounded bg-oxford hover:bg-oxford-dark text-canvas text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer gap-2"
          >
            <span>Start Your Family Dossier ($225)</span>
            <ArrowRight className="w-4 h-4 text-brass-light" />
          </button>
        </div>

        {/* Interactive Binder Workspace */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Deep Oxford Navy Binder Cover & 5 Tab Selector */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-oxford text-canvas rounded-2xl p-6 border border-brass/50 shadow-lg">
              <div className="flex items-center gap-3 pb-4 border-b border-white/15">
                <div className="w-12 h-12 shrink-0">
                  <CrestLogo />
                </div>
                <div>
                  <span className="font-heading text-xl font-bold tracking-wide text-white block leading-none">
                    SOUTHERNWELL
                  </span>
                  <span className="text-[11px] tracking-[0.2em] uppercase text-brass-light font-semibold block mt-1">
                    Master Care Dossier
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-canvas/75 block mb-2">
                  5 Structured Divider Tabs
                </span>
                {DOSSIER_TABS.map((tab, idx) => {
                  const Icon = TAB_ICONS[idx] ?? BookOpen;
                  const isActive = tab.number === activeTab;
                  return (
                    <button
                      key={tab.number}
                      type="button"
                      onClick={() => setActiveTab(tab.number)}
                      className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-canvas text-oxford-dark font-bold shadow-sm'
                          : 'bg-white/10 hover:bg-white/15 text-canvas'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 tabular-nums ${
                          isActive
                            ? 'bg-oxford text-brass-light'
                            : 'bg-white/15 text-brass-light'
                        }`}
                      >
                        {tab.number}
                      </span>
                      <span className="text-xs sm:text-sm truncate flex-1">
                        {tab.title}
                      </span>
                      <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Confidentiality & Sync Note */}
            <div className="p-5 rounded-xl bg-white border border-card-border space-y-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                <div className="text-xs text-obsidian/80 leading-relaxed">
                  <strong className="text-obsidian block mb-1">
                    Physical Binder + Encrypted Archive
                  </strong>
                  Updated after every accompanied appointment so local caregivers, EMTs, and out-of-state adult children read from the exact same page. No skilled nursing or medical care is performed.
                </div>
              </div>
              <div className="pt-2 border-t border-card-border">
                <SheetsSyncControl compact />
              </div>
            </div>
          </div>

          {/* Right: Active Tab Content + Refrigerator EMS Snapshot Customizer */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-card-border shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-card-border">
                <div>
                  <div className="flex items-center gap-2 text-xs text-brass-deep font-semibold uppercase tracking-wider">
                    <span>Divider Tab 0{selectedTabData.number}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedTabData.colorTag} Section</span>
                  </div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-obsidian mt-1">
                    {selectedTabData.title}
                  </h2>
                </div>
                <span className="text-xs font-medium text-oxford">
                  Illustrative Family Template
                </span>
              </div>

              <p className="text-sm sm:text-base text-obsidian/80 mt-4 leading-relaxed">
                {selectedTabData.description}
              </p>

              <div className="mt-6 divide-y divide-card-border border border-card-border rounded-xl overflow-hidden">
                {selectedTabData.sampleRows.map((row) => (
                  <div
                    key={row.label}
                    className="p-4 sm:px-5 bg-canvas/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-obsidian/65 block">
                        {row.label}
                      </span>
                      <span className="text-sm sm:text-base font-semibold text-obsidian">
                        {row.value}
                      </span>
                    </div>
                    <span className="text-xs text-oxford font-medium sm:text-right">
                      {row.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {activeTab === 5 && <MasterWorkbookPanel compact />}

            {/* Interactive Laminated 1-Page Refrigerator EMS Snapshot */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-card-border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-card-border">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brass-deep block">
                    Included In Every Foundation Walkthrough
                  </span>
                  <h3 className="font-heading text-2xl font-bold text-obsidian mt-0.5">
                    Laminated 1-Page Refrigerator EMS Snapshot
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEms}
                    className="px-3.5 py-2 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-obsidian inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copiedEms ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-oxford" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-oxford" />
                        <span>Copy Snapshot</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 text-brass-light" />
                    <span>Print Page</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3.5">
                  <p className="text-xs text-obsidian/75">
                    Test customizing the refrigerator card preview below for your loved one:
                  </p>
                  <div>
                    <label
                      htmlFor="ems-client-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1"
                    >
                      Client Name
                    </label>
                    <input
                      id="ems-client-name"
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ems-allergies"
                      className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1"
                    >
                      Medication Allergies
                    </label>
                    <input
                      id="ems-allergies"
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ems-hospital"
                      className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1"
                    >
                      Preferred Hospital
                    </label>
                    <input
                      id="ems-hospital"
                      type="text"
                      value={preferredHospital}
                      onChange={(e) => setPreferredHospital(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ems-contact"
                      className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1"
                    >
                      Emergency Contact / POA
                    </label>
                    <input
                      id="ems-contact"
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford"
                    />
                  </div>
                </div>

                {/* Live Laminated Card Preview */}
                <div className="bg-canvas rounded-xl p-5 border-2 border-oxford/25 space-y-3">
                  <div className="flex items-center justify-between border-b border-brass/35 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-deep block">
                        EMS Rapid Reference
                      </span>
                      <span className="font-heading text-xl font-bold text-obsidian">
                        {clientName || 'Client Name'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-navy-slate">
                      Dossier Tab 1–4
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-obsidian/65 uppercase font-semibold block text-[10px]">
                        Known Allergies
                      </span>
                      <span className="font-semibold text-obsidian">
                        {allergies || 'None reported'}
                      </span>
                    </div>
                    <div>
                      <span className="text-obsidian/65 uppercase font-semibold block text-[10px]">
                        Preferred Regional Hospital
                      </span>
                      <span className="font-semibold text-obsidian">
                        {preferredHospital || 'Nearest Emergency Dept'}
                      </span>
                    </div>
                    <div>
                      <span className="text-obsidian/65 uppercase font-semibold block text-[10px]">
                        Primary Family Contact (POA)
                      </span>
                      <span className="font-semibold text-obsidian">
                        {emergencyContact || 'Family Contact'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-brass/35 flex items-center justify-between text-[11px] text-obsidian/75">
                      <span>Navigator: Jasmeen Williams, LPN, BS-HHS</span>
                      <span className="font-bold text-oxford tabular-nums">601-554-6067</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
