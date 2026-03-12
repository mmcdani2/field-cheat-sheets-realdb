import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";

type DashboardStats = {
  totalLogs: number;
  logsToday: number;
  activeTechs: number;
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-white/55">
        {label}
      </div>
      <div className={`mt-4 text-4xl font-black tracking-tight text-white ${accent ?? ""}`}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/admin/stats/summary`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load dashboard stats.");
          return;
        }

        setStats(data);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <Layout
      title="Dashboard"
      subtitle="Quick view of refrigerant activity, technician usage, and today’s field submissions."
    >
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
          Loading dashboard...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total Logs" value={stats.totalLogs} />
          <StatCard label="Logs Today" value={stats.logsToday} accent="text-orange-300" />
          <StatCard label="Active Techs" value={stats.activeTechs} />
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
          <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
            Snapshot
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Operations at a glance
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
            This dashboard is intentionally simple right now. Next step is recent activity,
            log trend visibility, and direct drill-down into technician submissions.
          </p>
        </div>
      ) : null}
    </Layout>
  );
}
