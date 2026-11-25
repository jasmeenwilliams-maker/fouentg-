import { useEffect, useState } from 'react';

export type SyncStatusLabel =
  | 'Synced to Sheet'
  | 'Saved Locally / Pending Sync'
  | 'Sync Error';

export interface SyncPayload<T extends Record<string, unknown> = Record<string, unknown>> {
  sheetTab: string;
  timestamp: string;
  token?: string;
  record: T;
}

export interface SyncResult {
  ok: boolean;
  status: SyncStatusLabel;
  tab?: string;
  appendedRow?: number;
  syncedAt?: string;
  error?: string;
}

export interface SheetStatusResponse {
  ok: boolean;
  service?: string;
  spreadsheetName?: string;
  availableTabs?: string[];
  timestamp?: string;
  error?: string;
}

export interface SheetRowsResponse<T = Record<string, unknown>> {
  ok: boolean;
  tab?: string;
  count?: number;
  rows?: T[];
  error?: string;
}

export type SheetSyncTab =
  | 'Enrollments'
  | 'Check-Ins'
  | 'Action Items'
  | 'Referrals'
  | 'Payments'
  | 'Consultations'
  | 'Master Workbook';

export interface SheetSyncMetaState {
  status: SyncStatusLabel;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastTab: string | null;
  lastError: string | null;
  webhookConfigured: boolean;
  webhookUrl: string;
}

const WEBAPP_URL_STORAGE_KEY = 'sw_sheets_webapp_url';
const PENDING_QUEUE_STORAGE_KEY = 'sw_pending_sheet_syncs_v1';
const SYNC_META_STORAGE_KEY = 'sw_sheets_sync_meta_v1';
export const SHEETS_SYNC_EVENT = 'sw-sheets-sync-updated';

// Paste your deployed Google Apps Script /exec URL here as a default fallback
const DEFAULT_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyRFMSpRfHUqAZFqBqYfODsq9FnywtXo2ZyINUunInR6BYjoHyvgzZOn9Ogz3ppNK6qGw/exec";

export const GOOGLE_APPS_SCRIPT_SNIPPET = `/**
 * SouthernWell Case Management Services — Master Workbook Sync Receiver
 * Supports doPost(e) row routing and doGet(e) status/row-preview endpoints.
 */
function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var payload = JSON.parse(raw);
    var sheetTab = String(payload.sheetTab || 'Master Workbook').trim();
    var timestamp = String(payload.timestamp || new Date().toISOString());
    var record = (payload.record && typeof payload.record === 'object')
      ? payload.record
      : payload;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetTab);
    if (!sheet) {
      sheet = ss.insertSheet(sheetTab);
    }

    var recordKeys = Object.keys(record).filter(function (k) {
      return k !== 'sheetTab' && k !== 'timestamp' && k !== 'record' && k !== 'token';
    });

    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0]
      : ['Timestamp'];

    if (headers.length === 0 || !headers[0]) {
      headers = ['Timestamp'];
    }

    recordKeys.forEach(function (key) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
      }
    });

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    var row = headers.map(function (header, idx) {
      if (idx === 0 && header === 'Timestamp') return timestamp;
      var val = record[header];
      if (val === undefined || val === null) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        tab: sheetTab,
        appendedRow: sheet.getLastRow(),
        syncedAt: timestamp
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (params.action === 'status') {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          service: 'SouthernWell Case Management Master Workbook Sync',
          spreadsheetName: ss.getName(),
          availableTabs: ss.getSheets().map(function (s) { return s.getName(); }),
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var tabName = String(params.tab || 'Enrollments').trim();
    var limit = Math.max(1, Math.min(100, Number(params.limit) || 25));
    var sheet = ss.getSheetByName(tabName);

    if (!sheet || sheet.getLastRow() < 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: true,
          tab: tabName,
          count: 0,
          rows: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(function (h) { return String(h || ''); });
    var dataRows = values.slice(1).slice(-limit).reverse().map(function (row) {
      var obj = {};
      headers.forEach(function (header, idx) {
        if (header) obj[header] = row[idx];
      });
      return obj;
    });

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        tab: tabName,
        count: dataRows.length,
        rows: dataRows
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function getSheetsWebAppUrl(): string {
  const envUrl =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string> }).env
          ?.VITE_GOOGLE_SHEETS_WEBAPP_URL
      : undefined;

  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(WEBAPP_URL_STORAGE_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  }

  return (envUrl || DEFAULT_WEBAPP_URL).trim();
}

export function setSheetsWebAppUrl(url: string): void {
  if (typeof window !== 'undefined') {
    const trimmed = url.trim();
    if (trimmed) {
      window.localStorage.setItem(WEBAPP_URL_STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(WEBAPP_URL_STORAGE_KEY);
    }
    const current = getSheetSyncMeta();
    updateSheetSyncMeta({
      ...current,
      webhookConfigured: Boolean(getSheetsWebAppUrl()),
      webhookUrl: getSheetsWebAppUrl(),
      lastError: null,
    });
  }
}

export function getPendingSyncQueue(): SyncPayload[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PENDING_QUEUE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncPayload[]) : [];
  } catch {
    return [];
  }
}

function savePendingSyncQueue(queue: SyncPayload[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_QUEUE_STORAGE_KEY, JSON.stringify(queue.slice(-50)));
}

function enqueuePendingSync(payload: SyncPayload): void {
  const current = getPendingSyncQueue();
  current.push(payload);
  savePendingSyncQueue(current);
}

export function getSheetSyncMeta(): SheetSyncMetaState {
  const activeUrl = getSheetsWebAppUrl();
  const queue = getPendingSyncQueue();
  let stored: Partial<SheetSyncMetaState> = {};

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(SYNC_META_STORAGE_KEY);
      stored = raw ? (JSON.parse(raw) as Partial<SheetSyncMetaState>) : {};
    } catch {
      stored = {};
    }
  }

  let status: SyncStatusLabel = stored.status || 'Saved Locally / Pending Sync';
  if (
    status !== 'Synced to Sheet' &&
    status !== 'Saved Locally / Pending Sync' &&
    status !== 'Sync Error'
  ) {
    status = 'Saved Locally / Pending Sync';
  }
  if (!activeUrl && status === 'Synced to Sheet') {
    status = 'Saved Locally / Pending Sync';
  }

  return {
    status,
    pendingCount: queue.length,
    lastSyncedAt: typeof stored.lastSyncedAt === 'string' ? stored.lastSyncedAt : null,
    lastTab: typeof stored.lastTab === 'string' ? stored.lastTab : null,
    lastError: typeof stored.lastError === 'string' ? stored.lastError : null,
    webhookConfigured: Boolean(activeUrl),
    webhookUrl: activeUrl,
  };
}

export function updateSheetSyncMeta(next: SheetSyncMetaState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SYNC_META_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent(SHEETS_SYNC_EVENT, { detail: next }));
}

/**
 * Saves a local snapshot first (optional localSaveFn), then POSTs JSON using
 * Content-Type: "text/plain;charset=utf-8" so Apps Script doPost(e) receives
 * e.postData.contents without triggering a browser CORS preflight block.
 */
export async function syncRecordToSheet<T extends Record<string, unknown>>(
  sheetTab: string,
  record: T,
  options?: {
    webAppUrl?: string;
    token?: string;
    localSaveFn?: () => void;
  }
): Promise<SyncResult> {
  if (options?.localSaveFn) {
    options.localSaveFn();
  }

  const targetUrl = (options?.webAppUrl || getSheetsWebAppUrl()).trim();
  const payload: SyncPayload<T> = {
    sheetTab,
    timestamp: new Date().toISOString(),
    ...(options?.token ? { token: options.token } : {}),
    record,
  };

  if (!targetUrl) {
    enqueuePendingSync(payload);
    const meta = getSheetSyncMeta();
    updateSheetSyncMeta({
      ...meta,
      status: 'Saved Locally / Pending Sync',
      pendingCount: getPendingSyncQueue().length,
      lastTab: sheetTab,
      lastError: null,
      webhookConfigured: false,
      webhookUrl: '',
    });
    return {
      ok: false,
      status: 'Saved Locally / Pending Sync',
      tab: sheetTab,
      error: 'Google Sheets Web App URL is not configured yet',
    };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let parsed: {
      ok?: boolean;
      tab?: string;
      appendedRow?: number;
      syncedAt?: string;
      error?: string;
    };

    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error('Endpoint returned non-JSON response (check Web App access permissions)');
    }

    if (!response.ok || !parsed.ok) {
      enqueuePendingSync(payload);
      const errMsg = parsed.error || `Sync failed with HTTP ${response.status}`;
      const meta = getSheetSyncMeta();
      updateSheetSyncMeta({
        ...meta,
        status: 'Sync Error',
        pendingCount: getPendingSyncQueue().length,
        lastTab: sheetTab,
        lastError: errMsg,
        webhookConfigured: true,
        webhookUrl: targetUrl,
      });
      return {
        ok: false,
        status: 'Sync Error',
        tab: sheetTab,
        error: errMsg,
      };
    }

    const syncedAt = parsed.syncedAt || payload.timestamp;
    const queue = getPendingSyncQueue();
    updateSheetSyncMeta({
      status: queue.length === 0 ? 'Synced to Sheet' : 'Saved Locally / Pending Sync',
      pendingCount: queue.length,
      lastSyncedAt: syncedAt,
      lastTab: parsed.tab || sheetTab,
      lastError: null,
      webhookConfigured: true,
      webhookUrl: targetUrl,
    });

    return {
      ok: true,
      status: 'Synced to Sheet',
      tab: parsed.tab || sheetTab,
      appendedRow: parsed.appendedRow,
      syncedAt,
    };
  } catch (err) {
    enqueuePendingSync(payload);
    const errMsg = err instanceof Error ? err.message : String(err);
    const meta = getSheetSyncMeta();
    updateSheetSyncMeta({
      ...meta,
      status: 'Sync Error',
      pendingCount: getPendingSyncQueue().length,
      lastTab: sheetTab,
      lastError: errMsg,
      webhookConfigured: true,
      webhookUrl: targetUrl,
    });
    return {
      ok: false,
      status: 'Sync Error',
      tab: sheetTab,
      error: errMsg,
    };
  }
}

/**
 * Retries any items queued under "Saved Locally / Pending Sync".
 */
export async function flushPendingSyncs(options?: {
  webAppUrl?: string;
  token?: string;
}): Promise<{ flushed: number; remaining: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { flushed: 0, remaining: 0 };
  }

  savePendingSyncQueue([]);
  const stillPending: SyncPayload[] = [];
  let flushed = 0;

  for (const item of queue) {
    const result = await syncRecordToSheet(item.sheetTab, item.record, {
      webAppUrl: options?.webAppUrl,
      token: item.token || options?.token,
    });
    if (result.ok) {
      flushed += 1;
    } else {
      stillPending.push(item);
    }
  }

  savePendingSyncQueue(stillPending);
  const current = getSheetSyncMeta();
  updateSheetSyncMeta({
    ...current,
    status:
      stillPending.length === 0
        ? 'Synced to Sheet'
        : current.webhookConfigured
          ? current.status
          : 'Saved Locally / Pending Sync',
    pendingCount: stillPending.length,
  });

  return { flushed, remaining: stillPending.length };
}

/**
 * GET check: ?action=status
 */
export async function checkSheetStatus(webAppUrl?: string): Promise<SheetStatusResponse> {
  const targetUrl = (webAppUrl || getSheetsWebAppUrl()).trim();
  if (!targetUrl) {
    return { ok: false, error: 'Google Sheets Web App URL is not configured' };
  }

  const url = new URL(targetUrl);
  url.searchParams.set('action', 'status');

  const response = await fetch(url.toString(), { method: 'GET' });
  return (await response.json()) as SheetStatusResponse;
}

/**
 * GET recent rows from a tab: ?tab=Enrollments&limit=25
 */
export async function fetchSheetRows<T = Record<string, unknown>>(
  tab: string,
  limit = 25,
  webAppUrl?: string
): Promise<SheetRowsResponse<T>> {
  const targetUrl = (webAppUrl || getSheetsWebAppUrl()).trim();
  if (!targetUrl) {
    return { ok: false, error: 'Google Sheets Web App URL is not configured' };
  }

  const url = new URL(targetUrl);
  url.searchParams.set('tab', tab);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url.toString(), { method: 'GET' });
  return (await response.json()) as SheetRowsResponse<T>;
}

export function useSheetsSyncState(): SheetSyncMetaState {
  const [syncState, setSyncState] = useState<SheetSyncMetaState>(getSheetSyncMeta);

  useEffect(() => {
    const handleEvent = (ev: Event) => {
      const detail = (ev as CustomEvent<SheetSyncMetaState>).detail;
      if (detail && detail.status) {
        setSyncState(detail);
      } else {
        setSyncState(getSheetSyncMeta());
      }
    };
    const handleStorage = (ev: StorageEvent) => {
      if (
        ev.key === SYNC_META_STORAGE_KEY ||
        ev.key === PENDING_QUEUE_STORAGE_KEY ||
        ev.key === WEBAPP_URL_STORAGE_KEY
      ) {
        setSyncState(getSheetSyncMeta());
      }
    };
    window.addEventListener(SHEETS_SYNC_EVENT, handleEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SHEETS_SYNC_EVENT, handleEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return syncState;
}
