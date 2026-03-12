import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { API_BASE, getStoredToken } from "../lib/auth";

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

function ModuleCard({
  row,
  onToggle,
  savingId,
}: {
  row: DivisionModuleRow;
  onToggle: (row: DivisionModuleRow) => Promise<void>;
  savingId: string;
}) {
  const isSaving = savingId === row.id;

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

      <div className="mt-4">
        <button
          type="button"
          onClick={() => onToggle(row)}
          disabled={isSaving}
          className="h-11 rounded-2xl bg-[#fbbf24] px-4 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving
            ? "Saving..."
            : row.isEnabled
              ? "Disable Module"
              : "Enable Module"}
        </button>
      </div>
    </div>
  );
}

export default function DivisionDetailPage() {
  const { id } = useParams();
  const [division, setDivision] = useState<Division | null>(null);
  const [modules, setModules] = useState<DivisionModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    if (id) {
      loadDivisionDetail();
    }
  }, [id]);

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

  return (
    <Layout
      title="Division Detail"
      subtitle="Review this division and the BossOS modules currently mapped to it."
    >
      <div className="grid gap-6">
        <div>
          <Link
            to="/divisions"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to Divisions
          </Link>
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

        {!loading && !error && division ? (
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

            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Module Access
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
                Division modules
              </h3>
              <p className="mt-2 text-sm text-white/65 sm:text-base">
                These are the product-managed modules currently mapped to this division.
              </p>
            </div>

            <div className="grid gap-4">
              {modules.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                  No modules found for this division.
                </div>
              ) : (
                modules.map((row) => (
                  <ModuleCard
                    key={row.id}
                    row={row}
                    onToggle={handleToggle}
                    savingId={savingId}
                  />
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
