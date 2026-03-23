import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";
import DivisionModuleAssignmentsSection from "./division-detail/DivisionModuleAssignmentsSection";
import QuickEstimateSettingsSection from "./division-detail/QuickEstimateSettingsSection";
import type {
  DetailView,
  Division,
  DivisionModuleRow,
  QuickEstimateCalculatorSettings,
} from "./division-detail/types";

const DEFAULT_LABOR_RATE = "40";
const DEFAULT_PRICING_TIERS = "35, 40, 50";

function parsePricingTierPercentInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0 && item < 100)
    .map((item) => item / 100);
}

export default function DivisionDetailPage() {
  const { id } = useParams();
  const [division, setDivision] = useState<Division | null>(null);
  const [modules, setModules] = useState<DivisionModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [loadingQuickEstimateSettings, setLoadingQuickEstimateSettings] = useState(false);
  const [savingQuickEstimateSettings, setSavingQuickEstimateSettings] = useState(false);
  const [laborRateInput, setLaborRateInput] = useState(DEFAULT_LABOR_RATE);
  const [pricingTiersInput, setPricingTiersInput] = useState(DEFAULT_PRICING_TIERS);
  const [view, setView] = useState<DetailView>("overview");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const enabledModuleCount = modules.filter((row) => row.isEnabled).length;
  const disabledModuleCount = modules.length - enabledModuleCount;

  async function loadDivisionDetail() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = getStoredToken();

      const res = await fetch(`${API_BASE}/api/divisions/${id}/modules`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load division details.");
        return;
      }

      setDivision(data.division ?? null);
      setModules(Array.isArray(data.modules) ? data.modules : []);
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  async function loadQuickEstimateSettings(divisionId: string) {
    try {
      setLoadingQuickEstimateSettings(true);

      const token = getStoredToken();

      const res = await fetch(
        `${API_BASE}/api/divisions/${divisionId}/quick-estimate-calculator-settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to load quick estimate settings.");
        return;
      }

      const settings = data.settings as QuickEstimateCalculatorSettings;
      setLaborRateInput(String(settings.laborRate));
      setPricingTiersInput(
        settings.pricingTiers.map((tier) => String(tier * 100)).join(", ")
      );
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoadingQuickEstimateSettings(false);
    }
  }

  useEffect(() => {
    if (id) {
      void loadDivisionDetail();
    }
  }, [id]);

  useEffect(() => {
    if (division?.id && division.key === "hvac") {
      void loadQuickEstimateSettings(division.id);
    }
  }, [division?.id, division?.key]);

  async function handleToggle(row: DivisionModuleRow) {
    try {
      setSavingId(row.id);
      setError("");
      setMessage("");

      const token = getStoredToken();

      const res = await fetch(
        `${API_BASE}/api/divisions/${id}/modules/${row.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isEnabled: !row.isEnabled,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update module.");
        return;
      }

      setModules((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                isEnabled: data.divisionModule.isEnabled,
                updatedAt: data.divisionModule.updatedAt,
              }
            : item
        )
      );

      setMessage(
        `${row.module.name} ${!row.isEnabled ? "enabled" : "disabled"}.`
      );
    } catch {
      setError("Could not reach API.");
    } finally {
      setSavingId("");
    }
  }

  async function handleSaveQuickEstimateSettings(e: React.FormEvent) {
    e.preventDefault();

    if (!division?.id) return;

    const laborRate = Number(laborRateInput.trim());
    const pricingTiers = parsePricingTierPercentInput(pricingTiersInput);

    if (!Number.isFinite(laborRate) || laborRate <= 0) {
      setError("Labor rate must be greater than 0.");
      setMessage("");
      return;
    }

    if (pricingTiers.length === 0) {
      setError("Enter at least one valid pricing tier percentage.");
      setMessage("");
      return;
    }

    try {
      setSavingQuickEstimateSettings(true);
      setError("");
      setMessage("");

      const token = getStoredToken();

      const res = await fetch(
        `${API_BASE}/api/divisions/${division.id}/quick-estimate-calculator-settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            laborRate,
            pricingTiers,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save division settings.");
        return;
      }

      const settings = data.settings as QuickEstimateCalculatorSettings;

      setLaborRateInput(String(settings.laborRate));
      setPricingTiersInput(
        settings.pricingTiers.map((tier) => String(tier * 100)).join(", ")
      );
      setMessage("Division settings saved.");
    } catch {
      setError("Could not reach API.");
    } finally {
      setSavingQuickEstimateSettings(false);
    }
  }

  function handleResetQuickEstimateForm() {
    setLaborRateInput(DEFAULT_LABOR_RATE);
    setPricingTiersInput(DEFAULT_PRICING_TIERS);
    setError("");
    setMessage("");
  }

  return (
    <Layout
      title="Division Detail"
      subtitle="Review this division and the BossOS modules currently mapped to it."
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap gap-3">
          <Link
            to="/divisions"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to Divisions
          </Link>

          {!loading && division && view === "modules" ? (
            <button
              type="button"
              onClick={() => setView("overview")}
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Back to Division Detail
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
            Loading division details...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-200">
            {message}
          </div>
        ) : null}

        {!loading && !error && division && view === "overview" ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Division
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                {division.name}
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Key
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {division.key}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Status
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {division.isActive ? "Active" : "Inactive"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Modules
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {modules.length}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setView("modules")}
              className="block w-full rounded-3xl border border-white/10 bg-[#141414] p-5 text-left shadow-2xl transition hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Module Access
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                Division modules
              </h3>
              <p className="mt-2 text-sm text-white/65 sm:text-base">
                Open the module view to manage active and inactive modules for this division.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Total
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {modules.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Active
                  </div>
                  <div className="mt-2 text-base font-semibold text-emerald-300">
                    {enabledModuleCount}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Inactive
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    {disabledModuleCount}
                  </div>
                </div>
              </div>
            </button>

            {division.key === "hvac" ? (
              <QuickEstimateSettingsSection
                loading={loadingQuickEstimateSettings}
                saving={savingQuickEstimateSettings}
                laborRateInput={laborRateInput}
                pricingTiersInput={pricingTiersInput}
                onChangeLaborRate={setLaborRateInput}
                onChangePricingTiers={setPricingTiersInput}
                onSubmit={handleSaveQuickEstimateSettings}
                onReset={handleResetQuickEstimateForm}
              />
            ) : null}
          </>
        ) : null}

        {!loading && !error && division && view === "modules" ? (
          <DivisionModuleAssignmentsSection
            division={division}
            modules={modules}
            enabledModuleCount={enabledModuleCount}
            disabledModuleCount={disabledModuleCount}
            savingId={savingId}
            onToggle={handleToggle}
          />
        ) : null}
      </div>
    </Layout>
  );
}