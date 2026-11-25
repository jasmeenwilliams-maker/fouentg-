import { useState } from 'react';
import { MapPin, ShieldCheck } from 'lucide-react';
import { FOUNDER_PORTRAIT_URL } from '../data/southernWellData';

interface CrestLogoProps {
  className?: string;
  alt?: string;
}

export function CrestLogo({
  className = 'w-full h-full',
  alt = 'SouthernWell Case Management Services SW Botanical Monogram Crest',
}: CrestLogoProps) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`rounded-full bg-oxford border border-brass/75 flex items-center justify-center relative overflow-hidden shadow-xs ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className="w-full h-full"
      >
        <circle cx="32" cy="32" r="29" stroke="#B08D57" strokeWidth="1.25" strokeOpacity="0.85" />
        <circle cx="32" cy="32" r="25" stroke="#C8A977" strokeWidth="0.9" strokeDasharray="2 2.5" strokeOpacity="0.65" />
        <path
          d="M15 41C14 33 17 24 23 19M49 41C50 33 47 24 41 19"
          stroke="#B08D57"
          strokeWidth="1.35"
          strokeLinecap="round"
        />
        <path
          d="M23 47C27 49 37 49 41 47"
          stroke="#C8A977"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-heading font-bold text-[15px] tracking-wider text-brass-light select-none">
        SW
      </span>
    </div>
  );
}

interface FounderPortraitProps {
  className?: string;
  src?: string;
}

export function FounderPortrait({
  className = 'w-full h-full object-cover object-top',
  src = FOUNDER_PORTRAIT_URL,
}: FounderPortraitProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-oxford via-oxford-dark to-navy-slate flex flex-col items-center justify-center p-8 text-center text-canvas">
        <div className="w-16 h-16 rounded-full border border-brass/70 bg-brass/15 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-brass-light" />
        </div>
        <span className="font-heading text-2xl font-semibold text-white">
          Jasmeen Williams, LPN, BS-HHS
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-brass-light mt-2">
          Founder &amp; Principal Care Navigator
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Jasmeen Williams, LPN, BS-HHS - Founder and Principal Care Navigator"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

interface RegionCardProps {
  label: string;
  corridor: string;
  highlights: string;
}

export function RegionCard({ label, corridor, highlights }: RegionCardProps) {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-brass/45 bg-gradient-to-br from-oxford to-oxford-dark p-5 text-canvas">
      <div
        aria-hidden="true"
        className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border border-brass/25 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -right-2 -bottom-2 w-20 h-20 rounded-full border border-brass/20 pointer-events-none"
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brass-light">
            <MapPin className="w-3.5 h-3.5 text-brass-light" />
            <span>{corridor}</span>
          </span>
          <div className="font-heading text-xl font-semibold text-white">
            {label}
          </div>
          <p className="text-xs text-canvas/85">{highlights}</p>
        </div>
      </div>
    </div>
  );
}
