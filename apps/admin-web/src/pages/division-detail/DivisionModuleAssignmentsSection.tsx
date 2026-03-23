import type { Division, DivisionModuleRow } from "./types";

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

type Props = {
  division: Division;
  modules: DivisionModuleRow[];
  enabledModuleCount: number;
  disabledModuleCount: number;
  savingId: string;
  onToggle: (row: DivisionModuleRow) => Promise<void>;
};

export default function DivisionModuleAssignmentsSection({
  division,
  modules,
  enabledModuleCount,
  disabledModuleCount,
  savingId,
  onToggle,
}: Props) {
  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
        <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
          Module Access
        </div>
        <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
          {division.name} modules
        </h3>
        <p className="mt-2 text-sm text-white/65 sm:text-base">
          Manage active and inactive modules for this division.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 shadow-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            Total
          </div>
          <div className="mt-2 text-base font-semibold text-white">
            {modules.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 shadow-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            Active
          </div>
          <div className="mt-2 text-base font-semibold text-emerald-300">
            {enabledModuleCount}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 shadow-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            Inactive
          </div>
          <div className="mt-2 text-base font-semibold text-white">
            {disabledModuleCount}
          </div>
        </div>
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
              onToggle={onToggle}
              savingId={savingId}
            />
          ))
        )}
      </div>
    </>
  );
}