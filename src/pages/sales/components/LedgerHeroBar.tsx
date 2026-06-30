import { formatCurrency2 } from "../../../utils";

interface LedgerHeroBarProps {
  weekLabel: string;
  twTotal: number;
  vsLYPct: number;
  attentionCount: number;
  totalTransactions: number;
  lyTransactions: number;
  avgBasket: number;
  lyAvgBasket: number;
  onReset: () => void;
}

const formatPct = (pct: number) => {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
};

const LedgerHeroBar = ({
  weekLabel,
  twTotal,
  vsLYPct,
  attentionCount,
  totalTransactions,
  lyTransactions,
  avgBasket,
  lyAvgBasket,
  onReset,
}: LedgerHeroBarProps) => {
  const transDeltaLY = lyTransactions > 0
    ? ((totalTransactions - lyTransactions) / lyTransactions) * 100
    : 0;
  const basketDeltaLY = lyAvgBasket > 0
    ? ((avgBasket - lyAvgBasket) / lyAvgBasket) * 100
    : 0;
  return (
    <div className="bg-[#1e2a4a] rounded-xl p-4 mb-4 text-white">
      <div className="flex justify-between items-start mb-0.5">
        <p className="text-[10px] uppercase tracking-widest opacity-60">
          Weekly Performance Ledger
        </p>
        <button
          onClick={onReset}
          className="text-[10px] opacity-40 hover:opacity-80 transition-opacity underline underline-offset-2"
        >
          Change search
        </button>
      </div>
      <p className="text-[11px] opacity-50 mb-3">
        {weekLabel} · All assigned stores · Ranked by vs LY delta
      </p>
      <div className="flex gap-8">
        <div>
          <p className="text-xl font-semibold">{formatCurrency2(twTotal)}</p>
          <p className="text-[11px] opacity-60 mt-0.5">Total net sales</p>
          <p className={`text-xs font-medium mt-0.5 ${vsLYPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatPct(vsLYPct)} vs LY
          </p>
        </div>
        {totalTransactions > 0 && (
          <div>
            <p className="text-xl font-semibold">{totalTransactions.toLocaleString()}</p>
            <p className="text-[11px] opacity-60 mt-0.5">Total transactions</p>
            {lyTransactions > 0 && (
              <p className={`text-xs font-medium mt-0.5 ${transDeltaLY >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPct(transDeltaLY)} vs LY
              </p>
            )}
          </div>
        )}
        {avgBasket > 0 && (
          <div>
            <p className="text-xl font-semibold">{formatCurrency2(avgBasket)}</p>
            <p className="text-[11px] opacity-60 mt-0.5">Avg basket</p>
            {lyAvgBasket > 0 && (
              <p className={`text-xs font-medium mt-0.5 ${basketDeltaLY >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatPct(basketDeltaLY)} vs LY
              </p>
            )}
          </div>
        )}
        {attentionCount > 0 && (
          <div>
            <p className="text-xl font-semibold">{attentionCount}</p>
            <p className="text-[11px] opacity-60 mt-0.5">
              {attentionCount === 1 ? "store" : "stores"} need attention
            </p>
            <p className="text-xs text-red-400 font-medium mt-0.5">Below last year</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerHeroBar;
