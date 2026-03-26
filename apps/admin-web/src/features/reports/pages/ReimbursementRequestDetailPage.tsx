import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AdminShellLayout from "../../../shell/AdminShellLayout";
import { API_BASE, getStoredToken } from "../../../shared/api/auth-storage";

type ReimbursementRequestDetail = {
  id: string;
  userId: string;
  companyKey: string;
  divisionKey: string | null;
  techNameSnapshot: string;
  amountSpent: string;
  purchaseDate: string;
  vendor: string;
  category: string;
  paymentMethod: string;
  purpose: string;
  tiedToJob: boolean;
  jobNumber: string | null;
  notes: string | null;
  receiptUploaded: boolean;
  urgentReimbursementNeeded: boolean;
  status: string;
  reimbursementDate: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

function formatCurrency(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : value;
}

function statusTone(status: string) {
  switch (status) {
    case "approved":
      return "bg-blue-500/15 text-blue-300";
    case "denied":
      return "bg-red-500/15 text-red-300";
    case "reimbursed":
      return "bg-emerald-500/15 text-emerald-300";
    default:
      return "bg-white/10 text-white/60";
  }
}

export default function ReimbursementRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<ReimbursementRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadRequest() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const token = getStoredToken();
        const res = await fetch(`${API_BASE}/api/reimbursement-requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Failed to load reimbursement request.");
          return;
        }

        setRequest(data.request ?? null);
      } catch {
        setError("Could not reach API.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      void loadRequest();
    }
  }, [id]);

  async function updateStatus(status: string) {
    if (!request) return;

    try {
      setSavingStatus(status);
      setError("");
      setMessage("");

      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/api/reimbursement-requests/${request.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to update reimbursement status.");
        return;
      }

      setRequest(data.request ?? null);
      setMessage(`Status updated to ${status}.`);
    } catch {
      setError("Could not reach API.");
    } finally {
      setSavingStatus("");
    }
  }

  return (
    <AdminShellLayout
      title="Reimbursement Request Detail"
      subtitle="Review the submission and update its processing status."
    >
      <div className="grid gap-6">
        <div>
          <Link
            to="/logs"
            className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            Back to Reports
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/70 shadow-2xl">
            Loading reimbursement request...
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

        {!loading && !error && request ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                    Submission
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    {request.techNameSnapshot}
                  </h2>
                  <p className="mt-2 text-sm text-white/65 sm:text-base">
                    {request.vendor}  {request.purchaseDate}
                  </p>
                </div>

                <div
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
                    statusTone(request.status),
                  ].join(" ")}
                >
                  {request.status}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Amount
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {formatCurrency(request.amountSpent)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Division
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {request.divisionKey || "N/A"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Category
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {request.category}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Payment Method
                  </div>
                  <div className="mt-1 text-base font-semibold text-white">
                    {request.paymentMethod}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Request Details
              </div>

              <div className="mt-4 grid gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    What Was It For?
                  </div>
                  <div className="mt-1 text-base text-white">
                    {request.purpose}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      Tied to Job
                    </div>
                    <div className="mt-1 text-base text-white">
                      {request.tiedToJob ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      Job Number
                    </div>
                    <div className="mt-1 text-base text-white">
                      {request.jobNumber || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      Receipt Uploaded
                    </div>
                    <div className="mt-1 text-base text-white">
                      {request.receiptUploaded ? "Yes" : "No"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                      Urgent Reimbursement Needed
                    </div>
                    <div className="mt-1 text-base text-white">
                      {request.urgentReimbursementNeeded ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Additional Notes
                  </div>
                  <div className="mt-1 text-base text-white">
                    {request.notes || "None"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
              <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
                Workflow
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => updateStatus("approved")}
                  disabled={savingStatus.length > 0}
                  className="h-12 rounded-2xl bg-blue-500/80 px-4 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingStatus === "approved" ? "Saving..." : "Approve"}
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus("denied")}
                  disabled={savingStatus.length > 0}
                  className="h-12 rounded-2xl bg-red-500/80 px-4 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingStatus === "denied" ? "Saving..." : "Deny"}
                </button>

                <button
                  type="button"
                  onClick={() => updateStatus("reimbursed")}
                  disabled={savingStatus.length > 0}
                  className="h-12 rounded-2xl bg-emerald-500/80 px-4 text-sm font-black text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingStatus === "reimbursed" ? "Saving..." : "Mark Reimbursed"}
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Reviewed At
                  </div>
                  <div className="mt-1 text-base text-white">
                    {request.reviewedAt || "Not reviewed"}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Reimbursement Date
                  </div>
                  <div className="mt-1 text-base text-white">
                    {request.reimbursementDate || "Not reimbursed"}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminShellLayout>
  );
}



