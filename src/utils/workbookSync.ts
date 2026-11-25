import {
  createSeedOpsData,
  OPS_STORAGE_KEY,
  type OpsCheckin,
  type OpsDataState,
} from '../data/operationsHubData';

export const MASTER_WORKBOOK_PATH =
  '/assets/aistudio/Southernwell_Master_Database_Workbook_f81ce84f';

export const WORKBOOK_STORAGE_KEY = 'sw_master_workbook_rows';
export const WORKBOOK_URL_KEY = 'sw_master_workbook_external_url';
export const FORMS_STORAGE_KEY = 'swf';

export const WORKBOOK_SYNC_EVENT = 'sw-workbook-updated';
export const FORMS_SYNC_EVENT = 'sw-forms-updated';
export const OPS_SYNC_EVENT = 'sw-ops-updated';

export interface ParsedWorkbook {
  headers: string[];
  rows: string[][];
}

export function parseCsvText(raw: string): ParsedWorkbook {
  const lines = raw
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { headers: ['Timestamp', 'How are you feeling this morning?'], rows: [] };
  }

  const splitRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  };

  const headers = splitRow(lines[0]);
  const rows = lines.slice(1).map(splitRow);
  return { headers, rows };
}

export function readStoredWorkbook(): ParsedWorkbook | null {
  try {
    const saved = localStorage.getItem(WORKBOOK_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as ParsedWorkbook;
    if (parsed && Array.isArray(parsed.headers) && Array.isArray(parsed.rows)) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeStoredWorkbook(next: ParsedWorkbook): void {
  try {
    localStorage.setItem(WORKBOOK_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(WORKBOOK_SYNC_EVENT, { detail: next }));
}

export function mergeWorkbookRows(
  source: ParsedWorkbook,
  local: ParsedWorkbook | null
): ParsedWorkbook {
  if (!local || local.rows.length === 0) return source;

  const seen = new Set<string>();
  const mergedRows: string[][] = [];

  const addRow = (row: string[]) => {
    const key = `${(row[0] ?? '').trim()}|${(row[1] ?? '').trim()}`;
    if (!key || key === '|' || seen.has(key)) return;
    seen.add(key);
    mergedRows.push(row);
  };

  // Preserve locally added check-ins at top, then include all rows from attached CSV
  local.rows.forEach(addRow);
  source.rows.forEach(addRow);

  return {
    headers: source.headers.length > 0 ? source.headers : local.headers,
    rows: mergedRows,
  };
}

export async function fetchSourceWorkbook(
  mergeWithLocal = true
): Promise<ParsedWorkbook> {
  const res = await fetch(MASTER_WORKBOOK_PATH, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Unable to read workbook (${res.status})`);
  }
  const text = await res.text();
  const source = parseCsvText(text);
  const finalWorkbook = mergeWithLocal
    ? mergeWorkbookRows(source, readStoredWorkbook())
    : source;

  writeStoredWorkbook(finalWorkbook);
  return finalWorkbook;
}

function normalizeWorkbookDate(timestamp: string): string {
  const datePart = timestamp.trim().split(/\s+/)[0] || '';
  const mdy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, m, d, y] = mdy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const iso = datePart.match(/^\d{4}-\d{2}-\d{2}$/);
  if (iso) return datePart;
  return new Date().toISOString().slice(0, 10);
}

export function formatStage5WorkbookSummary(workbook: ParsedWorkbook): string {
  const latestRows = workbook.rows.slice(0, 6);
  if (latestRows.length === 0) {
    return 'No workbook check-ins recorded yet.';
  }
  const lines = latestRows.map(
    (r) => `${r[0] || 'Entry'} — ${r[1] || 'Checked in'}`
  );
  return `Linked Master Database Check-Ins:\n${lines.join('\n')}`;
}

export function syncWorkbookEverywhere(workbook: ParsedWorkbook): {
  addedCheckins: number;
  summaryText: string;
} {
  const summaryText = formatStage5WorkbookSummary(workbook);

  // 1. Sync into Stage 5 Enrollment Forms ('swf')
  try {
    const rawForms = localStorage.getItem(FORMS_STORAGE_KEY);
    const formStore: Record<string, unknown> = rawForms
      ? (JSON.parse(rawForms) as Record<string, unknown>)
      : {};
    formStore['s5_mood_cognition'] = summaryText;
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(formStore));
    window.dispatchEvent(new CustomEvent(FORMS_SYNC_EVENT, { detail: formStore }));
  } catch {
    // ignore
  }

  // 2. Sync into Operations Hub Check-Ins ('sw_ops_v1') without duplicating rows
  let addedCheckins = 0;
  try {
    const seed = createSeedOpsData();
    const rawOps = localStorage.getItem(OPS_STORAGE_KEY);
    const parsedOps = rawOps ? (JSON.parse(rawOps) as Partial<OpsDataState>) : {};
    const ops: OpsDataState = {
      preset: parsedOps.preset || seed.preset,
      clients: Array.isArray(parsedOps.clients) ? parsedOps.clients : seed.clients,
      checkins: Array.isArray(parsedOps.checkins) ? parsedOps.checkins : seed.checkins,
      actions: Array.isArray(parsedOps.actions) ? parsedOps.actions : seed.actions,
      referrals: Array.isArray(parsedOps.referrals) ? parsedOps.referrals : seed.referrals,
      payments: Array.isArray(parsedOps.payments) ? parsedOps.payments : seed.payments,
      meds: Array.isArray(parsedOps.meds) ? parsedOps.meds : seed.meds,
      mmasResponses: parsedOps.mmasResponses || seed.mmasResponses,
      bhlsResponses: parsedOps.bhlsResponses || seed.bhlsResponses,
      launchDone: parsedOps.launchDone || seed.launchDone,
    };

    const existingNotes = new Set(ops.checkins.map((c) => c.note.trim()));
    const defaultClient = ops.clients[0]?.id || 'SW-RM-4081';
    const newCheckins: OpsCheckin[] = [];

    workbook.rows.forEach((row) => {
      const ts = (row[0] ?? '').trim();
      const resp = (row[1] ?? '').trim();
      if (!ts && !resp) return;
      const note = `Workbook Check-In (${ts || 'Recorded'}): ${resp || 'Logged'}`;
      if (!existingNotes.has(note)) {
        existingNotes.add(note);
        newCheckins.push({
          client: defaultClient,
          date: normalizeWorkbookDate(ts),
          type: 'Phone',
          note,
          done: true,
        });
      }
    });

    if (newCheckins.length > 0) {
      addedCheckins = newCheckins.length;
      const nextOps: OpsDataState = {
        ...ops,
        checkins: [...newCheckins, ...ops.checkins],
      };
      localStorage.setItem(OPS_STORAGE_KEY, JSON.stringify(nextOps));
      window.dispatchEvent(new CustomEvent(OPS_SYNC_EVENT, { detail: nextOps }));
    }
  } catch {
    // ignore
  }

  return { addedCheckins, summaryText };
}
