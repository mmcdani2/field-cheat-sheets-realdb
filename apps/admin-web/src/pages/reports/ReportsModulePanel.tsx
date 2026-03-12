type Props = {
  divisionName: string;
  isHvac: boolean;
  isSprayFoam: boolean;
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]",
        active
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-white/10 text-white/50",
      ].join(" ")}
    >
      {active ? "Active" : "Not Live Yet"}
    </span>
  );
}

export default function ReportsModulePanel({
  divisionName,
  isHvac,
  isSprayFoam,
}: Props) {
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
        <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
          Active Division
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
          {divisionName}
        </h2>
        <p className="mt-2 text-sm text-white/65 sm:text-base">
          {isHvac
            ? "HVAC reporting is live now and starts with refrigerant activity."
            : "Spray Foam is staged for division-based reporting and module rollout next."}
        </p>
      </div>

      {isHvac ? (
        <>
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Report Module
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              Refrigerant Logs
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
              Review technician refrigerant activity, inspect individual submissions, and verify field reporting.
            </p>
            <div className="mt-4">
              <StatusBadge active />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Active View
            </div>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
              Refrigerant Log Records
            </h3>
            <p className="mt-2 text-sm text-white/65 sm:text-base">
              This is the first live HVAC report module in BossOS.
            </p>
          </div>
        </>
      ) : null}

      {isSprayFoam ? (
        <>
          <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
            <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
              Report Module
            </div>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
              Spray Foam Job Logs
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
              Division-specific spray foam reporting will land here once the first module is live.
            </p>
            <div className="mt-4">
              <StatusBadge active={false} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 text-white/65 shadow-2xl">
            No Spray Foam report modules are active yet.
          </div>
        </>
      ) : null}
    </div>
  );
}
