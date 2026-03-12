import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";

type LauncherModule = {
  id: string;
  key: string;
  name: string;
  category: string;
};

type LauncherDivision = {
  id: string;
  key: string;
  name: string;
  modules: LauncherModule[];
};

function divisionDescription(key: string) {
  switch (key) {
    case "hvac":
      return "HVAC tools, logs, and field workflows.";
    case "spray-foam":
      return "Spray foam tools, logs, and future field workflows.";
    default:
      return "Division tools and field workflows.";
  }
}

function DivisionCard({
  to,
  eyebrow,
  title,
  description,
}: {
  to: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl transition hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-base">
        {description}
      </p>
    </Link>
  );
}

export default function HomePage() {
  const [divisions, setDivisions] = useState<LauncherDivision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLauncher() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/auth/launcher`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load divisions.");
          return;
        }

        setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadLauncher();
  }, []);

  return (
    <FieldLayout
      kicker="BossOS Field"
      title="Divisions"
      subtitle="Choose a division first, then open the tools inside it."
    >
      <div className="grid gap-6">
        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
            Loading divisions...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            {divisions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                No active divisions are available yet.
              </div>
            ) : (
              divisions.map((division) => (
                <DivisionCard
                  key={division.id}
                  to={`/division/${division.key}`}
                  eyebrow="Division"
                  title={division.name}
                  description={divisionDescription(division.key)}
                />
              ))
            )}
          </>
        ) : null}
      </div>
    </FieldLayout>
  );
}
