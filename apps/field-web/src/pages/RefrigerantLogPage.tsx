import { useState } from "react";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";

type FormState = {
  companyKey: string;
  customerName: string;
  jobNumber: string;
  city: string;
  state: string;
  equipmentType: string;
  refrigerantType: string;
  poundsAdded: string;
  poundsRecovered: string;
  leakSuspected: boolean;
  notes: string;
};

const initialState: FormState = {
  companyKey: "urban-mechanical",
  customerName: "",
  jobNumber: "",
  city: "",
  state: "TX",
  equipmentType: "",
  refrigerantType: "R-410A",
  poundsAdded: "",
  poundsRecovered: "",
  leakSuspected: false,
  notes: "",
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
      {children}
    </label>
  );
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
    />
  );
}

function FieldSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition focus:border-orange-400/60"
    />
  );
}

function FieldTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
    />
  );
}

export default function RefrigerantLogPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = getStoredToken();

      const res = await fetch(`${API_BASE}/api/refrigerant-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyKey: form.companyKey,
          customerName: form.customerName || null,
          jobNumber: form.jobNumber || null,
          city: form.city || null,
          state: form.state || null,
          equipmentType: form.equipmentType || null,
          refrigerantType: form.refrigerantType,
          poundsAdded: form.poundsAdded || null,
          poundsRecovered: form.poundsRecovered || null,
          leakSuspected: form.leakSuspected,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to submit log.");
        return;
      }

      setMessage("Refrigerant log submitted.");
      setForm(initialState);
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FieldLayout
      kicker="Urban Mechanical"
      title="New Refrigerant Log"
      subtitle="Enter job details and submit refrigerant activity from the field."
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <FieldLabel>Company</FieldLabel>
              <FieldSelect
                value={form.companyKey}
                onChange={(e) => update("companyKey", e.target.value)}
              >
                <option value="urban-mechanical">Urban Mechanical</option>
                <option value="urban-spray-foam">Urban Spray Foam</option>
              </FieldSelect>
            </div>

            <div className="grid gap-2">
              <FieldLabel>Customer Name</FieldLabel>
              <FieldInput
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
                placeholder="Customer or site name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Job Number</FieldLabel>
                <FieldInput
                  value={form.jobNumber}
                  onChange={(e) => update("jobNumber", e.target.value)}
                  placeholder="WO-12345"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Equipment Type</FieldLabel>
                <FieldInput
                  value={form.equipmentType}
                  onChange={(e) => update("equipmentType", e.target.value)}
                  placeholder="Split System"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>City</FieldLabel>
                <FieldInput
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Texarkana"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>State</FieldLabel>
                <FieldInput
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="TX"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <FieldLabel>Refrigerant Type</FieldLabel>
              <FieldSelect
                value={form.refrigerantType}
                onChange={(e) => update("refrigerantType", e.target.value)}
              >
                <option value="R-410A">R-410A</option>
                <option value="R-22">R-22</option>
                <option value="R-32">R-32</option>
                <option value="R-454B">R-454B</option>
              </FieldSelect>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Pounds Added</FieldLabel>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={form.poundsAdded}
                  onChange={(e) => update("poundsAdded", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Pounds Recovered</FieldLabel>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={form.poundsRecovered}
                  onChange={(e) => update("poundsRecovered", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <input
                type="checkbox"
                checked={form.leakSuspected}
                onChange={(e) => update("leakSuspected", e.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-black"
              />
              <span className="text-base font-medium text-white/85">Leak suspected</span>
            </label>

            <div className="grid gap-2">
              <FieldLabel>Notes</FieldLabel>
              <FieldTextarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Add details from the service call"
              />
            </div>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="h-16 rounded-2xl bg-[#fbbf24] px-5 text-lg font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Submitting..." : "Submit Log"}
        </button>
      </form>
    </FieldLayout>
  );
}