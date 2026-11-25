import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DownloadCloud,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Settings2,
  Wifi,
  X,
} from 'lucide-react';
import { CrestLogo } from './BrandImage';
import {
  checkSheetStatus,
  fetchSheetRows,
  flushPendingSyncs,
  getPendingSyncQueue,
  getSheetSyncMeta,
  getSheetsWebAppUrl,
  GOOGLE_APPS_SCRIPT_SNIPPET,
  setSheetsWebAppUrl,
  updateSheetSyncMeta,
  useSheetsSyncState,
  type SheetRowsResponse,
  type SheetSyncTab,
  type SyncStatusLabel,
} from '../utils/sheetsSync';

interface SheetsSyncControlProps {
  compact?: boolean;
  onSyncNow?: () => void | Promise<void>;
  syncLabel?: string;
}

const PREVIEW_TABS: SheetSyncTab[] = [
  'Enrollments',
  'Check-Ins',
  'Action Items',
  'Referrals',
  'Payments',
  'Consultations',
  'Master Workbook',
];

export function SheetsSyncControl({
  compact = false,
  onSyncNow,
  syncLabel = 'Sync to Sheet',
}: SheetsSyncControlProps) {
  const syncState = useSheetsSyncState();
  const [modalOpen, setModalOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState(syncState.webhookUrl);
  const [syncing, setSyncing] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [pullingRows, setPullingRows] = useState(false);
  const [previewTab, setPreviewTab] = useState<SheetSyncTab>('Enrollments');
  const [rowsPreview, setRowsPreview] = useState<SheetRowsResponse | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);

  useEffect(() => {
    setUrlDraft(syncState.webhookUrl);
  }, [syncState.webhookUrl]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      if (onSyncNow) {
        await onSyncNow();
      } else {
        const queue = getPendingSyncQueue();
        if (queue.length > 0) {
          const res = await flushPendingSyncs();
          setModalNotice(
            `Flushed ${res.flushed} record(s); ${res.remaining} remaining in local queue.`
          );
        } else {
          await handleTestConnection();
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setModalNotice(null);
    const activeUrl = getSheetsWebAppUrl();
    const current = getSheetSyncMeta();

    if (!activeUrl) {
      updateSheetSyncMeta({
        ...current,
        status: 'Saved Locally / Pending Sync',
        webhookConfigured: false,
        webhookUrl: '',
        lastError: null,
      });
      setModalNotice(
        'No Google Sheets Web App URL configured yet. Records remain saved locally.'
      );
      setTestingConnection(false);
      return;
    }

    try {
      const res = await checkSheetStatus();
      if (res.ok) {
        const pending = getPendingSyncQueue().length;
        const nextStatus: SyncStatusLabel =
          pending === 0 ? 'Synced to Sheet' : 'Saved Locally / Pending Sync';
        updateSheetSyncMeta({
          ...current,
          status: nextStatus,
          pendingCount: pending,
          lastSyncedAt: current.lastSyncedAt || res.timestamp || new Date().toISOString(),
          lastError: null,
          webhookConfigured: true,
          webhookUrl: activeUrl,
        });
        const tabsText =
          Array.isArray(res.availableTabs) && res.availableTabs.length > 0
            ? ` Tabs: ${res.availableTabs.join(', ')}.`
            : '';
        setModalNotice(
          `Connected to ${res.spreadsheetName || res.service || 'Google Sheets'}.${tabsText}`
        );
      } else {
        const errText = res.error || 'Apps Script status check returned ok: false';
        updateSheetSyncMeta({
          ...current,
          status: 'Sync Error',
          lastError: errText,
          webhookConfigured: true,
          webhookUrl: activeUrl,
        });
        setModalNotice(errText);
      }
    } catch (err) {
      const errText =
        err instanceof Error
          ? err.message
          : 'Unable to reach Google Sheets Web App (?action=status).';
      updateSheetSyncMeta({
        ...current,
        status: 'Sync Error',
        lastError: errText,
        webhookConfigured: true,
        webhookUrl: activeUrl,
      });
      setModalNotice(errText);
    } finally {
      setTestingConnection(false);
    }
  };

  const handlePullRecentRows = async (tabToPull: SheetSyncTab = previewTab) => {
    setPullingRows(true);
    setModalNotice(null);
    try {
      const res = await fetchSheetRows(tabToPull, 25);
      setRowsPreview(res);
      if (!res.ok && res.error) {
        setModalNotice(res.error);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : `Unable to pull rows from ${tabToPull}.`;
      setRowsPreview({ ok: false, tab: tabToPull, error: msg });
      setModalNotice(msg);
    } finally {
      setPullingRows(false);
    }
  };

  const handleSaveWebhook = async (ev: FormEvent) => {
    ev.preventDefault();
    setSheetsWebAppUrl(urlDraft);
    const activeUrl = getSheetsWebAppUrl();
    if (activeUrl) {
      setModalNotice('Webhook URL saved. Testing connection and flushing local queue...');
      setSyncing(true);
      try {
        const flushedRes = await flushPendingSyncs();
        if (flushedRes.flushed > 0 && flushedRes.remaining === 0) {
          setModalNotice(
            `Webhook connected and ${flushedRes.flushed} queued record(s) synced to Google Sheets.`
          );
        } else {
          await handleTestConnection();
        }
      } finally {
        setSyncing(false);
      }
    } else {
      setModalNotice(
        'Webhook URL cleared. Records remain safely stored in localStorage until connected.'
      );
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SNIPPET);
      setCopiedScript(true);
      window.setTimeout(() => setCopiedScript(false), 2400);
    } catch {
      setCopiedScript(false);
    }
  };

  const statusStyles =
    syncState.status === 'Synced to Sheet'
      ? 'bg-navy-soft text-oxford-dark border-oxford/25'
      : syncState.status === 'Sync Error'
        ? 'bg-[#FDEDEC] text-[#9E3524] border-[#F5B7B1]'
        : 'bg-brass-soft text-brass-deep border-brass/45';

  const StatusIcon =
    syncState.status === 'Synced to Sheet'
      ? CheckCircle2
      : syncState.status === 'Sync Error'
        ? AlertCircle
        : Clock;

  const previewRows = Array.isArray(rowsPreview?.rows) ? rowsPreview.rows : [];
  const previewHeaders = Array.from(
    new Set(previewRows.flatMap((row) => Object.keys(row || {})))
  );

  return (
    <>
      <div className="print:hidden inline-flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setModalNotice(null);
            setModalOpen(true);
          }}
          title={
            syncState.lastError
              ? `Google Sheets Sync Error: ${syncState.lastError}`
              : syncState.lastSyncedAt
                ? `Last synced (${syncState.lastTab || 'Sheet'}): ${new Date(
                    syncState.lastSyncedAt
                  ).toLocaleTimeString()}`
                : 'Configure live Google Sheets Web App sync'
          }
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${statusStyles}`}
        >
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{syncState.status}</span>
          {syncState.pendingCount > 0 && syncState.status !== 'Synced to Sheet' && (
            <span className="px-1.5 py-0.5 rounded bg-white/80 text-[10px] font-bold tabular-nums">
              {syncState.pendingCount}
            </span>
          )}
        </button>

        {(onSyncNow || syncState.pendingCount > 0 || !compact) && (
          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleManualSync()}
            className="px-3 py-1.5 rounded-lg border border-oxford/25 bg-white hover:bg-canvas text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-oxford ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : syncLabel}</span>
          </button>
        )}

        {!compact && (
          <>
            <button
              type="button"
              disabled={testingConnection}
              onClick={() => {
                setModalOpen(true);
                void handleTestConnection();
              }}
              className="px-3 py-1.5 rounded-lg border border-oxford/25 bg-white hover:bg-canvas text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Wifi className="w-3.5 h-3.5 text-oxford" />
              <span>{testingConnection ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              disabled={pullingRows}
              onClick={() => {
                setModalOpen(true);
                void handlePullRecentRows('Enrollments');
              }}
              className="px-3 py-1.5 rounded-lg border border-brass/55 bg-brass-soft/60 hover:bg-brass-soft text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <DownloadCloud className="w-3.5 h-3.5 text-brass-deep" />
              <span>Pull Recent Rows</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            setModalNotice(null);
            setModalOpen(true);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-oxford-dark text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Settings2 className="w-3.5 h-3.5 text-brass-deep" />
          <span>{compact ? 'Sheet Setup' : 'Google Sheets Setup'}</span>
        </button>
      </div>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheets-sync-modal-title"
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) setModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-oxford-dark/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-canvas rounded-2xl max-w-[820px] w-full border border-brass/55 shadow-2xl overflow-hidden my-auto relative">
            <button
              type="button"
              aria-label="Close Google Sheets setup modal"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Deep Oxford Navy Header with Brushed Brass SW Monogram Crest */}
            <div className="bg-gradient-to-br from-oxford to-oxford-dark text-canvas px-6 sm:px-8 py-6 border-b-2 border-brass">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-canvas p-0.5 border border-brass/75 shrink-0 overflow-hidden">
                  <CrestLogo alt="SouthernWell Case Management Services Monogram Crest" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brass-light block">
                    SouthernWell Case Management Services
                  </span>
                  <h3
                    id="sheets-sync-modal-title"
                    className="font-heading text-2xl sm:text-3xl font-semibold text-white leading-tight"
                  >
                    Live Google Sheets Master Workbook Sync
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-canvas/85 mt-3 leading-relaxed">
                Enrollment packets, check-ins, action items, referrals, payments, and consultation requests write to{' '}
                <strong className="text-white">localStorage first</strong> and transmit{' '}
                <code className="text-brass-light">{'{ sheetTab, timestamp, record }'}</code>{' '}
                via <code className="text-brass-light">Content-Type: &quot;text/plain;charset=utf-8&quot;</code>. Strictly non-clinical care coordination only.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto bg-canvas">
              {/* Current Status Card with Test Connection & Flush */}
              <div className="rounded-xl bg-white border border-card-border p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-obsidian/65 block">
                    Current Sync State
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 ${statusStyles}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{syncState.status}</span>
                    </span>
                    <span className="text-xs text-obsidian/75 tabular-nums">
                      Pending local queue: <strong>{syncState.pendingCount}</strong>
                    </span>
                    {syncState.lastSyncedAt && (
                      <span className="text-xs text-obsidian/75">
                        · Last synced ({syncState.lastTab || 'Sheet'}):{' '}
                        {new Date(syncState.lastSyncedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {syncState.lastError && (
                    <p className="text-xs text-[#9E3524] font-medium mt-1">
                      Detail: {syncState.lastError}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={testingConnection}
                    onClick={() => void handleTestConnection()}
                    className="px-3.5 py-2 rounded-lg border border-oxford/30 bg-white hover:bg-canvas-muted text-oxford-dark text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Wifi className="w-3.5 h-3.5 text-oxford" />
                    <span>{testingConnection ? 'Checking...' : 'Test Connection'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={syncing}
                    onClick={() => void handleManualSync()}
                    className="px-4 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-brass-light ${syncing ? 'animate-spin' : ''}`}
                    />
                    <span>{syncing ? 'Syncing Queue...' : 'Flush & Sync Now'}</span>
                  </button>
                </div>
              </div>

              {/* Webhook URL Configuration Form */}
              <form
                onSubmit={(ev) => void handleSaveWebhook(ev)}
                className="rounded-xl bg-white border border-card-border p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="sw-sheets-webapp-url"
                    className="text-xs font-bold uppercase tracking-wider text-oxford-dark flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5 text-oxford" />
                    <span>Google Apps Script Web App URL (sw_sheets_webapp_url)</span>
                  </label>
                  <span className="text-[11px] font-semibold text-brass-deep">
                    {syncState.webhookConfigured ? 'Endpoint Configured' : 'Local Queue Mode'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="sw-sheets-webapp-url"
                    type="url"
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-card-border bg-canvas text-xs sm:text-sm text-obsidian focus:outline-none focus:border-oxford focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-brass hover:bg-brass-light text-oxford-dark text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Webhook URL</span>
                  </button>
                </div>

                {modalNotice && (
                  <p className="text-xs font-medium text-oxford-dark bg-navy-soft/80 border border-oxford/20 rounded-lg px-3 py-2">
                    {modalNotice}
                  </p>
                )}
              </form>

              {/* Pull Recent Rows Preview (fetchSheetRows("Enrollments", 25)) */}
              <div className="rounded-xl bg-white border border-card-border p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="font-heading text-xl font-bold text-oxford-dark">
                      Pull Recent Rows Preview
                    </h4>
                    <p className="text-xs text-obsidian/75">
                      Fetches up to 25 recent rows directly from Google Sheets (
                      <code>?tab={previewTab}&amp;limit=25</code>)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Select sheet tab to preview"
                      value={previewTab}
                      onChange={(e) => setPreviewTab(e.target.value as SheetSyncTab)}
                      className="px-3 py-2 rounded-lg border border-card-border bg-canvas text-xs font-semibold text-oxford-dark focus:outline-none focus:border-oxford"
                    >
                      {PREVIEW_TABS.map((tab) => (
                        <option key={tab} value={tab}>
                          {tab}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={pullingRows}
                      onClick={() => void handlePullRecentRows(previewTab)}
                      className="px-3.5 py-2 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <DownloadCloud
                        className={`w-3.5 h-3.5 text-brass-light ${
                          pullingRows ? 'animate-pulse' : ''
                        }`}
                      />
                      <span>{pullingRows ? 'Pulling...' : 'Pull Recent Rows'}</span>
                    </button>
                  </div>
                </div>

                {rowsPreview && (
                  <div className="rounded-xl border border-card-border overflow-hidden">
                    {!rowsPreview.ok ? (
                      <div className="p-4 bg-[#FDEDEC] text-xs font-medium text-[#9E3524]">
                        {rowsPreview.error || 'Unable to pull rows from Google Sheet.'}
                      </div>
                    ) : previewRows.length === 0 ? (
                      <div className="p-4 bg-canvas text-xs text-obsidian/75 text-center">
                        Connected to <strong>{rowsPreview.tab || previewTab}</strong> — no rows recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[220px]">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr>
                              {previewHeaders.map((header) => (
                                <th
                                  key={header}
                                  className="bg-oxford text-brass-light text-left px-3 py-2 font-semibold whitespace-nowrap sticky top-0"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-card-border">
                            {previewRows.map((row, idx) => (
                              <tr key={idx} className="bg-white hover:bg-canvas/60">
                                {previewHeaders.map((header) => (
                                  <td
                                    key={header}
                                    className="px-3 py-2 text-obsidian/85 max-w-[220px] truncate"
                                  >
                                    {row[header] !== undefined && row[header] !== null
                                      ? String(row[header])
                                      : '—'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tab Routing Overview */}
              <div className="rounded-xl bg-white border border-card-border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-oxford" />
                  <h4 className="font-heading text-xl font-bold text-oxford-dark">
                    Master Workbook Tab Routing
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {[
                    {
                      tab: 'Enrollments',
                      desc: '5-Stage Care Dossier intake, HIPAA releases & bottle inventory',
                    },
                    {
                      tab: 'Check-Ins',
                      desc: 'Care navigation check-ins & Master Workbook morning entries',
                    },
                    {
                      tab: 'Action Items',
                      desc: 'Follow-up coordination tasks, assigned owners & due dates',
                    },
                    {
                      tab: 'Referrals',
                      desc: 'LCSW, Provider, Pharmacy, Community & Elder Law referrals',
                    },
                    {
                      tab: 'Payments',
                      desc: 'Monthly retainer tracking, due dates & payment status',
                    },
                    {
                      tab: 'Consultations',
                      desc: 'Family discovery consultation requests & contact details',
                    },
                  ].map((item) => (
                    <div
                      key={item.tab}
                      className="p-3 rounded-lg bg-canvas border border-card-border"
                    >
                      <strong className="text-oxford-dark block">{item.tab}</strong>
                      <span className="text-obsidian/75">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clean Google Apps Script doPost(e) & doGet(e) Snippet */}
              <div className="rounded-xl border border-oxford/25 overflow-hidden bg-oxford-dark text-canvas">
                <div className="px-4 py-3 bg-oxford border-b border-brass/50 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brass-light block">
                      Google Apps Script (`doPost(e)` &amp; `doGet(e)`)
                    </span>
                    <span className="text-xs text-canvas/85">
                      Paste into Extensions → Apps Script in your Master Workbook Google Sheet
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopyScript()}
                    className="px-3 py-1.5 rounded-lg bg-brass hover:bg-brass-light text-oxford-dark text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Snippet</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Apps Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-[11px] sm:text-xs font-mono text-canvas/90 overflow-x-auto max-h-[260px] leading-relaxed">
                  <code>{GOOGLE_APPS_SCRIPT_SNIPPET}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
