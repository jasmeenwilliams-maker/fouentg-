import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Delete, Lock } from 'lucide-react';

export const HUB_AUTH_KEY = 'sw_hub_auth_v1';
const VALID_HUB_PINS = ['1941', '2024'];

interface OpsPinLockProps {
  onUnlock: () => void;
  onBackToOverview: () => void;
}

export function OpsPinLock({ onUnlock, onBackToOverview }: OpsPinLockProps) {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleKeyInput = useCallback(
    (val: string) => {
      setErrorMsg('');
      setHasError(false);

      if (val === 'clr') {
        setEnteredPin('');
        return;
      }

      if (val === 'del') {
        setEnteredPin((prev) => prev.slice(0, -1));
        return;
      }

      if (/^[0-9]$/.test(val)) {
        setEnteredPin((prev) => {
          if (prev.length >= 4) return prev;
          const next = prev + val;

          if (next.length === 4) {
            window.setTimeout(() => {
              if (VALID_HUB_PINS.includes(next)) {
                try {
                  sessionStorage.setItem(HUB_AUTH_KEY, 'granted');
                } catch {
                  // ignore sessionStorage failures
                }
                onUnlock();
              } else {
                setHasError(true);
                setErrorMsg('Incorrect authorization PIN. Try again.');
                window.setTimeout(() => {
                  setEnteredPin('');
                  setHasError(false);
                }, 600);
              }
            }, 150);
          }

          return next;
        });
      }
    },
    [onUnlock]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyInput(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyInput('del');
      } else if (e.key === 'Escape') {
        handleKeyInput('clr');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyInput]);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gradient-to-br from-oxford via-oxford-dark to-oxford-dark p-5">
      <div className="w-full max-w-[420px] bg-white border-2 border-brass/70 rounded-[28px] px-7 py-8 text-center shadow-2xl relative overflow-hidden">
        {/* Top Navy & Brass Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-oxford via-brass to-oxford-dark" />

        <div className="w-[68px] h-[68px] mx-auto mb-4 rounded-[22px] bg-gradient-to-br from-oxford to-oxford-dark border-2 border-brass/70 flex items-center justify-center text-brass-light shadow-md">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="font-heading text-[28px] font-semibold text-oxford-dark tracking-tight mb-1.5">
          Operations Security Gate
        </h1>
        <p className="text-[13px] text-obsidian/75 leading-relaxed mb-5">
          Confidential client records &amp; care navigation logs.
          <br />
          Enter 4-digit coordinator authorization PIN:
        </p>

        {/* 4 Circular PIN Display Dots */}
        <div
          className="flex justify-center gap-3.5 my-5"
          aria-label={`PIN digits entered: ${enteredPin.length} of 4`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-[18px] h-[18px] rounded-full border-2 transition-all duration-200 ${
                  hasError
                    ? 'bg-[#9E3524] border-[#9E3524] scale-110'
                    : filled
                      ? 'bg-oxford border-oxford scale-115 shadow-[0_0_0_3px_rgba(176,141,87,0.35)]'
                      : 'bg-canvas border-brass/70'
                }`}
              />
            );
          })}
        </div>

        {/* 3x4 Coordinator Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[290px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyInput(digit)}
              className="h-[52px] rounded-[14px] bg-canvas border border-card-border text-oxford-dark text-xl font-bold flex items-center justify-center cursor-pointer select-none transition-all hover:bg-navy-soft hover:border-oxford hover:scale-[1.03] active:scale-95"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeyInput('clr')}
            className="h-[52px] rounded-[14px] bg-canvas-muted border border-card-border text-navy-slate text-[13px] font-extrabold tracking-wider flex items-center justify-center cursor-pointer select-none transition-all hover:bg-navy-soft hover:border-oxford active:scale-95"
          >
            CLR
          </button>
          <button
            type="button"
            onClick={() => handleKeyInput('0')}
            className="h-[52px] rounded-[14px] bg-canvas border border-card-border text-oxford-dark text-xl font-bold flex items-center justify-center cursor-pointer select-none transition-all hover:bg-navy-soft hover:border-oxford hover:scale-[1.03] active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleKeyInput('del')}
            aria-label="Backspace PIN digit"
            className="h-[52px] rounded-[14px] bg-canvas-muted border border-card-border text-navy-slate flex items-center justify-center cursor-pointer select-none transition-all hover:bg-navy-soft hover:border-oxford active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-[20px] text-[12.5px] font-bold text-[#9E3524] mt-2">
          {errorMsg}
        </div>

        <div className="mt-3.5 text-[11px] font-semibold text-navy-slate">
          Authorized: Jasmeen Williams, LPN, BS-HHS (PIN: 1941 or 2024)
        </div>

        <button
          type="button"
          onClick={onBackToOverview}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-oxford-dark/80 hover:text-oxford-dark underline underline-offset-4 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Service Overview</span>
        </button>
      </div>
    </div>
  );
}
