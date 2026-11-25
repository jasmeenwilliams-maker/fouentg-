import { useState } from 'react';
import { Users, Minus, Plus, FolderHeart, Coffee, Copy, Check } from 'lucide-react';

export interface CostShareSelection {
  planId: 'essential' | 'comprehensive';
  planName: string;
  siblings: number;
  scaleFactor: number;
  includeFoundation: boolean;
  monthlyPerMember: number;
  totalMonth1PerMember: number;
}

interface SiblingCostCalculatorProps {
  selectedPlan?: 'essential' | 'comprehensive';
  onPlanChange?: (plan: 'essential' | 'comprehensive') => void;
  onDiscussConsultation: (summary: CostShareSelection) => void;
}

const FOUNDATION_FEE = 225;

export function SiblingCostCalculator({
  selectedPlan: controlledPlan,
  onPlanChange,
  onDiscussConsultation,
}: SiblingCostCalculatorProps) {
  const [internalPlan, setInternalPlan] = useState<'essential' | 'comprehensive'>('comprehensive');
  const [siblings, setSiblings] = useState<number>(3);
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [includeFoundation, setIncludeFoundation] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const plan = controlledPlan ?? internalPlan;
  const setPlan = (next: 'essential' | 'comprehensive') => {
    setInternalPlan(next);
    onPlanChange?.(next);
  };

  const basePrice = plan === 'essential' ? 275 : 350;
  const planName =
    plan === 'essential' ? 'Essential Stewardship' : 'Comprehensive Care Navigation';
  const adjustedRetainer = basePrice * scaleFactor;
  const monthlyPerMember = adjustedRetainer / siblings;
  const dailyPerMember = monthlyPerMember / 30;
  const foundationPerMember = (FOUNDATION_FEE * scaleFactor) / siblings;
  const totalMonth1PerMember =
    monthlyPerMember + (includeFoundation ? foundationPerMember : 0);

  const adjustSiblings = (delta: number) => {
    setSiblings((prev) => Math.min(8, Math.max(1, prev + delta)));
  };

  const scaleLabel =
    scaleFactor === 1
      ? 'Standard (100%)'
      : scaleFactor === 0.8
        ? 'Tier A (-20%)'
        : 'Tier B (-35%)';

  const handleCopyBreakdown = async () => {
    const lines = [
      `SouthernWell Case Management Services — Family Cost-Share Summary`,
      `Plan: ${planName} ($${adjustedRetainer.toFixed(2)}/mo · ${scaleLabel})`,
      `Contributing Members: ${siblings} ${siblings === 1 ? 'member' : 'siblings'}`,
      `Monthly Share Per Member: $${monthlyPerMember.toFixed(2)}/mo (~$${dailyPerMember.toFixed(2)}/day)`,
      includeFoundation
        ? `Month 1 Onboarding Share (+Foundation Walkthrough): +$${foundationPerMember.toFixed(2)} one-time ($${totalMonth1PerMember.toFixed(2)} total Month 1)`
        : null,
      `Schedule complimentary consultation: 601-554-6067`,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-oxford via-oxford to-oxford-dark px-6 py-6 sm:px-10 border-b border-brass/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-white/10 border border-brass/50 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-brass-light" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-canvas/85 mb-0.5">
              <span className="font-semibold tracking-[0.16em] uppercase text-brass-light">
                Interactive Tool
              </span>
              <span aria-hidden="true">·</span>
              <span>Family Financial Transparency</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white leading-tight">
              Family Cost-Sharing Calculator
            </h3>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-canvas/85 md:max-w-md md:text-right">
          See how easily ongoing non-clinical care navigation divides among adult siblings or contributing family members.
        </p>
      </div>

      <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Controls */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* 1. Plan Selector */}
          <div>
            <span className="block text-xs font-bold tracking-wider text-obsidian uppercase mb-2.5">
              1. Select Monthly Retainer Plan
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('essential')}
                aria-pressed={plan === 'essential'}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford ${
                  plan === 'essential'
                    ? 'border-oxford bg-navy-soft/70 shadow-xs'
                    : 'border-card-border bg-canvas hover:border-brass'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-heading font-bold text-lg text-obsidian">
                    Essential Stewardship
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      plan === 'essential' ? 'border-oxford' : 'border-obsidian/40'
                    }`}
                  >
                    {plan === 'essential' && (
                      <span className="w-2 h-2 rounded-full bg-oxford" />
                    )}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1 tabular-nums">
                  <span className="text-2xl font-bold text-obsidian font-heading">$275</span>
                  <span className="text-xs text-obsidian/65">/ month</span>
                </div>
                <span className="text-xs text-obsidian/75 mt-1">
                  2 scheduled check-ins &amp; pillbox review
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlan('comprehensive')}
                aria-pressed={plan === 'comprehensive'}
                className={`text-left p-4 rounded-xl border-2 transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxford ${
                  plan === 'comprehensive'
                    ? 'border-oxford bg-navy-soft/70 shadow-xs'
                    : 'border-card-border bg-canvas hover:border-brass'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-heading font-bold text-lg text-obsidian truncate">
                      Care Navigation
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brass-light text-oxford-dark uppercase whitespace-nowrap shrink-0">
                      Popular
                    </span>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      plan === 'comprehensive' ? 'border-oxford' : 'border-obsidian/40'
                    }`}
                  >
                    {plan === 'comprehensive' && (
                      <span className="w-2 h-2 rounded-full bg-oxford" />
                    )}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-1 tabular-nums">
                  <span className="text-2xl font-bold text-obsidian font-heading">$350</span>
                  <span className="text-xs text-obsidian/65">/ month</span>
                </div>
                <span className="text-xs text-obsidian/75 mt-1">
                  Weekly visits + 2 accompaniments
                </span>
              </button>
            </div>
          </div>

          {/* 2. Sibling Count Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5 gap-2">
              <span className="block text-xs font-bold tracking-wider text-obsidian uppercase">
                2. Contributing Siblings / Family Members
              </span>
              <span className="text-xs text-oxford font-semibold tabular-nums whitespace-nowrap">
                {siblings === 1 ? 'Individual Member' : `Split ${siblings} ways`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-lg border border-card-border bg-white p-1">
                <button
                  type="button"
                  aria-label="Decrease contributing siblings"
                  onClick={() => adjustSiblings(-1)}
                  disabled={siblings <= 1}
                  className="w-9 h-9 rounded bg-canvas hover:bg-canvas-muted disabled:opacity-40 text-obsidian font-bold flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-heading font-bold text-xl text-obsidian tabular-nums">
                  {siblings}
                </span>
                <button
                  type="button"
                  aria-label="Increase contributing siblings"
                  onClick={() => adjustSiblings(1)}
                  disabled={siblings >= 8}
                  className="w-9 h-9 rounded bg-canvas hover:bg-canvas-muted disabled:opacity-40 text-obsidian font-bold flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setSiblings(count)}
                    className={`px-3 py-2 text-xs rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      siblings === count
                        ? 'border-oxford bg-oxford text-canvas font-bold'
                        : 'border-card-border bg-canvas text-obsidian/80 font-semibold hover:border-brass'
                    }`}
                  >
                    {count} Siblings
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Foundation Assessment Toggle */}
          <div className="p-4 rounded-xl bg-canvas border border-card-border flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <FolderHeart className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
              <div>
                <label
                  htmlFor="foundation-assessment-toggle"
                  className="text-xs font-bold text-obsidian block cursor-pointer"
                >
                  Include One-Time Foundation Walkthrough ($225)?
                </label>
                <span className="text-xs text-obsidian/75">
                  Calculates initial Month 1 onboarding cost split evenly across members.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="foundation-assessment-toggle"
                type="checkbox"
                checked={includeFoundation}
                onChange={(e) => setIncludeFoundation(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#CFC8BC] rounded-full peer peer-focus-visible:ring-2 peer-focus-visible:ring-oxford peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-oxford" />
            </label>
          </div>

          {/* 4. Community Sliding Scale */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs font-bold tracking-wider text-obsidian uppercase">
                Community Sliding Scale Simulation
              </span>
              <span className="text-xs text-navy-slate font-medium">
                Income-Qualified Families
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { factor: 1.0, label: 'Standard (100%)' },
                { factor: 0.8, label: 'Tier A (20% off)' },
                { factor: 0.65, label: 'Tier B (35% off)' },
              ].map((option) => (
                <button
                  key={option.factor}
                  type="button"
                  onClick={() => setScaleFactor(option.factor)}
                  className={`py-2.5 px-2 text-center rounded-lg border text-xs transition-all whitespace-nowrap cursor-pointer ${
                    scaleFactor === option.factor
                      ? 'border-oxford bg-oxford text-canvas font-semibold'
                      : 'border-card-border bg-canvas text-obsidian/80 font-medium hover:border-brass'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Result Card */}
        <div className="lg:col-span-5 bg-oxford rounded-xl p-6 sm:p-7 text-canvas flex flex-col justify-between border-2 border-brass/70 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-5 gap-2">
              <span className="text-[11px] font-bold tracking-[0.18em] text-brass-light uppercase">
                Share Per Family Member
              </span>
              <span className="text-xs text-brass-light font-medium truncate">
                {planName}
              </span>
            </div>

            <div className="text-center py-2">
              <div className="text-[11px] font-semibold text-canvas/80 uppercase tracking-widest mb-1">
                Your Monthly Share
              </div>
              <div className="flex items-baseline justify-center gap-1.5 tabular-nums">
                <span className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  ${monthlyPerMember.toFixed(2)}
                </span>
                <span className="text-sm text-brass-light font-medium">
                  / mo per member
                </span>
              </div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-brass-light tabular-nums">
                <Coffee className="w-3.5 h-3.5 text-brass-light" />
                <span>Just ~${dailyPerMember.toFixed(2)} / day per member</span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/15 space-y-2.5 text-xs text-canvas/90 tabular-nums">
              <div className="flex justify-between items-center gap-2">
                <span className="text-canvas/75">Total Monthly Retainer:</span>
                <span className="font-bold text-white">
                  ${adjustedRetainer.toFixed(2)} / mo
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-canvas/75">Contributing Members:</span>
                <span className="font-semibold text-brass-light">
                  {siblings === 1
                    ? '1 Family Member'
                    : `${siblings} Contributing Siblings`}
                </span>
              </div>
              {scaleFactor < 1 && (
                <div className="flex justify-between items-center gap-2">
                  <span className="text-canvas/75">Sliding Scale Adjusted:</span>
                  <span className="font-semibold text-brass-light">
                    {scaleFactor === 0.8 ? 'Tier A (-20%)' : 'Tier B (-35%)'}
                  </span>
                </div>
              )}
              {includeFoundation && (
                <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/15">
                  <span className="text-canvas/75">Month 1 Onboarding Share:</span>
                  <span className="font-bold text-brass-light text-right">
                    +${foundationPerMember.toFixed(2)} one-time ($
                    {totalMonth1PerMember.toFixed(2)} total M1)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/15 space-y-2.5 relative z-10">
            <button
              type="button"
              onClick={() =>
                onDiscussConsultation({
                  planId: plan,
                  planName,
                  siblings,
                  scaleFactor,
                  includeFoundation,
                  monthlyPerMember,
                  totalMonth1PerMember,
                })
              }
              className="w-full py-3 px-4 rounded-lg bg-canvas hover:bg-brass-soft text-oxford-dark font-bold text-xs tracking-wider uppercase text-center transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              Discuss Shared Family Billing
            </button>

            <button
              type="button"
              onClick={handleCopyBreakdown}
              className="w-full py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-canvas text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-brass-light" />
                  <span>Cost Breakdown Copied for Family</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-brass-light" />
                  <span>Copy Summary for Siblings</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-canvas/75 font-normal pt-1">
              SouthernWell Case Management Services supports split billing or coordinated monthly invoices across family members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
