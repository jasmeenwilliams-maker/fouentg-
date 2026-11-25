import { useEffect, useMemo, useState } from 'react';
import { Copy, Printer, RotateCcw, CheckCircle2 } from 'lucide-react';
import { offsetDay } from '../data/operationsHubData';

const CAREGIVER_SCREEN_STORAGE_KEY = 'sw_caregiver_screening_v1';

const CSES8_ITEMS: string[] = [
  'How sure are you that you can ask a friend or family member to stay with your loved one for a day when you need to see the doctor or run errands?',
  'How sure are you that you can keep yourself from thinking about unpleasant aspects of caregiving?',
  'How sure are you that you can stop yourself from worrying about future problems related to your loved one’s condition?',
  'How sure are you that you can cope with unexpected or new situations involving your loved one?',
  'How sure are you that you can do the things necessary to keep your own personal stress under control?',
  'How sure are you that you can do the things necessary to take care of your own health?',
  'How sure are you that you can find community resources (such as meals, respite care, legal aid, or support groups) when needed?',
  'How sure are you that you can handle or prevent situations where your loved one becomes upset, angry, or distressed?',
];

const UTILIZATION_ITEMS: Array<{
  key: 'physicianVisits' | 'erVisits' | 'hospitalStays' | 'hospitalNights';
  label: string;
  helper: string;
}> = [
  {
    key: 'physicianVisits',
    label: 'Physician / provider office visits (past 6 months)',
    helper: 'Do not include visits while admitted in the hospital or emergency department.',
  },
  {
    key: 'erVisits',
    label: 'Hospital emergency room visits (past 6 months)',
    helper: 'Count each separate trip to an emergency department.',
  },
  {
    key: 'hospitalStays',
    label: 'Overnight hospital stays / admissions (past 6 months)',
    helper: 'Number of different times admitted overnight or longer.',
  },
  {
    key: 'hospitalNights',
    label: 'Total nights spent in the hospital (past 6 months)',
    helper: 'Total cumulative nights across all inpatient hospital stays.',
  },
];

interface CaregiverScreenState {
  caregiverClientName: string;
  sessionDate: string;
  navigatorCaseId: string;
  csesAnswers: Array<number | null>;
  utilization: {
    physicianVisits: string;
    erVisits: string;
    hospitalStays: string;
    hospitalNights: string;
  };
  followUpNotes: string;
}

function createInitialState(): CaregiverScreenState {
  return {
    caregiverClientName: '',
    sessionDate: offsetDay(0),
    navigatorCaseId: 'Jasmeen Williams, LPN, BS-HHS',
    csesAnswers: Array(8).fill(null),
    utilization: {
      physicianVisits: '',
      erVisits: '',
      hospitalStays: '',
      hospitalNights: '',
    },
    followUpNotes: '',
  };
}

function loadSavedState(): CaregiverScreenState {
  const fallback = createInitialState();
  try {
    const raw = localStorage.getItem(CAREGIVER_SCREEN_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<CaregiverScreenState>;
    const savedId =
      typeof parsed.navigatorCaseId === 'string'
        ? parsed.navigatorCaseId === 'Jasmeen Williams, LPN'
          ? 'Jasmeen Williams, LPN, BS-HHS'
          : parsed.navigatorCaseId
        : fallback.navigatorCaseId;
    return {
      caregiverClientName:
        typeof parsed.caregiverClientName === 'string'
          ? parsed.caregiverClientName
          : fallback.caregiverClientName,
      sessionDate:
        typeof parsed.sessionDate === 'string'
          ? parsed.sessionDate
          : fallback.sessionDate,
      navigatorCaseId: savedId,
      csesAnswers:
        Array.isArray(parsed.csesAnswers) && parsed.csesAnswers.length === 8
          ? parsed.csesAnswers
          : fallback.csesAnswers,
      utilization: {
        physicianVisits:
          typeof parsed.utilization?.physicianVisits === 'string'
            ? parsed.utilization.physicianVisits
            : '',
        erVisits:
          typeof parsed.utilization?.erVisits === 'string'
            ? parsed.utilization.erVisits
            : '',
        hospitalStays:
          typeof parsed.utilization?.hospitalStays === 'string'
            ? parsed.utilization.hospitalStays
            : '',
        hospitalNights:
          typeof parsed.utilization?.hospitalNights === 'string'
            ? parsed.utilization.hospitalNights
            : '',
      },
      followUpNotes:
        typeof parsed.followUpNotes === 'string'
          ? parsed.followUpNotes
          : fallback.followUpNotes,
    };
  } catch {
    return fallback;
  }
}

export function CaregiverUtilizationScreen() {
  const [state, setState] = useState<CaregiverScreenState>(loadSavedState);
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(CAREGIVER_SCREEN_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const csesStats = useMemo(() => {
    const answered = state.csesAnswers.filter(
      (v): v is number => typeof v === 'number' && v >= 1 && v <= 10
    );
    const missingCount = 8 - answered.length;
    if (missingCount > 2) {
      return {
        scored: false,
        answeredCount: answered.length,
        mean: null as number | null,
      };
    }
    const mean = answered.reduce((acc, v) => acc + v, 0) / answered.length;
    return {
      scored: true,
      answeredCount: answered.length,
      mean,
    };
  }, [state.csesAnswers]);

  const utilizationSummary = useMemo(() => {
    const entries = UTILIZATION_ITEMS.map((item) => {
      const raw = state.utilization[item.key].trim();
      if (raw === '') return null;
      const num = Number(raw);
      return {
        key: item.key,
        label: item.label.replace(' (past 6 months)', ''),
        value: Number.isNaN(num) ? raw : Math.max(0, num),
      };
    }).filter((x): x is { key: 'physicianVisits' | 'erVisits' | 'hospitalStays' | 'hospitalNights'; label: string; value: number | string } => x !== null);

    return entries;
  }, [state.utilization]);

  const handleCopySummary = async () => {
    const scoreLine = csesStats.scored && csesStats.mean !== null
      ? `CSES-8 Scale Score: ${csesStats.mean.toFixed(2)} / 10 (${csesStats.answeredCount}/8 items answered; study benchmark 5.88)`
      : `CSES-8 Scale Score: Not scored (${csesStats.answeredCount}/8 answered; >2 items missing)`;

    const utilLine =
      utilizationSummary.length > 0
        ? `6-Month Health Care Utilization: ${utilizationSummary
            .map((u) => `${u.label}: ${u.value}`)
            .join(' | ')}`
        : '6-Month Health Care Utilization: No answers yet.';

    const text = [
      'SouthernWell Case Management Services — Caregiver Self-Efficacy (CSES-8) & Health Care Utilization',
      `Caregiver / Client: ${state.caregiverClientName || '—'} | Date: ${state.sessionDate} | Coordinator / Case ID: ${state.navigatorCaseId || '—'}`,
      scoreLine,
      utilLine,
      state.followUpNotes.trim() ? `Clarification Notes: ${state.followUpNotes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('✓ Summary copied to clipboard');
    } catch {
      setCopyStatus('Copy unavailable in this browser context.');
    }
  };

  const handleReset = () => {
    const fresh = createInitialState();
    setState(fresh);
    setCopyStatus('');
    try {
      localStorage.removeItem(CAREGIVER_SCREEN_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl font-semibold text-oxford-dark">
            Caregiver Self-Efficacy &amp; Care Utilization Check-In
          </h3>
          <p className="text-xs sm:text-sm text-obsidian/75 mt-0.5">
            SouthernWell of South Mississippi self-advocacy check-in template · Auto-saved on this device as you type
          </p>
        </div>
        <span className="px-3 py-1 rounded-md bg-navy-soft text-navy-slate border border-oxford/20 text-xs font-bold inline-flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-oxford" />
          <span>Saved on this device as you type</span>
        </span>
      </div>

      {/* Session Details */}
      <div className="rounded-2xl bg-white border border-card-border p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brass-deep">
          Session Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-oxford-dark mb-1">
              Caregiver / Client Name
            </label>
            <input
              type="text"
              value={state.caregiverClientName}
              onChange={(e) =>
                setState((prev) => ({ ...prev, caregiverClientName: e.target.value }))
              }
              placeholder="e.g. Sarah Davis (Family Advocate for M.C.)"
              className="w-full px-3 py-2 rounded-xl border border-card-border bg-canvas text-sm text-obsidian focus:bg-white focus:outline-none focus:border-oxford"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-oxford-dark mb-1">Date</label>
            <input
              type="date"
              value={state.sessionDate}
              onChange={(e) =>
                setState((prev) => ({ ...prev, sessionDate: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-xl border border-card-border bg-canvas text-sm text-obsidian tabular-nums focus:bg-white focus:outline-none focus:border-oxford"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-oxford-dark mb-1">
              Coordinator / Case ID
            </label>
            <input
              type="text"
              value={state.navigatorCaseId}
              onChange={(e) =>
                setState((prev) => ({ ...prev, navigatorCaseId: e.target.value }))
              }
              placeholder="Jasmeen Williams, LPN, BS-HHS"
              className="w-full px-3 py-2 rounded-xl border border-card-border bg-canvas text-sm text-obsidian focus:bg-white focus:outline-none focus:border-oxford"
            />
          </div>
        </div>
      </div>

      {/* Section 1: Self-Efficacy for Caregiving (CSES-8) */}
      <div className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs">
        <div className="bg-oxford px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-brass">
          <span className="text-xs font-bold uppercase tracking-wider text-brass-light">
            Self-Efficacy for Caregiving (CSES-8)
          </span>
          <span className="text-[11px] font-semibold text-canvas/90">
            1 = Not at all confident · 10 = Totally confident
          </span>
        </div>

        <div className="p-4 bg-canvas/60 space-y-4">
          <p className="text-xs sm:text-sm text-obsidian/85 leading-relaxed">
            How sure are you that you can keep up your own activities and also respond to caregiving situations? For each question, select how sure you are that you can do the task regularly at the present time.
          </p>

          <div className="divide-y divide-card-border bg-white rounded-xl border border-card-border px-4">
            {CSES8_ITEMS.map((question, qIdx) => {
              const selectedVal = state.csesAnswers[qIdx];
              return (
                <div key={question} className="py-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs sm:text-sm font-semibold text-oxford-dark">
                      <b>{qIdx + 1}.</b> {question}
                    </p>
                    {selectedVal !== null && (
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => {
                            const next = [...prev.csesAnswers];
                            next[qIdx] = null;
                            return { ...prev, csesAnswers: next };
                          })
                        }
                        className="text-[11px] font-semibold text-obsidian/60 hover:text-oxford-dark underline shrink-0 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-obsidian/65 mr-1 hidden sm:inline">
                      Not at all
                    </span>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const active = selectedVal === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            setState((prev) => {
                              const next = [...prev.csesAnswers];
                              next[qIdx] = num;
                              return { ...prev, csesAnswers: next };
                            })
                          }
                          aria-pressed={active}
                          className={`w-8 h-8 rounded-lg border text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                            active
                              ? 'bg-oxford text-white border-oxford shadow-2xs'
                              : 'bg-canvas text-oxford-dark border-card-border hover:border-oxford'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                    <span className="text-[11px] text-obsidian/65 ml-1 hidden sm:inline">
                      Totally confident
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Scale Score Box */}
          <div className="rounded-xl bg-gradient-to-br from-navy-soft to-white border border-oxford/25 p-4 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-oxford-dark">
                Scale score (mean of answered items)
              </span>
              <span className="text-xs font-semibold text-navy-slate tabular-nums">
                {csesStats.answeredCount} / 8 items answered
              </span>
            </div>
            <div className="font-heading text-2xl font-bold text-oxford-dark tabular-nums">
              {csesStats.scored && csesStats.mean !== null
                ? `${csesStats.mean.toFixed(2)} / 10`
                : 'Not scored'}
            </div>
            <p className="text-xs text-obsidian/80 leading-relaxed">
              <strong>Scoring:</strong> Each item&apos;s score is the number selected. The scale score is the mean of the eight items. If more than two items are missing, the scale is not scored. A higher number means higher self-efficacy. For reference, the 47 caregivers in the original study averaged 5.88 (SD 1.90). On paper, if two consecutive numbers are circled, code the lower one; if they are not consecutive, do not score the item. This page accepts one number per item.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Health Care Utilization */}
      <div className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs">
        <div className="bg-oxford px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b-2 border-brass">
          <span className="text-xs font-bold uppercase tracking-wider text-brass-light">
            Health Care Utilization Log (Past 6 Months)
          </span>
          <span className="text-[11px] font-semibold text-canvas/90">
            Enter 0 if none · Do not exceed 6 months
          </span>
        </div>

        <div className="p-4 bg-canvas/60 space-y-4">
          <p className="text-xs sm:text-sm text-obsidian/85">
            Answer for the past 6 months. Enter <strong>0</strong> if none.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {UTILIZATION_ITEMS.map((item) => (
              <div
                key={item.key}
                className="p-3.5 rounded-xl bg-white border border-card-border space-y-1.5"
              >
                <label
                  htmlFor={`util-${item.key}`}
                  className="block text-xs sm:text-sm font-bold text-oxford-dark"
                >
                  {item.label}
                </label>
                <p className="text-[11px] text-obsidian/70">{item.helper}</p>
                <input
                  id={`util-${item.key}`}
                  type="number"
                  min={0}
                  step={1}
                  value={state.utilization[item.key]}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      utilization: {
                        ...prev.utilization,
                        [item.key]: e.target.value,
                      },
                    }))
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-card-border bg-canvas text-sm font-semibold text-oxford-dark tabular-nums focus:bg-white focus:outline-none focus:border-oxford"
                />
              </div>
            ))}
          </div>

          {/* Summary Box */}
          <div className="rounded-xl bg-gradient-to-br from-navy-soft to-white border border-oxford/25 p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-oxford-dark block">
              Summary
            </span>
            {utilizationSummary.length === 0 ? (
              <p className="text-sm font-semibold text-obsidian/75">No answers yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {utilizationSummary.map((entry) => (
                  <div
                    key={entry.key}
                    className="p-2.5 rounded-lg bg-white border border-card-border"
                  >
                    <span className="text-[10.5px] font-semibold text-obsidian/70 block">
                      {entry.label}
                    </span>
                    <span className="font-heading text-xl font-bold text-oxford-dark tabular-nums">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-obsidian/80 leading-relaxed pt-1">
              <strong>Notes:</strong> These are single-item logistical tallies with no total score. Self-reports often benefit from family clarification—for example, whether an ER visit that led to an admission counts as both an ER visit and a hospital stay, separating acute-hospital nights from skilled nursing facility nights, and noting outpatient appointments. Do not log a period longer than six months.
            </p>
          </div>

          {/* Follow-up Clarification Notes */}
          <div>
            <label className="block text-xs font-bold text-oxford-dark mb-1">
              Follow-Up Clarification Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={state.followUpNotes}
              onChange={(e) =>
                setState((prev) => ({ ...prev, followUpNotes: e.target.value }))
              }
              placeholder="Clarify ER-to-inpatient stays, acute vs. SNF nights, or outpatient office visits..."
              className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford"
            />
          </div>

          {/* Action Buttons */}
          <div className="print:hidden flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-oxford hover:bg-oxford-dark text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-4 py-2 rounded-xl border border-oxford/25 bg-white text-oxford-dark hover:bg-canvas-muted text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Summary</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl border border-oxford/25 bg-white text-oxford-dark hover:bg-canvas-muted text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Template</span>
            </button>
            {copyStatus && (
              <span className="text-xs font-bold text-oxford ml-1">{copyStatus}</span>
            )}
          </div>
        </div>
      </div>

      {/* Attribution Footer */}
      <p className="text-[11px] text-obsidian/70 leading-relaxed px-1">
        Both scales are free to use without permission. Source: Self-Management Resource Center, selfmanagementresource.com. CSES-8: Ritter PL, Sheth K, Stewart AL, Gallagher-Thompson D, Lorig K. <em>The Gerontologist</em>, 2020, doi:10.1093/geront/gnaa174. Health Care Utilization: Lorig K, Stewart A, Ritter P, González V, Laurent D, Lynch J. <em>Outcome Measures for Health Education and other Health Care Interventions</em>. Sage, 1996, pp. 24–25.
      </p>
    </div>
  );
}
