import { useState } from 'react';
import {
  Calendar,
  PhoneCall,
  Award,
  MapPin,
  Shield,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Plane,
  Clock,
  Heart,
  Headphones,
  FileCheck2,
  Home,
  BookOpen,
  CalendarCheck,
  Handshake,
  Check,
  Car,
  Scale,
  ChevronDown,
  Phone,
  Menu,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react';
import {
  AUDIENCE_CARDS,
  BRAND_INFO,
  FAQ_ITEMS,
  PRICING_TIERS,
  WORKFLOW_STAGES,
} from './data/southernWellData';
import { CrestLogo, FounderPortrait } from './components/BrandImage';
import aboutFounderPortrait from './assets/images/regenerated_image_1795726606900.webp';
import {
  SiblingCostCalculator,
  type CostShareSelection,
} from './components/SiblingCostCalculator';
import { CareDossierScreen } from './components/CareDossierScreen';
import { ConsultationForm } from './components/ConsultationForm';
import { EnrollmentFormsScreen } from './components/EnrollmentFormsScreen';
import { DossierAndGuidesSection } from './components/DossierAndGuidesSection';
import {
  ClientPortalModal,
  type PortalDestination,
} from './components/ClientPortalModal';
import { OperationsHubScreen } from './components/OperationsHubScreen';
import type { OpsNavId } from './data/operationsHubData';

type AppScreen = 'overview' | 'dossier' | 'enrollment' | 'operations';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [enrollmentStage, setEnrollmentStage] = useState(0);
  const [enrollmentTab, setEnrollmentTab] = useState<'stages' | 'workbook'>('stages');
  const [operationsInitialNav, setOperationsInitialNav] = useState<OpsNavId>('dashboard');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);
  const [calculatorPlan, setCalculatorPlan] = useState<'essential' | 'comprehensive'>(
    'comprehensive'
  );
  const [preselectedTier, setPreselectedTier] = useState<string | undefined>(undefined);
  const [preselectedLocation, setPreselectedLocation] = useState<
    'hattiesburg' | 'gulfport' | 'laurel' | 'other' | undefined
  >(undefined);
  const [costShareSummary, setCostShareSummary] = useState<CostShareSelection | null>(
    null
  );

  const navigateToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (screen !== 'overview') {
      setScreen('overview');
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openScreen = (nextScreen: AppScreen) => {
    setMobileMenuOpen(false);
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePortalDestination = (dest: PortalDestination) => {
    if (dest.type === 'dossier') {
      openScreen('dossier');
      return;
    }
    if (dest.type === 'operations') {
      setOperationsInitialNav(dest.initialNav ?? 'dashboard');
      openScreen('operations');
      return;
    }
    setEnrollmentStage(dest.stageIndex);
    setEnrollmentTab(dest.tab ?? 'stages');
    openScreen('enrollment');
  };

  const handleSelectPricingTier = (
    tierId: 'foundation' | 'essential' | 'comprehensive' | 'alacarte',
    tierTitle: string
  ) => {
    setPreselectedTier(tierTitle);
    if (tierId === 'essential' || tierId === 'comprehensive') {
      setCalculatorPlan(tierId);
    }
    navigateToSection('consultation');
  };

  const handleDiscussFromCalculator = (summary: CostShareSelection) => {
    setCostShareSummary(summary);
    setPreselectedTier(summary.planName);
    navigateToSection('consultation');
  };

  const renderAudienceIcon = (icon: 'flight' | 'schedule' | 'heart') => {
    if (icon === 'flight') return <Plane className="w-6 h-6" />;
    if (icon === 'schedule') return <Clock className="w-6 h-6" />;
    return <Heart className="w-6 h-6" />;
  };

  const renderStageIcon = (stageNumber: number) => {
    switch (stageNumber) {
      case 1:
        return <Headphones className="w-5 h-5" />;
      case 2:
        return <FileCheck2 className="w-5 h-5" />;
      case 3:
        return <Home className="w-5 h-5" />;
      case 4:
        return <BookOpen className="w-5 h-5" />;
      default:
        return <CalendarCheck className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-obsidian">
      {/* ===================================================================== */}
      {/* TOP NAVIGATION BAR                                                    */}
      {/* ===================================================================== */}
      <header className="print:hidden sticky top-0 z-50 bg-oxford text-canvas border-b border-brass/40">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => openScreen('overview')}
            className="flex items-center gap-3 group text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-light"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 transition-transform duration-200 group-hover:scale-105">
              <CrestLogo />
            </div>
            <div>
              <span className="font-heading font-bold text-xl sm:text-2xl tracking-wide text-white leading-none block whitespace-nowrap">
                SOUTHERNWELL
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.14em] text-brass-light mt-0.5">
                Case Management Services
              </span>
            </div>
          </button>

          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-canvas/90"
          >
            <button
              type="button"
              onClick={() => navigateToSection('workflow')}
              className="hover:text-brass-light transition-colors py-1 relative whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brass-light hover:after:w-full after:transition-all"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => openScreen('dossier')}
              className={`transition-colors py-1 relative whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-brass-light after:transition-all ${
                screen === 'dossier'
                  ? 'text-brass-light font-semibold after:w-full'
                  : 'hover:text-brass-light after:w-0 hover:after:w-full'
              }`}
            >
              Care Dossier
            </button>
            <button
              type="button"
              onClick={() => openScreen('enrollment')}
              className={`transition-colors py-1 relative whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-brass-light after:transition-all ${
                screen === 'enrollment'
                  ? 'text-brass-light font-semibold after:w-full'
                  : 'hover:text-brass-light after:w-0 hover:after:w-full'
              }`}
            >
              Enrollment
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('services-pricing')}
              className="hover:text-brass-light transition-colors py-1 relative whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brass-light hover:after:w-full after:transition-all"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('about-jasmeen')}
              className="hover:text-brass-light transition-colors py-1 relative whitespace-nowrap shrink-0 cursor-pointer after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brass-light hover:after:w-full after:transition-all"
            >
              About &amp; FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setPortalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded border border-brass/60 bg-oxford-dark hover:bg-navy-slate text-canvas text-xs sm:text-sm font-semibold tracking-wide hover:border-brass-light transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-brass-light shrink-0" />
              <span className="hidden sm:inline">Client Portal</span>
              <span className="sm:hidden">Portal</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToSection('consultation')}
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded bg-brass hover:bg-brass-light text-oxford-dark text-sm font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Book Consultation
            </button>

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-lg border border-brass/50 bg-oxford-dark text-canvas cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-brass/30 bg-oxford-dark px-5 py-4 space-y-2 text-canvas">
            <button
              type="button"
              onClick={() => openScreen('overview')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas hover:bg-navy-slate cursor-pointer"
            >
              Service Overview
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('who-we-serve')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              Who We Serve
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('workflow')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => openScreen('dossier')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              Care Dossier Explorer
            </button>
            <button
              type="button"
              onClick={() => openScreen('enrollment')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              Enrollment Forms (5 Stages)
            </button>
            <button
              type="button"
              onClick={() => {
                setOperationsInitialNav('dashboard');
                openScreen('operations');
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              Coordinator Operations Hub
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('services-pricing')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              Pricing &amp; Cost Calculator
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('about-jasmeen')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-canvas/90 hover:bg-navy-slate cursor-pointer"
            >
              About Jasmeen &amp; FAQ
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setPortalModalOpen(true);
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold text-canvas bg-oxford border border-brass/50 flex items-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-brass-light" />
              <span>Client &amp; Family Portal</span>
            </button>
            <button
              type="button"
              onClick={() => navigateToSection('consultation')}
              className="w-full mt-2 py-3 px-4 rounded bg-brass text-oxford-dark text-sm font-bold text-center cursor-pointer"
            >
              Book Free Consultation
            </button>
          </div>
        )}
      </header>

      {/* ===================================================================== */}
      {/* SCREEN ROUTER                                                         */}
      {/* ===================================================================== */}
      <main className="w-full flex-1">
        {screen === 'operations' && (
          <OperationsHubScreen
            initialNav={operationsInitialNav}
            onBackToOverview={() => openScreen('overview')}
            onOpenEnrollmentForms={(stageIdx, tab) => {
              setEnrollmentStage(stageIdx ?? 0);
              setEnrollmentTab(tab ?? 'stages');
              openScreen('enrollment');
            }}
          />
        )}

        {screen === 'enrollment' && (
          <EnrollmentFormsScreen
            initialStage={enrollmentStage}
            initialPortalTab={enrollmentTab}
            onBackToOverview={() => openScreen('overview')}
            onOpenOperationsHub={() => {
              setOperationsInitialNav('dashboard');
              openScreen('operations');
            }}
          />
        )}

        {screen === 'dossier' && (
          <CareDossierScreen
            onBackToOverview={() => openScreen('overview')}
            onBookConsultation={() => {
              setPreselectedTier('The Foundation Walkthrough & Care Dossier');
              navigateToSection('consultation');
            }}
          />
        )}

        {screen === 'overview' && (
          <>
            {/* ================================================================= */}
            {/* SECTION 1: HERO SECTION                                           */}
            {/* ================================================================= */}
            <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-card-border">
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                  {/* Left Text Content */}
                  <div className="lg:col-span-7 flex flex-col justify-center gap-6">
                    <div className="text-xs font-semibold tracking-[0.16em] text-brass-deep uppercase">
                      {BRAND_INFO.subtitle} · Hattiesburg / Pine Belt &amp; Gulf Coast
                    </div>

                    <h1 className="font-heading text-4xl sm:text-5xl lg:text-[62px] leading-[1.08] text-obsidian font-semibold tracking-tight text-balance">
                      Steady family advocacy and care navigation.
                    </h1>

                    <p className="text-base sm:text-lg lg:text-[19px] leading-relaxed text-obsidian/85 max-w-2xl">
                      SouthernWell Case Management Services provides private, strictly non-clinical care navigation, medication organization, and appointment accompaniment across South Mississippi.{' '}
                      <span className="font-semibold text-oxford-dark">
                        No skilled nursing or medical care is performed.
                      </span>
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => navigateToSection('consultation')}
                        className="inline-flex items-center justify-center px-7 py-4 rounded bg-oxford hover:bg-oxford-dark text-canvas font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all cursor-pointer gap-2.5"
                      >
                        <span>Schedule a Complimentary 30-Minute Consultation</span>
                        <Calendar className="w-4 h-4 text-brass-light shrink-0" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-obsidian/90 pt-1">
                      <PhoneCall className="w-4 h-4 text-oxford shrink-0" />
                      <span>
                        Prefer to talk right away? Call or text{' '}
                        <a
                          href={`tel:${BRAND_INFO.phone}`}
                          className="font-bold underline decoration-brass hover:text-oxford transition-colors tabular-nums"
                        >
                          {BRAND_INFO.phone}
                        </a>
                      </span>
                    </div>

                    {/* Trust Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-card-border mt-2">
                      <div className="p-4 rounded-lg bg-white border border-card-border flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-oxford">
                          <Award className="w-4 h-4 text-brass-deep shrink-0" />
                          <span className="text-xs uppercase tracking-wider font-semibold text-obsidian">
                            Healthcare Navigation Fluency
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-obsidian">
                          8+ Years Healthcare Experience
                        </h4>
                        <p className="text-xs text-obsidian/75">
                          Founded by Jasmeen Williams, LPN, BS-HHS
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-white border border-card-border flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-oxford">
                          <MapPin className="w-4 h-4 text-brass-deep shrink-0" />
                          <span className="text-xs uppercase tracking-wider font-semibold text-obsidian">
                            Regional Reach
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-obsidian">
                          Local &amp; Long-Distance Support
                        </h4>
                        <p className="text-xs text-obsidian/75">
                          Hattiesburg, Laurel, Gulfport, Biloxi &amp; Coast
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-white border border-card-border flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-oxford">
                          <Shield className="w-4 h-4 text-brass-deep shrink-0" />
                          <span className="text-xs uppercase tracking-wider font-semibold text-obsidian">
                            Non-Clinical Scope
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-obsidian">
                          100% Independent Advocacy
                        </h4>
                        <p className="text-xs text-obsidian/75">
                          No skilled nursing or medical care performed
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Visual: Advocate & Care Dossier Presentation */}
                  <div className="lg:col-span-5 flex flex-col justify-center">
                    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-card-border">
                      <div className="flex items-center justify-between border-b border-card-border pb-4 mb-5">
                        <div className="flex items-center gap-2">
                          <BadgeCheck className="w-5 h-5 text-oxford shrink-0" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-obsidian">
                            Your Dedicated Local Advocate
                          </span>
                        </div>
                        <span className="text-xs font-medium text-navy-slate">
                          {BRAND_INFO.subtitle}
                        </span>
                      </div>

                      <div className="relative rounded-xl overflow-hidden border border-card-border mb-5 aspect-[4/5] bg-canvas">
                        <FounderPortrait className="w-full h-full object-cover object-top" />
                        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-oxford-dark/90 backdrop-blur-xs border border-brass/60 text-canvas">
                          <Award className="w-3.5 h-3.5 text-brass-light shrink-0" />
                          <span className="text-[11px] font-semibold tracking-wider uppercase text-brass-light">
                            Founder &amp; Principal Navigator
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-oxford-dark/85 via-oxford-dark/15 to-transparent pointer-events-none" />
                        <div className="absolute bottom-4 left-4 right-4 text-canvas flex items-end justify-between gap-2">
                          <div>
                            <span className="font-heading text-2xl font-bold text-white block leading-tight">
                              Jasmeen Williams
                            </span>
                            <span className="text-xs uppercase tracking-widest text-brass-light font-semibold block mt-0.5">
                              LPN, BS-HHS
                            </span>
                          </div>
                          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] text-canvas">
                            <MapPin className="w-3.5 h-3.5 text-brass-light shrink-0" />
                            <span>Hattiesburg &amp; Coast</span>
                          </div>
                        </div>
                      </div>

                      {/* Deep Oxford Navy Care Dossier Standard Strip */}
                      <div className="w-full bg-oxford rounded-xl p-4 sm:p-5 text-canvas relative overflow-hidden border border-brass/50">
                        <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3 gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 shrink-0">
                              <CrestLogo alt="SouthernWell SW Monogram Crest" />
                            </div>
                            <div>
                              <span className="font-heading text-lg font-bold tracking-wider text-canvas block leading-none">
                                SOUTHERNWELL
                              </span>
                              <span className="text-[10px] tracking-[0.18em] text-brass-light font-semibold uppercase block mt-1">
                                Master Care Dossier Standard
                              </span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-brass-light px-2 py-0.5 rounded bg-oxford-dark/70 border border-brass/45 shrink-0">
                            Physical &amp; Cloud
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="p-2 rounded bg-oxford-dark/70 border border-white/15 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-brass-light shrink-0" />
                            <span className="text-canvas/95 text-[11px]">
                              24-Hr Family Briefings
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openScreen('dossier')}
                        className="mt-4 w-full py-2.5 px-4 rounded-lg border border-card-border bg-canvas hover:bg-canvas-muted text-obsidian text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <span>Inspect 5-Tab Care Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5 text-oxford" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 2: WHO WE SERVE                                           */}
            {/* ================================================================= */}
            <section
              id="who-we-serve"
              className="py-16 md:py-24 bg-canvas-muted/60 border-b border-card-border"
            >
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
                <div className="max-w-3xl mb-14">
                  <span className="text-xs sm:text-sm font-semibold tracking-widest text-brass-deep uppercase block mb-2">
                    Why Families Partner With SouthernWell of South Mississippi
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight mb-4 text-balance">
                    Trusted local eyes, ears, and organization—when you can't be in two places at once.
                  </h2>
                  <p className="text-base sm:text-lg text-obsidian/80 leading-relaxed">
                    Whether you live ten minutes away in Hattiesburg or three states away in Houston, Atlanta, or New Orleans, coordinating an aging parent's appointments and records can quickly become overwhelming. SouthernWell Case Management Services steps in as your dedicated non-clinical family advocate—bridging the gap between provider instructions and daily life at home.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {AUDIENCE_CARDS.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white rounded-xl p-7 border border-card-border flex flex-col justify-between hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <div className="w-12 h-12 rounded-lg bg-navy-soft text-oxford flex items-center justify-center mb-6">
                          {renderAudienceIcon(card.icon)}
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-navy-slate uppercase block mb-1">
                          {card.kicker}
                        </span>
                        <h3 className="font-heading text-2xl font-bold text-obsidian mb-3">
                          {card.title}
                        </h3>
                        <p className="text-base text-obsidian/75 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                      <div className="pt-6 mt-6 border-t border-card-border flex items-center text-xs font-semibold text-oxford uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 mr-2 text-brass-deep shrink-0" />
                        <span>{card.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 3: 5-STAGE CARE NAVIGATION PROCESS                        */}
            {/* ================================================================= */}
            <section
              id="workflow"
              className="py-16 md:py-24 bg-canvas border-b border-card-border"
            >
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs font-semibold tracking-[0.16em] text-brass-deep uppercase block mb-3">
                    Clear, Structured Onboarding &amp; Ongoing Navigation
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight mb-4 text-balance">
                    Our 5-Stage Care Navigation Process
                  </h2>
                  <p className="text-base sm:text-lg text-obsidian/80 leading-relaxed">
                    From your first discovery conversation to routine appointment accompaniment, here is how we partner with clients and families across South Mississippi.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-stretch">
                  {WORKFLOW_STAGES.map((stage) => (
                    <div
                      key={stage.stageNumber}
                      className={`rounded-xl p-6 flex flex-col justify-between transition-all ${
                        stage.featured
                          ? 'bg-oxford text-canvas border-2 border-brass shadow-md'
                          : 'bg-white text-obsidian border border-card-border hover:border-brass'
                      }`}
                    >
                      <div>
                        <span
                          className={`text-[11px] font-bold tracking-wider uppercase block mb-4 tabular-nums ${
                            stage.featured ? 'text-brass-light' : 'text-navy-slate'
                          }`}
                        >
                          {stage.timing}
                        </span>
                        <div
                          className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${
                            stage.featured
                              ? 'bg-oxford-dark/80 text-brass-light border border-brass/30'
                              : 'bg-navy-soft text-oxford'
                          }`}
                        >
                          {renderStageIcon(stage.stageNumber)}
                        </div>
                        <h3
                          className={`font-heading text-xl font-bold mb-2 leading-snug ${
                            stage.featured ? 'text-white' : 'text-obsidian'
                          }`}
                        >
                          {stage.title}
                        </h3>
                        <p
                          className={`text-xs sm:text-[13px] leading-relaxed mb-4 ${
                            stage.featured ? 'text-canvas/90' : 'text-obsidian/75'
                          }`}
                        >
                          {stage.description}
                        </p>

                        {stage.hasDividerTabs && (
                          <div className="mb-4 pt-3 border-t border-card-border">
                            <button
                              type="button"
                              onClick={() => openScreen('dossier')}
                              className="text-xs font-bold text-oxford hover:text-oxford-dark underline cursor-pointer inline-block"
                            >
                              Explore 5-Tab Care Dossier →
                            </button>
                          </div>
                        )}
                      </div>

                      <div
                        className={`pt-3 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                          stage.featured
                            ? 'border-white/15 text-brass-light'
                            : 'border-card-border text-oxford'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{stage.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Assurance Strip */}
                <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-white border border-card-border flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-navy-soft text-oxford flex items-center justify-center shrink-0">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-heading text-xl sm:text-2xl font-bold text-obsidian">
                        Ready to start with an unhurried conversation?
                      </h4>
                      <p className="text-xs sm:text-sm text-obsidian/75">
                        No pressure, no complicated paperwork to start—just compassionate non-clinical care coordination tailored to your family's needs.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => openScreen('enrollment')}
                      className="inline-flex items-center justify-center px-5 py-3 rounded border border-oxford/30 bg-canvas hover:bg-canvas-muted text-obsidian text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer gap-2"
                    >
                      <span>Open Enrollment Forms</span>
                      <FileCheck2 className="w-4 h-4 text-oxford" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToSection('consultation')}
                      className="inline-flex items-center justify-center px-6 py-3 rounded bg-oxford hover:bg-oxford-dark text-canvas text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap cursor-pointer gap-2"
                    >
                      <span>Schedule Stage 1 Consultation</span>
                      <Calendar className="w-4 h-4 text-brass-light" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 4: SERVICES & TRANSPARENT PRICING                         */}
            {/* ================================================================= */}
            <section
              id="services-pricing"
              className="py-16 md:py-24 bg-canvas border-b border-card-border"
            >
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs sm:text-sm font-semibold tracking-widest text-brass-deep uppercase block mb-2">
                    Care Navigation &amp; Advocacy Tiers
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight mb-4 text-balance">
                    Clear, flexible support tailored to your family's rhythm.
                  </h2>
                  <p className="text-base sm:text-lg text-obsidian/80">
                    Every partnership begins with our one-time Foundation Walkthrough &amp; Care Dossier, followed by the ongoing level of non-clinical support that fits your loved one best.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                  {PRICING_TIERS.map((tier) => (
                    <div
                      key={tier.id}
                      className={`rounded-xl p-6 flex flex-col justify-between relative ${
                        tier.popular
                          ? 'bg-oxford text-canvas border-2 border-brass shadow-lg'
                          : 'bg-white text-obsidian border border-card-border'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`text-xs font-bold tracking-wider uppercase ${
                              tier.popular ? 'text-brass-light' : 'text-navy-slate'
                            }`}
                          >
                            {tier.indexLabel}
                          </span>
                          {tier.popular && (
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brass text-oxford-dark whitespace-nowrap">
                              Most Popular
                            </span>
                          )}
                        </div>
                        <h3
                          className={`font-heading text-2xl font-bold mb-2 leading-snug ${
                            tier.popular ? 'text-white' : 'text-obsidian'
                          }`}
                        >
                          {tier.title}
                        </h3>
                        <div className="my-4 tabular-nums">
                          <span
                            className={`text-3xl font-heading font-bold ${
                              tier.popular ? 'text-white' : 'text-obsidian'
                            }`}
                          >
                            ${tier.price}
                          </span>
                          <span
                            className={`text-xs font-semibold uppercase ml-1.5 ${
                              tier.popular ? 'text-brass-light' : 'text-obsidian/65'
                            }`}
                          >
                            {tier.unit}
                          </span>
                        </div>
                        <ul
                          className={`space-y-3 text-sm pt-3 border-t ${
                            tier.popular
                              ? 'text-canvas/90 border-white/15'
                              : 'text-obsidian/80 border-card-border'
                          }`}
                        >
                          {tier.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  tier.popular ? 'text-brass-light' : 'text-oxford'
                                }`}
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPricingTier(tier.id, tier.title)}
                        className={`mt-6 w-full py-2.5 px-4 rounded font-semibold text-xs tracking-wider uppercase text-center transition-colors cursor-pointer whitespace-nowrap ${
                          tier.popular
                            ? 'bg-canvas hover:bg-brass-soft text-oxford-dark font-bold'
                            : 'bg-canvas hover:bg-canvas-muted text-obsidian border border-card-border'
                        }`}
                      >
                        {tier.ctaLabel}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Travel Note & Non-Clinical Boundary Scope */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white border border-card-border text-sm text-obsidian/80 flex items-start gap-3">
                    <Car className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                    <p>
                      <strong>Travel Note:</strong> Standard rates include round-trip travel within 25 miles of Hattiesburg or Gulfport/Biloxi; extended regional specialist travel (such as Jackson or New Orleans) is billed at $35/hour.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-card-border text-sm text-obsidian/80 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-oxford shrink-0 mt-0.5" />
                    <p>
                      <strong>Strict Non-Clinical Boundary Scope:</strong> SouthernWell Case Management Services operates strictly as a non-clinical care navigation, logistics, and family advocacy service—no skilled nursing or medical care is performed.
                    </p>
                  </div>
                </div>

                {/* Sibling Cost-Sharing Calculator */}
                <div className="mt-12">
                  <SiblingCostCalculator
                    selectedPlan={calculatorPlan}
                    onPlanChange={setCalculatorPlan}
                    onDiscussConsultation={handleDiscussFromCalculator}
                  />
                </div>

                {/* Sliding Scale Callout */}
                <div className="mt-8 p-6 sm:p-8 rounded-xl bg-navy-soft border border-oxford/20 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-12 h-12 rounded-full bg-oxford text-brass-light flex items-center justify-center shrink-0">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h4 className="font-heading text-2xl font-bold text-obsidian">
                      Private-Pay Independence &amp; Community Sliding Scale
                    </h4>
                    <p className="text-sm sm:text-base text-obsidian/85 leading-relaxed">
                      SouthernWell Case Management Services operates on a transparent private-pay model so we remain 100% devoted to your family—free from insurance restrictions or rushed 15-minute quotas. Because we believe every South Mississippi senior deserves dignified advocacy regardless of retirement budget, we reserve dedicated caseload spots for Fixed-Income Sliding Scale Partnerships (20% to 35% off standard rates for qualifying older adults living primarily on Social Security or modest pensions).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <DossierAndGuidesSection
              onOpenFullDossier={() => openScreen('dossier')}
              onSelectDistrictConsultation={(district) => {
                setPreselectedLocation(district);
                navigateToSection('consultation');
              }}
            />

            {/* ================================================================= */}
            {/* SECTION 5: MEET THE FOUNDER                                       */}
            {/* ================================================================= */}
            <section
              id="about-jasmeen"
              className="py-16 md:py-24 bg-canvas-muted/50 border-b border-card-border"
            >
              <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Portrait Card */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl overflow-hidden shadow-sm border border-card-border bg-white p-5">
                      <div className="aspect-[4/5] relative rounded-xl overflow-hidden border border-card-border bg-canvas">
                        <FounderPortrait
                          src={aboutFounderPortrait}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="pt-4 flex items-center justify-between gap-2 text-xs text-obsidian/75">
                        <span className="font-semibold text-obsidian">
                          Hattiesburg / Pine Belt &amp; Gulf Coast
                        </span>
                        <span className="font-medium text-oxford">
                          Private Family Advocacy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bio Content */}
                  <div className="lg:col-span-7 flex flex-col gap-5">
                    <span className="text-xs sm:text-sm font-semibold tracking-widest text-brass-deep uppercase block">
                      About Your Advocate
                    </span>
                    <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight text-balance">
                      Meet Jasmeen Williams, LPN, BS-HHS
                    </h2>
                    <p className="font-heading italic text-xl sm:text-2xl text-oxford leading-snug">
                      "Aging should feel dignified, unhurried, and free of bureaucratic friction."
                    </p>
                    <div className="space-y-4 text-base sm:text-[17px] text-obsidian/85 leading-relaxed">
                      <p>
                        Jasmeen Williams founded SouthernWell Case Management Services (SouthernWell of South Mississippi) on a simple conviction: older adults deserve to navigate aging with dignity, clarity, and unhurried attention—and their families deserve a trustworthy advocate who treats every detail as if it were for her own loved ones.
                      </p>
                      <p>
                        Holding credentials as a Licensed Practical Nurse (LPN) and a Bachelor of Science in Health &amp; Human Services (BS-HHS) with over eight years of healthcare systems experience, Jasmeen has dedicated her career to client &amp; family advocacy, care coordination, and elevating access and clarity across South Mississippi. Serving families across Hattiesburg, the Pine Belt, and the Gulf Coast, her agency operates strictly within non-clinical boundaries—no skilled nursing or medical care is performed—combining healthcare navigation fluency with warm, meticulous organization alongside local physicians, licensed social workers (LCSWs), and elder law partners.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-lg bg-white border border-card-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-oxford block mb-1">
                          Founder Credentials
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-obsidian">
                          LPN, BS-HHS · Non-Clinical Care Coordination Only
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-white border border-card-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-oxford block mb-1">
                          Deep Regional Roots
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-obsidian">
                          Pine Belt &amp; Mississippi Gulf Coast Specialist Network
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 6: FREQUENTLY ASKED QUESTIONS (FAQ)                       */}
            {/* ================================================================= */}
            <section
              id="faq"
              className="py-16 md:py-24 bg-canvas border-b border-card-border"
            >
              <div className="max-w-[880px] mx-auto px-5 sm:px-8">
                <div className="text-center mb-12">
                  <span className="text-xs sm:text-sm font-semibold tracking-widest text-brass-deep uppercase block mb-2">
                    Clarity &amp; Common Questions
                  </span>
                  <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-obsidian leading-tight">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-4">
                  {FAQ_ITEMS.map((item, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={item.question}
                        className={`bg-white rounded-xl border transition-colors overflow-hidden ${
                          isOpen ? 'border-oxford/50' : 'border-card-border'
                        }`}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() =>
                            setOpenFaqIndex((prev) => (prev === index ? -1 : index))
                          }
                          className="w-full flex items-center justify-between p-6 text-left font-heading text-xl sm:text-2xl font-bold text-obsidian cursor-pointer gap-4"
                        >
                          <span>{item.question}</span>
                          <ChevronDown
                            className={`w-5 h-5 text-oxford shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6 pt-3 text-base text-obsidian/80 leading-relaxed border-t border-card-border/70">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 7: CONSULTATION BOOKING & CONTACT                         */}
            {/* ================================================================= */}
            <section
              id="consultation"
              className="py-16 md:py-24 bg-canvas-muted/60 border-b border-card-border"
            >
              <div className="max-w-[1100px] mx-auto px-5 sm:px-8">
                <ConsultationForm
                  preselectedTier={preselectedTier}
                  preselectedLocation={preselectedLocation}
                  costShareSummary={costShareSummary}
                  onClearPreselection={() => {
                    setPreselectedTier(undefined);
                    setPreselectedLocation(undefined);
                    setCostShareSummary(null);
                  }}
                  onOpenEnrollmentPortal={() => openScreen('enrollment')}
                />
              </div>
            </section>
          </>
        )}
      </main>

      {/* ===================================================================== */}
      {/* FOOTER                                                                */}
      {/* ===================================================================== */}
      <footer className="print:hidden bg-oxford-dark text-canvas pt-16 pb-12 border-t border-brass/35">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/15">
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0">
                  <CrestLogo />
                </div>
                <div>
                  <span className="font-heading font-bold text-xl tracking-wide text-white block leading-none">
                    SouthernWell Case Management Services
                  </span>
                  <span className="font-sans text-[10px] tracking-[0.18em] uppercase font-semibold text-brass-light block mt-1">
                    {BRAND_INFO.subtitle}
                  </span>
                </div>
              </div>
              <p className="text-sm text-canvas/85 max-w-sm leading-relaxed">
                Dedicated, strictly non-clinical care navigation, appointment accompaniment, and family advocacy across South Mississippi. No skilled nursing or medical care is performed.
              </p>
            </div>

            <div className="md:col-span-3">
              <span className="text-xs font-bold tracking-widest text-brass-light uppercase block mb-3">
                Navigation
              </span>
              <ul className="space-y-2 text-sm text-canvas/85">
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('who-we-serve')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Who We Serve
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('workflow')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openScreen('dossier')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Care Dossier Explorer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openScreen('enrollment')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Enrollment Forms
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setOperationsInitialNav('dashboard');
                      openScreen('operations');
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Operations Hub
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('services-pricing')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Services &amp; Pricing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('about-jasmeen')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    About Jasmeen
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToSection('consultation')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Book Discovery Call
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setPortalModalOpen(true)}
                    className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-brass-light shrink-0" />
                    <span>Client &amp; Family Forms Portal</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <span className="text-xs font-bold tracking-widest text-brass-light uppercase block mb-3">
                Service Areas &amp; Direct Line
              </span>
              <div className="text-sm text-canvas/85 space-y-2.5">
                {BRAND_INFO.regions.map((region) => (
                  <p key={region} className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brass-light shrink-0" />
                    <span>{region}</span>
                  </p>
                ))}
                <p className="flex items-center gap-2 flex-wrap">
                  <Phone className="w-4 h-4 text-brass-light shrink-0" />
                  <a
                    href={`tel:${BRAND_INFO.phone}`}
                    className="hover:underline tabular-nums"
                  >
                    {BRAND_INFO.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-canvas/75 gap-4">
            <p>© 2025 SouthernWell Case Management Services LLC. All rights reserved.</p>
            <p className="text-center sm:text-right">
              Non-Clinical Care Navigation &amp; Family Advocacy · No skilled nursing or medical care performed.
            </p>
          </div>
        </div>
      </footer>

      <ClientPortalModal
        open={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        onOpenDestination={handlePortalDestination}
        onBookSession={() => navigateToSection('consultation')}
      />
    </div>
  );
}
