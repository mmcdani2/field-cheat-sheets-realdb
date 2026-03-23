import type { Division } from "./types";

type Props = {
  divisions: Division[];
  value: string;
  onChange: (value: string) => void;
};

export default function ReportsDivisionSelect({
  divisions,
  value,
  onChange,
}: Props) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
        Division
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition focus:border-orange-400/60"
      >
        {divisions.map((division) => (
          <option key={division.id} value={division.id}>
            {division.name}
          </option>
        ))}
      </select>
    </div>
  );
}