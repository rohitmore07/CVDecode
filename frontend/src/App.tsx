import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { UploadPage } from "./pages/UploadPage";
import { LandingPage } from "./pages/LandingPage";
import { registerGetToken } from "./services/api";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "dark" ? "light" : "dark"));

  // Signed-in users open straight into the app; clicking the brand shows the landing page.
const [view, setView] = useState<"landing" | "app">("landing");

  return (
    <>
      <SignedIn>
        {/* Kept mounted but hidden so an upload/analysis in progress isn't lost */}
        <div className={view === "app" ? "" : "hidden"}>
          <AuthenticatedApp
            theme={theme}
            toggleTheme={toggleTheme}
            onGoHome={() => setView("landing")}
          />
        </div>
        {view === "landing" && (
          <LandingPage
            theme={theme}
            toggleTheme={toggleTheme}
            isSignedIn
            onGetStarted={() => setView("app")}
          />
        )}
      </SignedIn>
      <SignedOut>
        <LandingPage theme={theme} toggleTheme={toggleTheme} />
      </SignedOut>
    </>
  );
}

/* ─── Authenticated ──────────────────────── */
function AuthenticatedApp({
  theme,
  toggleTheme,
  onGoHome,
}: {
  theme: "light" | "dark";
  toggleTheme: () => void;
  onGoHome: () => void;
}) {
  const { getToken } = useAuth();
  useEffect(() => {
    registerGetToken(getToken);
  }, [getToken]);

  return <UploadPage theme={theme} toggleTheme={toggleTheme} onGoHome={onGoHome} />;
}

export default App;
