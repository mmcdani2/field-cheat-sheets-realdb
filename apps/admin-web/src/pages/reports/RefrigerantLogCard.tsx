import { Link } from "react-router-dom";

export type RefrigerantLog = {
  id: string;
  customerName: string | null;
  refrigerantType: string;
  techNameSnapshot: string;
  jobNumber: string | null;
  city: string | null;
  state: string | null;
  poundsAdded: string | number | null;
  poundsRecovered: string | number | null;
};

export default function RefrigerantLogCard({ log }: { log: RefrigerantLog }) {
  return (
    <Link
      to={`/logs/${log.id}`}
      className="block rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl transition hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xl font-black tracking-tight text-white">
            {log.customerName || "No customer name"}
          </div>
          <div className="mt-1 text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">
            {log.refrigerantType}
          </div>
        </div>

        <div className="shrink-0 text-white/35">→</div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-white/65">
        <div>
          <span className="font-semibold text-white/85">Tech:</span> {log.techNameSnapshot}
        </div>
        <div>
          <span className="font-semibold text-white/85">Job:</span> {log.jobNumber || "N/A"}
        </div>
        <div>
          <span className="font-semibold text-white/85">Location:</span> {log.city || "N/A"}
          {log.state ? `, ${log.state}` : ""}
        </div>
        <div>
          <span className="font-semibold text-white/85">Added:</span> {log.poundsAdded ?? "0"}{" "}
          <span className="mx-2 text-white/30">|</span>
          <span className="font-semibold text-white/85">Recovered:</span>{" "}
          {log.poundsRecovered ?? "0"}
        </div>
      </div>
    </Link>
  );
}
