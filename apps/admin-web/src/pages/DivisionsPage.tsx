import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

function DivisionCard({ division }: { division: Division }) {
  return (
    <Link
      to={`/divisions/${division.id}`}
      className="block rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl transition hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-black tracking-tight text-white">
            {division.name}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            {division.key}
          </div>
        </div>

        <div
          className={[
            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
            division.isActive
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/10 text-white/55",
          ].join(" ")}
        >
          {division.isActive ? "Active" : "Inactive"}
        </div>
      </div>
    </Link>
  );
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDivisions() {
      try {
        setLoading(true);
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

        setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    loadDivisions();
  }, []);

  return (
    <Layout
      title="Divisions"
      subtitle="Manage the business units that BossOS organizes for reporting, modules, and future permissions."
    >
      <div className="grid gap-6">
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
          <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
            Structure
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
            Active business divisions
          </h2>
          <p className="mt-2 text-sm text-white/65 sm:text-base">
            Divisions separate operating units like HVAC and Spray Foam. Module enablement and user assignment will hang off this next.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
            Loading divisions...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-4">
            {divisions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
                No divisions found.
              </div>
            ) : (
              divisions.map((division) => (
                <DivisionCard key={division.id} division={division} />
              ))
            )}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
