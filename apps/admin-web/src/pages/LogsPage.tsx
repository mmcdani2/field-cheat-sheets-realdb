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

export default function LogsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [modules, setModules] = useState<DivisionModuleRow[]>([]);
  const [logs, setLogs] = useState<RefrigerantLog[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoadingDivisions(true);
        setLoadingLogs(true);
        setError("");

        const token = getStoredToken();
        const headers = { Authorization: `Bearer ${token}` };

        const [divisionsRes, logsRes] = await Promise.all([
          fetch(`${API_BASE}/api/divisions`, { headers }),
          fetch(`${API_BASE}/api/refrigerant-logs/admin/all`, { headers }),
        ]);

        const divisionsData = await divisionsRes.json();
        const logsData = await logsRes.json();

        if (!divisionsRes.ok) {
          setError(divisionsData?.error || "Failed to load divisions.");
          return;
        }

        if (!logsRes.ok) {
          setError(logsData?.error || "Failed to load logs.");
          return;
        }

        const nextDivisions = Array.isArray(divisionsData.divisions)
          ? divisionsData.divisions.filter((division: Division) => division.isActive)
          : [];

        setDivisions(nextDivisions);

        if (nextDivisions.length > 0) {
          const hvacDivision = nextDivisions.find((division: Division) => division.key === "hvac");
          setSelectedDivisionId(hvacDivision?.id || nextDivisions[0].id);
        }

        setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingDivisions(false);
        setLoadingLogs(false);
      }
    }

    loadInitialData();
  }, []);

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

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) || null,
    [divisions, selectedDivisionId]
  );

  const enabledModules = useMemo(
    () => modules.filter((row) => row.isEnabled && row.module.isActive),
    [modules]
  );

  const refrigerantModuleEnabled = enabledModules.some(
    (row) => row.module.key === "refrigerant-log"
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
                        Refrigerant reporting is enabled for this division, so the records are live below.
                      </p>
                    </div>

                    {loadingLogs ? (
                      <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
                        Loading logs...
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {logs.length === 0 ? (
                          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                            No logs found.
                          </div>
                        ) : (
                          logs.map((log) => <RefrigerantLogCard key={log.id} log={log} />)
                        )}
                      </div>
                    )}
                  </>
                ) : null}

                {enabledModules
                  .filter((row) => row.module.key !== "refrigerant-log")
                  .map((row) => (
                    <div
                      key={`placeholder-${row.id}`}
                      className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl"
                    >
                      {row.module.name} is enabled for this division, but its admin reporting view is not live yet.
                    </div>
                  ))}
              </>
            )}
          </>
        ) : null}
      </div>
    </Layout>
  );
}
