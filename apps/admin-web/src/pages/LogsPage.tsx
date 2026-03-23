import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";
import RefrigerantRecordsPanel from "./reports/RefrigerantRecordsPanel";
import ReimbursementRequestsPanel from "./reports/ReimbursementRequestsPanel";
import ReportsDivisionSelect from "./reports/ReportsDivisionSelect";
import ReportsModulePanel from "./reports/ReportsModulePanel";
import SprayFoamRecordsPanel from "./reports/SprayFoamRecordsPanel";
import type { Division, DivisionModuleRow } from "./reports/types";

export default function LogsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [selectedModuleKey, setSelectedModuleKey] = useState("");
  const [modules, setModules] = useState<DivisionModuleRow[]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
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
          const hvacDivision = nextDivisions.find(
            (division: Division) => division.key === "hvac",
          );
          setSelectedDivisionId(hvacDivision?.id || nextDivisions[0].id);
        }
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingDivisions(false);
      }
    }

    void loadDivisions();
  }, []);

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.id === selectedDivisionId) || null,
    [divisions, selectedDivisionId],
  );

  useEffect(() => {
    async function loadDivisionModules() {
      if (!selectedDivisionId) {
        setModules([]);
        setSelectedModuleKey("");
        setLoadingModules(false);
        return;
      }

      try {
        setLoadingModules(true);
        setError("");

        const token = getStoredToken();
        const res = await fetch(
          `${API_BASE}/api/divisions/${selectedDivisionId}/modules`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load division modules.");
          return;
        }

        const nextModules = Array.isArray(data.modules) ? data.modules : [];
        setModules(nextModules);
        setSelectedModuleKey("");
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoadingModules(false);
      }
    }

    void loadDivisionModules();
  }, [selectedDivisionId]);

  const enabledModules = useMemo(
    () => modules.filter((row) => row.isEnabled && row.module.isActive),
    [modules],
  );

  const moduleItems = enabledModules.map((row) => ({
    key: row.module.key,
    name: row.module.name,
  }));

  const showingModulePicker = Boolean(selectedDivision && !selectedModuleKey);
  const showingRefrigerantRecords = selectedModuleKey === "refrigerant-log";
  const showingSprayFoamRecords = selectedModuleKey === "spray-foam-job-log";
  const showingReimbursementRequests = selectedModuleKey === "reimbursement-request";

  return (
    <Layout
      title="Reports"
      subtitle="Choose a division, then choose a report module, then review the records inside it."
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
            {loadingModules ? (
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
                Loading modules...
              </div>
            ) : null}

            {!loadingModules && enabledModules.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                No enabled report modules found for this division.
              </div>
            ) : null}

            {!loadingModules && enabledModules.length > 0 && showingModulePicker ? (
              <ReportsModulePanel
                modules={moduleItems}
                selectedModuleKey={selectedModuleKey}
                onSelectModule={setSelectedModuleKey}
              />
            ) : null}

            {showingRefrigerantRecords && selectedDivision.key ? (
              <RefrigerantRecordsPanel
                divisionKey={selectedDivision.key}
                onBack={() => setSelectedModuleKey("")}
              />
            ) : null}

            {showingSprayFoamRecords && selectedDivision.key ? (
              <SprayFoamRecordsPanel
                divisionKey={selectedDivision.key}
                onBack={() => setSelectedModuleKey("")}
              />
            ) : null}

            {showingReimbursementRequests && selectedDivision.key ? (
              <ReimbursementRequestsPanel
                divisionKey={selectedDivision.key}
                onBack={() => setSelectedModuleKey("")}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </Layout>
  );
}