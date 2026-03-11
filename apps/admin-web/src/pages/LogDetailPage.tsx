import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";

type RefrigerantLogDetail = {
  id: string;
  customerName: string | null;
  techNameSnapshot: string;
  companyKey: string;
  jobNumber: string | null;
  city: string | null;
  state: string | null;
  equipmentType: string | null;
  refrigerantType: string;
  poundsAdded: string | number | null;
  poundsRecovered: string | number | null;
  leakSuspected: boolean;
  notes: string | null;
  submittedAt: string;
};

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-white">
        {value !== null && value !== undefined && value !== "" ? value : "N/A"}
      </div>
    </div>
  );
}

export default function LogDetailPage() {
  const { id } = useParams();
  const [log, setLog] = useState<RefrigerantLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLog() {
      try {
        setLoading(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/refrigerant-logs/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load log.");
          return;
        }

        setLog(data.log);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadLog();
  }, [id]);

  return (
    <Layout
      kicker="Urban Mechanical"
      title="Log Detail"
      subtitle="Review submission details, technician information, and recorded refrigerant activity."
    >
      {loading ? (
        <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
          Loading log...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && log ? (
        <div className="grid gap-5">
          <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Submission
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              {log.customerName || "Unnamed customer"}
            </h2>
            <p className="mt-2 text-sm text-white/65 sm:text-base">
              Refrigerant type: <span className="font-semibold text-white">{log.refrigerantType}</span>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Log ID" value={log.id} />
            <DetailRow label="Tech" value={log.techNameSnapshot} />
            <DetailRow label="Company" value={log.companyKey} />
            <DetailRow label="Job Number" value={log.jobNumber} />
            <DetailRow
              label="Location"
              value={`${log.city || "N/A"}${log.state ? `, ${log.state}` : ""}`}
            />
            <DetailRow label="Equipment Type" value={log.equipmentType} />
            <DetailRow label="Pounds Added" value={log.poundsAdded} />
            <DetailRow label="Pounds Recovered" value={log.poundsRecovered} />
            <DetailRow label="Leak Suspected" value={log.leakSuspected ? "Yes" : "No"} />
            <DetailRow label="Submitted At" value={log.submittedAt} />
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Notes
            </div>
            <p className="mt-3 whitespace-pre-wrap text-base text-white/80">
              {log.notes || "No notes provided."}
            </p>
          </div>
        </div>
      ) : null}
    </Layout>
  );
}