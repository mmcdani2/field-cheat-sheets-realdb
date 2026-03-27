type Props = {
  loading: boolean;
  saving: boolean;
  laborRateInput: string;
  pricingTiersInput: string;
  onChangeLaborRate: (value: string) => void;
  onChangePricingTiers: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onReset: () => void;
};

export default function QuickEstimateSettingsSection({
  loading,
  saving,
  laborRateInput,
  pricingTiersInput,
  onChangeLaborRate,
  onChangePricingTiers,
  onSubmit,
  onReset,
}: Props) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl"
    >
      <div className="text-[12px] font-bold uppercase tracking-[0.24em] text-orange-400">
        Division Settings
      </div>
      <h3 className="mt-3 text-2xl font-black tracking-tight text-white">
        HVAC pricing defaults
      </h3>
      <p className="mt-2 text-sm text-white/65 sm:text-base">
        Set default labor rate and pricing tiers for division-level field pricing tools.
      </p>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white/70">
          Loading division settings..
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Labor Rate Per Hour
            </label>
            <input
              value={laborRateInput}
              onChange={(e) => onChangeLaborRate(e.target.value)}
              inputMode="decimal"
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
              placeholder="40"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Pricing Tiers (%)
            </label>
            <input
              value={pricingTiersInput}
              onChange={(e) => onChangePricingTiers(e.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 text-base text-white outline-none transition placeholder:text-white/30 focus:border-orange-400/60"
              placeholder="35, 40, 50"
            />
            <p className="text-sm text-white/45">
              Enter comma-separated margin percentages like 35, 40, 50
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="submit"
              disabled={saving || loading}
              className="h-14 rounded-2xl bg-[#fbbf24] px-5 text-base font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Division Settings"}
            </button>

            <button
              type="button"
              onClick={onReset}
              className="h-14 rounded-2xl border border-white/10 bg-white/5 px-5 text-base font-black text-white transition hover:bg-white/10"
            >
              Reset Form to Defaults
            </button>
          </div>
        </div>
      )}
    </form>
  );
}