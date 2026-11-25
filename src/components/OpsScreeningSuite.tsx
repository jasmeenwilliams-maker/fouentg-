import { useMemo, useState } from 'react';
import { Copy, Printer, RotateCcw } from 'lucide-react';
import { offsetDay } from '../data/operationsHubData';
import { CaregiverUtilizationScreen } from './CaregiverUtilizationScreen';

interface CheckInOption {
  label: string;
  value: number;
}

const YN_OPTS: CheckInOption[] = [
  { label: 'No', value: 1 },
  { label: 'Yes', value: 0 },
];

const NY_OPTS: CheckInOption[] = [
  { label: 'Yes', value: 1 },
  { label: 'No', value: 0 },
];

const MMAS_QUESTIONS: Array<{ q: string; opts: CheckInOption[] }> = [
  { q: 'Do you sometimes forget to take your medication?', opts: YN_OPTS },
  {
    q: 'People sometimes forget to take their medications for reasons other than forgetting. Thinking over the past two weeks, were there any days when you did not take your medication?',
    opts: YN_OPTS,
  },
  {
    q: 'Have you ever cut back or stopped taking your medication without telling your doctor, because you felt worse when you took it?',
    opts: YN_OPTS,
  },
  {
    q: 'When you travel or leave home, do you sometimes forget to bring your medication?',
    opts: YN_OPTS,
  },
  {
    q: 'Did you take your medication the last time you were supposed to take it?',
    opts: NY_OPTS,
  },
  {
    q: 'When you feel like your symptoms are under control, do you sometimes stop taking your medication?',
    opts: YN_OPTS,
  },
  {
    q: 'Taking medication every day is a real inconvenience for some people. Do you ever feel hassled about sticking to your care plan?',
    opts: YN_OPTS,
  },
  {
    q: 'How often do you have difficulty remembering to take all your medications?',
    opts: [
      { label: 'Never/Rarely', value: 1 },
      { label: 'Once in a while', value: 0.75 },
      { label: 'Sometimes', value: 0.5 },
      { label: 'Usually', value: 0.25 },
      { label: 'All the time', value: 0 },
    ],
  },
];

const BHLS_QUESTIONS: Array<{ q: string; opts: CheckInOption[] }> = [
  {
    q: 'How confident are you filling out medical forms by yourself?',
    opts: [
      { label: 'Extremely', value: 5 },
      { label: 'Quite a bit', value: 4 },
      { label: 'Somewhat', value: 3 },
      { label: 'A little bit', value: 2 },
      { label: 'Not at all', value: 1 },
    ],
  },
  {
    q: 'How often do you have someone help you read health-related materials?',
    opts: [
      { label: 'Always', value: 1 },
      { label: 'Often', value: 2 },
      { label: 'Sometimes', value: 3 },
      { label: 'Occasionally', value: 4 },
      { label: 'Never', value: 5 },
    ],
  },
  {
    q: 'How often do you have problems learning about your health condition because of difficulty understanding written information?',
    opts: [
      { label: 'Always', value: 1 },
      { label: 'Often', value: 2 },
      { label: 'Sometimes', value: 3 },
      { label: 'Occasionally', value: 4 },
      { label: 'Never', value: 5 },
    ],
  },
];

export function OpsScreeningSuite() {
  const [activeInstrument, setActiveInstrument] = useState<'mmas-bhls' | 'cses-util'>(
    'mmas-bhls'
  );
  const [clientName, setClientName] = useState('');
  const [assessmentDate, setAssessmentDate] = useState(offsetDay(0));
  const [completedBy, setCompletedBy] = useState('Jasmeen Williams, LPN, BS-HHS');
  const [method, setMethod] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [mmasAnswers, setMmasAnswers] = useState<Array<number | null>>(
    () => Array(8).fill(null)
  );
  const [bhlsAnswers, setBhlsAnswers] = useState<Array<number | null>>(
    () => Array(3).fill(null)
  );
  const [copyStatus, setCopyStatus] = useState('');

  const mmasResult = useMemo(() => {
    if (mmasAnswers.some((v) => v === null)) return null;
    const sum = mmasAnswers.reduce<number>((acc, v) => acc + (v ?? 0), 0);
    const level = sum < 6 ? 'Low' : sum < 8 ? 'Medium' : 'High';
    const action =
      sum < 6
        ? 'Explore logistical barriers with family, prepare written questions for the prescribing physician, and support bottle-label calendar or organizer reminders.'
        : sum < 8
          ? 'Discuss missed-dose triggers, reinforce daily reminder routines, and align pharmacy auto-refill dates with authorized family.'
          : 'Reinforce current self-advocacy routine; check in again during the next scheduled quarterly care navigation review.';
    return { score: sum, level, action };
  }, [mmasAnswers]);

  const bhlsResult = useMemo(() => {
    if (bhlsAnswers.some((v) => v === null)) return null;
    const vals = bhlsAnswers.map((v) => v ?? 0);
    const sum = vals.reduce((acc, v) => acc + v, 0);
    const level =
      sum <= 9 ? 'Likely Needs Support' : sum <= 12 ? 'Moderate Confidence' : 'Confident';
    const frictionFlag =
      vals.some((v) => v <= 3) && sum > 9
        ? ' (At least one item scored ≤3: potential comprehension friction flagged)'
        : '';
    const action =
      sum <= 12
        ? 'Use plain-language written summaries, large-print checklists, and calm verbal review of provider paperwork; loop in authorized family advocate.'
        : 'Standard care navigation approach; continue plain-language summaries as standard family communication protocol.';
    return { score: sum, level, frictionFlag, action };
  }, [bhlsAnswers]);

  const handleCopySummary = async () => {
    const mmasLine = mmasResult
      ? `Medication Routine Check-In: ${mmasResult.score}/8 (${mmasResult.level})`
      : 'Medication Routine Check-In: Incomplete';
    const bhlsLine = bhlsResult
      ? `Health Literacy Check-In: ${bhlsResult.score}/15 (${bhlsResult.level})`
      : 'Health Literacy Check-In: Incomplete';

    const text = [
      `Client: ${clientName} | Date: ${assessmentDate} | Coordinator: ${completedBy} | Method: ${method}`,
      mmasLine,
      bhlsLine,
      `Action Notes: ${actionNotes}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('✓ Summary copied to clipboard');
    } catch {
      setCopyStatus('Copy unavailable in this browser context.');
    }
  };

  const handleReset = () => {
    setMmasAnswers(Array(8).fill(null));
    setBhlsAnswers(Array(3).fill(null));
    setActionNotes('');
    setCopyStatus('');
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-white to-canvas border border-card-border border-t-[3px] border-t-oxford p-5 shadow-xs space-y-5 mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl font-semibold text-oxford-dark">
            Self-Advocacy Check-In &amp; Care Navigation Suite
          </h3>
          <p className="text-xs sm:text-sm text-obsidian/75 mt-0.5">
            Non-clinical self-advocacy templates for Medication Routine (MMAS-8), Health Literacy (BHLS), and Caregiver Self-Efficacy &amp; Utilization (CSES-8). No skilled nursing or medical care is performed.
          </p>
        </div>
        <span className="px-3 py-1 rounded-md bg-navy-soft text-navy-slate border border-oxford/20 text-xs font-bold">
          Non-Clinical Check-In
        </span>
      </div>

      {/* Instrument Switcher */}
      <div className="print:hidden flex flex-wrap items-center gap-2 pb-4 border-b border-card-border">
        <button
          type="button"
          onClick={() => setActiveInstrument('mmas-bhls')}
          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
            activeInstrument === 'mmas-bhls'
              ? 'bg-oxford text-white border-oxford shadow-xs'
              : 'bg-white text-oxford-dark border-card-border hover:border-oxford'
          }`}
        >
          Adherence &amp; Health Literacy (MMAS-8 / BHLS)
        </button>
        <button
          type="button"
          onClick={() => setActiveInstrument('cses-util')}
          className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
            activeInstrument === 'cses-util'
              ? 'bg-oxford text-white border-oxford shadow-xs'
              : 'bg-white text-oxford-dark border-card-border hover:border-oxford'
          }`}
        >
          Caregiver Self-Efficacy (CSES-8) &amp; Utilization
        </button>
      </div>

      {activeInstrument === 'cses-util' ? (
        <CaregiverUtilizationScreen />
      ) : (
        <>
          {/* Check-In Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-oxford-dark mb-1">
                Client ID / Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="SW-RM-4081"
                className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-oxford-dark mb-1">
                Check-In Date
              </label>
              <input
                type="date"
                value={assessmentDate}
                onChange={(e) => setAssessmentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian tabular-nums focus:outline-none focus:border-oxford"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-oxford-dark mb-1">
                Completed by
              </label>
              <input
                type="text"
                value={completedBy}
                onChange={(e) => setCompletedBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-oxford-dark mb-1">Method</label>
              <input
                type="text"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                placeholder="Home visit, Phone, Video"
                className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford"
              />
            </div>
          </div>

          {/* Part 1: MMAS-8 */}
          <div className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs">
            <div className="bg-oxford px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brass-light border-b-2 border-brass">
              Part 1: Medication Routine Check-In (8 Items — MMAS)
            </div>
            <div className="p-4 bg-canvas/60 divide-y divide-card-border">
              {MMAS_QUESTIONS.map((item, qIdx) => (
                <div key={item.q} className="py-3 first:pt-1 last:pb-1">
                  <p className="text-xs sm:text-sm font-semibold text-oxford-dark mb-2">
                    <b>{qIdx + 1}.</b> {item.q}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.opts.map((opt) => {
                      const selected = mmasAnswers[qIdx] === opt.value;
                      return (
                        <label
                          key={opt.label}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'bg-navy-soft border-oxford text-oxford-dark font-bold'
                              : 'bg-white border-card-border text-obsidian hover:border-oxford/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`mmas-q-${qIdx}`}
                            checked={selected}
                            onChange={() =>
                              setMmasAnswers((prev) => {
                                const next = [...prev];
                                next[qIdx] = opt.value;
                                return next;
                              })
                            }
                            className="accent-oxford cursor-pointer"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-3">
                <div className="rounded-xl bg-gradient-to-br from-navy-soft to-canvas border border-oxford/25 p-3.5 text-xs sm:text-sm">
                  {mmasResult ? (
                    <>
                      <strong className="text-oxford-dark block mb-1 tabular-nums">
                        Score: {mmasResult.score} / 8 ({mmasResult.level} Adherence)
                      </strong>
                      <span className="text-obsidian/85">{mmasResult.action}</span>
                    </>
                  ) : (
                    <span className="text-obsidian/75">
                      Answer all 8 items to see the routine check-in score &amp; navigation notes.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: BHLS */}
          <div className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs">
            <div className="bg-oxford px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brass-light border-b-2 border-brass">
              Part 2: Brief Health Literacy Self-Advocacy Check-In (3 Items — BHLS)
            </div>
            <div className="p-4 bg-canvas/60 divide-y divide-card-border">
              {BHLS_QUESTIONS.map((item, qIdx) => (
                <div key={item.q} className="py-3 first:pt-1 last:pb-1">
                  <p className="text-xs sm:text-sm font-semibold text-oxford-dark mb-2">
                    <b>{qIdx + 1}.</b> {item.q}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.opts.map((opt) => {
                      const selected = bhlsAnswers[qIdx] === opt.value;
                      return (
                        <label
                          key={opt.label}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            selected
                              ? 'bg-navy-soft border-oxford text-oxford-dark font-bold'
                              : 'bg-white border-card-border text-obsidian hover:border-oxford/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`bhls-q-${qIdx}`}
                            checked={selected}
                            onChange={() =>
                              setBhlsAnswers((prev) => {
                                const next = [...prev];
                                next[qIdx] = opt.value;
                                return next;
                              })
                            }
                            className="accent-oxford cursor-pointer"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-3">
                <div className="rounded-xl bg-gradient-to-br from-navy-soft to-canvas border border-oxford/25 p-3.5 text-xs sm:text-sm">
                  {bhlsResult ? (
                    <>
                      <strong className="text-oxford-dark block mb-1 tabular-nums">
                        Score: {bhlsResult.score} / 15 ({bhlsResult.level})
                        {bhlsResult.frictionFlag}
                      </strong>
                      <span className="text-obsidian/85">{bhlsResult.action}</span>
                    </>
                  ) : (
                    <span className="text-obsidian/75">
                      Answer all 3 items to see the health literacy self-advocacy score.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-Up Care Navigation Plan */}
          <div className="rounded-2xl bg-white border border-card-border overflow-hidden shadow-xs">
            <div className="bg-oxford px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-brass-light border-b-2 border-brass">
              Follow-Up Care Navigation Plan
            </div>
            <div className="p-4 bg-canvas/60 space-y-3">
              <div>
                <label className="block text-xs font-bold text-oxford-dark mb-1">
                  Coordinator Action Notes
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Plain-language summary, large print folder labels, reminder calendar, provider scheduling sync..."
                  className="w-full px-3 py-2 rounded-xl border border-card-border bg-white text-sm text-obsidian focus:outline-none focus:border-oxford"
                />
              </div>
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
                  <span>Clear Check-In Form</span>
                </button>
                {copyStatus && (
                  <span className="text-xs font-bold text-oxford ml-1">{copyStatus}</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
