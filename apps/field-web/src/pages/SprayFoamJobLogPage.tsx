import { useState } from "react";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";

type SprayFoamLine = {
  areaDescription: string;
  jobType: string;
  foamType: string;
  squareFeet: string;
  thicknessInches: string;
  boardFeet: string;
  notes: string;
};

type FormState = {
  customerName: string;
  jobNumber: string;
  city: string;
  state: string;
  notes: string;
  lines: SprayFoamLine[];
};

const emptyLine = (): SprayFoamLine => ({
  areaDescription: "",
  jobType: "",
  foamType: "",
  squareFeet: "",
  thicknessInches: "",
  boardFeet: "",
  notes: "",
});

const initialState: FormState = {
  customerName: "",
  jobNumber: "",
  city: "",
  state: "TX",
  notes: "",
  lines: [emptyLine()],
};

function cleanString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
      {children}
    </label>
  );
}

function FieldInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
    />
  );
}

function FieldSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition focus:border-orange-400/60"
    />
  );
}

function FieldTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
    />
  );
}

export default function SprayFoamJobLogPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLine(index: number, key: keyof SprayFoamLine, value: string) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [key]: value } : line
      ),
    }));
  }

  function addLine() {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, emptyLine()],
    }));
  }

  function removeLine(index: number) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.length === 1
        ? prev.lines
        : prev.lines.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const normalizedLines = form.lines
      .map((line) => ({
        areaDescription: cleanString(line.areaDescription),
        jobType: cleanString(line.jobType),
        foamType: cleanString(line.foamType),
        squareFeet: line.squareFeet.trim() || null,
        thicknessInches: line.thicknessInches.trim() || null,
        boardFeet: line.boardFeet.trim() || null,
        notes: cleanString(line.notes),
      }))
      .filter((line) => line.areaDescription || line.jobType || line.foamType);

    if (normalizedLines.length === 0) {
      setError("Add at least one spray foam line.");
      setLoading(false);
      return;
    }

    const invalidLine = normalizedLines.find(
      (line) => !line.areaDescription || !line.jobType || !line.foamType
    );

    if (invalidLine) {
      setError("Each spray foam line needs area, job type, and foam type.");
      setLoading(false);
      return;
    }

    try {
      const token = getStoredToken();

      const res = await fetch(`${API_BASE}/api/spray-foam-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyKey: "urban-spray-foam",
          divisionKey: "spray-foam",
          customerName: cleanString(form.customerName),
          jobNumber: cleanString(form.jobNumber),
          city: cleanString(form.city),
          state: cleanString(form.state?.toUpperCase() || ""),
          notes: cleanString(form.notes),
          lines: normalizedLines,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to submit spray foam job log.");
        return;
      }

      setMessage("Spray foam job log submitted.");
      setForm(initialState);
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FieldLayout
      kicker="BossOS Field"
      title="New Spray Foam Job Log"
      subtitle="Enter spray foam job details and add one or more application lines."
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                Division
              </div>
              <div className="mt-2 text-base font-semibold text-white">
                Spray Foam
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel>Customer Name</FieldLabel>
              <FieldInput
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                placeholder="Customer or site name"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Job Number</FieldLabel>
                <FieldInput
                  value={form.jobNumber}
                  onChange={(e) => updateField("jobNumber", e.target.value)}
                  placeholder="WO-12345"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>State</FieldLabel>
                <FieldInput
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value.toUpperCase())}
                  placeholder="TX"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel>City</FieldLabel>
              <FieldInput
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Texarkana"
              />
            </div>

            <div className="grid gap-2">
              <FieldLabel>Job Notes</FieldLabel>
              <FieldTextarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="General notes for the overall spray foam job"
              />
            </div>
          </div>
        </div>

        {form.lines.map((line, index) => (
          <div
            key={index}
            className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                  Application Line
                </div>
                <div className="mt-2 text-xl font-black tracking-tight text-white">
                  Line {index + 1}
                </div>
              </div>

              {form.lines.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Remove
                </button>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <FieldLabel>Area Description</FieldLabel>
                <FieldInput
                  value={line.areaDescription}
                  onChange={(e) => updateLine(index, "areaDescription", e.target.value)}
                  placeholder="Attic west side, crawlspace, wall cavity, etc."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <FieldLabel>Job Type</FieldLabel>
                  <FieldSelect
                    value={line.jobType}
                    onChange={(e) => updateLine(index, "jobType", e.target.value)}
                  >
                    <option value="">Select job type</option>
                    <option value="attic">Attic</option>
                    <option value="walls">Walls</option>
                    <option value="crawlspace">Crawlspace</option>
                    <option value="metal-building">Metal Building</option>
                    <option value="roof-deck">Roof Deck</option>
                    <option value="other">Other</option>
                  </FieldSelect>
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Foam Type</FieldLabel>
                  <FieldSelect
                    value={line.foamType}
                    onChange={(e) => updateLine(index, "foamType", e.target.value)}
                  >
                    <option value="">Select foam type</option>
                    <option value="open-cell">Open Cell</option>
                    <option value="closed-cell">Closed Cell</option>
                  </FieldSelect>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <FieldLabel>Square Feet</FieldLabel>
                  <FieldInput
                    type="number"
                    step="0.01"
                    value={line.squareFeet}
                    onChange={(e) => updateLine(index, "squareFeet", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Thickness (Inches)</FieldLabel>
                  <FieldInput
                    type="number"
                    step="0.01"
                    value={line.thicknessInches}
                    onChange={(e) => updateLine(index, "thicknessInches", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="grid gap-2">
                  <FieldLabel>Board Feet</FieldLabel>
                  <FieldInput
                    type="number"
                    step="0.01"
                    value={line.boardFeet}
                    onChange={(e) => updateLine(index, "boardFeet", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <FieldLabel>Line Notes</FieldLabel>
                <FieldTextarea
                  value={line.notes}
                  onChange={(e) => updateLine(index, "notes", e.target.value)}
                  placeholder="Notes specific to this spray foam application line"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addLine}
          className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-white transition hover:bg-white/10"
        >
          Add Another Line
        </button>

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
          {loading ? "Submitting..." : "Submit Spray Foam Job Log"}
        </button>
      </form>
    </FieldLayout>
  );
}
