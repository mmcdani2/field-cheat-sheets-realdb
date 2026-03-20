import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";

type AreaLine = {
  areaName: string;
  applicationType: string;
  foamType: string;
  squareFeet: string;
  averageThicknessIn: string;
};

type MaterialLine = {
  manufacturer: string;
  lotNumber: string;
  setsUsed: string;
  theoreticalYieldPerSet: string;
};

type FormState = {
  jobDate: string;
  customerName: string;
  jobNumber: string;
  crewLead: string;
  helpersText: string;
  rigName: string;
  timeOnJob: string;
  ambientTempF: string;
  substrateTempF: string;
  humidityPercent: string;
  downtimeMinutes: string;
  downtimeReason: string;
  otherNotes: string;
  photosUploadedToHcp: boolean;
  areaLines: AreaLine[];
  materialLines: MaterialLine[];
};

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function emptyAreaLine(): AreaLine {
  return {
    areaName: "",
    applicationType: "",
    foamType: "",
    squareFeet: "",
    averageThicknessIn: "",
  };
}

function emptyMaterialLine(): MaterialLine {
  return {
    manufacturer: "",
    lotNumber: "",
    setsUsed: "",
    theoreticalYieldPerSet: "",
  };
}

function createInitialState(): FormState {
  return {
    jobDate: todayValue(),
    customerName: "",
    jobNumber: "",
    crewLead: "",
    helpersText: "",
    rigName: "",
    timeOnJob: "",
    ambientTempF: "",
    substrateTempF: "",
    humidityPercent: "",
    downtimeMinutes: "",
    downtimeReason: "",
    otherNotes: "",
    photosUploadedToHcp: false,
    areaLines: [emptyAreaLine()],
    materialLines: [emptyMaterialLine()],
  };
}

function cleanString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed.length) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveBoardFeet(squareFeet: string, averageThicknessIn: string) {
  const sf = toNumber(squareFeet);
  const thickness = toNumber(averageThicknessIn);

  if (sf === null || thickness === null) {
    return "";
  }

  return (sf * thickness).toFixed(2);
}

function deriveTheoreticalTotalYield(setsUsed: string, theoreticalYieldPerSet: string) {
  const sets = toNumber(setsUsed);
  const yieldPerSet = toNumber(theoreticalYieldPerSet);

  if (sets === null || yieldPerSet === null) {
    return "";
  }

  return (sets * yieldPerSet).toFixed(2);
}

function deriveActualYield(boardFeet: string, setsUsed: string) {
  const bf = toNumber(boardFeet);
  const sets = toNumber(setsUsed);

  if (bf === null || sets === null || sets <= 0) {
    return "";
  }

  return (bf / sets).toFixed(2);
}

function deriveYieldPercent(boardFeet: string, theoreticalTotalYield: string) {
  const bf = toNumber(boardFeet);
  const theoretical = toNumber(theoreticalTotalYield);

  if (bf === null || theoretical === null || theoretical <= 0) {
    return "";
  }

  return ((bf / theoretical) * 100).toFixed(2);
}

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
      className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
    />
  );
}

export default function SprayFoamJobLogPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(createInitialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSuccessPrompt, setShowSuccessPrompt] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateAreaLine(index: number, key: keyof AreaLine, value: string) {
    setForm((prev) => ({
      ...prev,
      areaLines: prev.areaLines.map((line, i) =>
        i === index ? { ...line, [key]: value } : line
      ),
    }));
  }

  function updateMaterialLine(index: number, key: keyof MaterialLine, value: string) {
    setForm((prev) => ({
      ...prev,
      materialLines: prev.materialLines.map((line, i) =>
        i === index ? { ...line, [key]: value } : line
      ),
    }));
  }

  function addAreaLine() {
    setForm((prev) => ({
      ...prev,
      areaLines: [...prev.areaLines, emptyAreaLine()],
      materialLines: [...prev.materialLines, emptyMaterialLine()],
    }));
  }

  function removeAreaLine(index: number) {
    setForm((prev) => {
      if (prev.areaLines.length === 1) {
        return prev;
      }

      return {
        ...prev,
        areaLines: prev.areaLines.filter((_, i) => i !== index),
        materialLines: prev.materialLines.filter((_, i) => i !== index),
      };
    });
  }

  function handleSubmitAnotherLog() {
    setForm(createInitialState());
    setMessage("");
    setError("");
    setShowSuccessPrompt(false);
  }

  function handleReturnToModules() {
    setShowSuccessPrompt(false);
    navigate("/division/spray-foam");
  }

  const totals = useMemo(() => {
    const totalBoardFeet = form.areaLines.reduce((sum, line) => {
      const value = Number(deriveBoardFeet(line.squareFeet, line.averageThicknessIn) || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const setsByFoamType = form.materialLines.reduce<Record<string, number>>((acc, material, index) => {
      const foamType = form.areaLines[index]?.foamType?.trim();
      const setsUsed = Number(material.setsUsed || 0);

      if (!foamType || !Number.isFinite(setsUsed)) {
        return acc;
      }

      acc[foamType] = (acc[foamType] || 0) + setsUsed;
      return acc;
    }, {});

    const foamTypeTotals = Object.entries(setsByFoamType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([foamType, totalSetsUsed]) => ({
        foamType,
        label: `Total Sets ${foamType
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")} Used`,
        totalSetsUsed: totalSetsUsed.toFixed(2),
      }));

    return {
      totalBoardFeet: totalBoardFeet.toFixed(2),
      foamTypeTotals,
    };
  }, [form.areaLines, form.materialLines]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    setShowSuccessPrompt(false);

    const normalizedAreaLines = form.areaLines
      .map((line) => ({
        areaName: cleanString(line.areaName),
        applicationType: cleanString(line.applicationType),
        foamType: cleanString(line.foamType),
        squareFeet: line.squareFeet.trim() || null,
        averageThicknessIn: line.averageThicknessIn.trim() || null,
      }))
      .filter(
        (line) =>
          line.areaName ||
          line.applicationType ||
          line.foamType ||
          line.squareFeet ||
          line.averageThicknessIn
      );

    if (normalizedAreaLines.length === 0) {
      setError("Add at least one area line.");
      setLoading(false);
      return;
    }

    const invalidAreaLine = normalizedAreaLines.find(
      (line) =>
        !line.areaName ||
        !line.applicationType ||
        !line.foamType ||
        !line.squareFeet ||
        !line.averageThicknessIn
    );

    if (invalidAreaLine) {
      setError(
        "Each area line needs area name, application type, foam type, square feet, and average thickness."
      );
      setLoading(false);
      return;
    }

    const normalizedMaterialLines = form.materialLines
      .map((line, index) => ({
        areaLineNumber: index + 1,
        manufacturer: cleanString(line.manufacturer),
        lotNumber: cleanString(line.lotNumber),
        setsUsed: line.setsUsed.trim() || null,
        theoreticalYieldPerSet: line.theoreticalYieldPerSet.trim() || null,
      }))
      .filter(
        (line) =>
          line.manufacturer || line.lotNumber || line.setsUsed || line.theoreticalYieldPerSet
      );

    if (normalizedMaterialLines.length === 0) {
      setError("Add at least one material line.");
      setLoading(false);
      return;
    }

    const invalidMaterialLine = normalizedMaterialLines.find(
      (line) =>
        !line.manufacturer ||
        !line.lotNumber ||
        !line.setsUsed ||
        !line.theoreticalYieldPerSet
    );

    if (invalidMaterialLine) {
      setError(
        "Each material line needs manufacturer, lot number, sets used, and theoretical yield per set."
      );
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
          jobDate: cleanString(form.jobDate),
          customerName: cleanString(form.customerName),
          jobNumber: cleanString(form.jobNumber),
          crewLead: cleanString(form.crewLead),
          helpersText: cleanString(form.helpersText),
          rigName: cleanString(form.rigName),
          timeOnJob: cleanString(form.timeOnJob),
          ambientTempF: form.ambientTempF.trim() || null,
          substrateTempF: form.substrateTempF.trim() || null,
          humidityPercent: form.humidityPercent.trim() || null,
          downtimeMinutes: form.downtimeMinutes.trim() || null,
          downtimeReason: cleanString(form.downtimeReason),
          otherNotes: cleanString(form.otherNotes),
          photosUploadedToHcp: form.photosUploadedToHcp,
          areaLines: normalizedAreaLines,
          materialLines: normalizedMaterialLines,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to submit spray foam job log.");
        return;
      }

      setMessage("Spray foam job log submitted.");
      setShowSuccessPrompt(true);
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
      subtitle="Log one job, its sprayed areas, and the material usage tied to those areas."
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
          <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
            Job Header
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Job Date</FieldLabel>
                <FieldInput
                  type="date"
                  value={form.jobDate}
                  onChange={(e) => updateField("jobDate", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Job Number</FieldLabel>
                <FieldInput
                  value={form.jobNumber}
                  onChange={(e) => updateField("jobNumber", e.target.value)}
                  placeholder="WO-12345"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel>Customer Name</FieldLabel>
              <FieldInput
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                placeholder="Customer or builder"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Crew Lead</FieldLabel>
                <FieldInput
                  value={form.crewLead}
                  onChange={(e) => updateField("crewLead", e.target.value)}
                  placeholder="Lead sprayer"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Rig Name</FieldLabel>
                <FieldInput
                  value={form.rigName}
                  onChange={(e) => updateField("rigName", e.target.value)}
                  placeholder="Truck or rig"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Helpers</FieldLabel>
                <FieldInput
                  value={form.helpersText}
                  onChange={(e) => updateField("helpersText", e.target.value)}
                  placeholder="Helper names"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Time On Job</FieldLabel>
                <FieldInput
                  value={form.timeOnJob}
                  onChange={(e) => updateField("timeOnJob", e.target.value)}
                  placeholder="6.5 hours"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <FieldLabel>Ambient Temp (F)</FieldLabel>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={form.ambientTempF}
                  onChange={(e) => updateField("ambientTempF", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Substrate Temp (F)</FieldLabel>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={form.substrateTempF}
                  onChange={(e) => updateField("substrateTempF", e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Humidity (%)</FieldLabel>
                <FieldInput
                  type="number"
                  step="0.01"
                  value={form.humidityPercent}
                  onChange={(e) => updateField("humidityPercent", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <FieldLabel>Downtime Minutes</FieldLabel>
                <FieldInput
                  type="number"
                  step="1"
                  value={form.downtimeMinutes}
                  onChange={(e) => updateField("downtimeMinutes", e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <FieldLabel>Downtime Reason</FieldLabel>
                <FieldInput
                  value={form.downtimeReason}
                  onChange={(e) => updateField("downtimeReason", e.target.value)}
                  placeholder="Weather, machine, access, etc."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <FieldLabel>Other Notes</FieldLabel>
              <FieldTextarea
                value={form.otherNotes}
                onChange={(e) => updateField("otherNotes", e.target.value)}
                placeholder="Overall job notes"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-semibold text-white">
              <input
                type="checkbox"
                checked={form.photosUploadedToHcp}
                onChange={(e) => updateField("photosUploadedToHcp", e.target.checked)}
              />
              Photos uploaded to Housecall Pro
            </label>
          </div>
        </div>

        {form.areaLines.map((line, index) => {
          const boardFeet = deriveBoardFeet(line.squareFeet, line.averageThicknessIn);
          const material = form.materialLines[index];
          const theoreticalTotalYield = deriveTheoreticalTotalYield(
            material.setsUsed,
            material.theoreticalYieldPerSet
          );
          const actualYield = deriveActualYield(boardFeet, material.setsUsed);
          const yieldPercent = deriveYieldPercent(boardFeet, theoreticalTotalYield);

          return (
            <div
              key={index}
              className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                    Area + Material Pair
                  </div>
                  <div className="mt-2 text-xl font-black tracking-tight text-white">
                    Line {index + 1}
                  </div>
                </div>

                {form.areaLines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeAreaLine(index)}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid gap-5">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Area Output
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <FieldLabel>Area Name</FieldLabel>
                      <FieldInput
                        value={line.areaName}
                        onChange={(e) => updateAreaLine(index, "areaName", e.target.value)}
                        placeholder="Attic, walls, crawlspace, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <FieldLabel>Application Type</FieldLabel>
                        <FieldSelect
                          value={line.applicationType}
                          onChange={(e) => updateAreaLine(index, "applicationType", e.target.value)}
                        >
                          <option value="">Select application type</option>
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
                          onChange={(e) => updateAreaLine(index, "foamType", e.target.value)}
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
                          onChange={(e) => updateAreaLine(index, "squareFeet", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Average Thickness (Inches)</FieldLabel>
                        <FieldInput
                          type="number"
                          step="0.01"
                          value={line.averageThicknessIn}
                          onChange={(e) =>
                            updateAreaLine(index, "averageThicknessIn", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Board Feet</FieldLabel>
                        <FieldInput value={boardFeet} readOnly placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                    Material Usage
                  </div>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <FieldLabel>Foam Type</FieldLabel>
                        <FieldInput
                          value={line.foamType || ""}
                          readOnly
                          placeholder="Auto from area line"
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Board Feet Sprayed</FieldLabel>
                        <FieldInput value={boardFeet} readOnly placeholder="Auto from area line" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <FieldLabel>Manufacturer</FieldLabel>
                        <FieldInput
                          value={material.manufacturer}
                          onChange={(e) => updateMaterialLine(index, "manufacturer", e.target.value)}
                          placeholder="Manufacturer"
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Lot Number</FieldLabel>
                        <FieldInput
                          value={material.lotNumber}
                          onChange={(e) => updateMaterialLine(index, "lotNumber", e.target.value)}
                          placeholder="Lot number"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <FieldLabel>Sets Used</FieldLabel>
                        <FieldInput
                          type="number"
                          step="0.01"
                          value={material.setsUsed}
                          onChange={(e) => updateMaterialLine(index, "setsUsed", e.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Theoretical Yield Per Set</FieldLabel>
                        <FieldInput
                          type="number"
                          step="0.01"
                          value={material.theoreticalYieldPerSet}
                          onChange={(e) =>
                            updateMaterialLine(index, "theoreticalYieldPerSet", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="grid gap-2">
                        <FieldLabel>Theoretical Total Yield</FieldLabel>
                        <FieldInput value={theoreticalTotalYield} readOnly placeholder="0.00" />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Actual Yield</FieldLabel>
                        <FieldInput value={actualYield} readOnly placeholder="0.00" />
                      </div>

                      <div className="grid gap-2">
                        <FieldLabel>Yield Percent</FieldLabel>
                        <FieldInput
                          value={yieldPercent ? `${yieldPercent}%` : ""}
                          readOnly
                          placeholder="0.00%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addAreaLine}
          className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-white transition hover:bg-white/10"
        >
          Add Another Area
        </button>

        <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
          <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
            Job Totals
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                Total Board Feet
              </div>
              <div className="mt-2 text-base font-semibold text-white">
                {totals.totalBoardFeet}
              </div>
            </div>

            {totals.foamTypeTotals.map((item) => (
              <div
                key={item.foamType}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
              >
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                  {item.label}
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  {item.totalSetsUsed}
                </div>
              </div>
            ))}
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
          {loading ? "Submitting..." : "Submit Spray Foam Job Log"}
        </button>
      </form>

      {showSuccessPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Submission Complete
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              Spray foam job log submitted
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/70">
              What do you want to do next?
            </p>

            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={handleSubmitAnotherLog}
                className="h-14 rounded-2xl bg-[#fbbf24] px-5 text-base font-black text-black transition hover:brightness-105"
              >
                Submit Another Log
              </button>

              <button
                type="button"
                onClick={handleReturnToModules}
                className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-white transition hover:bg-white/10"
              >
                Return to Spray Foam Modules
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </FieldLayout>
  );
}
