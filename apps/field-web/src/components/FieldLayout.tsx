import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "../lib/auth";

type FieldLayoutProps = {
  children: React.ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
};

function navClass(isActive: boolean) {
  return [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-white text-black"
      : "text-white/70 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export default function FieldLayout({
  children,
  kicker = "Urban Field",
  title,
  subtitle,
}: FieldLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => getStoredToken(), [location.pathname]);

  const isLogin = location.pathname === "/login";
  const isLog = location.pathname === "/refrigerant-log";
  const isMine = location.pathname === "/my-logs";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111111] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-orange-400">
                  {kicker}
                </p>
                <div className="mt-2 text-lg font-black tracking-tight text-white sm:text-xl">
                  Field App
                </div>
              </div>

              {token ? (
                <button
                  onClick={() => {
                    clearStoredToken();
                    navigate("/login");
                  }}
                  className="ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/20"
                >
                  Logout
                </button>
              ) : null}
            </div>

            <nav className="mt-4 flex flex-wrap gap-2">
              <Link to="/login" className={navClass(isLogin)}>
                Login
              </Link>
              <Link to="/refrigerant-log" className={navClass(isLog)}>
                New Log
              </Link>
              <Link to="/my-logs" className={navClass(isMine)}>
                My Logs
              </Link>
            </nav>
          </header>

          <main className="px-5 py-6 sm:px-6 sm:py-8">
            {title || subtitle ? (
              <section className="mb-6 sm:mb-8">
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {title}
                </h1>

                {subtitle ? (
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
                    {subtitle}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="mx-auto w-full max-w-xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}