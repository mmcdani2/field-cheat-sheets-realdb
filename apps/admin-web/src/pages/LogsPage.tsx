import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";
import ReportsDivisionSelect from "./reports/ReportsDivisionSelect";
import RefrigerantLogCard, { type RefrigerantLog } from "./reports/RefrigerantLogCard";

type Division = {
  id: string;
  companyId: string;
  key: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type DivisionModuleRow = {
  id: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  module: {
    id: string;
    key: string;
    name: string;
    category: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

type SprayFoamLogLine = {
  id: string;
  jobLogId: string;
  lineNumber: number;
  areaDescription: string;
  jobType: string;
  foamType: string;
  squareFeet: string | null;
  thicknessInches: string | null;
  boardFeet: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SprayFoamLog = {
  id: string;
  userId: string;
  companyKey: string;
  divisionKey: string | null;
  techNameSnapshot: string;
  customerName: string | null;
  jobNumber: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  lines: SprayFoamLogLine[];
};

function ModuleCard({ row }: { row: DivisionModuleRow }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-black tracking-tight text-white">
            {row.module.name}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            {row.module.key}
          </div>
        </div>

        <div
          className={[
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
            row.isEnabled
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/10 text-white/55",
          ].join(" ")}
        >
          {row.isEnabled ? "Enabled" : "Disabled"}
        </div>
      </div>

      <div className="mt-4 text-sm text-white/65">
        <span className="font-semibold text-white/85">Category:</span>{" "}
        {row.module.category}
      </div>
    </div>
  );
}

function SprayFoamLogCard({ log }: { log: SprayFoamLog }) {
  const totalBoardFeet = log.lines.reduce((sum, line) => {
    const value = line.boardFeet ? Number(line.boardFeet) : 0;
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-black tracking-tight text-white">
            {log.customerName || "No customer name"}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            Spray Foam Job Log
          </div>
        </div>

        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
          {log.lines.length} {log.lines.length === 1 ? "Line" : "Lines"}
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
          <span className="font-semibold text-white/85">Board Feet:</span>{" "}
          {totalBoardFeet ? totalBoardFeet.toFixed(2) : "0.00"}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {log.lines.map((line) => (
          <div key={line.id} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
            <div className="text-sm font-semibold text-white">
              {line.areaDescription}
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
              {line.jobType} · {line.foamType}
            </div>
            <div className="mt-2 text-sm text-white/65">
              SF: {line.squareFeet || "0"}{" "}
              <span className="mx-2 text-white/30">|</span>
              Thickness: {line.thicknessInches || "0"}{" "}
              <span className="mx-2 text-white/30">|</span>
              BF: {line.boardFeet || "0"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [modules, setModules] = useState<DivisionModuleRow[]>([]);
  const [refrigerantLogs, setRefrigerantLogs] = useState<RefrigerantLog[]>([]);
  const [sprayFoamLogs, setSprayFoamLogs] = useState<SprayFoamLog[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingRefrigerantLogs, setLoadingRefrigerantLogs] = useState(true);
  const [loadingSprayFoamLogs, setLoadingSprayFoamLogs] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDivisions() {
      try {
        setLoadingDivisions(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/divisions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load divisions.");
          return;
        }

        const nextDivisions = Array.isArray(data.divisions)
          ? data.divisions.filter((division: Division) => division.isActive)
          : [];

        setDivisions(nextDivisions);

        if (nextDivisions.length > 0) {
          const hvacDivision = nextDivisions.find((division: Division) => division.key === "hvac");
          setSelectedDivisionId(hvacDivision?.id || nextDivisions[0].id);
        }
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingDivisions(false);
      }
    }

    loadDivisions();
  }, []);

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) || null,
    [divisions, selectedDivisionId]
  );

  useEffect(() => {
    async function loadDivisionModules() {
      if (!selectedDivisionId) {
        setModules([]);
        setLoadingModules(false);
        return;
      }

      try {
        setLoadingModules(true);
        setError("");

        const token = getStoredToken();

        const res = await fetch(`${API_BASE}/api/divisions/${selectedDivisionId}/modules`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load division modules.");
          return;
        }

        setModules(Array.isArray(data.modules) ? data.modules : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingModules(false);
      }
    }

    loadDivisionModules();
  }, [selectedDivisionId]);

  useEffect(() => {
    async function loadRefrigerantLogs() {
      if (!selectedDivision?.key) {
        setRefrigerantLogs([]);
        setLoadingRefrigerantLogs(false);
        return;
      }

      try {
        setLoadingRefrigerantLogs(true);
        setError("");

        const token = getStoredToken();
        const url = new URL(`${API_BASE}/api/refrigerant-logs/admin/all`);
        url.searchParams.set("divisionKey", selectedDivision.key);

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load refrigerant logs.");
          return;
        }

        setRefrigerantLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingRefrigerantLogs(false);
      }
    }

    loadRefrigerantLogs();
  }, [selectedDivision?.key]);

  useEffect(() => {
    async function loadSprayFoamLogs() {
      if (!selectedDivision?.key) {
        setSprayFoamLogs([]);
        setLoadingSprayFoamLogs(false);
        return;
      }

      try {
        setLoadingSprayFoamLogs(true);
        setError("");

        const token = getStoredToken();
        const url = new URL(`${API_BASE}/api/spray-foam-logs/admin/all`);
        url.searchParams.set("divisionKey", selectedDivision.key);

        const res = await fetch(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load spray foam logs.");
          return;
        }

        setSprayFoamLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingSprayFoamLogs(false);
      }
    }

    loadSprayFoamLogs();
  }, [selectedDivision?.key]);

  const enabledModules = useMemo(
    () => modules.filter((row) => row.isEnabled && row.module.isActive),
    [modules]
  );

  const refrigerantModuleEnabled = enabledModules.some(
    (row) => row.module.key === "refrigerant-log"
  );

  const sprayFoamModuleEnabled = enabledModules.some(
    (row) => row.module.key === "spray-foam-job-log"
  );

  return (
    <Layout
      title="Reports"
      subtitle="Review records by division first, then drill into the modules and reports that belong to that business unit."
    >
      <div className="grid gap-6">
        {!loadingDivisions ? (
          <ReportsDivisionSelect
            divisions={divisions}
            value={selectedDivisionId}
            onChange={setSelectedDivisionId}
          />
        ) : null}

        {loadingDivisions ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
            Loading divisions...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        {!loadingDivisions && !error && selectedDivision ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Active Division
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {selectedDivision.name}
              </h2>
              <p className="mt-2 text-sm text-white/65 sm:text-base">
                BossOS is now reading enabled modules from admin configuration for this division.
              </p>
            </div>

            {loadingModules ? (
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
                Loading modules...
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
                  <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                    Enabled Modules
                  </div>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                    Active report modules
                  </h3>
                  <p className="mt-2 text-sm text-white/65 sm:text-base">
                    Only enabled modules should drive what this division can report on.
                  </p>
                </div>

                <div className="grid gap-4">
                  {enabledModules.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                      No enabled modules found for this division.
                    </div>
                  ) : (
                    enabledModules.map((row) => <ModuleCard key={row.id} row={row} />)
                  )}
                </div>

                {refrigerantModuleEnabled ? (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
                      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                        Active View
                      </div>
                      <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                        Refrigerant Log Records
                      </h3>
                      <p className="mt-2 text-sm text-white/65 sm:text-base">
                        Refrigerant reporting is enabled for this division, so only that division’s records are live below.
                      </p>
                    </div>

                    {loadingRefrigerantLogs ? (
                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
                        Loading refrigerant logs...
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {refrigerantLogs.length === 0 ? (
                          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                            No refrigerant logs found for this division.
                          </div>
                        ) : (
                          refrigerantLogs.map((log) => <RefrigerantLogCard key={log.id} log={log} />)
                        )}
                      </div>
                    )}
                  </>
                ) : null}

                {sprayFoamModuleEnabled ? (
                  <>
                    <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
                      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                        Active View
                      </div>
                      <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                        Spray Foam Job Logs
                      </h3>
                      <p className="mt-2 text-sm text-white/65 sm:text-base">
                        Spray foam reporting is enabled for this division, so only that division’s job logs are live below.
                      </p>
                    </div>

                    {loadingSprayFoamLogs ? (
                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
                        Loading spray foam job logs...
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {sprayFoamLogs.length === 0 ? (
                          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                            No spray foam job logs found for this division.
                          </div>
                        ) : (
                          sprayFoamLogs.map((log) => <SprayFoamLogCard key={log.id} log={log} />)
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
