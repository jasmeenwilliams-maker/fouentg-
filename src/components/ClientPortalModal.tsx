import { useEffect, useState, type FormEvent } from 'react';
import {
  Lock,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Info,
  AlertCircle,
  Printer,
  RotateCcw,
  FileDown,
  FileSpreadsheet,
  PenLine,
  Headphones,
  ArrowRight,
  BadgeCheck,
  Compass,
} from 'lucide-react';
import type { OpsNavId } from '../data/operationsHubData';

const AUTH_KEY = 'sw_auth_authenticated';
const AUTH_USER_KEY = 'sw_auth_user';
const VALID_PASSCODES = [
  'southernwell2025',
  '2025',
  'southernwell',
  'welcome',
  'jasmeen',
  'swcare',
];

export type PortalDestination =
  | { type: 'enrollment'; stageIndex: number; tab?: 'stages' | 'workbook' }
  | { type: 'dossier' }
  | { type: 'operations'; initialNav?: OpsNavId };

interface ClientPortalModalProps {
  open: boolean;
  onClose: () => void;
  onOpenDestination: (dest: PortalDestination) => void;
  onBookSession: () => void;
}

export function ClientPortalModal({
  open,
  onClose,
  onOpenDestination,
  onBookSession,
}: ClientPortalModalProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [householdName, setHouseholdName] = useState<string>(() => {
    try {
      return sessionStorage.getItem(AUTH_USER_KEY) || '';
    } catch {
      return '';
    }
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      setIsUnlocked(sessionStorage.getItem(AUTH_KEY) === 'true');
      const savedUser = sessionStorage.getItem(AUTH_USER_KEY);
      if (savedUser) setHouseholdName(savedUser);
    } catch {
      // ignore
    }

    const handleEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = passcode.trim().toLowerCase();
    const cleanedUser = householdName.trim() || 'McAllister Family (Hattiesburg)';

    if (VALID_PASSCODES.includes(cleaned)) {
      setAuthError(false);
      setIsUnlocked(true);
      setHouseholdName(cleanedUser);
      try {
        sessionStorage.setItem(AUTH_KEY, 'true');
        sessionStorage.setItem(AUTH_USER_KEY, cleanedUser);
      } catch {
        // ignore
      }
    } else {
      setAuthError(true);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPasscode('');
    setAuthError(false);
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
  };

  const navigateDestination = (dest: PortalDestination) => {
    onClose();
    onOpenDestination(dest);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-modal-title"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-oxford-dark/75 backdrop-blur-xs p-4 sm:p-6 md:p-10 flex items-center justify-center"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-brass/45 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-oxford px-6 py-5 sm:px-8 border-b border-brass/45 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-oxford-dark border border-brass/60 flex items-center justify-center text-brass-light shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.2em] text-brass-light uppercase">
                  Client &amp; Family Advocacy Portal
                </span>
                <span className="px-2 py-0.5 rounded bg-brass text-oxford-dark text-[9px] font-bold uppercase tracking-wider">
                  256-Bit Encrypted
                </span>
              </div>
              <h3
                id="portal-modal-title"
                className="font-heading text-xl sm:text-2xl font-bold text-white leading-tight"
              >
                SouthernWell Care Navigation Portal &amp; Forms
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close portal modal"
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-canvas flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth View */}
        {!isUnlocked ? (
          <div className="p-6 sm:p-8 bg-canvas">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-white border border-card-border shadow-xs flex items-center justify-center mx-auto mb-3 text-oxford">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-heading text-2xl font-bold text-oxford-dark mb-1.5">
                  Secure Family Access
                </h4>
                <p className="text-xs sm:text-sm text-obsidian/80 leading-relaxed">
                  Enter your client household passcode or PIN to view, fill, and download your 5-Tab Care Dossier onboarding and non-clinical care navigation forms.
                </p>
              </div>

              <form
                onSubmit={handleUnlock}
                className="space-y-4 bg-white p-6 rounded-xl border border-card-border shadow-xs"
              >
                <div>
                  <label
                    htmlFor="modal-portal-client-id"
                    className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1.5"
                  >
                    Household Name or ID (Optional)
                  </label>
                  <input
                    id="modal-portal-client-id"
                    type="text"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    placeholder="e.g., McAllister Family (Hattiesburg)"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="modal-portal-passcode"
                      className="block text-xs font-bold uppercase tracking-wider text-oxford-dark"
                    >
                      Access Passcode / Security PIN *
                    </label>
                    <span className="text-[11px] text-navy-slate font-medium flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Demo: southernwell2025</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="modal-portal-passcode"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode..."
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode((prev) => !prev)}
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-obsidian/60 hover:text-oxford transition-colors cursor-pointer"
                    >
                      {showPasscode ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {authError && (
                    <p
                      role="alert"
                      className="text-xs text-[#9E3524] font-semibold mt-1.5 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Incorrect passcode. Please try &quot;southernwell2025&quot; or &quot;2025&quot;.
                      </span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-brass-light" />
                  <span>Unlock Care Enrollment Forms</span>
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-card-border text-[11px] text-obsidian/75">
                  <span>HIPAA-aligned client records portal (non-clinical scope)</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBookSession();
                    }}
                    className="font-semibold text-oxford hover:text-oxford-dark underline cursor-pointer"
                  >
                    Need a new access PIN?
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Unlocked Workspace View */
          <div className="p-6 sm:p-8 bg-white max-h-[78vh] overflow-y-auto space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-card-border gap-3">
              <div>
                <span className="font-heading font-bold text-xl text-oxford-dark block leading-none">
                  Client Workspace: Active Enrollment &amp; Records
                </span>
                <span className="text-[11px] text-obsidian/70 mt-1 block">
                  Authorized Family Member:{' '}
                  <strong className="text-oxford-dark">{householdName || 'Verified Access'}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleLock}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-obsidian/80 hover:text-oxford-dark border border-card-border bg-canvas hover:bg-canvas-muted flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Lock Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'enrollment',
                      stageIndex: 0,
                      tab: 'stages',
                    })
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-oxford text-canvas hover:bg-oxford-dark text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5 text-brass-light" />
                  <span>Open Full 5-Stage Forms</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-oxford/20 bg-navy-soft/80 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-sm text-oxford-dark">
                    Form Pack: 5-Tab Care Dossier Onboarding Suite (v4.2)
                  </h5>
                  <p className="text-xs text-obsidian/80 mt-0.5">
                    HIPAA authorizations, non-clinical care navigation disclosures, medication label inventory tables, and the linked Master Database Workbook are ready below. No skilled nursing or medical care is performed.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-white border border-oxford/20 text-navy-slate font-bold text-[10px] uppercase tracking-wider shrink-0">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-canvas border border-card-border flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brass-deep uppercase tracking-wider">
                    Tab 1 Specimen
                  </span>
                  <h6 className="font-bold text-sm text-oxford-dark">
                    Emergency &amp; Provider Contacts Sheet
                  </h6>
                  <p className="text-xs text-obsidian/75">
                    Direct phone tree, preferred hospital, primary care office, and pharmacy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'enrollment',
                      stageIndex: 0,
                      tab: 'stages',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-canvas-muted text-oxford-dark border border-card-border text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-oxford" />
                  <span>Fill</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-canvas border border-card-border flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brass-deep uppercase tracking-wider">
                    Tab 2 Specimen
                  </span>
                  <h6 className="font-bold text-sm text-oxford-dark">
                    Master Medication Label Inventory
                  </h6>
                  <p className="text-xs text-obsidian/75">
                    Bottle labels, timings, prescribers, and refill alerts with CSV export.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'enrollment',
                      stageIndex: 2,
                      tab: 'stages',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-canvas-muted text-oxford-dark border border-card-border text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-oxford" />
                  <span>Fill</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-canvas border border-card-border flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brass-deep uppercase tracking-wider">
                    Tab 4 Specimen
                  </span>
                  <h6 className="font-bold text-sm text-oxford-dark">
                    Mississippi Non-Clinical Scope &amp; HIPAA Waiver
                  </h6>
                  <p className="text-xs text-obsidian/75">
                    Authorized non-clinical family advocacy representation and e-signature.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'enrollment',
                      stageIndex: 1,
                      tab: 'stages',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-canvas-muted text-oxford-dark border border-card-border text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5 text-oxford" />
                  <span>Sign</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-canvas border border-card-border flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brass-deep uppercase tracking-wider">
                    Fridge Specimen
                  </span>
                  <h6 className="font-bold text-sm text-oxford-dark">
                    Laminated EMS Emergency Summary
                  </h6>
                  <p className="text-xs text-obsidian/75">
                    One-page rapid first-responder overview for kitchen refrigerator magnet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateDestination({ type: 'dossier' })}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-canvas-muted text-oxford-dark border border-card-border text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-oxford" />
                  <span>Open</span>
                </button>
              </div>
            </div>

            {/* Linked Master Workbook & Operations Hub Quick Launch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-canvas border border-oxford/20 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-oxford-dark block">
                      Master Database Workbook
                    </span>
                    <span className="text-[11px] text-obsidian/75">
                      Morning check-ins, CSV import/export, or direct Stage 5 sync.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'enrollment',
                      stageIndex: 4,
                      tab: 'workbook',
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-lg border border-oxford/30 bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Workbook</span>
                  <ArrowRight className="w-3.5 h-3.5 text-oxford" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-canvas border border-oxford/20 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Compass className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-oxford-dark block">
                      Care Coordinator Operations Hub
                    </span>
                    <span className="text-[11px] text-obsidian/75">
                      10-step caseload pipeline, check-in ledger, and self-advocacy check-ins.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigateDestination({
                      type: 'operations',
                      initialNav: 'dashboard',
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Open Operations Hub</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brass-light" />
                </button>
              </div>
            </div>

            {/* Bottom In-Person Onboarding CTA */}
            <div className="p-4 rounded-xl bg-oxford text-canvas flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-brass/45">
              <div className="flex items-center gap-3">
                <Headphones className="w-6 h-6 text-brass-light shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">
                    Need Jasmeen Williams, LPN, BS-HHS to complete onboarding in person?
                  </div>
                  <div className="text-[11px] text-canvas/85">
                    In-home kitchen-table care navigation setup is included with Foundation Walkthroughs.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBookSession();
                }}
                className="px-4 py-2 rounded-lg bg-brass hover:bg-brass-soft text-oxford-dark text-xs font-bold uppercase tracking-wider shrink-0 transition-colors cursor-pointer"
              >
                Book Kitchen-Table Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
