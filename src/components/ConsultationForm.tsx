import { useEffect, useState, type FormEvent } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, Calendar, Video, Home, FileCheck2 } from 'lucide-react';
import { BRAND_INFO } from '../data/southernWellData';
import type { CostShareSelection } from './SiblingCostCalculator';
import { syncRecordToSheet } from '../utils/sheetsSync';
import { SheetsSyncControl } from './SheetsSyncControl';

const CONSULTATION_STORAGE_KEY = 'sw_consultation_requests_v1';

interface ConsultationFormProps {
  preselectedTier?: string;
  preselectedLocation?: 'hattiesburg' | 'gulfport' | 'laurel' | 'other';
  costShareSummary?: CostShareSelection | null;
  onClearPreselection?: () => void;
  onOpenEnrollmentPortal?: () => void;
}

export function ConsultationForm({
  preselectedTier,
  preselectedLocation,
  costShareSummary,
  onClearPreselection,
  onOpenEnrollmentPortal,
}: ConsultationFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState<string>(preselectedLocation ?? 'hattiesburg');
  const [format, setFormat] = useState<'phone' | 'video' | 'in-home'>('phone');
  const [timeWindow, setTimeWindow] = useState('Morning (9:00 AM – 12:00 PM)');
  const [situation, setSituation] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (preselectedLocation) {
      setLocation(preselectedLocation);
    }
  }, [preselectedLocation]);

  const locationLabelMap: Record<string, string> = {
    hattiesburg: 'Hattiesburg / Petal / Pine Belt',
    gulfport: 'Gulfport / Biloxi / Coast',
    laurel: 'Laurel / Surrounding Areas',
    other: 'Other South Mississippi Area',
  };

  const formatLabelMap: Record<'phone' | 'video' | 'in-home', string> = {
    phone: 'Phone Call',
    video: 'Video Call',
    'in-home': 'In-Home Discovery',
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedPhone || !trimmedEmail) {
      setErrorMsg('Please provide your name, phone number, and email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const record = {
      fullName: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      location: locationLabelMap[location] || location,
      format: formatLabelMap[format] || format,
      timeWindow,
      interestedTier: preselectedTier || 'General Inquiry',
      costShareSummary: costShareSummary
        ? `${costShareSummary.planName} (${costShareSummary.siblings} members @ $${costShareSummary.monthlyPerMember.toFixed(2)}/mo)`
        : '',
      situation: situation.trim(),
      coordinator: 'Jasmeen Williams, LPN, BS-HHS',
      scope: 'Non-clinical family consultation request',
    };

    try {
      const raw = localStorage.getItem(CONSULTATION_STORAGE_KEY);
      const existing = raw ? (JSON.parse(raw) as unknown[]) : [];
      const next = [
        { submittedAt: new Date().toISOString(), ...record },
        ...(Array.isArray(existing) ? existing : []),
      ].slice(0, 50);
      localStorage.setItem(CONSULTATION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota errors
    }

    void syncRecordToSheet('Consultations', record);

    setErrorMsg(null);
    setSubmitted(true);
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-10 lg:p-12 border border-card-border shadow-sm">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs sm:text-sm font-semibold tracking-widest text-brass-deep uppercase block mb-2">
          Complimentary Family Discovery
        </span>
        <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight mb-3 text-balance">
          Let's talk about how we can support your family.
        </h2>
        <p className="text-base sm:text-lg text-obsidian/80">
          Schedule a complimentary, no-obligation 30-minute consultation with {BRAND_INFO.founder}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Direct Contact Info Side Panel */}
        <div className="lg:col-span-5 bg-canvas rounded-xl p-6 sm:p-8 border border-card-border flex flex-col gap-6">
          <h3 className="font-heading text-2xl font-bold text-obsidian">
            Direct Service Inquiries
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-obsidian/65 block">
                  Call or Text
                </span>
                <a
                  href={`tel:${BRAND_INFO.phone}`}
                  className="text-base font-bold text-obsidian hover:text-oxford transition-colors tabular-nums block"
                >
                  {BRAND_INFO.phone}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs uppercase tracking-wider font-semibold text-obsidian/65 block">
                  Direct Email
                </span>
                <a
                  href={`mailto:${BRAND_INFO.email}`}
                  className="text-sm sm:text-base font-bold text-obsidian hover:text-oxford transition-colors break-all"
                >
                  {BRAND_INFO.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-obsidian/65 block">
                  Service Area
                </span>
                <span className="text-sm font-semibold text-obsidian">
                  Hattiesburg / Pine Belt &amp; Gulfport / Mississippi Gulf Coast
                </span>
              </div>
            </div>
          </div>

          {(preselectedTier || costShareSummary) && (
            <div className="p-4 rounded-lg bg-white border border-brass/55 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-oxford">
                  Selected Care Context
                </span>
                {onClearPreselection && (
                  <button
                    type="button"
                    onClick={onClearPreselection}
                    className="text-[11px] text-obsidian/65 hover:text-obsidian underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              {preselectedTier && (
                <p className="text-xs font-semibold text-obsidian">
                  Interested Tier: {preselectedTier}
                </p>
              )}
              {costShareSummary && (
                <p className="text-xs text-obsidian/80 tabular-nums">
                  {costShareSummary.planName} split across {costShareSummary.siblings}{' '}
                  {costShareSummary.siblings === 1 ? 'member' : 'siblings'} ($
                  {costShareSummary.monthlyPerMember.toFixed(2)}/mo each)
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-card-border text-xs text-obsidian/75 space-y-1">
            <p>All inquiries are received directly by Jasmeen Williams, LPN, BS-HHS.</p>
            <p className="font-semibold text-oxford-dark">
              Strictly non-clinical care navigation—no skilled nursing or medical care is performed.
            </p>
          </div>
        </div>

        {/* Contact Form / Confirmation */}
        <div className="lg:col-span-7">
          {submitted ? (
            <div className="p-8 rounded-xl bg-navy-soft border border-oxford/25 text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-oxford mx-auto" />
              <h4 className="font-heading text-2xl sm:text-3xl font-bold text-obsidian">
                Thank You for Reaching Out
              </h4>
              <p className="text-sm sm:text-base text-obsidian/85 max-w-md mx-auto">
                Jasmeen has received your consultation request for{' '}
                <strong>{locationLabelMap[location]}</strong> ({formatLabelMap[format]} ·{' '}
                {timeWindow}) and will reach out personally within 24 hours.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                {onOpenEnrollmentPortal && (
                  <button
                    type="button"
                    onClick={onOpenEnrollmentPortal}
                    className="px-5 py-2.5 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileCheck2 className="w-3.5 h-3.5 text-brass-light" />
                    <span>Open Client Enrollment Portal</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 rounded-lg border border-oxford/25 bg-white hover:bg-canvas text-xs font-semibold text-obsidian transition-colors cursor-pointer"
                >
                  Update Inquiry Details
                </button>
              </div>
              <div className="pt-3 border-t border-oxford/15 flex justify-center">
                <SheetsSyncControl compact />
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Consultation Format Segmented Control */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-2">
                  Preferred Consultation Format
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'phone' as const, label: 'Phone Call', icon: Phone },
                    { id: 'video' as const, label: 'Video Call', icon: Video },
                    { id: 'in-home' as const, label: 'In-Home', icon: Home },
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = format === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormat(item.id)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'border-oxford bg-oxford text-canvas'
                            : 'border-card-border bg-canvas text-obsidian/80 hover:border-brass'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                    htmlFor="full_name"
                  >
                    Your Name *
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full px-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                    htmlFor="phone"
                  >
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(601) 555-0199"
                    className="w-full px-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                    htmlFor="email"
                  >
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                    htmlFor="location"
                  >
                    Loved One's Location
                  </label>
                  <select
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                  >
                    <option value="hattiesburg">Hattiesburg / Petal / Pine Belt</option>
                    <option value="gulfport">Gulfport / Biloxi / Coast</option>
                    <option value="laurel">Laurel / Surrounding Areas</option>
                    <option value="other">Other South Mississippi Area</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                  htmlFor="time_window"
                >
                  Preferred Time Window
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-oxford absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="time_window"
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                  >
                    <option>Morning (9:00 AM – 12:00 PM)</option>
                    <option>Midday (12:00 PM – 3:00 PM)</option>
                    <option>Late Afternoon (3:00 PM – 5:30 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider text-obsidian mb-1.5"
                  htmlFor="situation"
                >
                  How can Jasmeen best assist your family?
                </label>
                <textarea
                  id="situation"
                  rows={3}
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Tell us a little about your loved one's current situation, upcoming appointments, or care coordination needs..."
                  className="w-full px-4 py-3 rounded-lg border border-card-border bg-white focus:outline-none focus:border-oxford text-sm text-obsidian"
                />
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-[#FDF2F2] border border-[#D98282] text-xs font-medium text-[#8B2626]"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 px-6 rounded-lg bg-oxford hover:bg-oxford-dark text-canvas font-semibold text-sm tracking-wider uppercase transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request Free 30-Minute Consultation</span>
                <Send className="w-4 h-4 text-brass-light" />
              </button>
              <p className="text-center text-xs text-obsidian/65">
                Strictly confidential. No sales pressure. We will respond within 24 hours.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
