import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

type SprayFoamLogLineDetail = {
  id: string;
  lineNumber: number;
  areaDescription: string;
  jobType: string;
  foamType: string;
  squareFeet: string | null;
  thicknessInches: string | null;
  boardFeet: string | null;
  notes: string | null;
};

type SprayFoamLogDetail = {
  id: string;
  customerName: string | null;
  techNameSnapshot: string;
  companyKey: string;
  divisionKey: string | null;
  jobNumber: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  submittedAt: string;
  lines: SprayFoamLogLineDetail[];
};

type LogType = "refrigerant" | "spray-foam";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
}) {
  const displayValue =
    value !== null && value !== undefined && value !== "" ? String(value) : "N/A";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-white">{displayValue}</div>
    </div>
  );
}

function formatSubmittedAt(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function LogDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const logType: LogType = useMemo(() => {
    return searchParams.get("type") === "spray-foam" ? "spray-foam" : "refrigerant";
  }, [searchParams]);

  const [refrigerantLog, setRefrigerantLog] = useState<RefrigerantLogDetail | null>(null);
  const [sprayFoamLog, setSprayFoamLog] = useState<SprayFoamLogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLog() {
      try {
        setLoading(true);
        setError("");
        setRefrigerantLog(null);
        setSprayFoamLog(null);

        const token = getStoredToken();
        const endpoint =
          logType === "spray-foam"
            ? `${API_BASE}/api/spray-foam-logs/${id}`
            : `${API_BASE}/api/refrigerant-logs/${id}`;

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load log.");
          return;
        }

        if (logType === "spray-foam") {
          setSprayFoamLog(data.log as SprayFoamLogDetail);
          return;
        }

        setRefrigerantLog(data.log as RefrigerantLogDetail);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadLog();
    }
  }, [id, logType]);

  async function handleDeleteSprayFoamLog() {
    if (!id || logType !== "spray-foam") {
      return;
    }

    const confirmed = window.confirm(
      "Delete this spray foam job log permanently? This will also delete all line items."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/api/spray-foam-logs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to delete log.");
        return;
      }

      navigate("/logs");
    } catch {
      setError("Could not reach API.");
    } finally {
      setDeleting(false);
    }
  }

  const sprayFoamTotalBoardFeet = sprayFoamLog?.lines.reduce((sum, line) => {
    const value = line.boardFeet ? Number(line.boardFeet) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const kicker = logType === "spray-foam" ? "Urban Spray Foam" : "Urban Mechanical";
  const subtitle =
    logType === "spray-foam"
      ? "Review the full spray foam job submission, job info, and all recorded line items."
      : "Review submission details, technician information, and recorded refrigerant activity.";

  return (
    <Layout kicker={kicker} title="Log Detail" subtitle={subtitle}>
      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
          Loading log...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && refrigerantLog ? (
        <div className="grid gap-5">
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Submission
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              {refrigerantLog.customerName || "No customer name"}
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Submitted by {refrigerantLog.techNameSnapshot} on{" "}
              {formatSubmittedAt(refrigerantLog.submittedAt)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Tech" value={refrigerantLog.techNameSnapshot} />
            <DetailRow label="Job Number" value={refrigerantLog.jobNumber} />
            <DetailRow
              label="Location"
              value={[refrigerantLog.city, refrigerantLog.state].filter(Boolean).join(", ")}
            />
            <DetailRow label="Equipment Type" value={refrigerantLog.equipmentType} />
            <DetailRow label="Refrigerant Type" value={refrigerantLog.refrigerantType} />
            <DetailRow label="Leak Suspected" value={refrigerantLog.leakSuspected ? "Yes" : "No"} />
            <DetailRow label="Pounds Added" value={refrigerantLog.poundsAdded} />
            <DetailRow label="Pounds Recovered" value={refrigerantLog.poundsRecovered} />
            <DetailRow label="Company Key" value={refrigerantLog.companyKey} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Notes
            </div>
            <div className="mt-3 text-sm leading-7 text-white/75">
              {refrigerantLog.notes || "No notes submitted."}
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !error && sprayFoamLog ? (
        <div className="grid gap-5">
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  Submission
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                  {sprayFoamLog.customerName || "No customer name"}
                </h2>
                <p className="mt-2 text-sm text-white/65">
                  Submitted by {sprayFoamLog.techNameSnapshot} on{" "}
                  {formatSubmittedAt(sprayFoamLog.submittedAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDeleteSprayFoamLog}
                disabled={deleting}
                className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete Log"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <DetailRow label="Tech" value={sprayFoamLog.techNameSnapshot} />
            <DetailRow label="Job Number" value={sprayFoamLog.jobNumber} />
            <DetailRow
              label="Location"
              value={[sprayFoamLog.city, sprayFoamLog.state].filter(Boolean).join(", ")}
            />
            <DetailRow label="Company Key" value={sprayFoamLog.companyKey} />
            <DetailRow label="Division Key" value={sprayFoamLog.divisionKey} />
            <DetailRow label="Line Count" value={sprayFoamLog.lines.length} />
            <DetailRow
              label="Total Board Feet"
              value={sprayFoamTotalBoardFeet ? sprayFoamTotalBoardFeet.toFixed(2) : "0.00"}
            />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Job Notes
            </div>
            <div className="mt-3 text-sm leading-7 text-white/75">
              {sprayFoamLog.notes || "No notes submitted."}
            </div>
          </div>

          <div className="grid gap-4">
            {sprayFoamLog.lines.map((line) => (
              <div
                key={line.id}
                className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                      Line {line.lineNumber}
                    </div>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                      {line.areaDescription}
                    </h3>
                    <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
                      {line.jobType} · {line.foamType}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DetailRow label="Square Feet" value={line.squareFeet} />
                  <DetailRow label="Thickness (Inches)" value={line.thicknessInches} />
                  <DetailRow label="Board Feet" value={line.boardFeet} />
                  <DetailRow label="Notes" value={line.notes} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
