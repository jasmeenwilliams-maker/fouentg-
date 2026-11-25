import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Upload,
  PlusCircle,
  Link2,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  fetchSourceWorkbook,
  MASTER_WORKBOOK_PATH,
  parseCsvText,
  readStoredWorkbook,
  syncWorkbookEverywhere,
  WORKBOOK_STORAGE_KEY,
  WORKBOOK_SYNC_EVENT,
  WORKBOOK_URL_KEY,
  writeStoredWorkbook,
  type ParsedWorkbook,
} from '../utils/workbookSync';
import { syncRecordToSheet } from '../utils/sheetsSync';
import { SheetsSyncControl } from './SheetsSyncControl';

export type { ParsedWorkbook };
export { MASTER_WORKBOOK_PATH };

interface MasterWorkbookPanelProps {
  onSyncToStage5?: (summaryText: string) => void;
  compact?: boolean;
}

export function MasterWorkbookPanel({
  onSyncToStage5,
  compact = false,
}: MasterWorkbookPanelProps) {
  const [workbook, setWorkbook] = useState<ParsedWorkbook>(() => {
    return (
      readStoredWorkbook() ?? {
        headers: ['Timestamp', 'How are you feeling this morning?'],
        rows: [],
      }
    );
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState('Feeling rested and steady');
  const [externalUrl, setExternalUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(WORKBOOK_URL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [urlDraft, setUrlDraft] = useState(externalUrl);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const syncFromAttachedSource = async (mergeWithLocal: boolean, showNotice = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const synced = await fetchSourceWorkbook(mergeWithLocal);
      setWorkbook(synced);
      const { addedCheckins } = syncWorkbookEverywhere(synced);
      if (showNotice) {
        notify(
          addedCheckins > 0
            ? `Synced workbook (${synced.rows.length} entries · ${addedCheckins} added to Operations Check-Ins).`
            : `Synced ${synced.rows.length} workbook entries across Portal & Operations Hub.`
        );
      }
    } catch {
      setLoadError('Could not load the linked workbook file.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void syncFromAttachedSource(true, false);

    const handleSyncEvent = (ev: Event) => {
      const detail = (ev as CustomEvent<ParsedWorkbook>).detail;
      if (detail && Array.isArray(detail.rows)) {
        setWorkbook(detail);
      } else {
        const stored = readStoredWorkbook();
        if (stored) setWorkbook(stored);
      }
    };

    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === WORKBOOK_STORAGE_KEY) {
        const stored = readStoredWorkbook();
        if (stored) setWorkbook(stored);
      }
      if (ev.key === WORKBOOK_URL_KEY) {
        const nextUrl = ev.newValue || '';
        setExternalUrl(nextUrl);
        setUrlDraft(nextUrl);
      }
    };

    window.addEventListener(WORKBOOK_SYNC_EVENT, handleSyncEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(WORKBOOK_SYNC_EVENT, handleSyncEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const persistAndBroadcast = (next: ParsedWorkbook) => {
    setWorkbook(next);
    writeStoredWorkbook(next);
    return syncWorkbookEverywhere(next);
  };

  const handleUploadCsv = (ev: ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const parsed = parseCsvText(reader.result);
        const { addedCheckins } = persistAndBroadcast(parsed);
        notify(
          `Synced ${file.name} (${parsed.rows.length} entries${
            addedCheckins > 0 ? ` · ${addedCheckins} check-ins added` : ''
          }).`
        );
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  };

  const handleAddEntry = (ev: FormEvent) => {
    ev.preventDefault();
    const cleaned = newResponse.trim();
    if (!cleaned) return;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const stamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newRow = workbook.headers.map((_, idx) =>
      idx === 0 ? stamp : idx === 1 ? cleaned : ''
    );
    const next: ParsedWorkbook = {
      headers: workbook.headers,
      rows: [newRow, ...workbook.rows],
    };
    persistAndBroadcast(next);
    setNewResponse('');
    void syncRecordToSheet('Check-Ins', {
      timestamp: stamp,
      response: cleaned,
      source: 'Master Workbook Check-In',
      scope: 'Non-clinical care navigation check-in',
    }).then((sheetState) => {
      notify(
        sheetState.status === 'Synced to Sheet'
          ? 'Added entry, saved locally, and synced to Google Sheets.'
          : 'Added entry and saved locally (Stage 5 & Operations Check-Ins updated).'
      );
    });
  };

  const handleDownloadUpdatedCsv = () => {
    const escapeCsv = (val: string) => `"${String(val).replace(/"/g, '""')}"`;
    const lines = [
      workbook.headers.map(escapeCsv).join(','),
      ...workbook.rows.map((r) => r.map((c) => escapeCsv(c ?? '')).join(',')),
    ];
    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Southernwell_Master_Database_Workbook.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Downloaded Southernwell_Master_Database_Workbook.csv');
  };

  const handleSaveExternalUrl = (ev: FormEvent) => {
    ev.preventDefault();
    const trimmed = urlDraft.trim();
    setExternalUrl(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(WORKBOOK_URL_KEY, trimmed);
      } else {
        localStorage.removeItem(WORKBOOK_URL_KEY);
      }
    } catch {
      // ignore
    }
    notify(trimmed ? 'Workbook URL linked.' : 'External workbook link cleared.');
  };

  const handleSyncEverywhere = () => {
    const { addedCheckins, summaryText } = syncWorkbookEverywhere(workbook);
    if (onSyncToStage5) {
      onSyncToStage5(summaryText);
    }
    void syncRecordToSheet('Master Workbook', {
      totalEntries: workbook.rows.length,
      latestTimestamp: workbook.rows[0]?.[0] || '',
      latestResponse: workbook.rows[0]?.[1] || '',
      scope: 'Non-clinical care coordination',
    }).then((sheetState) => {
      const sheetSuffix =
        sheetState.status === 'Synced to Sheet'
          ? ' Live Google Sheet synced.'
          : '';
      notify(
        addedCheckins > 0
          ? `Synced ${addedCheckins} new check-ins to Operations Hub & Stage 5 Log.${sheetSuffix}`
          : `All workspaces are up to date with Master Database Workbook.${sheetSuffix}`
      );
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-card-border overflow-hidden">
      <div className="bg-oxford text-canvas px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-brass">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-oxford-dark text-brass-light flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brass-light block">
              Live Synced Data Source
            </span>
            <h3 className="font-heading text-xl font-bold text-white leading-tight">
              SouthernWell Case Management Master Workbook
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={MASTER_WORKBOOK_PATH}
            download="Southernwell_Master_Database_Workbook.csv"
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-brass-light" />
            <span>Source File</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadUpdatedCsv}
            className="px-3 py-1.5 rounded-lg bg-brass hover:bg-brass-soft text-oxford-dark text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Controls Row */}
        {!compact && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Check-in Logger */}
            <form
              onSubmit={handleAddEntry}
              className="p-4 rounded-xl bg-canvas border border-card-border space-y-2.5"
            >
              <label
                htmlFor="workbook-checkin-input"
                className="block text-xs font-bold uppercase tracking-wider text-oxford-dark"
              >
                Log Morning Check-In Entry
              </label>
              <div className="flex gap-2">
                <input
                  id="workbook-checkin-input"
                  type="text"
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="How are you feeling this morning?"
                  className="flex-1 px-3 py-2 rounded-lg border border-card-border bg-white text-xs sm:text-sm text-obsidian focus:outline-none focus:border-oxford"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-brass-light" />
                  <span>Add &amp; Sync</span>
                </button>
              </div>
            </form>

            {/* Upload Updated CSV / External Google Sheet Link */}
            <form
              onSubmit={handleSaveExternalUrl}
              className="p-4 rounded-xl bg-canvas border border-card-border space-y-2.5"
            >
              <label
                htmlFor="workbook-external-url"
                className="block text-xs font-bold uppercase tracking-wider text-oxford-dark"
              >
                Link Live Google Sheet / Workbook URL
              </label>
              <div className="flex gap-2">
                <input
                  id="workbook-external-url"
                  type="url"
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="flex-1 px-3 py-2 rounded-lg border border-card-border bg-white text-xs sm:text-sm text-obsidian focus:outline-none focus:border-oxford"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg border border-oxford/30 bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Link2 className="w-3.5 h-3.5 text-oxford" />
                  <span>Save Link</span>
                </button>
              </div>
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-navy-slate hover:text-oxford-dark underline"
                >
                  <span>Open Linked Spreadsheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </form>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-obsidian/80">
            <span className="font-semibold text-oxford-dark tabular-nums">
              {workbook.rows.length} {workbook.rows.length === 1 ? 'entry' : 'entries'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[280px] sm:max-w-none">
              Source: Southernwell_Master_Database_Workbook
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SheetsSyncControl compact onSyncNow={handleSyncEverywhere} syncLabel="Sync Sheet" />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleUploadCsv}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-oxford" />
              <span>Import CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                void syncFromAttachedSource(false, true);
              }}
              className="px-3 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-xs font-semibold text-oxford-dark inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-navy-slate" />
              <span>Sync Source</span>
            </button>

            <button
              type="button"
              onClick={handleSyncEverywhere}
              className="px-3.5 py-1.5 rounded-lg bg-oxford hover:bg-oxford-dark text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{onSyncToStage5 ? 'Sync to Stage 5 & Ops' : 'Sync All Workspaces'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Toast Inline */}
        {statusMessage && (
          <div className="p-3 rounded-lg bg-navy-soft border border-oxford/20 text-xs font-medium text-oxford-dark flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-oxford shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Workbook Data Table */}
        {loading ? (
          <div className="p-6 text-center text-xs text-obsidian/70 border border-card-border rounded-xl bg-canvas">
            Syncing linked workbook entries...
          </div>
        ) : loadError ? (
          <div className="p-4 text-xs text-[#9E3524] bg-[#FDEDEC] border border-[#F5B7B1] rounded-xl">
            {loadError}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border">
            <table className="w-full border-collapse text-xs sm:text-sm">
              <thead>
                <tr>
                  {workbook.headers.map((h) => (
                    <th
                      key={h}
                      className="bg-oxford text-brass-light text-left px-4 py-2.5 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {workbook.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={workbook.headers.length}
                      className="px-4 py-6 text-center text-obsidian/70"
                    >
                      No check-in rows found in this workbook.
                    </td>
                  </tr>
                ) : (
                  workbook.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white hover:bg-canvas/50">
                      {workbook.headers.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-4 py-2.5 ${
                            cIdx === 0
                              ? 'font-medium text-oxford-dark tabular-nums whitespace-nowrap'
                              : 'text-obsidian/85'
                          }`}
                        >
                          {row[cIdx] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
