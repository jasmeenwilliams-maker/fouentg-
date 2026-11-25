import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import {
  Printer,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Eraser,
  Check,
  ShieldCheck,
  Lock,
  LockOpen,
  KeyRound,
  User,
  Eye,
  EyeOff,
  FileDown,
  Table2,
  Info,
  X,
  Send,
  Pill,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Compass,
} from 'lucide-react';
import {
  ENROLLMENT_STAGES,
  type EnrollmentStage,
  type FormFieldItem,
} from '../data/enrollmentFormsData';
import { MasterWorkbookPanel } from './MasterWorkbookPanel';
import { SheetsSyncControl } from './SheetsSyncControl';
import { FORMS_SYNC_EVENT } from '../utils/workbookSync';
import { syncRecordToSheet } from '../utils/sheetsSync';

type FormStore = Record<string, unknown>;

const STORAGE_KEY = 'swf';
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

function loadInitialStore(): FormStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FormStore) : {};
  } catch {
    return {};
  }
}

function buildEnrollmentSheetRecord(
  formStore: FormStore,
  fallbackClient: string,
  stageLabel: string
): Record<string, unknown> {
  const sanitizedFields: Record<string, unknown> = {};
  Object.entries(formStore).forEach(([k, v]) => {
    if (typeof v === 'string' && v.startsWith('data:image/')) {
      sanitizedFields[k] = '[Digital Signature Captured]';
    } else if (Array.isArray(v)) {
      sanitizedFields[k] = v.join('; ');
    } else {
      sanitizedFields[k] = v;
    }
  });
  const clientName =
    (typeof formStore['client'] === 'string' && formStore['client'].trim()) ||
    fallbackClient ||
    'Client Household';
  return {
    clientName,
    stage: stageLabel,
    coordinator: 'Jasmeen Williams, LPN, BS-HHS',
    scope: 'Non-clinical care navigation only',
    ...sanitizedFields,
  };
}

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (dataUrl: string | undefined) => void;
}

function SignaturePad({ label, value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#16263B';

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  const getCoords = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [
      ((ev.clientX - rect.left) * canvas.width) / rect.width,
      ((ev.clientY - rect.top) * canvas.height) / rect.height,
    ];
  };

  const handlePointerDown = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawingRef.current = true;
    canvas.setPointerCapture(ev.pointerId);
    const [x, y] = getCoords(ev);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#16263B';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y);
    ctx.stroke();
  };

  const handlePointerMove = (ev: PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const [x, y] = getCoords(ev);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      onChange(canvas.toDataURL());
    } catch {
      // ignore storage errors
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange(undefined);
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold uppercase tracking-wider text-oxford-dark">
        {label}
      </span>
      <canvas
        ref={canvasRef}
        width={480}
        height={120}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full max-w-[480px] h-[120px] border border-brass/70 rounded-lg bg-white touch-none block cursor-crosshair"
      />
      <div className="print:hidden">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-oxford-dark transition-colors cursor-pointer"
        >
          <Eraser className="w-3.5 h-3.5 text-oxford" />
          <span>Clear Signature</span>
        </button>
      </div>
    </div>
  );
}

interface EnrollmentFormsScreenProps {
  onBackToOverview: () => void;
  onOpenOperationsHub?: () => void;
  initialStage?: number;
  initialPortalTab?: 'stages' | 'workbook';
}

export function EnrollmentFormsScreen({
  onBackToOverview,
  onOpenOperationsHub,
  initialStage = 0,
  initialPortalTab = 'stages',
}: EnrollmentFormsScreenProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [activeUser, setActiveUser] = useState<string>(() => {
    try {
      return sessionStorage.getItem(AUTH_USER_KEY) || 'Margaret E. Carlisle';
    } catch {
      return 'Margaret E. Carlisle';
    }
  });

  // Login gate state
  const [clientIdInput, setClientIdInput] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Access request modal state
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessSubmitted, setAccessSubmitted] = useState(false);
  const [reqClientName, setReqClientName] = useState('');
  const [reqUserName, setReqUserName] = useState('');
  const [reqRelation, setReqRelation] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // Portal forms state
  const [store, setStore] = useState<FormStore>(loadInitialStore);
  const [currentStage, setCurrentStage] = useState<number>(initialStage);
  const [activePortalTab, setActivePortalTab] = useState<'stages' | 'workbook'>(
    initialPortalTab
  );
  const [printMode, setPrintMode] = useState<'active' | 'all'>('active');
  const [confirmClear, setConfirmClear] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const sheetSyncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (sheetSyncTimerRef.current) {
        window.clearTimeout(sheetSyncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentStage(initialStage);
  }, [initialStage]);

  useEffect(() => {
    setActivePortalTab(initialPortalTab);
  }, [initialPortalTab]);

  useEffect(() => {
    const handleSync = (ev: Event) => {
      const detail = (ev as CustomEvent<FormStore>).detail;
      if (detail && typeof detail === 'object') {
        setStore(detail);
      } else {
        setStore(loadInitialStore());
      }
    };
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY) {
        setStore(loadInitialStore());
      }
    };
    window.addEventListener(FORMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(FORMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && accessModalOpen) {
        setAccessModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [accessModalOpen]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const syncEnrollmentPacketNow = async (targetStore: FormStore, notifyUser = false) => {
    const stageLabel = ENROLLMENT_STAGES[currentStage]?.shortLabel || 'Stage 1';
    const record = buildEnrollmentSheetRecord(targetStore, activeUser, stageLabel);
    const result = await syncRecordToSheet('Enrollments', record, {
      localSaveFn: () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(targetStore));
        } catch {
          // ignore quota errors
        }
      },
    });
    if (notifyUser) {
      showToast(
        result.status === 'Synced to Sheet'
          ? 'Enrollment packet saved locally and synced to Google Sheets.'
          : result.status === 'Sync Error'
            ? `Saved locally to browser; Google Sheets sync error: ${result.error || 'check setup'}`
            : 'Enrollment packet saved locally (pending Google Sheets webhook setup).'
      );
    }
  };

  const updateValue = (key: string, value: unknown) => {
    setStore((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      window.dispatchEvent(new CustomEvent(FORMS_SYNC_EVENT, { detail: next }));

      if (sheetSyncTimerRef.current) {
        window.clearTimeout(sheetSyncTimerRef.current);
      }
      sheetSyncTimerRef.current = window.setTimeout(() => {
        void syncEnrollmentPacketNow(next, false);
      }, 1000);

      return next;
    });
  };

  const handleVerifyPasscode = (e: FormEvent) => {
    e.preventDefault();
    const cleanedPwd = passcodeInput.trim().toLowerCase();
    const cleanedUser = clientIdInput.trim() || 'Margaret E. Carlisle';

    if (VALID_PASSCODES.includes(cleanedPwd)) {
      setAuthError(false);
      try {
        sessionStorage.setItem(AUTH_KEY, 'true');
        sessionStorage.setItem(AUTH_USER_KEY, cleanedUser);
      } catch {
        // ignore session errors
      }
      if (!store['client']) {
        updateValue('client', cleanedUser);
      }
      setActiveUser(cleanedUser);
      setIsAuthenticated(true);
    } else {
      setAuthError(true);
    }
  };

  const handleLockPortal = () => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore
    }
    setPasscodeInput('');
    setAuthError(false);
    setIsAuthenticated(false);
  };

  const handleOpenAccessModal = () => {
    if (clientIdInput.trim() && !reqClientName) {
      setReqClientName(clientIdInput.trim());
    }
    setAccessSubmitted(false);
    setAccessModalOpen(true);
  };

  const handleExportRecords = () => {
    const rawName =
      (typeof store['client'] === 'string' && store['client'].trim()) ||
      activeUser ||
      'Client';
    const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const payload = {
      organization: 'SouthernWell Case Management Services LLC',
      subBrand: 'SouthernWell of South Mississippi',
      portal: 'Care Dossier Intake & Non-Clinical Navigation System',
      scopeNotice:
        'Non-clinical care navigation and family advocacy only; no skilled nursing or medical care is performed.',
      exportedAt: new Date().toISOString(),
      client: rawName,
      recordData: store,
    };
    const fileName = `SouthernWell_${cleanName}_CareDossier_Records.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported backup records: ${fileName}`);
  };

  const handleExportMedicationsCsv = () => {
    const rawName =
      (typeof store['client'] === 'string' && store['client'].trim()) ||
      activeUser ||
      'Client';
    const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const walkthroughDate =
      (typeof store['s3_date'] === 'string' && store['s3_date']) ||
      new Date().toISOString().split('T')[0];
    const todayIso = new Date().toISOString().split('T')[0];

    const escapeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    };

    const csvLines: string[] = [
      escapeCsv('SouthernWell Case Management Services LLC — Medication Label Inventory Log'),
      `${escapeCsv('Client Legal Name')},${escapeCsv(rawName)}`,
      `${escapeCsv('Walkthrough / Inventory Date')},${escapeCsv(walkthroughDate)}`,
      `${escapeCsv('Export Date')},${escapeCsv(todayIso)}`,
      `${escapeCsv('Care Coordinator')},${escapeCsv('Jasmeen Williams, LPN, BS-HHS (SouthernWell of South Mississippi)')}`,
      `${escapeCsv('Non-Clinical Scope Notice')},${escapeCsv('Logistical inventory per prescription bottle labels only; no skilled nursing, medical care, or prescribing is performed.')}`,
      '',
      [
        'Row / Entry',
        'Medication / Supplement Name & Label Info',
        'Bottle Directions',
        'Discrepancy Flagged (Duplicate / Expired / Low Refill)',
      ]
        .map(escapeCsv)
        .join(','),
    ];

    for (let r = 0; r < 6; r++) {
      const col0 = typeof store[`s3_meds_table_${r}_0`] === 'string' ? store[`s3_meds_table_${r}_0`] : '';
      const col1 = typeof store[`s3_meds_table_${r}_1`] === 'string' ? store[`s3_meds_table_${r}_1`] : '';
      const col2 = typeof store[`s3_meds_table_${r}_2`] === 'string' ? store[`s3_meds_table_${r}_2`] : '';
      csvLines.push([`Slot ${r + 1}`, col0, col1, col2].map(escapeCsv).join(','));
    }

    const csvString = '\uFEFF' + csvLines.join('\r\n');
    const fileName = `SouthernWell_${cleanName}_Medication_Inventory_${todayIso}.csv`;
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Medication Label Inventory exported as CSV (${fileName})`);
  };

  const toggleChoice = (key: string, option: string, single?: boolean) => {
    const existing = Array.isArray(store[key]) ? (store[key] as string[]) : [];
    const isChecked = existing.includes(option);
    if (single) {
      updateValue(key, isChecked ? [] : [option]);
    } else {
      updateValue(
        key,
        isChecked ? existing.filter((x) => x !== option) : [...existing, option]
      );
    }
  };

  const handlePrint = (mode: 'active' | 'all') => {
    setPrintMode(mode);
    window.setTimeout(() => {
      window.print();
    }, 60);
  };

  const handleConfirmClearAll = () => {
    setStore({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(FORMS_SYNC_EVENT, { detail: {} }));
    setConfirmClear(false);
    showToast('All enrollment form fields have been reset.');
  };

  const isStageStarted = (stage: EnrollmentStage) => {
    return stage.sections.some((sec) =>
      sec.items.some((item) => {
        if (item.kind === 'note' || item.kind === 'fixed') return false;
        if (item.kind === 'table') {
          return item.rows.some((_, ri) =>
            item.headers.some((_, ci) => {
              const val = store[`${item.key}_${ri}_${ci}`];
              return typeof val === 'string' && val.trim().length > 0;
            })
          );
        }
        const val = store[item.key];
        if (Array.isArray(val)) return val.length > 0;
        return typeof val === 'string' && val.trim().length > 0;
      })
    );
  };

  const renderItem = (item: FormFieldItem) => {
    if (item.kind === 'note') {
      return (
        <p
          key={item.text}
          className="text-xs sm:text-sm italic text-obsidian/80 bg-canvas p-3 rounded-lg border border-card-border"
        >
          {item.text}
        </p>
      );
    }

    if (item.kind === 'fixed') {
      return (
        <div key={item.label}>
          <span className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1">
            {item.label}
          </span>
          <div className="py-2 border-b border-oxford/20 text-sm font-semibold text-oxford-dark">
            {item.value}
          </div>
        </div>
      );
    }

    if (item.kind === 'field') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div key={`${item.key}-${item.label}`}>
          <label className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1">
            {item.label}
          </label>
          <input
            type={item.inputType}
            value={val}
            onChange={(e) => updateValue(item.key, e.target.value)}
            className="w-full py-2 px-2.5 border border-card-border bg-canvas rounded-md text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
          />
        </div>
      );
    }

    if (item.kind === 'textarea') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div key={item.key}>
          <label className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1.5">
            {item.label}
          </label>
          <textarea
            rows={3}
            value={val}
            onChange={(e) => updateValue(item.key, e.target.value)}
            className="w-full p-3 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
          />
        </div>
      );
    }

    if (item.kind === 'choices') {
      const selected = Array.isArray(store[item.key]) ? (store[item.key] as string[]) : [];
      const stackCol = item.options.some((opt) => opt.length > 40);
      return (
        <div key={item.key}>
          <span className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-2">
            {item.label}
          </span>
          <div className={`flex flex-wrap gap-x-5 gap-y-2 ${stackCol ? 'flex-col' : ''}`}>
            {item.options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-start gap-2.5 cursor-pointer py-0.5 text-sm text-obsidian/90"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChoice(item.key, opt, item.single)}
                    className="mt-1 w-4 h-4 accent-oxford shrink-0 cursor-pointer"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    if (item.kind === 'initials') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div
          key={item.key}
          className="pt-3 border-t border-dashed border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <p className="text-sm text-obsidian/85 leading-relaxed flex-1">{item.text}</p>
          <input
            type="text"
            placeholder="Initials"
            maxLength={4}
            value={val}
            onChange={(e) => updateValue(item.key, e.target.value)}
            className="w-20 text-center py-1.5 px-2 border border-card-border bg-canvas rounded-md text-sm font-bold uppercase text-oxford-dark focus:outline-none focus:border-oxford focus:bg-white shrink-0"
          />
        </div>
      );
    }

    if (item.kind === 'table') {
      return (
        <div key={item.key} className="space-y-3">
          {item.key === 's3_meds_table' && (
            <div className="print:hidden p-3.5 rounded-lg bg-navy-soft/80 border border-oxford/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Pill className="w-5 h-5 text-oxford shrink-0" />
                <div>
                  <span className="text-xs font-bold text-oxford-dark block">
                    Medication Bottle Inventory Log (6-Slot Reconciled Schedule)
                  </span>
                  <span className="text-[11px] text-obsidian/75">
                    Exportable spreadsheet format for primary physicians, specialists, and authorized family advocates
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportMedicationsCsv}
                className="px-3.5 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Medication Log (CSV)</span>
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-card-border">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr>
                  {item.headers.map((header) => (
                    <th
                      key={header}
                      className="bg-oxford text-brass-light text-left px-3 py-2 font-semibold"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {item.rows.map((rowLabel, ri) => {
                  const isFixedCol =
                    Boolean(item.fixedFirstCol) &&
                    /[A-Za-z]/.test(rowLabel) &&
                    rowLabel.length > 3;

                  return (
                    <tr key={`${item.key}-${ri}`} className="border-t border-card-border">
                      {item.headers.map((_, ci) => {
                        if (ci === 0 && isFixedCol) {
                          return (
                            <td
                              key={ci}
                              className="px-3 py-2 font-semibold text-oxford-dark bg-canvas/60 w-[28%] border-r border-card-border"
                            >
                              {rowLabel}
                            </td>
                          );
                        }
                        const cellKey = `${item.key}_${ri}_${ci}`;
                        const cellVal =
                          typeof store[cellKey] === 'string'
                            ? (store[cellKey] as string)
                            : '';
                        return (
                          <td
                            key={ci}
                            className="p-0 border-r last:border-r-0 border-card-border bg-white"
                          >
                            <input
                              type="text"
                              value={cellVal}
                              placeholder={ci === 0 ? rowLabel : ''}
                              onChange={(e) => updateValue(cellKey, e.target.value)}
                              className="w-full px-2.5 py-2 bg-transparent text-obsidian focus:outline-none focus:bg-canvas/40"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (item.kind === 'signature') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <SignaturePad
          key={item.key}
          label={item.label}
          value={val}
          onChange={(dataUrl) => updateValue(item.key, dataUrl)}
        />
      );
    }

    return null;
  };

  return (
    <section className="py-10 md:py-14 bg-canvas min-h-[calc(100vh-5rem)]">
      <div className="max-w-[960px] mx-auto px-5 sm:px-8">
        {/* Top Context Banner */}
        <div className="print:hidden pb-6 border-b border-card-border flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={onBackToOverview}
              className="text-xs font-semibold uppercase tracking-wider text-navy-slate hover:text-oxford-dark transition-colors mb-2 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>← Back to Service Overview</span>
            </button>
            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-oxford-dark leading-tight">
              Secure Client &amp; Family Advocacy Forms Portal
            </h1>
            <p className="text-sm text-obsidian/80 mt-1">
              SouthernWell Case Management Services · Non-Clinical Care Navigation (No Skilled Nursing or Medical Care Performed)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-navy-slate font-semibold shrink-0">
            <Lock className="w-4 h-4 text-oxford shrink-0" />
            <span>Protected Household Session</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* PASSWORD / PIN PROTECTION GATE                                    */}
        {/* ================================================================= */}
        {!isAuthenticated ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-full max-w-[480px] bg-white border border-card-border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-oxford to-oxford-dark text-canvas px-7 py-8 text-center border-b-2 border-brass">
                <div className="w-13 h-13 mx-auto mb-4 rounded-full bg-white/10 border border-brass/70 flex items-center justify-center text-brass-light">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="font-heading text-3xl font-semibold text-white mb-1.5">
                  Client &amp; Family Access
                </h2>
                <p className="text-xs sm:text-sm text-canvas/85 leading-relaxed">
                  Please enter your authorized household passcode or client PIN to access the 5-stage Care Dossier enrollment forms.
                </p>
              </div>

              <form onSubmit={handleVerifyPasscode} className="p-7 space-y-5">
                <div>
                  <label
                    htmlFor="client-id-input"
                    className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1.5"
                  >
                    Client Household ID or Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-navy-slate absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="client-id-input"
                      type="text"
                      required
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="e.g. Carlisle or SW-2025"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="passcode-input"
                    className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1.5"
                  >
                    Access PIN / Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-navy-slate absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="passcode-input"
                      type={showPasscode ? 'text' : 'password'}
                      required
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="Enter secure PIN"
                      className="w-full pl-10 pr-11 py-3 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode((prev) => !prev)}
                      aria-label={showPasscode ? 'Hide PIN' : 'Show PIN'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-slate hover:text-oxford-dark p-1 cursor-pointer"
                    >
                      {showPasscode ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LockOpen className="w-4 h-4 text-brass-light" />
                  <span>Unlock Care Enrollment Forms</span>
                </button>

                {authError && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-[#FDEDEC] border border-[#F5B7B1] text-xs font-medium text-[#9E3524] flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Incorrect passcode. Please verify with Jasmeen Williams, LPN, BS-HHS or try demo PIN:{' '}
                      <strong>southernwell2025</strong>
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-navy-soft/80 border border-dashed border-oxford/30 text-xs text-oxford-dark leading-relaxed">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-navy-slate">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Client &amp; Coordinator Demo Passcode</span>
                  </div>
                  Passcode: <strong className="tracking-wide">southernwell2025</strong> or{' '}
                  <strong className="tracking-wide">2025</strong>
                  <span className="block text-[11px] text-obsidian/75 mt-1">
                    All entries save automatically in this browser session.
                  </span>
                </div>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleOpenAccessModal}
                    className="text-xs font-semibold text-oxford-dark underline underline-offset-4 hover:text-oxford transition-colors cursor-pointer"
                  >
                    Forgot PIN or Need Household Access?
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* =============================================================== */
          /* UNLOCKED PORTAL: SESSION BAR + 5-STAGE FORMS                    */
          /* =============================================================== */
          <>
            {/* Active Portal Bar */}
            <div className="print:hidden mt-6 p-3.5 sm:px-5 rounded-xl bg-white border border-card-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-navy-slate">
                  <ShieldCheck className="w-4 h-4 text-oxford shrink-0" />
                  <span>
                    Secure Active Session:{' '}
                    <strong className="text-oxford-dark">{activeUser}</strong>
                  </span>
                </div>
                <SheetsSyncControl
                  compact
                  syncLabel="Save & Sync Packet"
                  onSyncNow={() => syncEnrollmentPacketNow(store, true)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRecords}
                  className="px-3 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-oxford" />
                  <span>Export Records</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportMedicationsCsv}
                  className="px-3 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Table2 className="w-3.5 h-3.5 text-navy-slate" />
                  <span>Export Meds (CSV)</span>
                </button>
                {onOpenOperationsHub && (
                  <button
                    type="button"
                    onClick={onOpenOperationsHub}
                    className="px-3 py-1.5 rounded-lg border border-oxford/25 bg-navy-soft/80 hover:bg-navy-soft text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Compass className="w-3.5 h-3.5 text-oxford" />
                    <span>Operations Hub</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLockPortal}
                  className="px-3 py-1.5 rounded-lg border border-oxford/30 bg-white hover:bg-canvas text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-oxford" />
                  <span>Lock Portal</span>
                </button>
              </div>
            </div>

            {/* Stage Switcher Bar */}
            <div className="print:hidden mt-5 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-card-border">
              <div className="flex flex-wrap items-center gap-2">
                {ENROLLMENT_STAGES.map((st, idx) => {
                  const active = activePortalTab === 'stages' && currentStage === idx;
                  const started = isStageStarted(st);
                  return (
                    <button
                      key={st.shortLabel}
                      type="button"
                      onClick={() => {
                        setActivePortalTab('stages');
                        setCurrentStage(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-oxford border-oxford text-canvas'
                          : 'bg-white border-card-border text-oxford-dark hover:border-oxford'
                      }`}
                    >
                      <span>{st.shortLabel}</span>
                      {started && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            active ? 'text-brass-light' : 'text-oxford'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    setActivePortalTab('workbook');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activePortalTab === 'workbook'
                      ? 'bg-oxford border-oxford text-canvas'
                      : 'bg-white border-card-border text-oxford-dark hover:border-oxford'
                  }`}
                >
                  <FileSpreadsheet
                    className={`w-3.5 h-3.5 ${
                      activePortalTab === 'workbook' ? 'text-brass-light' : 'text-oxford'
                    }`}
                  />
                  <span>Master Workbook</span>
                </button>
              </div>

              {/* Clear All Inline Confirmation */}
              <div>
                {confirmClear ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-obsidian/80">
                      Reset all fields?
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirmClearAll}
                      className="px-3 py-1.5 rounded-lg bg-[#9E3524] text-white text-xs font-semibold cursor-pointer"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 rounded-lg border border-card-border bg-white text-xs font-semibold text-oxford-dark cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="px-3.5 py-2 rounded-lg border border-[#FADBD8] bg-[#FDEDEC] hover:bg-[#F9D8D5] text-xs font-semibold text-[#9E3524] inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Data</span>
                  </button>
                )}
              </div>
            </div>

            {/* Master Workbook View */}
            {activePortalTab === 'workbook' && (
              <div className="mt-6 print:hidden">
                <MasterWorkbookPanel
                  onSyncToStage5={(summaryText) => {
                    updateValue('s5_mood_cognition', summaryText);
                    setActivePortalTab('stages');
                    setCurrentStage(4);
                    showToast('Synced Master Workbook check-ins into Stage 5 Wellness Log.');
                  }}
                />
              </div>
            )}

            {/* Stages Content */}
            <div className="mt-6 space-y-10">
              {ENROLLMENT_STAGES.map((stage, idx) => {
                const isVisibleOnScreen =
                  activePortalTab === 'stages' && idx === currentStage;
                const visibleInPrint = printMode === 'all' || isVisibleOnScreen;

                return (
                  <div
                    key={stage.heading}
                    className={`${isVisibleOnScreen ? 'block' : 'hidden'} ${
                      visibleInPrint
                        ? 'print:block print:break-after-page'
                        : 'print:hidden'
                    }`}
                  >
                    <div className="mb-5">
                      <h2 className="font-heading text-2xl sm:text-3xl font-bold text-oxford-dark">
                        {stage.heading}
                      </h2>
                      <p className="text-sm italic text-navy-slate mt-1">{stage.subtitle}</p>
                    </div>

                    <div className="space-y-5">
                      {stage.sections.map((section) => {
                        const groupedBlocks: Array<
                          | { type: 'grid'; items: FormFieldItem[] }
                          | { type: 'single'; item: FormFieldItem }
                        > = [];

                        section.items.forEach((it) => {
                          const isGridItem = it.kind === 'field' || it.kind === 'fixed';
                          const last = groupedBlocks[groupedBlocks.length - 1];
                          if (isGridItem) {
                            if (last && last.type === 'grid') {
                              last.items.push(it);
                            } else {
                              groupedBlocks.push({ type: 'grid', items: [it] });
                            }
                          } else {
                            groupedBlocks.push({ type: 'single', item: it });
                          }
                        });

                        return (
                          <div
                            key={section.title}
                            className="bg-white rounded-xl border border-card-border overflow-hidden break-inside-avoid"
                          >
                            <div className="bg-oxford text-canvas px-5 py-3 text-xs font-bold tracking-wider uppercase border-b-2 border-brass">
                              {section.title}
                            </div>
                            <div className="p-5 sm:p-6 space-y-5">
                              {groupedBlocks.map((block, bIdx) =>
                                block.type === 'grid' ? (
                                  <div
                                    key={bIdx}
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                                  >
                                    {block.items.map(renderItem)}
                                  </div>
                                ) : (
                                  <div key={bIdx}>{renderItem(block.item)}</div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stage Footer Navigation Controls */}
                    <div className="print:hidden mt-6 pt-4 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          setCurrentStage((prev) => Math.max(0, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-4 py-2.5 rounded-lg border border-oxford/30 bg-white hover:bg-canvas-muted disabled:opacity-40 text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous Stage</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handlePrint('active')}
                          className="px-4 py-2.5 rounded-lg border border-oxford/30 bg-white hover:bg-canvas-muted text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-oxford" />
                          <span>Print This Stage</span>
                        </button>

                        {idx < ENROLLMENT_STAGES.length - 1 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentStage((prev) =>
                                Math.min(ENROLLMENT_STAGES.length - 1, prev + 1)
                              );
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>Next Stage</span>
                            <ArrowRight className="w-3.5 h-3.5 text-brass-light" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePrint('all')}
                            className="px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-brass-light" />
                            <span>Print Full 5-Stage Packet</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* =================================================================== */}
      {/* REQUEST HOUSEHOLD ACCESS / PIN RESET MODAL                          */}
      {/* =================================================================== */}
      {accessModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-modal-title"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setAccessModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-oxford-dark/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl max-w-[540px] w-full border border-card-border shadow-xl overflow-hidden my-auto relative">
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setAccessModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="bg-gradient-to-br from-oxford to-oxford-dark text-white px-7 py-6 border-b-2 border-brass">
              <div className="w-11 h-11 rounded-full bg-white/15 border border-brass/70 flex items-center justify-center text-brass-light mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3
                id="access-modal-title"
                className="font-heading text-2xl font-bold text-white"
              >
                Request Household Access or PIN Reset
              </h3>
              <p className="text-xs text-canvas/90 mt-1 leading-relaxed">
                If you are an authorized family member, adult child proxy, or POA and need your household PIN re-sent or verified by Jasmeen Williams, LPN, BS-HHS, submit your details below.
              </p>
            </div>

            <div className="p-6 sm:p-7">
              {accessSubmitted ? (
                <div className="bg-navy-soft border border-oxford/25 rounded-xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-oxford text-white flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-heading text-xl font-bold text-oxford-dark">
                    Access Request Received
                  </h4>
                  <p className="text-xs sm:text-sm text-oxford-dark leading-relaxed">
                    For client confidentiality, Jasmeen Williams, LPN, BS-HHS will verify your family authorization against our service records and send your household access credentials via encrypted email or phone within 2 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAccessModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg bg-oxford text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAccessSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="req-client-name"
                      className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                    >
                      Client Full Name *
                    </label>
                    <input
                      id="req-client-name"
                      type="text"
                      required
                      value={reqClientName}
                      onChange={(e) => setReqClientName(e.target.value)}
                      placeholder="e.g. Margaret E. Carlisle"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="req-user-name"
                        className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                      >
                        Your Full Name *
                      </label>
                      <input
                        id="req-user-name"
                        type="text"
                        required
                        value={reqUserName}
                        onChange={(e) => setReqUserName(e.target.value)}
                        placeholder="e.g. Sarah Carlisle Davis"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="req-relation"
                        className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                      >
                        Relationship to Client *
                      </label>
                      <input
                        id="req-relation"
                        type="text"
                        required
                        value={reqRelation}
                        onChange={(e) => setReqRelation(e.target.value)}
                        placeholder="e.g. Daughter / Healthcare POA"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="req-email"
                        className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                      >
                        Email for Verification *
                      </label>
                      <input
                        id="req-email"
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="family@example.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="req-phone"
                        className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                      >
                        Direct Mobile / Phone *
                      </label>
                      <input
                        id="req-phone"
                        type="tel"
                        required
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="(601) 555-0192"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="req-notes"
                      className="block text-xs font-bold uppercase tracking-wider text-oxford-dark mb-1"
                    >
                      Reason / Verification Notes (Optional)
                    </label>
                    <textarea
                      id="req-notes"
                      rows={2}
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      placeholder="e.g. Setting up Care Dossier from out of state, misplaced code, or new POA appointment"
                      className="w-full px-3.5 py-2 rounded-lg border border-card-border bg-canvas text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAccessModalOpen(false)}
                      className="px-4 py-2.5 rounded-lg border border-card-border bg-transparent text-xs font-semibold text-oxford-dark cursor-pointer"
                    >
                      Cancel / Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-white text-xs font-semibold inline-flex items-center gap-1.5 border border-brass/50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-brass-light" />
                      <span>Submit Access Request</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EXPORT TOAST NOTIFICATION                                           */}
      {/* =================================================================== */}
      {toastMsg && (
        <div
          role="status"
          className="print:hidden fixed bottom-6 right-6 z-50 bg-oxford-dark text-white border border-brass/60 rounded-lg px-4 py-3 shadow-lg flex items-center gap-2.5 text-xs sm:text-sm max-w-md"
        >
          <CheckCircle2 className="w-4 h-4 text-brass-light shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </section>
  );
}
