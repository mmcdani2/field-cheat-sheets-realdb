import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearStoredToken, getStoredToken } from "../lib/auth";

type LayoutProps = {
  children: React.ReactNode;
  kicker?: string;
  title?: string;
  subtitle?: string;
};

const navLinkClass =
  "text-sm font-medium text-white/75 transition hover:text-white";

export default function Layout({
  children,
  kicker = "Urban Admin",
  title,
  subtitle,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useMemo(() => getStoredToken(), [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="rounded-[28px] border border-white/10 bg-[#111111] shadow-2xl">
          <header className="border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.28em] text-orange-400">
                  {kicker}
                </p>
                <div className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
                  Field Admin
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

            <nav className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <Link to="/login" className={navLinkClass}>
                Login
              </Link>
              <Link to="/dashboard" className={navLinkClass}>
                Dashboard
              </Link>
              <Link to="/logs" className={navLinkClass}>
                Logs
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
                  <p className="mt-3 max-w-2xl text-base text-white/65 sm:text-lg">
                    {subtitle}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="mx-auto w-full max-w-4xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}