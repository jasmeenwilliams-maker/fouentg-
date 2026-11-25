import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  FileText,
  Gift,
  Home,
  Library,
  Lock,
  Pill,
  Plus,
  Rocket,
  RotateCcw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import {
  createSeedOpsData,
  HUB_PRESETS,
  LAUNCH_CHECKLIST_ITEMS,
  offsetDay,
  OPS_COUNTIES,
  OPS_COUNTY_COLORS,
  OPS_NAV_ITEMS,
  OPS_PACKAGES,
  OPS_PORCH_TIERS,
  OPS_STEP_FORMS,
  OPS_STEPS,
  OPS_STORAGE_KEY,
  SOP_ITEMS,
  WORKFLOW_GUIDE_SECTIONS,
  type AlertPreset,
  type OpsAction,
  type OpsCheckin,
  type OpsClient,
  type OpsDataState,
  type OpsMed,
  type OpsNavId,
  type OpsNavItem,
  type OpsPayment,
  type OpsReferral,
} from '../data/operationsHubData';
import { CrestLogo } from './BrandImage';
import { HUB_AUTH_KEY, OpsPinLock } from './OpsPinLock';
import { OpsFormsModule } from './OpsFormsModule';
import { OpsScreeningSuite } from './OpsScreeningSuite';
import { MasterWorkbookPanel } from './MasterWorkbookPanel';
import { SheetsSyncControl } from './SheetsSyncControl';
import {
  fetchSourceWorkbook,
  OPS_SYNC_EVENT,
  syncWorkbookEverywhere,
} from '../utils/workbookSync';
import { syncRecordToSheet, type SheetSyncTab } from '../utils/sheetsSync';

interface OperationsHubScreenProps {
  onBackToOverview: () => void;
  onOpenEnrollmentForms: (stageIndex?: number, tab?: 'stages' | 'workbook') => void;
  initialNav?: OpsNavId;
}

function loadOpsState(): OpsDataState {
  const seed = createSeedOpsData();
  try {
    const raw = localStorage.getItem(OPS_STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<OpsDataState>;
    return {
      preset: parsed.preset || seed.preset,
      clients: Array.isArray(parsed.clients) ? parsed.clients : seed.clients,
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : seed.checkins,
      actions: Array.isArray(parsed.actions) ? parsed.actions : seed.actions,
      referrals: Array.isArray(parsed.referrals) ? parsed.referrals : seed.referrals,
      payments: Array.isArray(parsed.payments) ? parsed.payments : seed.payments,
      meds: Array.isArray(parsed.meds) ? parsed.meds : seed.meds,
      mmasResponses: parsed.mmasResponses || seed.mmasResponses,
      bhlsResponses: parsed.bhlsResponses || seed.bhlsResponses,
      launchDone: parsed.launchDone || seed.launchDone,
    };
  } catch {
    return seed;
  }
}

function renderNavIcon(icon: OpsNavItem['icon']) {
  const cls = 'w-4 h-4 shrink-0';
  switch (icon) {
    case 'home':
      return <Home className={cls} />;
    case 'compass':
      return <Compass className={cls} />;
    case 'book':
      return <BookOpen className={cls} />;
    case 'clipboard':
      return <ClipboardList className={cls} />;
    case 'users':
      return <Users className={cls} />;
    case 'chart':
      return <BarChart3 className={cls} />;
    case 'calendar':
      return <Calendar className={cls} />;
    case 'check':
      return <CheckSquare className={cls} />;
    case 'share':
      return <Share2 className={cls} />;
    case 'pill':
      return <Pill className={cls} />;
    case 'gift':
      return <Gift className={cls} />;
    case 'wallet':
      return <Wallet className={cls} />;
    case 'file':
      return <FileText className={cls} />;
    case 'handbook':
      return <ShieldCheck className={cls} />;
    case 'rocket':
      return <Rocket className={cls} />;
    default:
      return <Library className={cls} />;
  }
}

export function OperationsHubScreen({
  onBackToOverview,
  onOpenEnrollmentForms,
  initialNav = 'dashboard',
}: OperationsHubScreenProps) {
  const [ops, setOps] = useState<OpsDataState>(loadOpsState);
  const [activeNav, setActiveNav] = useState<OpsNavId>(initialNav);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHubUnlocked, setIsHubUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(HUB_AUTH_KEY) === 'granted';
    } catch {
      return false;
    }
  });
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClearSample, setConfirmClearSample] = useState(false);
  const syncTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    setActiveNav(initialNav);
  }, [initialNav]);

  useEffect(() => {
    const timers = syncTimersRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(ops));
    } catch {
      // ignore storage quota failures
    }
  }, [ops]);

  const persistOpsLocalFirst = (nextOps: OpsDataState) => {
    try {
      localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(nextOps));
    } catch {
      // ignore storage quota failures
    }
  };

  const queueSheetSync = (
    sheetTab: SheetSyncTab,
    record: Record<string, unknown>,
    dedupeKey: string,
    immediate = false
  ) => {
    const existing = syncTimersRef.current.get(dedupeKey);
    if (existing) {
      window.clearTimeout(existing);
      syncTimersRef.current.delete(dedupeKey);
    }
    if (immediate) {
      void syncRecordToSheet(sheetTab, record);
      return;
    }
    const timerId = window.setTimeout(() => {
      syncTimersRef.current.delete(dedupeKey);
      void syncRecordToSheet(sheetTab, record);
    }, 750);
    syncTimersRef.current.set(dedupeKey, timerId);
  };

  useEffect(() => {
    void fetchSourceWorkbook(true)
      .then((wb) => {
        syncWorkbookEverywhere(wb);
      })
      .catch(() => {
        // ignore offline fetch issues
      });

    const handleOpsSync = (ev: Event) => {
      const detail = (ev as CustomEvent<OpsDataState>).detail;
      if (detail && Array.isArray(detail.checkins)) {
        setOps(detail);
      } else {
        setOps(loadOpsState());
      }
    };
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === OPS_STORAGE_KEY) {
        setOps(loadOpsState());
      }
    };
    window.addEventListener(OPS_SYNC_EVENT, handleOpsSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(OPS_SYNC_EVENT, handleOpsSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const handleSyncWorkbookCheckins = async () => {
    try {
      const wb = await fetchSourceWorkbook(true);
      const { addedCheckins } = syncWorkbookEverywhere(wb);
      showToast(
        addedCheckins > 0
          ? `Synced ${addedCheckins} check-in(s) from Southernwell Master Database Workbook.`
          : 'Operations Check-Ins are already synced with Master Database Workbook.'
      );
    } catch {
      showToast('Unable to reach Master Database Workbook file.');
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const q = searchQuery.trim().toLowerCase();
  const matchesQuery = (record: object) =>
    !q || JSON.stringify(record).toLowerCase().includes(q);

  const today = offsetDay(0);
  const nextWeek = offsetDay(7);
  const limits = HUB_PRESETS[ops.preset];

  const metrics = useMemo(() => {
    const activeClients = ops.clients.filter((c) => c.status !== 'Closed');
    const checkinsDue = ops.checkins.filter(
      (c) => !c.done && Boolean(c.date) && c.date <= nextWeek
    ).length;
    const openActions = ops.actions.filter((a) => !a.done).length;
    const pendingReferrals = ops.referrals.filter((r) => r.status === 'Pending').length;
    const paymentsAttention = ops.payments.filter((p) => p.status !== 'Paid').length;

    const countyCounts = OPS_COUNTIES.map(
      (county) =>
        activeClients.filter((client) => client.county === county).length
    );

    const priorityItems: Array<{ urgent: boolean; text: string }> = [];
    ops.payments.forEach((p) => {
      if (p.status !== 'Paid') {
        priorityItems.push({ urgent: true, text: `Due Retainer: ${p.client} $${p.amt}` });
      }
    });
    ops.clients.forEach((c) => {
      if (c.status === 'Check-in due') {
        priorityItems.push({ urgent: false, text: `Check-in due: ${c.id} (${c.ini})` });
      }
    });
    ops.checkins.forEach((c) => {
      if (!c.done && c.date && c.date <= today) {
        priorityItems.push({
          urgent: c.date < today,
          text: `Check-in ${c.date < today ? 'overdue' : 'today'}: ${c.client} (${c.type})`,
        });
      }
    });
    ops.actions.forEach((a) => {
      if (!a.done && a.due && a.due < today) {
        priorityItems.push({ urgent: true, text: `Action overdue: ${a.title}` });
      }
    });
    ops.meds.forEach((m) => {
      if (!m.done && m.refill && m.refill <= nextWeek) {
        priorityItems.push({
          urgent: false,
          text: `Refill reminder: ${m.client} — ${m.item}`,
        });
      }
    });

    return {
      activeCount: activeClients.length,
      checkinsDue,
      openActions,
      pendingReferrals,
      paymentsAttention,
      countyCounts,
      countyDenominator: activeClients.length || 1,
      priorityItems,
    };
  }, [ops, nextWeek, today]);

  const handleAddClient = () => {
    const nextNum = ops.clients.length + 1;
    const newClient: OpsClient = {
      id: `SW-NEW-${nextNum}`,
      ini: 'N.C.',
      county: 'Forrest',
      pkg: 'Essentials',
      step: 0,
      next: offsetDay(3),
      visit: 'Discovery Call',
      status: 'Active',
      contact: 'Phone',
      packet: 'Not started',
      consent: false,
      porch: 'Standard',
      needs: 'Intake scheduled',
    };
    setOps((prev) => {
      const next = { ...prev, clients: [newClient, ...prev.clients] };
      persistOpsLocalFirst(next);
      return next;
    });
    queueSheetSync(
      'Enrollments',
      {
        event: 'New Client Enrolled',
        clientId: newClient.id,
        initials: newClient.ini,
        county: newClient.county,
        packageTier: newClient.pkg,
        status: newClient.status,
        preferredContact: newClient.contact,
        needs: newClient.needs,
        scope: 'Non-clinical care navigation only',
      },
      `client-${newClient.id}`,
      true
    );
    setActiveNav('clients');
    showToast(`Enrolled draft client ${newClient.id}. Saved locally & queued for Sheet sync.`);
  };

  const handleAddCheckin = () => {
    const newRow: OpsCheckin = {
      client: ops.clients[0]?.id || '',
      date: offsetDay(2),
      type: 'Phone',
      note: '',
      done: false,
    };
    setOps((prev) => {
      const next = { ...prev, checkins: [newRow, ...prev.checkins] };
      persistOpsLocalFirst(next);
      return next;
    });
    queueSheetSync(
      'Check-Ins',
      {
        client: newRow.client,
        date: newRow.date,
        type: newRow.type,
        note: newRow.note || 'Scheduled check-in',
        done: newRow.done,
        scope: 'Non-clinical care coordination check-in',
      },
      `checkin-add-${Date.now()}`,
      true
    );
  };

  const handleAddAction = () => {
    const newRow: OpsAction = {
      title: 'New coordination task',
      client: ops.clients[0]?.id || '',
      owner: 'Coordinator',
      due: offsetDay(3),
      done: false,
    };
    setOps((prev) => {
      const next = { ...prev, actions: [newRow, ...prev.actions] };
      persistOpsLocalFirst(next);
      return next;
    });
    queueSheetSync(
      'Action Items',
      {
        title: newRow.title,
        client: newRow.client,
        owner: newRow.owner,
        due: newRow.due,
        done: newRow.done,
        scope: 'Non-clinical action plan',
      },
      `action-add-${Date.now()}`,
      true
    );
  };

  const handleAddReferral = () => {
    const newRow: OpsReferral = {
      client: ops.clients[0]?.id || '',
      kind: 'Provider',
      to: '',
      date: offsetDay(0),
      status: 'Pending',
    };
    setOps((prev) => {
      const next = { ...prev, referrals: [newRow, ...prev.referrals] };
      persistOpsLocalFirst(next);
      return next;
    });
    queueSheetSync(
      'Referrals',
      {
        client: newRow.client,
        kind: newRow.kind,
        referredTo: newRow.to || 'Pending designation',
        date: newRow.date,
        status: newRow.status,
        scope: 'Non-clinical care coordination referral',
      },
      `referral-add-${Date.now()}`,
      true
    );
  };

  const handleAddPayment = () => {
    const newRow: OpsPayment = {
      client: ops.clients[0]?.id || '',
      amt: 285,
      due: offsetDay(5),
      status: 'Due',
    };
    setOps((prev) => {
      const next = { ...prev, payments: [newRow, ...prev.payments] };
      persistOpsLocalFirst(next);
      return next;
    });
    queueSheetSync(
      'Payments',
      {
        client: newRow.client,
        amount: newRow.amt,
        dueDate: newRow.due,
        status: newRow.status,
        scope: 'Non-clinical care coordination retainer',
      },
      `payment-add-${Date.now()}`,
      true
    );
  };

  const handleAddMed = () => {
    const newRow: OpsMed = {
      client: ops.clients[0]?.id || '',
      item: '',
      src: 'Client',
      refill: offsetDay(14),
      pharm: '',
      done: false,
    };
    setOps((prev) => ({ ...prev, meds: [newRow, ...prev.meds] }));
  };

  const updateClientField = <K extends keyof OpsClient>(
    index: number,
    field: K,
    value: OpsClient[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.clients];
      next[index] = { ...next[index], [field]: value };
      const nextState = { ...prev, clients: next };
      persistOpsLocalFirst(nextState);
      return nextState;
    });
  };

  const updateCheckinField = <K extends keyof OpsCheckin>(
    index: number,
    field: K,
    value: OpsCheckin[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.checkins];
      const updatedRow = { ...next[index], [field]: value };
      next[index] = updatedRow;
      const nextState = { ...prev, checkins: next };
      persistOpsLocalFirst(nextState);
      queueSheetSync(
        'Check-Ins',
        {
          client: updatedRow.client,
          date: updatedRow.date,
          type: updatedRow.type,
          note: updatedRow.note,
          done: updatedRow.done,
          scope: 'Non-clinical care coordination check-in',
        },
        `checkin-${index}-${updatedRow.client || 'row'}`,
        field !== 'note'
      );
      return nextState;
    });
  };

  const updateActionField = <K extends keyof OpsAction>(
    index: number,
    field: K,
    value: OpsAction[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.actions];
      const updatedRow = { ...next[index], [field]: value };
      next[index] = updatedRow;
      const nextState = { ...prev, actions: next };
      persistOpsLocalFirst(nextState);
      queueSheetSync(
        'Action Items',
        {
          title: updatedRow.title,
          client: updatedRow.client,
          owner: updatedRow.owner,
          due: updatedRow.due,
          done: updatedRow.done,
          scope: 'Non-clinical action plan',
        },
        `action-${index}-${updatedRow.client || 'row'}`,
        field !== 'title'
      );
      return nextState;
    });
  };

  const updateReferralField = <K extends keyof OpsReferral>(
    index: number,
    field: K,
    value: OpsReferral[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.referrals];
      const updatedRow = { ...next[index], [field]: value };
      next[index] = updatedRow;
      const nextState = { ...prev, referrals: next };
      persistOpsLocalFirst(nextState);
      queueSheetSync(
        'Referrals',
        {
          client: updatedRow.client,
          kind: updatedRow.kind,
          referredTo: updatedRow.to,
          date: updatedRow.date,
          status: updatedRow.status,
          scope: 'Non-clinical care coordination referral',
        },
        `referral-${index}-${updatedRow.client || 'row'}`,
        field !== 'to'
      );
      return nextState;
    });
  };

  const updatePaymentField = <K extends keyof OpsPayment>(
    index: number,
    field: K,
    value: OpsPayment[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.payments];
      const updatedRow = { ...next[index], [field]: value };
      next[index] = updatedRow;
      const nextState = { ...prev, payments: next };
      persistOpsLocalFirst(nextState);
      queueSheetSync(
        'Payments',
        {
          client: updatedRow.client,
          amount: updatedRow.amt,
          dueDate: updatedRow.due,
          status: updatedRow.status,
          scope: 'Non-clinical care coordination retainer',
        },
        `payment-${index}-${updatedRow.client || 'row'}`,
        field !== 'amt'
      );
      return nextState;
    });
  };

  const updateMedField = <K extends keyof OpsMed>(
    index: number,
    field: K,
    value: OpsMed[K]
  ) => {
    setOps((prev) => {
      const next = [...prev.meds];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, meds: next };
    });
  };

  const deleteRow = (
    key: 'clients' | 'checkins' | 'actions' | 'referrals' | 'payments' | 'meds',
    index: number
  ) => {
    setOps((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const moveClientStep = (index: number, delta: number) => {
    setOps((prev) => {
      const next = [...prev.clients];
      const current = next[index];
      if (!current) return prev;
      next[index] = {
        ...current,
        step: Math.max(0, Math.min(9, current.step + delta)),
      };
      return { ...prev, clients: next };
    });
  };

  const handleExportCaseloadCsv = () => {
    const csvEscape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['Client ID', 'Initials', 'County', 'Package', 'Status', 'Next Check-In'].join(','),
      ...ops.clients.map((c) =>
        [c.id, c.ini, c.county, c.pkg, c.status, c.next].map(csvEscape).join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'southernwell_caseload_ledger.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Caseload ledger exported as southernwell_caseload_ledger.csv.');
  };

  const handleLockHub = () => {
    try {
      sessionStorage.removeItem(HUB_AUTH_KEY);
    } catch {
      // ignore sessionStorage failures
    }
    setIsHubUnlocked(false);
  };

  const handleResetDemoData = () => {
    setOps(createSeedOpsData());
    setConfirmReset(false);
    setConfirmClearSample(false);
    showToast('Operations Hub restored to default South Mississippi seed caseload.');
  };

  const handleClearSampleData = () => {
    const emptyState: OpsDataState = {
      preset: ops.preset,
      clients: [],
      checkins: [],
      actions: [],
      referrals: [],
      payments: [],
      meds: [],
      mmasResponses: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0 },
      bhlsResponses: { q1: 0, q2: 0, q3: 0 },
      launchDone: {},
    };
    persistOpsLocalFirst(emptyState);
    setOps(emptyState);
    setConfirmClearSample(false);
    showToast('Sample caseload cleared from local browser storage.');
  };

  const clientIds = ops.clients.map((c) => c.id);

  if (!isHubUnlocked) {
    return (
      <OpsPinLock
        onUnlock={() => setIsHubUnlocked(true)}
        onBackToOverview={onBackToOverview}
      />
    );
  }

  return (
    <section className="min-h-[calc(100vh-5rem)] bg-canvas text-obsidian py-6 sm:py-8">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Utility Strip */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-card-border">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onBackToOverview}
              className="text-xs font-semibold uppercase tracking-wider text-navy-slate hover:text-oxford-dark transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Service Overview</span>
            </button>
            <span className="text-card-border hidden sm:inline">|</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brass-deep">
              Operations &amp; Care Navigation Hub
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEnrollmentForms(0, 'stages')}
              className="px-3 py-1.5 rounded-lg border border-card-border bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-oxford" />
              <span>Full 5-Stage Portal</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenEnrollmentForms(4, 'workbook')}
              className="px-3 py-1.5 rounded-lg border border-card-border bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-navy-slate" />
              <span>Master Workbook</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="px-2.5 py-1.5 rounded-lg bg-[#9E3524] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-card-border bg-white text-xs font-semibold text-oxford-dark cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="px-3 py-1.5 rounded-lg border border-card-border bg-white hover:bg-canvas-muted text-obsidian/75 hover:text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Seed</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Feedback Toast */}
        {toastMsg && (
          <div
            role="status"
            className="print:hidden mb-4 px-4 py-3 rounded-xl bg-navy-soft border border-oxford/20 text-oxford-dark text-xs sm:text-sm font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-oxford shrink-0" />
              <span>{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-xs font-bold text-navy-slate hover:text-oxford-dark cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dual-Column Operations Shell */}
        <div className="flex flex-col lg:flex-row items-start gap-5">
          {/* PERSISTENT DEEP OXFORD NAVY SIDEBAR */}
          <aside
            aria-label="Operations Hub Navigation"
            className="print:hidden w-full lg:w-[275px] shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto rounded-2xl bg-gradient-to-b from-oxford to-oxford-dark border border-brass/40 shadow-lg p-3.5 text-canvas"
          >
            <div className="px-2.5 pt-1 pb-4 mb-2.5 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-canvas p-0.5 border border-brass/70 flex items-center justify-center shrink-0 overflow-hidden">
                  <CrestLogo alt="SouthernWell Case Management Services Emblem" />
                </div>
                <div>
                  <span className="font-heading font-bold text-lg text-white block leading-none tracking-tight">
                    SOUTHERNWELL
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-brass-light block mt-1">
                    Operations Hub
                  </span>
                </div>
              </div>
            </div>

            <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
              {OPS_NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-[13px] font-semibold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-canvas text-oxford-dark border-brass shadow-sm'
                        : 'border-transparent text-canvas/85 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0 border ${
                        isActive
                          ? 'bg-navy-soft border-oxford/25 text-oxford-dark'
                          : 'bg-white/10 border-white/15 text-brass-light'
                      }`}
                    >
                      {renderNavIcon(item.icon)}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* MAIN WORKSPACE SURFACE */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* Global Search Bar, Sheets Sync Status & Lock Hub Control */}
            <div className="print:hidden flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-obsidian/50 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search client records, initials, counties..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford shadow-xs"
                />
              </div>
              <SheetsSyncControl />
              <button
                id="hub-lock-btn"
                type="button"
                onClick={handleLockHub}
                title="Lock Hub Immediately"
                className="px-4 py-2.5 rounded-xl bg-oxford hover:bg-oxford-dark text-canvas border border-brass/45 text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4 text-brass-light" />
                <span>Lock Hub</span>
              </button>
            </div>

            {/* Scope Notice Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-navy-soft/90 to-white border border-oxford/20 px-4 py-3 text-xs sm:text-[13px] text-obsidian shadow-xs">
              <strong className="font-bold text-oxford-dark">Strictly non-clinical care coordination.</strong>{' '}
              SouthernWell Case Management Services (SouthernWell of South Mississippi) provides family advocacy, care navigation, and appointment logistics across the Pine Belt &amp; Gulf Coast. No skilled nursing or medical care is performed.
            </div>

            {/* ============================================================= */}
            {/* 1. DASHBOARD VIEW                                             */}
            {/* ============================================================= */}
            {activeNav === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Operations Dashboard
                  </h2>
                  <span className="px-3 py-1 rounded-md bg-navy-soft text-navy-slate border border-oxford/20 text-xs font-bold">
                    South Mississippi
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="px-4 py-2.5 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Users className="w-4 h-4 text-brass-light" />
                    <span>Enroll Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNav('checkins')}
                    className="px-4 py-2.5 rounded-xl bg-white border border-oxford/25 text-oxford-dark hover:bg-canvas-muted text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Calendar className="w-4 h-4 text-oxford" />
                    <span>Check-Ins</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCaseloadCsv}
                    className="px-4 py-2.5 rounded-xl bg-white border border-oxford/25 text-oxford-dark hover:bg-canvas-muted text-xs font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4 text-oxford" />
                    <span>Export CSV</span>
                  </button>
                </div>

                {/* KPI Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5">
                  {[
                    {
                      label: 'Active clients',
                      val: metrics.activeCount,
                      max: null as number | null,
                      sub: 'Enrolled',
                      icon: <Users className="w-5 h-5" />,
                    },
                    {
                      label: 'Check-ins due (7 days)',
                      val: metrics.checkinsDue,
                      max: null as number | null,
                      sub: 'Open',
                      icon: <Calendar className="w-5 h-5" />,
                    },
                    {
                      label: 'Open action items',
                      val: metrics.openActions,
                      max: limits.a,
                      sub: '',
                      icon: <CheckSquare className="w-5 h-5" />,
                    },
                    {
                      label: 'Referrals pending',
                      val: metrics.pendingReferrals,
                      max: limits.r,
                      sub: '',
                      icon: <Share2 className="w-5 h-5" />,
                    },
                    {
                      label: 'Payments attention',
                      val: metrics.paymentsAttention,
                      max: limits.p,
                      sub: '',
                      icon: <Wallet className="w-5 h-5" />,
                    },
                  ].map((kpi) => {
                    const isBreached = kpi.max !== null && kpi.val > kpi.max;
                    return (
                      <div
                        key={kpi.label}
                        className="rounded-2xl bg-gradient-to-b from-white to-canvas border border-card-border border-t-[3px] border-t-oxford p-4 shadow-xs"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl grid place-items-center mb-3 border ${
                            isBreached
                              ? 'bg-[#FDE8E5] border-[#9E3524]/30 text-[#9E3524]'
                              : 'bg-navy-soft border-oxford/20 text-oxford'
                          }`}
                        >
                          {kpi.icon}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-obsidian/70 block">
                          {kpi.label}
                        </span>
                        <span
                          className={`font-heading font-semibold text-4xl block mt-1 tabular-nums ${
                            isBreached ? 'text-[#9E3524]' : 'text-oxford-dark'
                          }`}
                        >
                          {kpi.val}
                        </span>
                        <span className="text-xs text-obsidian/70 font-medium block mt-0.5">
                          {kpi.max !== null
                            ? isBreached
                              ? `Over limit (max ${kpi.max})`
                              : `Within limit (max ${kpi.max})`
                            : kpi.sub}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Needs Attention */}
                <div className="rounded-2xl bg-white border border-card-border p-4 shadow-xs">
                  <strong className="text-sm font-bold text-oxford-dark block mb-2">
                    Needs attention
                  </strong>
                  {metrics.priorityItems.length > 0 ? (
                    <div className="divide-y divide-card-border">
                      {metrics.priorityItems.slice(0, 6).map((item, idx) => (
                        <div
                          key={`${item.text}-${idx}`}
                          className={`py-2.5 text-sm ${
                            item.urgent ? 'text-[#9E3524] font-semibold' : 'text-obsidian'
                          }`}
                        >
                          {item.text}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-obsidian/70 py-2">
                      Nothing needs attention right now.
                    </p>
                  )}
                </div>

                {/* Collapsible County Breakdown & Alert Thresholds */}
                <details className="rounded-2xl bg-white border border-card-border p-4 shadow-xs">
                  <summary className="cursor-pointer font-bold text-sm text-oxford-dark select-none">
                    County breakdown &amp; alert thresholds
                  </summary>

                  <div className="mt-3 pt-3 border-t border-card-border space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-xs sm:text-sm text-oxford-dark mr-1">
                        Alert thresholds:
                      </strong>
                      {(['strict', 'standard', 'high'] as AlertPreset[]).map((presetKey) => {
                        const active = ops.preset === presetKey;
                        return (
                          <button
                            key={presetKey}
                            type="button"
                            onClick={() => setOps((prev) => ({ ...prev, preset: presetKey }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                              active
                                ? 'bg-oxford text-white border-oxford ring-2 ring-brass/45'
                                : 'bg-white text-oxford-dark border-oxford/25 hover:bg-canvas-muted'
                            }`}
                          >
                            {presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <strong className="text-xs sm:text-sm text-oxford-dark block">
                        Clients by county
                      </strong>
                      <div className="flex h-3 rounded-full overflow-hidden bg-canvas-muted my-3 border border-oxford/10">
                        {metrics.countyCounts.map((count, idx) => (
                          <div
                            key={OPS_COUNTIES[idx]}
                            style={{
                              width: `${(count / metrics.countyDenominator) * 100}%`,
                              backgroundColor: OPS_COUNTY_COLORS[idx],
                            }}
                            title={`${OPS_COUNTIES[idx]}: ${count}`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {OPS_COUNTIES.map((county, idx) => (
                          <span
                            key={county}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-navy-soft border border-oxford/20 text-xs font-bold text-navy-slate"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-xs inline-block"
                              style={{ backgroundColor: OPS_COUNTY_COLORS[idx] }}
                            />
                            <span>
                              {county}: {metrics.countyCounts[idx]}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>

                {/* Local Storage & Clear Sample Data Note */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-obsidian/70 pt-1">
                  <span>Local browser storage active alongside live Google Sheets sync.</span>
                  {confirmClearSample ? (
                    <span className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleClearSampleData}
                        className="px-2.5 py-1 rounded-lg bg-[#9E3524] text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearSample(false)}
                        className="px-2.5 py-1 rounded-lg border border-card-border bg-white text-oxford-dark text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearSample(true)}
                      className="px-3 py-1 rounded-lg border border-oxford/25 bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-semibold cursor-pointer"
                    >
                      Clear sample data
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 2. 10-STEP WORKFLOW PIPELINE                                  */}
            {/* ============================================================= */}
            {activeNav === 'workflow' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Workflow Pipeline (10-Step Care Navigation Flow)
                  </h2>
                </div>

                <div className="flex gap-3.5 overflow-x-auto pb-3 items-start">
                  {OPS_STEPS.map(([stepTitle, stepTiming], stepIdx) => {
                    const stepClients = ops.clients
                      .map((client, origIdx) => ({ client, origIdx }))
                      .filter(
                        ({ client }) => client.step === stepIdx && matchesQuery(client)
                      );
                    const stepForms = OPS_STEP_FORMS[stepIdx] || [];

                    return (
                      <div
                        key={stepTitle}
                        className="w-[235px] shrink-0 rounded-2xl bg-gradient-to-b from-white to-canvas border border-card-border p-3 shadow-xs"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="w-5 h-5 rounded-md bg-navy-soft text-oxford-dark text-[11px] font-extrabold inline-flex items-center justify-center shrink-0 tabular-nums">
                            {stepIdx + 1}
                          </span>
                          <h3 className="font-bold text-xs text-oxford-dark truncate">
                            {stepTitle}
                          </h3>
                          <span className="text-[11px] text-obsidian/65 ml-auto shrink-0">
                            ({stepTiming})
                          </span>
                        </div>

                        {stepForms.length > 0 && (
                          <div className="text-[11px] text-obsidian/75 space-y-0.5 mb-2.5 leading-snug">
                            {stepForms.map((f) => (
                              <div key={f}>• {f}</div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          {stepClients.length > 0 ? (
                            stepClients.map(({ client, origIdx }) => (
                              <div
                                key={`${client.id}-${origIdx}`}
                                className="rounded-xl bg-white border border-oxford/25 p-2.5 shadow-2xs"
                              >
                                <div className="font-bold text-xs text-oxford-dark">
                                  {client.id}{' '}
                                  <span className="font-normal text-obsidian/75">
                                    ({client.ini})
                                  </span>
                                </div>
                                <div className="text-[11px] text-obsidian/70 mt-0.5">
                                  {client.county} • {client.pkg}
                                </div>
                                <div className="flex gap-1.5 mt-2">
                                  {stepIdx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => moveClientStep(origIdx, -1)}
                                      aria-label={`Move ${client.id} back`}
                                      className="flex-1 py-1 rounded-lg bg-canvas border border-card-border hover:bg-navy-soft hover:border-oxford text-oxford-dark flex items-center justify-center cursor-pointer"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {stepIdx < 9 && (
                                    <button
                                      type="button"
                                      onClick={() => moveClientStep(origIdx, 1)}
                                      aria-label={`Advance ${client.id}`}
                                      className="flex-1 py-1 rounded-lg bg-canvas border border-card-border hover:bg-navy-soft hover:border-oxford text-oxford-dark flex items-center justify-center cursor-pointer"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-obsidian/60 italic py-1">
                              No clients at this stage
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-obsidian/70">
                  Use arrows to advance clients along the 10-step care navigation journey.
                </p>
              </div>
            )}

            {/* ============================================================= */}
            {/* 3. WORKFLOW MANUAL                                            */}
            {/* ============================================================= */}
            {activeNav === 'guide' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    SouthernWell Coordinator Workflow Manual
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Standard turnaround targets and onboarding phases from initial discovery call to ongoing family briefings.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {WORKFLOW_GUIDE_SECTIONS.map((sec) => (
                    <div
                      key={sec.phase}
                      className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-heading text-xl font-bold text-oxford-dark">
                          {sec.phase}
                        </h3>
                        <span className="px-3 py-1 rounded-md bg-navy-soft text-navy-slate text-xs font-bold">
                          SLA: {sec.sla}
                        </span>
                      </div>
                      <p className="text-sm text-obsidian/85 leading-relaxed">
                        {sec.summary}
                      </p>
                      <ul className="space-y-1.5 pt-1">
                        {sec.actions.map((act) => (
                          <li
                            key={act}
                            className="flex items-start gap-2 text-xs sm:text-sm text-obsidian/85"
                          >
                            <CheckCircle2 className="w-4 h-4 text-oxford shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 4. STANDARD OPERATING PROCEDURES                            */}
            {/* ============================================================= */}
            {activeNav === 'sop' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Standard Operating Procedures (SOPs)
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Non-clinical governance standards protecting client safety, HIPAA authorizations, and family communication SLAs. No skilled nursing or medical care is performed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOP_ITEMS.map((item) => (
                    <div
                      key={item.code}
                      className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-oxford text-brass-light text-[11px] font-bold tracking-wider">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold text-navy-slate">
                          {item.cadence}
                        </span>
                      </div>
                      <h3 className="font-heading text-xl font-bold text-oxford-dark">
                        {item.title}
                      </h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-brass-deep">
                        Owner: {item.owner}
                      </p>
                      <p className="text-sm text-obsidian/85 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 5. CLIENT DIRECTORY (EDITABLE TABLE)                          */}
            {/* ============================================================= */}
            {activeNav === 'clients' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Client Directory
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enroll New Client</span>
                  </button>
                </div>

                <div className="overflow-x-auto bg-white border border-card-border rounded-2xl shadow-xs">
                  <table className="w-full min-w-[1160px] border-collapse text-xs">
                    <thead>
                      <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                        <th className="px-3 py-3">Client ID</th>
                        <th className="px-3 py-3">Initials</th>
                        <th className="px-3 py-3">County</th>
                        <th className="px-3 py-3">Package</th>
                        <th className="px-3 py-3">Workflow step</th>
                        <th className="px-3 py-3">Next check-in</th>
                        <th className="px-3 py-3">Visit type</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Preferred contact</th>
                        <th className="px-3 py-3">Packet</th>
                        <th className="px-3 py-3 text-center">Releases</th>
                        <th className="px-3 py-3">Sliding scale</th>
                        <th className="px-3 py-3">Non-clinical needs</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ops.clients.map((c, idx) =>
                        matchesQuery(c) ? (
                          <tr
                            key={`${c.id}-${idx}`}
                            className="border-t border-card-border even:bg-canvas/50"
                          >
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={c.id}
                                onChange={(e) => updateClientField(idx, 'id', e.target.value)}
                                className="w-28 px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent font-semibold text-oxford-dark"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={c.ini}
                                onChange={(e) => updateClientField(idx, 'ini', e.target.value)}
                                className="w-16 px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.county}
                                onChange={(e) =>
                                  updateClientField(idx, 'county', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {OPS_COUNTIES.map((co) => (
                                  <option key={co} value={co}>
                                    {co}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.pkg}
                                onChange={(e) => updateClientField(idx, 'pkg', e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {OPS_PACKAGES.map((pk) => (
                                  <option key={pk} value={pk}>
                                    {pk}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.step}
                                onChange={(e) =>
                                  updateClientField(idx, 'step', Number(e.target.value))
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {OPS_STEPS.map(([label], stepNum) => (
                                  <option key={label} value={stepNum}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="date"
                                value={c.next}
                                onChange={(e) => updateClientField(idx, 'next', e.target.value)}
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={c.visit}
                                onChange={(e) =>
                                  updateClientField(idx, 'visit', e.target.value)
                                }
                                className="w-36 px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.status}
                                onChange={(e) =>
                                  updateClientField(
                                    idx,
                                    'status',
                                    e.target.value as OpsClient['status']
                                  )
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Active', 'Check-in due', 'On hold', 'Closed'].map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.contact}
                                onChange={(e) =>
                                  updateClientField(
                                    idx,
                                    'contact',
                                    e.target.value as OpsClient['contact']
                                  )
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Phone', 'Text', 'Email', 'Voicemail'].map((ct) => (
                                  <option key={ct} value={ct}>
                                    {ct}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.packet}
                                onChange={(e) =>
                                  updateClientField(
                                    idx,
                                    'packet',
                                    e.target.value as OpsClient['packet']
                                  )
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Not started', 'Sent', 'Returned', 'Complete'].map((pk) => (
                                  <option key={pk} value={pk}>
                                    {pk}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={c.consent}
                                onChange={(e) =>
                                  updateClientField(idx, 'consent', e.target.checked)
                                }
                                className="w-4 h-4 accent-oxford cursor-pointer"
                              />
                            </td>
                            <td className="p-1.5">
                              <select
                                value={c.porch}
                                onChange={(e) =>
                                  updateClientField(idx, 'porch', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {OPS_PORCH_TIERS.map((pt) => (
                                  <option key={pt} value={pt}>
                                    {pt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                value={c.needs}
                                onChange={(e) =>
                                  updateClientField(idx, 'needs', e.target.value)
                                }
                                className="w-56 px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-1.5 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow('clients', idx)}
                                aria-label={`Delete ${c.id}`}
                                className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-obsidian/70">
                  Click any cell to edit. Changes save automatically to local state.
                </p>
              </div>
            )}

            {/* ============================================================= */}
            {/* 6. CLIENT PROGRESS MATRIX                                     */}
            {/* ============================================================= */}
            {activeNav === 'progress' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Client Onboarding &amp; Navigation Progress
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Real-time milestone completion across packet dispatch, HIPAA releases, and the 10-step onboarding trajectory.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ops.clients.filter(matchesQuery).map((client) => {
                    const pct = Math.round(((client.step + 1) / 10) * 100);
                    return (
                      <div
                        key={client.id}
                        className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-heading text-xl font-bold text-oxford-dark">
                              {client.id} ({client.ini})
                            </h3>
                            <p className="text-xs text-obsidian/75">
                              {client.county} · {client.pkg}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-md bg-navy-soft text-navy-slate text-xs font-bold tabular-nums">
                            Step {client.step + 1}/10 ({pct}%)
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-canvas-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-oxford to-brass transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                          <div className="p-2 rounded-lg bg-canvas border border-card-border">
                            <span className="text-[10px] uppercase font-bold text-obsidian/65 block">
                              Stage
                            </span>
                            <span className="font-semibold text-oxford-dark">
                              {OPS_STEPS[client.step]?.[0]}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-canvas border border-card-border">
                            <span className="text-[10px] uppercase font-bold text-obsidian/65 block">
                              Packet
                            </span>
                            <span className="font-semibold text-oxford-dark">{client.packet}</span>
                          </div>
                          <div className="p-2 rounded-lg bg-canvas border border-card-border">
                            <span className="text-[10px] uppercase font-bold text-obsidian/65 block">
                              Releases
                            </span>
                            <span
                              className={`font-semibold ${
                                client.consent ? 'text-oxford' : 'text-[#9E3524]'
                              }`}
                            >
                              {client.consent ? 'Signed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 7. CHECK-INS TABLE                                            */}
            {/* ============================================================= */}
            {activeNav === 'checkins' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Check-Ins
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetsSyncControl
                      compact
                      syncLabel="Save & Sync Check-Ins"
                      onSyncNow={async () => {
                        persistOpsLocalFirst(ops);
                        const latest = ops.checkins[0];
                        const res = await syncRecordToSheet(
                          'Check-Ins',
                          latest
                            ? {
                                client: latest.client,
                                date: latest.date,
                                type: latest.type,
                                note: latest.note,
                                done: latest.done,
                                totalCheckins: ops.checkins.length,
                                scope: 'Non-clinical care coordination check-in',
                              }
                            : { totalCheckins: 0, scope: 'Non-clinical care coordination check-in' }
                        );
                        showToast(
                          res.status === 'Synced to Sheet'
                            ? 'Check-Ins saved locally and synced to Google Sheets.'
                            : 'Check-Ins saved locally (pending Google Sheets webhook).'
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleSyncWorkbookCheckins()}
                      className="px-3.5 py-2 rounded-xl border border-oxford/25 bg-navy-soft/80 hover:bg-navy-soft text-oxford-dark text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-oxford" />
                      <span>Sync Workbook</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCheckin}
                      className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-card-border rounded-2xl shadow-xs">
                  <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                        <th className="px-3 py-3">Client ID</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Note (non-clinical only)</th>
                        <th className="px-3 py-3 text-center">Done</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ops.checkins.map((row, idx) =>
                        matchesQuery(row) ? (
                          <tr
                            key={`ci-${idx}`}
                            className="border-t border-card-border even:bg-canvas/50"
                          >
                            <td className="p-2">
                              <select
                                value={row.client}
                                onChange={(e) =>
                                  updateCheckinField(idx, 'client', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                <option value="">--</option>
                                {clientIds.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  updateCheckinField(idx, 'date', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.type}
                                onChange={(e) =>
                                  updateCheckinField(
                                    idx,
                                    'type',
                                    e.target.value as OpsCheckin['type']
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {[
                                  'Phone',
                                  'Home visit',
                                  'Pill tray review',
                                  'Self-advocacy check-in',
                                  'Appointment Accompaniment',
                                ].map((tp) => (
                                  <option key={tp} value={tp}>
                                    {tp}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.note}
                                onChange={(e) =>
                                  updateCheckinField(idx, 'note', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.done}
                                onChange={(e) =>
                                  updateCheckinField(idx, 'done', e.target.checked)
                                }
                                className="w-4 h-4 accent-oxford cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow('checkins', idx)}
                                aria-label="Delete check-in row"
                                className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 8. ACTION PLANS TABLE                                         */}
            {/* ============================================================= */}
            {activeNav === 'actions' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Action Plans
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetsSyncControl
                      compact
                      syncLabel="Save & Sync Actions"
                      onSyncNow={async () => {
                        persistOpsLocalFirst(ops);
                        const latest = ops.actions[0];
                        const res = await syncRecordToSheet(
                          'Action Items',
                          latest
                            ? {
                                title: latest.title,
                                client: latest.client,
                                owner: latest.owner,
                                due: latest.due,
                                done: latest.done,
                                totalActions: ops.actions.length,
                                scope: 'Non-clinical action plan',
                              }
                            : { totalActions: 0, scope: 'Non-clinical action plan' }
                        );
                        showToast(
                          res.status === 'Synced to Sheet'
                            ? 'Action Items saved locally and synced to Google Sheets.'
                            : 'Action Items saved locally (pending Google Sheets webhook).'
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAction}
                      className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-card-border rounded-2xl shadow-xs">
                  <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                        <th className="px-3 py-3">Action item</th>
                        <th className="px-3 py-3">Client ID</th>
                        <th className="px-3 py-3">Owner</th>
                        <th className="px-3 py-3">Due</th>
                        <th className="px-3 py-3 text-center">Done</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ops.actions.map((row, idx) =>
                        matchesQuery(row) ? (
                          <tr
                            key={`act-${idx}`}
                            className="border-t border-card-border even:bg-canvas/50"
                          >
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) =>
                                  updateActionField(idx, 'title', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.client}
                                onChange={(e) =>
                                  updateActionField(idx, 'client', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                <option value="">--</option>
                                {clientIds.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={row.owner}
                                onChange={(e) =>
                                  updateActionField(
                                    idx,
                                    'owner',
                                    e.target.value as OpsAction['owner']
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Coordinator', 'Family contact', 'Client'].map((ow) => (
                                  <option key={ow} value={ow}>
                                    {ow}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.due}
                                onChange={(e) =>
                                  updateActionField(idx, 'due', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={row.done}
                                onChange={(e) =>
                                  updateActionField(idx, 'done', e.target.checked)
                                }
                                className="w-4 h-4 accent-oxford cursor-pointer"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow('actions', idx)}
                                aria-label="Delete action item"
                                className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 9. REFERRALS TABLE                                            */}
            {/* ============================================================= */}
            {activeNav === 'referrals' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Referrals
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetsSyncControl
                      compact
                      syncLabel="Save & Sync Referrals"
                      onSyncNow={async () => {
                        persistOpsLocalFirst(ops);
                        const latest = ops.referrals[0];
                        const res = await syncRecordToSheet(
                          'Referrals',
                          latest
                            ? {
                                client: latest.client,
                                kind: latest.kind,
                                referredTo: latest.to,
                                date: latest.date,
                                status: latest.status,
                                totalReferrals: ops.referrals.length,
                                scope: 'Non-clinical care coordination referral',
                              }
                            : { totalReferrals: 0, scope: 'Non-clinical care coordination referral' }
                        );
                        showToast(
                          res.status === 'Synced to Sheet'
                            ? 'Referrals saved locally and synced to Google Sheets.'
                            : 'Referrals saved locally (pending Google Sheets webhook).'
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddReferral}
                      className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-card-border rounded-2xl shadow-xs">
                  <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                        <th className="px-3 py-3">Client ID</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Referred to</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ops.referrals.map((row, idx) =>
                        matchesQuery(row) ? (
                          <tr
                            key={`ref-${idx}`}
                            className="border-t border-card-border even:bg-canvas/50"
                          >
                            <td className="p-2">
                              <select
                                value={row.client}
                                onChange={(e) =>
                                  updateReferralField(idx, 'client', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                <option value="">--</option>
                                {clientIds.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={row.kind}
                                onChange={(e) =>
                                  updateReferralField(
                                    idx,
                                    'kind',
                                    e.target.value as OpsReferral['kind']
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {[
                                  'LCSW',
                                  'Provider',
                                  'Pharmacy',
                                  'Community resource',
                                  'Elder Law',
                                ].map((k) => (
                                  <option key={k} value={k}>
                                    {k}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.to}
                                onChange={(e) =>
                                  updateReferralField(idx, 'to', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  updateReferralField(idx, 'date', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.status}
                                onChange={(e) =>
                                  updateReferralField(
                                    idx,
                                    'status',
                                    e.target.value as OpsReferral['status']
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Pending', 'Sent', 'Closed'].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow('referrals', idx)}
                                aria-label="Delete referral"
                                className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 10. PAYMENT TRACKING                                          */}
            {/* ============================================================= */}
            {activeNav === 'payments' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Payment Tracking
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetsSyncControl
                      compact
                      syncLabel="Save & Sync Payments"
                      onSyncNow={async () => {
                        persistOpsLocalFirst(ops);
                        const latest = ops.payments[0];
                        const res = await syncRecordToSheet(
                          'Payments',
                          latest
                            ? {
                                client: latest.client,
                                amount: latest.amt,
                                dueDate: latest.due,
                                status: latest.status,
                                totalPayments: ops.payments.length,
                                scope: 'Non-clinical care coordination retainer',
                              }
                            : { totalPayments: 0, scope: 'Non-clinical care coordination retainer' }
                        );
                        showToast(
                          res.status === 'Synced to Sheet'
                            ? 'Payments saved locally and synced to Google Sheets.'
                            : 'Payments saved locally (pending Google Sheets webhook).'
                        );
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPayment}
                      className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white border border-card-border rounded-2xl shadow-xs">
                  <table className="w-full min-w-[640px] border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                        <th className="px-3 py-3">Client ID</th>
                        <th className="px-3 py-3">Amount ($)</th>
                        <th className="px-3 py-3">Due date</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {ops.payments.map((row, idx) =>
                        matchesQuery(row) ? (
                          <tr
                            key={`pay-${idx}`}
                            className="border-t border-card-border even:bg-canvas/50"
                          >
                            <td className="p-2">
                              <select
                                value={row.client}
                                onChange={(e) =>
                                  updatePaymentField(idx, 'client', e.target.value)
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                <option value="">--</option>
                                {clientIds.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={row.amt}
                                onChange={(e) =>
                                  updatePaymentField(
                                    idx,
                                    'amt',
                                    Number(e.target.value) || 0
                                  )
                                }
                                className="w-28 px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={row.due}
                                onChange={(e) =>
                                  updatePaymentField(idx, 'due', e.target.value)
                                }
                                className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={row.status}
                                onChange={(e) =>
                                  updatePaymentField(
                                    idx,
                                    'status',
                                    e.target.value as OpsPayment['status']
                                  )
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                              >
                                {['Paid', 'Due', 'Overdue'].map((st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => deleteRow('payments', idx)}
                                aria-label="Delete payment row"
                                className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 11. MEDICATION TRACKER & SELF-ADVOCACY CHECK-IN SUITE         */}
            {/* ============================================================= */}
            {activeNav === 'meds' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                      Medication Tracker &amp; Self-Advocacy Check-In Suite
                    </h2>
                    <p className="text-sm text-obsidian/75 mt-0.5">
                      Logs prescription bottles strictly per label (no skilled nursing or medical care performed) paired with non-clinical adherence and health literacy self-advocacy check-ins.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMed}
                    className="print:hidden px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medication Item</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-card-border p-4 shadow-xs space-y-3">
                  <div className="overflow-x-auto border border-card-border rounded-xl">
                    <table className="w-full min-w-[700px] border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                          <th className="px-3 py-2.5">Client ID</th>
                          <th className="px-3 py-2.5">Item as supplied (per label)</th>
                          <th className="px-3 py-2.5">Supplied by</th>
                          <th className="px-3 py-2.5">Refill Reminder</th>
                          <th className="px-3 py-2.5">Pharmacy</th>
                          <th className="px-3 py-2.5 text-center">Done</th>
                          <th className="px-2 py-2.5 print:hidden" />
                        </tr>
                      </thead>
                      <tbody>
                        {ops.meds.map((row, idx) =>
                          matchesQuery(row) ? (
                            <tr
                              key={`med-${idx}`}
                              className="border-t border-card-border even:bg-canvas/50"
                            >
                              <td className="p-2">
                                <select
                                  value={row.client}
                                  onChange={(e) =>
                                    updateMedField(idx, 'client', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                                >
                                  <option value="">--</option>
                                  {clientIds.map((id) => (
                                    <option key={id} value={id}>
                                      {id}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.item}
                                  onChange={(e) =>
                                    updateMedField(idx, 'item', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={row.src}
                                  onChange={(e) =>
                                    updateMedField(
                                      idx,
                                      'src',
                                      e.target.value as OpsMed['src']
                                    )
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                                >
                                  {['Client', 'Provider'].map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="date"
                                  value={row.refill}
                                  onChange={(e) =>
                                    updateMedField(idx, 'refill', e.target.value)
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent tabular-nums"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={row.pharm}
                                  onChange={(e) =>
                                    updateMedField(idx, 'pharm', e.target.value)
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-transparent focus:border-oxford focus:bg-white bg-transparent"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={row.done}
                                  onChange={(e) =>
                                    updateMedField(idx, 'done', e.target.checked)
                                  }
                                  className="w-4 h-4 accent-oxford cursor-pointer"
                                />
                              </td>
                              <td className="p-2 text-right print:hidden">
                                <button
                                  type="button"
                                  onClick={() => deleteRow('meds', idx)}
                                  aria-label="Delete medication"
                                  className="p-1.5 rounded-lg bg-[#9E3524]/10 hover:bg-[#9E3524]/20 text-[#9E3524] cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ) : null
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-obsidian/70">
                    Medication inventory reflects bottle labels strictly. No skilled nursing, medical care, dosing changes, or prescribing are performed.
                  </p>
                </div>

                {/* Integrated Auto-Scoring MMAS-8 & BHLS Self-Advocacy Check-In Suite */}
                <OpsScreeningSuite />
              </div>
            )}

            {/* ============================================================= */}
            {/* 12. ENROLLMENT & FORMS (5 STAGES SYNCED WITH SWF)             */}
            {/* ============================================================= */}
            {activeNav === 'forms' && <OpsFormsModule onNotify={showToast} />}

            {/* ============================================================= */}
            {/* 13. CARE NAVIGATION PACKAGES & RATES                          */}
            {/* ============================================================= */}
            {activeNav === 'packages' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    SouthernWell Care Navigation Packages &amp; Rates
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Non-Clinical Monthly Retainers &amp; Community Support (No skilled nursing or medical care is performed)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white border border-card-border p-5 space-y-2.5 shadow-xs">
                    <span className="px-3 py-1 rounded-md bg-navy-soft text-navy-slate text-xs font-bold inline-block">
                      Essentials Tier
                    </span>
                    <div className="font-heading text-3xl font-bold text-oxford-dark tabular-nums">
                      $175 <span className="text-sm font-sans font-normal text-obsidian/70">/ month</span>
                    </div>
                    <p className="text-xs text-obsidian/75">
                      Designed for independent older adults needing scheduled check-ins and appointment calendar coordination.
                    </p>
                    <ul className="space-y-1 text-xs text-obsidian/85 pt-2 list-disc pl-4">
                      <li>Weekly telephonic self-advocacy check-ins</li>
                      <li>Prescription refill reminders</li>
                      <li>Digital appointment sync</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-white border-2 border-oxford p-5 space-y-2.5 shadow-xs">
                    <span className="px-3 py-1 rounded-md bg-navy-soft text-oxford-dark text-xs font-bold inline-block">
                      Signature Tier
                    </span>
                    <div className="font-heading text-3xl font-bold text-oxford-dark tabular-nums">
                      $285 <span className="text-sm font-sans font-normal text-obsidian/70">/ month</span>
                    </div>
                    <p className="text-xs text-obsidian/75">
                      Popular care navigation plan for South Mississippi families requesting regular home visits.
                    </p>
                    <ul className="space-y-1 text-xs text-obsidian/85 pt-2 list-disc pl-4">
                      <li>1 in-home walkthrough &amp; pillbox organization review monthly</li>
                      <li>Bi-weekly self-advocacy check-ins</li>
                      <li>Physical 5-Tab Care Dossier Binder</li>
                      <li>Local specialist appointment scheduling</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-white border border-card-border p-5 space-y-2.5 shadow-xs">
                    <span className="px-3 py-1 rounded-md bg-oxford text-brass-light text-xs font-bold inline-block">
                      Comprehensive Care Navigation
                    </span>
                    <div className="font-heading text-3xl font-bold text-oxford-dark tabular-nums">
                      $350 <span className="text-sm font-sans font-normal text-obsidian/70">/ month</span>
                    </div>
                    <p className="text-xs text-obsidian/75">
                      Full-spectrum appointment accompaniment and family advocacy across Pine Belt &amp; Coast corridors.
                    </p>
                    <ul className="space-y-1 text-xs text-obsidian/85 pt-2 list-disc pl-4">
                      <li>Weekly in-home self-advocacy check-ins</li>
                      <li>Appointment accompaniment &amp; plain-language notes</li>
                      <li>24-hour post-visit family briefings</li>
                      <li>Priority care coordinator hotline access</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-white border border-oxford/25 p-5 space-y-2.5 shadow-xs">
                    <span className="px-3 py-1 rounded-md bg-brass-soft text-brass-deep text-xs font-bold inline-block">
                      Community Support
                    </span>
                    <div className="font-heading text-2xl font-bold text-oxford-dark">
                      Granny Doris Porch Fund
                    </div>
                    <p className="text-xs text-obsidian/80 leading-relaxed">
                      Endowed sliding scale fund providing subsidized care navigation services (20%–35% discount or full grant) for eligible South Mississippi older adults.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 14. CLIENT HANDBOOK                                           */}
            {/* ============================================================= */}
            {activeNav === 'handbook' && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Client &amp; Family Welcome Handbook
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Core Principles, Scope of Non-Clinical Care Coordination, and Emergency Safety Protocols
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-card-border p-6 space-y-5 shadow-xs">
                  <div>
                    <h3 className="font-heading text-2xl font-bold text-oxford-dark">
                      Southern Hospitality &amp; Diligent Advocacy
                    </h3>
                    <p className="text-sm text-obsidian/85 leading-relaxed mt-2">
                      Welcome to SouthernWell Case Management Services (SouthernWell of South Mississippi), founded by Jasmeen Williams, LPN, BS-HHS. Our mission is to ease the logistical strain on Mississippi families through dignified, organized, strictly non-clinical care navigation. We stand beside older adults and their families, ensuring appointments are kept, records stay orderly, and every voice is heard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl bg-canvas border border-card-border p-4">
                      <strong className="text-oxford-dark block mb-1">1. What We Do</strong>
                      <p className="text-xs text-obsidian/80 leading-relaxed">
                        Coordinate transport, organize records in your 5-Tab binder, attend provider appointments to take plain-language notes, and conduct friendly home self-advocacy check-ins.
                      </p>
                    </div>
                    <div className="rounded-xl bg-canvas border border-card-border p-4">
                      <strong className="text-oxford-dark block mb-1">2. What We Do Not Do</strong>
                      <p className="text-xs text-obsidian/80 leading-relaxed">
                        No skilled nursing or medical care is performed. We do not administer injections, dispense medications into mouths, diagnose conditions, or replace emergency medical responders.
                      </p>
                    </div>
                    <div className="rounded-xl bg-canvas border border-card-border p-4">
                      <strong className="text-oxford-dark block mb-1">3. The Porch Promise</strong>
                      <p className="text-xs text-obsidian/80 leading-relaxed">
                        Every family receives honest communication, transparent billing, and compassionate advocacy rooted in respect for our elders.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 15. LAUNCH READINESS CHECKLIST                                */}
            {/* ============================================================= */}
            {activeNav === 'launch' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                      Launch Readiness Checklist
                    </h2>
                    <p className="text-sm text-obsidian/80 mt-1">
                      Operational readiness verification across Hattiesburg (Pine Belt) and Mississippi Gulf Coast corridors.
                    </p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-md bg-navy-soft text-navy-slate text-xs font-bold tabular-nums">
                    {
                      LAUNCH_CHECKLIST_ITEMS.filter((item) => ops.launchDone[item.id])
                        .length
                    }{' '}
                    / {LAUNCH_CHECKLIST_ITEMS.length} Complete
                  </span>
                </div>

                <div className="rounded-2xl bg-white border border-card-border divide-y divide-card-border shadow-xs">
                  {LAUNCH_CHECKLIST_ITEMS.map((item) => {
                    const checked = Boolean(ops.launchDone[item.id]);
                    return (
                      <label
                        key={item.id}
                        className="p-4 flex items-start gap-3.5 cursor-pointer hover:bg-canvas/60 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setOps((prev) => ({
                              ...prev,
                              launchDone: {
                                ...prev.launchDone,
                                [item.id]: e.target.checked,
                              },
                            }))
                          }
                          className="mt-1 w-4 h-4 accent-oxford shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-brass-deep block">
                            {item.category}
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              checked ? 'text-oxford-dark' : 'text-obsidian/80'
                            }`}
                          >
                            {item.title}
                          </span>
                        </div>
                        {checked && (
                          <ClipboardCheck className="w-4 h-4 text-oxford shrink-0 mt-1" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 16. CLIENT WORKBOOKS                                          */}
            {/* ============================================================= */}
            {activeNav === 'books' && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
                    Client Workbooks &amp; Life Planners
                  </h2>
                  <p className="text-sm text-obsidian/80 mt-1">
                    Live Master Database Workbook synced with guided toolkits for Health Literacy, Advance Planning, and Life History
                  </p>
                </div>

                <MasterWorkbookPanel />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-2">
                    <Shield className="w-5 h-5 text-oxford" />
                    <strong className="font-heading text-xl text-oxford-dark block">
                      Workbook 1: My Care Story
                    </strong>
                    <p className="text-xs sm:text-sm text-obsidian/80 leading-relaxed">
                      A plain-language guide for compiling personal health history, allergies, past procedures, and favorite comfort routines.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-2">
                    <ClipboardList className="w-5 h-5 text-navy-slate" />
                    <strong className="font-heading text-xl text-oxford-dark block">
                      Workbook 2: What to Ask the Doctor
                    </strong>
                    <p className="text-xs sm:text-sm text-obsidian/80 leading-relaxed">
                      Pre-visit prompt sheets tailored for Cardiology, Orthopedics, Neurology, and Primary Care appointments.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white border border-card-border p-5 shadow-xs space-y-2">
                    <BookOpen className="w-5 h-5 text-brass-deep" />
                    <strong className="font-heading text-xl text-oxford-dark block">
                      Workbook 3: Legacy &amp; Important Papers
                    </strong>
                    <p className="text-xs sm:text-sm text-obsidian/80 leading-relaxed">
                      Checklist locating deeds, cemetery plots, insurance policies, and family heirloom wishes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
