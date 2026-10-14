import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

interface PageShellProps {
  title: string;
  subtitle: string;
  theme: "light" | "dark";
  toggleTheme: () => void;
  rightContent: ReactNode;
  children: ReactNode;
  onBrandClick?: () => void;
}

export function PageShell({
  title,
  subtitle,
  theme,
  toggleTheme,
  rightContent,
  children,
  onBrandClick,
}: PageShellProps) {
  const brand = (
    <>
      <img
        src="/favicon.svg"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-none"
      />
      <span className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold tracking-tight text-primary-theme">
          {title}
        </span>
        <span className="hidden text-xs text-muted-theme sm:block font-mono">{subtitle}</span>
      </span>
    </>
  );

  return (
    <div className="relative min-h-screen flex flex-col justify-between w-full text-primary-theme transition-colors duration-200 bg-grid bg-body-theme">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-main-theme bg-body-theme/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-6">
          {/* Brand (clickable when onBrandClick is provided) */}
          {onBrandClick ? (
            <button
              type="button"
              onClick={onBrandClick}
              aria-label="Go to home page"
              className="flex items-center gap-2.5 cursor-pointer text-left"
            >
              {brand}
            </button>
          ) : (
            <div className="flex items-center gap-2.5">{brand}</div>
          )}

          {/* Right */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              type="button"
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-none text-secondary-theme transition hover:bg-panel-theme hover:text-primary-theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {rightContent}
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6 sm:py-14 flex-1 flex flex-col justify-center">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-main-theme">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-6">
          <p className="text-[13px] text-muted-theme text-center">
            © {new Date().getFullYear()} CVDecode. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
