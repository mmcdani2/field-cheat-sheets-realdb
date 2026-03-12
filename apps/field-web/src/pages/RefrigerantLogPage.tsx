import { useState } from "react";
import FieldLayout from "../components/FieldLayout";
import { API_BASE, getStoredToken } from "../lib/auth";
import JobInfoSection from "./refrigerant-log/JobInfoSection";
import RefrigerantInfoSection from "./refrigerant-log/RefrigerantInfoSection";
import StatusMessage from "./refrigerant-log/StatusMessage";
import SubmitButton from "./refrigerant-log/SubmitButton";
import { initialState } from "./refrigerant-log/RefrigerantLogFormFields";
import type { FormState } from "./refrigerant-log/RefrigerantLogFormFields";

function cleanString(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export default function RefrigerantLogPage() {
  const [form, setForm] = useState<FormState>({
    ...initialState,
    companyKey: "urban-mechanical",
  });
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

    const refrigerantType = form.refrigerantType.trim();
    const poundsAdded = form.poundsAdded.trim();
    const poundsRecovered = form.poundsRecovered.trim();
    const state = form.state.trim().toUpperCase();

    if (!refrigerantType) {
      setError("Refrigerant type is required.");
      setLoading(false);
      return;
    }

    if (!poundsAdded && !poundsRecovered) {
      setError("Enter pounds added or pounds recovered.");
      setLoading(false);
      return;
    }

    try {
      const token = getStoredToken();

      const res = await fetch(`${API_BASE}/api/refrigerant-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyKey: "urban-mechanical",
          customerName: cleanString(form.customerName),
          jobNumber: cleanString(form.jobNumber),
          city: cleanString(form.city),
          state: cleanString(state),
          equipmentType: cleanString(form.equipmentType),
          refrigerantType,
          poundsAdded: poundsAdded || null,
          poundsRecovered: poundsRecovered || null,
          leakSuspected: form.leakSuspected,
          notes: cleanString(form.notes),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to submit log.");
        return;
      }

      setMessage("Refrigerant log submitted.");
      setForm({
        ...initialState,
        companyKey: "urban-mechanical",
      });
    } catch {
      setError("Could not reach API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FieldLayout
      kicker="BossOS Field"
      title="New Refrigerant Log"
      subtitle="Enter job details and submit HVAC refrigerant activity from the field."
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <JobInfoSection form={form} update={update} />
        <RefrigerantInfoSection form={form} update={update} />
        <StatusMessage tone="success" message={message} />
        <StatusMessage tone="error" message={error} />
        <SubmitButton loading={loading} />
      </form>
    </FieldLayout>
  );
}
