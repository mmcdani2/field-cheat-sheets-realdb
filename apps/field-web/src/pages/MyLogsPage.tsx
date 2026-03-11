import { useEffect, useState } from "react";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";

type RefrigerantLog = {
  id: string;
  customerName: string | null;
  refrigerantType: string;
  techNameSnapshot: string;
  jobNumber: string | null;
  city: string | null;
  state: string | null;
  poundsAdded: string | number | null;
  poundsRecovered: string | number | null;
};

function LogCard({ log }: { log: RefrigerantLog }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-black tracking-tight text-white">
            {log.customerName || "No customer name"}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            {log.refrigerantType}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-white/65">
        <div>
          <span className="font-semibold text-white/85">Tech:</span> {log.techNameSnapshot}
        </div>
        <div>
          <span className="font-semibold text-white/85">Job:</span> {log.jobNumber || "N/A"}
        </div>
        <div>
          <span className="font-semibold text-white/85">Location:</span> {log.city || "N/A"}
          {log.state ? `, ${log.state}` : ""}
        </div>
        <div>
          <span className="font-semibold text-white/85">Added:</span> {log.poundsAdded ?? "0"}
          <span className="mx-2 text-white/30">|</span>
          <span className="font-semibold text-white/85">Recovered:</span> {log.poundsRecovered ?? "0"}
        </div>
      </div>
    </div>
  );
}

export default function MyLogsPage() {
  const [logs, setLogs] = useState<RefrigerantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/mine`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load logs.");
          return;
        }

        setLogs(data.logs || []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  return (
    <FieldLayout
      kicker="Urban Mechanical"
      title="My Logs"
      subtitle="Review your recent refrigerant submissions from the field."
    >
      {loading ? (
        <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
          Loading logs...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-4">
          {logs.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
              No logs found.
            </div>
          ) : (
            logs.map((log) => <LogCard key={log.id} log={log} />)
          )}
        </div>
      ) : null}
    </FieldLayout>
  );
}