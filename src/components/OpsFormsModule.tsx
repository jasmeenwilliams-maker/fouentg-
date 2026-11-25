import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eraser,
  Printer,
  RotateCcw,
} from 'lucide-react';
import {
  ENROLLMENT_STAGES,
  type FormFieldItem,
} from '../data/enrollmentFormsData';
import { FORMS_SYNC_EVENT } from '../utils/workbookSync';
import { syncRecordToSheet } from '../utils/sheetsSync';
import { SheetsSyncControl } from './SheetsSyncControl';

type FormStore = Record<string, unknown>;
const FORMS_STORAGE_KEY = 'swf';

function loadFormsStore(): FormStore {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FormStore) : {};
  } catch {
    return {};
  }
}

function buildOpsFormSheetRecord(
  formStore: FormStore,
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
    'Client Household';
  return {
    clientName,
    stage: stageLabel,
    coordinator: 'Jasmeen Williams, LPN, BS-HHS',
    scope: 'Non-clinical care navigation only',
    ...sanitizedFields,
  };
}

function OpsFormSignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string | undefined) => void;
}) {
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
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value]);

  const getPos = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [
      ((ev.clientX - rect.left) * canvas.width) / rect.width,
      ((ev.clientY - rect.top) * canvas.height) / rect.height,
    ];
  };

  return (
    <div className="space-y-2">
      <span className="block text-xs font-bold text-oxford-dark">{label}</span>
      <canvas
        ref={canvasRef}
        width={500}
        height={120}
        onPointerDown={(ev) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          drawingRef.current = true;
          canvas.setPointerCapture(ev.pointerId);
          const [x, y] = getPos(ev);
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.strokeStyle = '#16263B';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 0.1, y);
          ctx.stroke();
        }}
        onPointerMove={(ev) => {
          if (!drawingRef.current) return;
          const ctx = canvasRef.current?.getContext('2d');
          if (!ctx) return;
          const [x, y] = getPos(ev);
          ctx.lineTo(x, y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          if (!drawingRef.current) return;
          drawingRef.current = false;
          try {
            if (canvasRef.current) onChange(canvasRef.current.toDataURL());
          } catch {
            // ignore
          }
        }}
        onPointerCancel={() => {
          drawingRef.current = false;
        }}
        className="w-full max-w-[500px] h-[120px] border border-dashed border-brass/70 rounded-xl bg-white touch-none block cursor-crosshair"
      />
      <button
        type="button"
        onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          }
          onChange(undefined);
        }}
        className="px-3 py-1.5 rounded-lg border border-card-border bg-white hover:bg-canvas text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 cursor-pointer"
      >
        <Eraser className="w-3.5 h-3.5 text-oxford" />
        <span>Clear signature</span>
      </button>
    </div>
  );
}

interface OpsFormsModuleProps {
  onNotify: (msg: string) => void;
}

export function OpsFormsModule({ onNotify }: OpsFormsModuleProps) {
  const [store, setStore] = useState<FormStore>(loadFormsStore);
  const [stageIdx, setStageIdx] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleSync = (ev: Event) => {
      const detail = (ev as CustomEvent<FormStore>).detail;
      if (detail && typeof detail === 'object') {
        setStore(detail);
      } else {
        setStore(loadFormsStore());
      }
    };
    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === FORMS_STORAGE_KEY) {
        setStore(loadFormsStore());
      }
    };
    window.addEventListener(FORMS_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(FORMS_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const stage = ENROLLMENT_STAGES[stageIdx];

  const syncPacketNow = async (targetStore: FormStore, notifyUser = false) => {
    const record = buildOpsFormSheetRecord(targetStore, stage.shortLabel);
    const result = await syncRecordToSheet('Enrollments', record, {
      localSaveFn: () => {
        try {
          localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(targetStore));
        } catch {
          // ignore
        }
      },
    });
    if (notifyUser) {
      onNotify(
        result.status === 'Synced to Sheet'
          ? 'Enrollment packet saved locally and synced to Google Sheets.'
          : result.status === 'Sync Error'
            ? `Saved locally; Google Sheets sync error: ${result.error || 'check setup'}`
            : 'Enrollment packet saved locally (pending Google Sheets webhook setup).'
      );
    }
  };

  const updateVal = (key: string, value: unknown) => {
    setStore((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      try {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      window.dispatchEvent(new CustomEvent(FORMS_SYNC_EVENT, { detail: next }));

      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
      syncTimerRef.current = window.setTimeout(() => {
        void syncPacketNow(next, false);
      }, 1000);

      return next;
    });
  };

  const toggleChoice = (key: string, opt: string, single?: boolean) => {
    const existing = Array.isArray(store[key]) ? (store[key] as string[]) : [];
    const has = existing.includes(opt);
    const updated = single
      ? has
        ? []
        : [opt]
      : has
        ? existing.filter((x) => x !== opt)
        : [...existing, opt];
    updateVal(key, updated);
  };

  const isStageStarted = (idx: number) => {
    const st = ENROLLMENT_STAGES[idx];
    return st.sections.some((sec) =>
      sec.items.some((item) => {
        if (item.kind === 'note' || item.kind === 'fixed') return false;
        if (item.kind === 'table') {
          return item.rows.some((_, ri) =>
            item.headers.some((_, ci) => {
              const v = store[`${item.key}_${ri}_${ci}`];
              return typeof v === 'string' && v.trim().length > 0;
            })
          );
        }
        const v = store[item.key];
        if (Array.isArray(v)) return v.length > 0;
        return typeof v === 'string' && v.trim().length > 0;
      })
    );
  };

  const renderField = (item: FormFieldItem) => {
    if (item.kind === 'note') {
      return (
        <p key={item.text} className="text-xs italic text-obsidian/75 my-2">
          {item.text}
        </p>
      );
    }
    if (item.kind === 'fixed') {
      return (
        <div key={item.label}>
          <span className="block text-xs font-bold text-oxford-dark mb-1">{item.label}</span>
          <div className="px-3 py-2 bg-white border border-card-border rounded-lg text-xs sm:text-sm font-semibold text-oxford-dark">
            {item.value}
          </div>
        </div>
      );
    }
    if (item.kind === 'field') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div key={`${item.key}-${item.label}`}>
          <label className="block text-xs font-bold text-oxford-dark mb-1">{item.label}</label>
          <input
            type={item.inputType}
            value={val}
            onChange={(e) => updateVal(item.key, e.target.value)}
            className="w-full px-3 py-2 border border-card-border bg-white rounded-lg text-xs sm:text-sm text-obsidian focus:outline-none focus:border-oxford"
          />
        </div>
      );
    }
    if (item.kind === 'textarea') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div key={item.key}>
          <label className="block text-xs font-bold text-oxford-dark mb-1">{item.label}</label>
          <textarea
            rows={3}
            value={val}
            onChange={(e) => updateVal(item.key, e.target.value)}
            className="w-full px-3 py-2 border border-card-border bg-white rounded-lg text-xs sm:text-sm text-obsidian focus:outline-none focus:border-oxford"
          />
        </div>
      );
    }
    if (item.kind === 'choices') {
      const sel = Array.isArray(store[item.key]) ? (store[item.key] as string[]) : [];
      const vertical = item.options.some((o) => o.length > 40);
      return (
        <div key={item.key} className="space-y-1.5">
          <span className="block text-xs font-bold text-oxford-dark">{item.label}</span>
          <div className={`flex flex-wrap gap-x-5 gap-y-1.5 ${vertical ? 'flex-col' : ''}`}>
            {item.options.map((opt) => (
              <label
                key={opt}
                className="flex items-start gap-2 text-xs sm:text-sm text-obsidian/90 cursor-pointer py-0.5"
              >
                <input
                  type="checkbox"
                  checked={sel.includes(opt)}
                  onChange={() => toggleChoice(item.key, opt, item.single)}
                  className="mt-0.5 w-4 h-4 accent-oxford shrink-0 cursor-pointer"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    if (item.kind === 'initials') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <div
          key={item.key}
          className="pt-2.5 border-t border-dashed border-card-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <p className="text-xs sm:text-sm text-obsidian/85 flex-1">{item.text}</p>
          <input
            type="text"
            maxLength={4}
            placeholder="Initials"
            value={val}
            onChange={(e) => updateVal(item.key, e.target.value)}
            className="w-20 text-center px-2 py-1.5 border border-card-border bg-white rounded-lg text-xs font-bold uppercase text-oxford-dark shrink-0"
          />
        </div>
      );
    }
    if (item.kind === 'table') {
      return (
        <div
          key={item.key}
          className="overflow-x-auto bg-white border border-card-border rounded-xl my-2"
        >
          <table className="w-full min-w-[540px] border-collapse text-xs">
            <thead>
              <tr className="bg-oxford text-brass-light text-left uppercase tracking-wider text-[10.5px]">
                {item.headers.map((h) => (
                  <th key={h} className="px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {item.rows.map((rowLabel, ri) => {
                const fixed =
                  Boolean(item.fixedFirstCol) &&
                  /[A-Za-z]/.test(rowLabel) &&
                  rowLabel.length > 3;
                return (
                  <tr key={`${item.key}-${ri}`} className="border-t border-card-border">
                    {item.headers.map((_, ci) => {
                      if (ci === 0 && fixed) {
                        return (
                          <td
                            key={ci}
                            className="px-3 py-2 font-bold text-oxford-dark bg-canvas/50 border-r border-card-border"
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
                          className="p-0 border-r last:border-r-0 border-card-border"
                        >
                          <input
                            type="text"
                            value={cellVal}
                            placeholder={ci === 0 ? rowLabel : ''}
                            onChange={(e) => updateVal(cellKey, e.target.value)}
                            className="w-full px-2.5 py-2 bg-transparent focus:bg-white focus:outline-none text-xs"
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
      );
    }
    if (item.kind === 'signature') {
      const val = typeof store[item.key] === 'string' ? (store[item.key] as string) : '';
      return (
        <OpsFormSignaturePad
          key={item.key}
          label={item.label}
          value={val}
          onChange={(nextVal) => updateVal(item.key, nextVal)}
        />
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-oxford-dark">
            Enrollment &amp; Required Forms (5-Stage Non-Clinical Suite)
          </h2>
          <p className="text-xs sm:text-sm text-obsidian/75 mt-0.5">
            Saved first to localStorage (key swf) and synced live to the Master Workbook
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SheetsSyncControl
            compact
            syncLabel="Save & Sync Packet"
            onSyncNow={() => syncPacketNow(store, true)}
          />
          <span className="px-3 py-1 rounded-full bg-navy-soft text-navy-slate border border-oxford/20 text-xs font-bold">
            Confidential Client Record
          </span>
        </div>
      </div>

      {/* Stage Nav */}
      <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-card-border">
        {ENROLLMENT_STAGES.map((st, idx) => {
          const active = idx === stageIdx;
          const started = isStageStarted(idx);
          return (
            <button
              key={st.shortLabel}
              type="button"
              onClick={() => setStageIdx(idx)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                active
                  ? 'bg-oxford text-white border-oxford shadow-xs'
                  : 'bg-white text-obsidian border-card-border hover:border-oxford hover:bg-canvas'
              }`}
            >
              <span>{st.shortLabel}</span>
              {started && (
                <Check
                  className={`w-3 h-3 ${active ? 'text-brass-light' : 'text-oxford'}`}
                />
              )}
            </button>
          );
        })}

        <div className="ml-auto">
          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setStore({});
                  try {
                    localStorage.removeItem(FORMS_STORAGE_KEY);
                  } catch {
                    // ignore
                  }
                  window.dispatchEvent(new CustomEvent(FORMS_SYNC_EVENT, { detail: {} }));
                  setConfirmReset(false);
                  onNotify('All 5 enrollment form stages have been cleared.');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#9E3524] text-white text-xs font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg border border-card-border bg-white text-xs font-semibold text-oxford-dark cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3.5 py-1.5 rounded-lg border border-[#9E3524]/45 bg-white hover:bg-[#FDE8E5] text-[#9E3524] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Forms</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage Header */}
      <div>
        <h3 className="font-heading text-2xl font-bold text-oxford-dark">{stage.heading}</h3>
        <p className="text-xs sm:text-sm italic text-obsidian/75 mt-0.5">
          {stage.subtitle}
        </p>
      </div>

      {/* Stage Sections */}
      <div className="space-y-4">
        {stage.sections.map((sec) => {
          const gridItems: FormFieldItem[] = [];
          const renderedBlocks: React.ReactNode[] = [];

          const flushGrid = (suffix: string) => {
            if (gridItems.length === 0) return;
            const copy = [...gridItems];
            gridItems.length = 0;
            renderedBlocks.push(
              <div
                key={`grid-${suffix}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {copy.map((it) => renderField(it))}
              </div>
            );
          };

          sec.items.forEach((item, idx) => {
            if (item.kind === 'field' || item.kind === 'fixed') {
              gridItems.push(item);
            } else {
              flushGrid(`${sec.title}-${idx}`);
              renderedBlocks.push(renderField(item));
            }
          });
          flushGrid(`${sec.title}-end`);

          return (
            <div
              key={sec.title}
              className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs"
            >
              <div className="bg-oxford px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brass-light border-b-2 border-brass">
                {sec.title}
              </div>
              <div className="p-4 bg-canvas/70 space-y-3">{renderedBlocks}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom Stage Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={stageIdx === 0}
            onClick={() => setStageIdx((s) => Math.max(0, s - 1))}
            className="px-4 py-2 rounded-xl border border-oxford/25 bg-white text-oxford-dark hover:bg-canvas-muted disabled:opacity-40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Stage</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-oxford/25 bg-white text-oxford-dark hover:bg-canvas-muted text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Stage {stageIdx + 1}</span>
          </button>
        </div>

        {stageIdx < 4 ? (
          <button
            type="button"
            onClick={() => setStageIdx((s) => Math.min(4, s + 1))}
            className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Next Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print All 5 Stages</span>
          </button>
        )}
      </div>
    </div>
  );
}
