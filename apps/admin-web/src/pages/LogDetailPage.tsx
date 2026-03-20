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

type SprayFoamAreaLineDetail = {
  id: string;
  lineNumber: number;
  areaDescription: string;
  jobType: string;
  foamType: string;
  squareFeet: string | null;
  thicknessInches: string | null;
  boardFeet: string | null;
};

type SprayFoamMaterialLineDetail = {
  id: string;
  lineNumber: number;
  foamType: string;
  manufacturer: string;
  lotNumber: string;
  setsUsed: string | null;
  theoreticalYieldPerSet: string | null;
  theoreticalTotalYield: string | null;
  actualYield: string | null;
  yieldPercent: string | null;
};

type SprayFoamLogDetail = {
  id: string;
  customerName: string | null;
  techNameSnapshot: string;
  companyKey: string;
  divisionKey: string | null;
  jobNumber: string | null;
  jobDate: string | null;
  crewLead: string | null;
  helpersText: string | null;
  rigName: string | null;
  timeOnJob: string | null;
  ambientTempF: string | null;
  substrateTempF: string | null;
  humidityPercent: string | null;
  downtimeMinutes: number | null;
  downtimeReason: string | null;
  otherNotes: string | null;
  photosUploadedToHcp: boolean;
  submittedAt: string;
  areaLines: SprayFoamAreaLineDetail[];
  materialLines: SprayFoamMaterialLineDetail[];
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
      "Delete this spray foam job log permanently? This will also delete area lines and material lines."
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

  const sprayFoamTotalBoardFeet = sprayFoamLog?.areaLines.reduce((sum, line) => {
    const value = line.boardFeet ? Number(line.boardFeet) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const sprayFoamTotalSetsUsed = sprayFoamLog?.materialLines.reduce((sum, line) => {
    const value = line.setsUsed ? Number(line.setsUsed) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const sprayFoamTheoreticalTotalYield = sprayFoamLog?.materialLines.reduce((sum, line) => {
    const value = line.theoreticalTotalYield ? Number(line.theoreticalTotalYield) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const sprayFoamOverallYieldPercent =
    sprayFoamTotalBoardFeet && sprayFoamTheoreticalTotalYield && sprayFoamTheoreticalTotalYield > 0
      ? ((sprayFoamTotalBoardFeet / sprayFoamTheoreticalTotalYield) * 100).toFixed(2)
      : "0.00";

  const kicker = logType === "spray-foam" ? "Urban Spray Foam" : "Urban Mechanical";
  const subtitle =
    logType === "spray-foam"
      ? "Review the full spray foam job submission, production output, and material usage."
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Job Date" value={sprayFoamLog.jobDate} />
            <DetailRow label="Job Number" value={sprayFoamLog.jobNumber} />
            <DetailRow label="Crew Lead" value={sprayFoamLog.crewLead} />
            <DetailRow label="Helpers" value={sprayFoamLog.helpersText} />
            <DetailRow label="Rig" value={sprayFoamLog.rigName} />
            <DetailRow label="Time On Job" value={sprayFoamLog.timeOnJob} />
            <DetailRow label="Ambient Temp (F)" value={sprayFoamLog.ambientTempF} />
            <DetailRow label="Substrate Temp (F)" value={sprayFoamLog.substrateTempF} />
            <DetailRow label="Humidity (%)" value={sprayFoamLog.humidityPercent} />
            <DetailRow label="Downtime Minutes" value={sprayFoamLog.downtimeMinutes} />
            <DetailRow label="Downtime Reason" value={sprayFoamLog.downtimeReason} />
            <DetailRow
              label="Photos Uploaded To HCP"
              value={sprayFoamLog.photosUploadedToHcp ? "Yes" : "No"}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailRow label="Area Line Count" value={sprayFoamLog.areaLines.length} />
            <DetailRow
              label="Total Board Feet"
              value={sprayFoamTotalBoardFeet ? sprayFoamTotalBoardFeet.toFixed(2) : "0.00"}
            />
            <DetailRow
              label="Total Sets Used"
              value={sprayFoamTotalSetsUsed ? sprayFoamTotalSetsUsed.toFixed(2) : "0.00"}
            />
            <DetailRow label="Overall Yield %" value={`${sprayFoamOverallYieldPercent}%`} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Other Notes
            </div>
            <div className="mt-3 text-sm leading-7 text-white/75">
              {sprayFoamLog.otherNotes || "No notes submitted."}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Area Lines
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                Installed output
              </h3>
            </div>

            {sprayFoamLog.areaLines.map((line) => (
              <div
                key={line.id}
                className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  Area Line {line.lineNumber}
                </div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                  {line.areaDescription}
                </h3>
                <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
                  {line.jobType} · {line.foamType}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <DetailRow label="Square Feet" value={line.squareFeet} />
                  <DetailRow label="Average Thickness (Inches)" value={line.thicknessInches} />
                  <DetailRow label="Board Feet" value={line.boardFeet} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Material Lines
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                Actual material usage
              </h3>
            </div>

            {sprayFoamLog.materialLines.map((line) => (
              <div
                key={line.id}
                className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
              >
                <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  Material Line {line.lineNumber}
                </div>
                <h3 className="mt-2 text-xl font-black tracking-tight text-white">
                  {line.manufacturer}
                </h3>
                <div className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
                  {line.foamType}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <DetailRow label="Lot Number" value={line.lotNumber} />
                  <DetailRow label="Sets Used" value={line.setsUsed} />
                  <DetailRow label="Theoretical Yield / Set" value={line.theoreticalYieldPerSet} />
                  <DetailRow label="Theoretical Total Yield" value={line.theoreticalTotalYield} />
                  <DetailRow label="Actual Yield" value={line.actualYield} />
                  <DetailRow
                    label="Yield Percent"
                    value={line.yieldPercent ? `${line.yieldPercent}%` : "N/A"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Layout>
  );
}
