import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FieldSidebar from "../components/shell/FieldSidebar";
import FieldTopbar from "../components/shell/FieldTopbar";
import { useAuth } from "../context/AuthContext";
import { clearStoredToken } from "../lib/auth";
import { fieldNavItems } from "../lib/nav";

type FieldShellLayoutProps = {
  children: ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
};

export default function FieldShellLayout({
  children,
  kicker,
  title,
  subtitle,
}: FieldShellLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const appVersion = import.meta.env.VITE_APP_VERSION || "v0.1.0";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const handleLogout = () => {
    clearStoredToken();
    navigate("/login", { replace: true });
  };

  if (location.pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1600px] px-2 py-2 sm:px-5 sm:py-5">
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111111] shadow-[0_20px_80px_rgba(0,0,0,0.45)] sm:rounded-[28px]">
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="hidden h-[calc(100vh-16px)] min-h-0 border-r border-white/10 lg:block sm:h-[calc(100vh-40px)]">
              <FieldSidebar
                items={fieldNavItems}
                pathname={location.pathname}
                onLogout={handleLogout}
                currentUserName={user?.fullName}
                currentUserEmail={user?.email}
                appVersion={appVersion}
              />
            </aside>

            <div className="min-w-0">
              <FieldTopbar
                kicker={kicker}
                title={title}
                subtitle={subtitle}
                onOpenMobileNav={() => setMobileNavOpen(true)}
              />

              <main className="min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="mx-auto w-full max-w-[1200px] min-w-0">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[88vw] max-w-[320px] min-h-0 flex-col border-r border-white/10 bg-[#0f0f0f] shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
            <div className="shrink-0 flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-lg font-semibold tracking-tight text-white">
                Navigation
              </div>

              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <FieldSidebar
                items={fieldNavItems}
                pathname={location.pathname}
                onNavigate={() => setMobileNavOpen(false)}
                onLogout={handleLogout}
                currentUserName={user?.fullName}
                currentUserEmail={user?.email}
                appVersion={appVersion}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
