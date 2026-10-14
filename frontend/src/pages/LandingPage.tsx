import { cloneElement, type ReactElement } from "react";
import { SignInButton } from "@clerk/clerk-react";
import {
  ArrowRight,
  CheckCircle,
  FileSearch,
  Target,
  Check,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ListFilter,
  Layers,
} from "lucide-react";
import { PageShell } from "../components/PageShell";

interface LandingPageProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  isSignedIn?: boolean;
  onGetStarted?: () => void;
}

export function LandingPage({ theme, toggleTheme, isSignedIn, onGetStarted }: LandingPageProps) {
  // Signed in: the button opens the app. Signed out: it opens the Clerk sign-in modal.
  const withAuth = (btn: ReactElement<{ onClick?: () => void }>) =>
    isSignedIn ? (
      cloneElement(btn, { onClick: onGetStarted })
    ) : (
      <SignInButton mode="modal">{btn}</SignInButton>
    );

  return (
    <PageShell
      title="CVDecode"
      subtitle="Structured Auditing"
      theme={theme}
      toggleTheme={toggleTheme}
      rightContent={withAuth(
        <button
          id="nav-sign-in-btn"
          className="inline-flex h-9 items-center gap-2 rounded bg-stone-900 dark:bg-stone-100 px-4 text-[13px] font-medium text-stone-100 dark:text-stone-900 transition hover:opacity-90 active:scale-95 border border-stone-850 dark:border-stone-200"
        >
          {isSignedIn ? "Open app" : "Sign in"}
        </button>
      )}
    >
      <div className="flex flex-col gap-20 sm:gap-28">

        {/* ── Hero Section ────────────────────────── */}
        <section className="animate-fade-up pt-4 sm:pt-8">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            
            {/* Left Content */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded border border-main-theme bg-panel-theme px-3 py-1">
                <Layers className="h-3.5 w-3.5 text-accent-theme" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary-theme font-mono">
                  CVDecode 1.0 — Professional Document Compliance
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-primary-theme sm:text-5xl lg:text-6xl">
                Objective ATS Resume Checker.
              </h1>
              
              <p className="mt-6 text-base leading-relaxed text-secondary-theme sm:text-lg">
                Audit your resume against ATS criteria, verify keyword alignment, and fix formatting bugs with a precise corporate ledger scorecard.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-6">
                {withAuth(
                  <button
                    id="hero-cta-btn"
                    className="inline-flex h-11 items-center gap-2 rounded bg-stone-900 dark:bg-stone-100 px-6 text-[14px] font-medium text-stone-100 dark:text-stone-900 transition hover:opacity-90 active:scale-95"
                  >
                    Start resume audit
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <div className="flex items-center gap-4 text-[13px] text-secondary-theme font-mono">
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-accent-theme" />
                    PDF format
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-accent-theme" />
                    Secure processing
                  </span>
                </div>
              </div>
            </div>

            {/* Right Content: Live CSS Audit Scorecard Table Mockup */}
            <div className="relative rounded border border-main-theme bg-card-theme p-5 sm:p-6 transition-transform lg:scale-[1.02]">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-main-theme pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent-theme animate-pulse" />
                  <span className="text-[12px] font-semibold text-primary-theme font-mono">
                    resume_document.pdf
                  </span>
                </div>
                <span className="text-[11px] text-muted-theme font-mono">
                  Console v1.0
                </span>
              </div>

              {/* Structured Audit Report Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse font-sans text-secondary-theme">
                  <thead>
                    <tr className="border-b border-main-theme text-muted-theme font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-2 font-semibold">Parameter</th>
                      <th className="pb-2 font-semibold px-3">Status</th>
                      <th className="pb-2 font-semibold text-right">Findings</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-main-theme/50 last:border-0">
                      <td className="py-2.5 font-medium text-primary-theme">Overall Quality</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-sm bg-stone-100 dark:bg-stone-850 px-1.5 py-0.5 text-[11px] font-bold text-accent-theme font-mono">84%</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-theme">Strong alignment</td>
                    </tr>
                    <tr className="border-b border-main-theme/50 last:border-0">
                      <td className="py-2.5 font-medium text-primary-theme">ATS Compatibility</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-sm bg-stone-100 dark:bg-stone-850 px-1.5 py-0.5 text-[10px] font-bold text-accent-theme font-mono">PASS</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-theme">Single column</td>
                    </tr>
                    <tr className="border-b border-main-theme/50 last:border-0">
                      <td className="py-2.5 font-medium text-primary-theme">Structure Check</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-sm bg-stone-100 dark:bg-stone-850 px-1.5 py-0.5 text-[10px] font-bold text-accent-theme font-mono">PASS</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-theme">Headers audited</td>
                    </tr>
                    <tr className="border-b border-main-theme/50 last:border-0">
                      <td className="py-2.5 font-medium text-primary-theme">Vocabulary Audit</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-sm bg-accent-theme/10 px-1.5 py-0.5 text-[10px] font-bold text-accent-theme font-mono">WARN</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-theme">Buzzwords flagged</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Before / After Diff */}
              <div className="mt-5 space-y-2 border-t border-main-theme pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-theme font-mono">
                  Vocabulary Corrections
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="rounded border border-stone-200 dark:border-stone-800 bg-panel-theme px-2.5 py-1.5 text-accent-theme">
                    <div className="flex items-start gap-1">
                      <span className="font-semibold">-</span>
                      <span>Responsible for database operations.</span>
                    </div>
                  </div>
                  <div className="rounded border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 px-2.5 py-1.5 text-primary-theme">
                    <div className="flex items-start gap-1">
                      <span className="font-semibold text-accent-theme">+</span>
                      <span>Automated replication, reducing failover times.</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Audit Categories (Tabular Bento Grid) ── */}
        <section>
          <div className="border-b border-main-theme pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-theme font-mono">
              Audit Scans
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary-theme">
              Structured validations performed by CVDecode
            </h2>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            
            {/* Panel 1: ATS Formatting (Double Width on large screens) */}
            <div className="flex flex-col justify-between rounded border border-main-theme bg-card-theme p-6 md:col-span-2">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded border border-main-theme bg-panel-theme text-accent-theme">
                  <FileSearch className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-primary-theme">
                  Document Layout & Scanner Compatibility
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-theme">
                  Checks layout structure to ensure compliance with common applicant screening databases. Checks columns, tables, headers, fonts, and margin sizing.
                </p>
              </div>

              {/* Layout checks table list */}
              <div className="mt-6 overflow-hidden rounded border border-main-theme bg-panel-theme/40 text-[12px] font-mono">
                <div className="flex justify-between border-b border-main-theme/50 px-3.5 py-2">
                  <span className="text-secondary-theme">Single-column layout check</span>
                  <span className="font-semibold text-accent-theme">✓ COMPLIANT</span>
                </div>
                <div className="flex justify-between border-b border-main-theme/50 px-3.5 py-2">
                  <span className="text-secondary-theme">Document margins validation</span>
                  <span className="font-semibold text-accent-theme">✓ COMPLIANT</span>
                </div>
                <div className="flex justify-between px-3.5 py-2">
                  <span className="text-secondary-theme">Standard typography detection</span>
                  <span className="font-semibold text-accent-theme">✓ COMPLIANT</span>
                </div>
              </div>
            </div>

            {/* Panel 2: ATS Scanner Validation Checkbox */}
            <div className="flex flex-col justify-between rounded border border-main-theme bg-card-theme p-6">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded border border-main-theme bg-panel-theme text-accent-theme">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-primary-theme">
                  Layout Structural Integrity
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-theme">
                  Flags formatting patterns that degrade content scanning systems, such as multi-column splits or tables.
                </p>
              </div>

              {/* Status checkboxes */}
              <div className="mt-5 space-y-2 rounded border border-main-theme bg-panel-theme/40 p-3.5 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-primary-theme">
                  <ShieldCheck className="h-4 w-4 text-accent-theme" />
                  <span>No tables detected</span>
                </div>
                <div className="flex items-center gap-2 text-primary-theme">
                  <ShieldCheck className="h-4 w-4 text-accent-theme" />
                  <span>Standard margin size</span>
                </div>
                <div className="flex items-center gap-2 text-accent-theme">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Custom header format</span>
                </div>
              </div>
            </div>

            {/* Panel 3: Career Classification Match */}
            <div className="flex flex-col justify-between rounded border border-main-theme bg-card-theme p-6">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded border border-main-theme bg-panel-theme text-accent-theme">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-primary-theme">
                  Job Target Alignment
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-theme">
                  Compares documented responsibilities and summaries against standard job descriptions across multiple tracks.
                </p>
              </div>

              {/* Horizontal stats matches */}
              <div className="mt-5 font-mono text-[11px] divide-y divide-subtle-theme">
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-secondary-theme">Project Manager</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-theme font-semibold">88</span>
                    <span className="text-muted-theme">//</span>
                    <span className="text-accent-theme">STRONG</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-secondary-theme">Operations Lead</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-theme font-semibold">81</span>
                    <span className="text-muted-theme">//</span>
                    <span className="text-accent-theme">STRONG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 4: Core Competencies & Keyword Index (Double Width on large screens) */}
            <div className="flex flex-col justify-between rounded border border-main-theme bg-card-theme p-6 md:col-span-2">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded border border-main-theme bg-panel-theme text-accent-theme">
                  <ListFilter className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-primary-theme">
                  Competency & Keywords Gap Index
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-secondary-theme">
                  Audits your document against career track expectations. Flags generic buzzwords to replace with concrete skills and indexes target parameters.
                </p>
              </div>

              {/* Buzzwords & Skill Gaps mockup panel */}
              <div className="mt-5 grid gap-4 sm:grid-cols-1 md:grid-cols-2 text-[12px]">
                {/* Flags column */}
                <div className="rounded border border-main-theme bg-panel-theme/20 p-4">
                  <span className="font-bold text-accent-theme font-mono uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Generic Buzzwords Flagged
                  </span>
                  <div className="mt-3 space-y-2 text-secondary-theme">
                    <div className="flex items-center justify-between border-b border-main-theme/50 pb-1.5 last:border-0 last:pb-0 font-mono">
                      <span>"team-player"</span>
                      <span className="text-[10px] text-accent-theme bg-accent-theme/10 px-1.5 py-0.5 rounded-sm">Flagged</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-main-theme/50 pb-1.5 last:border-0 last:pb-0 font-mono">
                      <span>"results-driven"</span>
                      <span className="text-[10px] text-accent-theme bg-accent-theme/10 px-1.5 py-0.5 rounded-sm">Flagged</span>
                    </div>
                  </div>
                </div>

                {/* Gaps column */}
                <div className="rounded border border-main-theme bg-panel-theme/20 p-4">
                  <span className="font-bold text-accent-theme font-mono uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Target Competency Gaps
                  </span>
                  <div className="mt-3 font-mono text-[11px] leading-relaxed space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <span className="text-muted-theme">-</span>
                      <span className="text-secondary-theme">Project Management</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-muted-theme">-</span>
                      <span className="text-secondary-theme">Budgeting</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-muted-theme">-</span>
                      <span className="text-secondary-theme">Data Analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── About Section & Specs ───────────────── */}
        <section>
          <div className="rounded-none border border-main-theme bg-card-theme p-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-10">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-theme font-mono block">
                Security & Specs
              </span>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-primary-theme">
                Built for professional data safety.
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-secondary-theme">
                Uploaded documents are processed on secure servers. Your data is never shared with third parties or used for model training.
              </p>
            </div>

            <div className="overflow-x-auto mt-8 lg:mt-0">
              <table className="w-full text-left text-[12px] border-collapse font-mono text-secondary-theme">
                <thead>
                  <tr className="border-b border-main-theme text-muted-theme uppercase tracking-wider text-[10px]">
                    <th className="pb-2 font-semibold">Parameter</th>
                    <th className="pb-2 font-semibold text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle-theme">
                  <tr>
                    <td className="py-3 text-secondary-theme">Format supported</td>
                    <td className="py-3 text-right text-primary-theme font-semibold">PDF (max 5 MB)</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-secondary-theme">Processing mode</td>
                    <td className="py-3 text-right text-primary-theme font-semibold">Background processing</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-secondary-theme">Storage policy</td>
                    <td className="py-3 text-right text-primary-theme font-semibold">Secure storage</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-secondary-theme">Model training</td>
                    <td className="py-3 text-right text-accent-theme font-semibold">Disabled</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Stepped Roadmap ─────────────────────── */}
        <section>
          <div className="border-b border-main-theme pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-accent-theme font-mono">
              Pipeline
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-primary-theme">
              How the audit is performed
            </h2>
          </div>

          <div className="mt-8 space-y-6">
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="border-l-2 pl-4 border-transparent hover:border-accent-theme transition-colors duration-150 py-1"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-accent-theme text-sm font-semibold select-none">
                    [0{i + 1}]
                  </span>
                  <h3 className="text-[15px] font-semibold text-primary-theme">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-1 ml-9 text-[13px] text-secondary-theme leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </PageShell>
  );
}

/* ─── Steps data ─────────────────── */
const STEPS: { title: string; desc: string }[] = [
  {
    title: "Document Upload",
    desc: "Submit your resume PDF. The file is stored securely and is only accessible to you.",
  },
  {
    title: "Audit Processing",
    desc: "CVDecode audits your layout format, section structure, and keyword content.",
  },
  {
    title: "Scorecard Delivery",
    desc: "A detailed report is delivered with your compliance scorecard and improvement areas.",
  },
];
