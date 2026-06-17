import { useState, useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

type DeptRow = {
  id: number;
  desc: string;
  tw: number;
  ly: number;
  hasLY: boolean;
  vsLYPct: number;
  qty: number;
  lyQty: number;
  digital: number;
  lyDigital: number;
  elecInstore: number;
  lyElecInstore: number;
  elecStore: number;
  lyElecStore: number;
  storeCpn: number;
  lyStoreCpn: number;
};

const TableRow = ({
  label,
  tw,
  ly,
  fmt = formatCurrency2,
}: {
  label: string;
  tw: number;
  ly: number;
  fmt?: (v: number) => string;
}) => {
  const diff = ly > 0 ? ((tw - ly) / ly) * 100 : null;
  return (
    <div className="grid grid-cols-[1fr_80px_80px_56px] items-center py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-content/60">{label}</span>
      <span className="text-[11px] font-medium text-content text-right">{fmt(tw)}</span>
      <span className="text-[11px] text-content/50 text-right">{ly > 0 ? fmt(ly) : "—"}</span>
      <span className={`text-[11px] font-medium text-right ${diff === null ? "text-content/30" : diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
        {diff !== null ? formatPct(diff) : "—"}
      </span>
    </div>
  );
};

const PopupSubDeptList = () => {
  const { subSales, subSalesWk3 } = useAppSelector((state) => state.sales);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rows = useMemo((): DeptRow[] => {
    const lyMap = subSalesWk3.reduce(
      (acc: Record<number, {
        net: number; qty: number; digital: number;
        elecInstore: number; elecStore: number; storeCpn: number;
      }>, s) => {
        if (!acc[s.sub_department]) acc[s.sub_department] = { net: 0, qty: 0, digital: 0, elecInstore: 0, elecStore: 0, storeCpn: 0 };
        acc[s.sub_department].net += s.total_sales - s.total_tax;
        acc[s.sub_department].qty += s.qty;
        acc[s.sub_department].digital += s.digital_coupons;
        acc[s.sub_department].elecInstore += s.elec_instore_coupons;
        acc[s.sub_department].elecStore += s.elec_store_coupons;
        acc[s.sub_department].storeCpn += s.store_coupon;
        return acc;
      },
      {},
    );

    const twMap = subSales.reduce(
      (acc: Record<number, {
        desc: string; net: number; qty: number; digital: number;
        elecInstore: number; elecStore: number; storeCpn: number;
      }>, s) => {
        if (!acc[s.sub_department]) {
          acc[s.sub_department] = { desc: s.sub_department_description, net: 0, qty: 0, digital: 0, elecInstore: 0, elecStore: 0, storeCpn: 0 };
        }
        acc[s.sub_department].net += s.total_sales - s.total_tax;
        acc[s.sub_department].qty += s.qty;
        acc[s.sub_department].digital += s.digital_coupons;
        acc[s.sub_department].elecInstore += s.elec_instore_coupons;
        acc[s.sub_department].elecStore += s.elec_store_coupons;
        acc[s.sub_department].storeCpn += s.store_coupon;
        return acc;
      },
      {},
    );

    return Object.entries(twMap)
      .map(([id, r]) => {
        const ly = lyMap[Number(id)];
        const lyNet = ly?.net ?? 0;
        return {
          id: Number(id),
          desc: r.desc,
          tw: r.net,
          ly: lyNet,
          hasLY: lyNet > 0,
          vsLYPct: lyNet ? ((r.net - lyNet) / lyNet) * 100 : 0,
          qty: r.qty,
          lyQty: ly?.qty ?? 0,
          digital: r.digital,
          lyDigital: ly?.digital ?? 0,
          elecInstore: r.elecInstore,
          lyElecInstore: ly?.elecInstore ?? 0,
          elecStore: r.elecStore,
          lyElecStore: ly?.elecStore ?? 0,
          storeCpn: r.storeCpn,
          lyStoreCpn: ly?.storeCpn ?? 0,
        };
      })
      .sort((a, b) => a.vsLYPct - b.vsLYPct);
  }, [subSales, subSalesWk3]);

  const negRows = rows.filter((r) => r.vsLYPct < 0);
  const posRows = rows.filter((r) => r.vsLYPct >= 0);
  const twTotal = rows.reduce((acc, r) => acc + r.tw, 0);
  const selected = selectedId !== null ? rows.find((r) => r.id === selectedId) : null;

  const fmt0 = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fmtCpn = (v: number) => formatCurrency2(v);

  if (!rows.length) {
    return (
      <div className="flex items-center justify-center h-32 text-content/30 text-sm">
        No sub department data
      </div>
    );
  }

  const Card = ({ id, desc, tw, ly, hasLY, vsLYPct, isNeg }: DeptRow & { isNeg: boolean }) => {
    const isSelected = selectedId === id;
    return (
      <button
        onClick={() => setSelectedId(isSelected ? null : id)}
        className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-left w-full transition-colors border ${
          isSelected
            ? "bg-[#1e2a4a] border-[#1e2a4a]"
            : isNeg
            ? "bg-red-50 border-red-100 hover:border-red-300"
            : "bg-gray-50 border-gray-100 hover:border-gray-300"
        }`}
      >
        <span className={`text-[11px] font-medium truncate flex-1 min-w-0 mr-2 ${
          isSelected ? "text-white" : isNeg ? "text-red-900" : "text-content/75"
        }`}>
          {desc}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-right">
            <div className={`text-[11px] font-medium ${isSelected ? "text-white" : isNeg ? "text-red-800" : "text-content/80"}`}>
              {formatCurrency2(tw)}
            </div>
            {hasLY && (
              <div className={`text-[10px] ${isSelected ? "text-white/60" : isNeg ? "text-red-400" : "text-content/50"}`}>
                {formatCurrency2(ly)} LY
              </div>
            )}
          </div>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full text-center w-[46px] flex-shrink-0 ${
            isSelected
              ? "bg-white/20 text-white"
              : isNeg
              ? "bg-red-200 text-red-800"
              : "bg-gray-200 text-content/70"
          }`}>
            {formatPct(vsLYPct)}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-2 gap-1 p-2 overflow-y-auto thin-scrollbar max-h-[300px]">
        {negRows.map((r) => <Card key={r.id} {...r} isNeg={true} />)}
        {negRows.length > 0 && posRows.length > 0 && (
          <div className="col-span-2 h-px bg-gray-100 my-0.5" />
        )}
        {posRows.map((r) => <Card key={r.id} {...r} isNeg={false} />)}
      </div>

      {/* Dept drill-down panel */}
      {selected && (
        <div className="mx-2 mb-2 rounded-lg border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_56px] items-center px-3 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-[11px] font-medium text-content truncate">{selected.desc}</span>
            <span className="text-[10px] font-medium text-content/50 text-right uppercase tracking-wide">TY</span>
            <span className="text-[10px] font-medium text-content/50 text-right uppercase tracking-wide">LY</span>
            <div className="flex items-center justify-end gap-1">
              <span className="text-[10px] font-medium text-content/50 uppercase tracking-wide">vs LY</span>
              <button onClick={() => setSelectedId(null)} className="text-content/30 hover:text-content/60 leading-none ml-1">✕</button>
            </div>
          </div>
          <div className="px-3">
            <TableRow label="Net sales" tw={selected.tw} ly={selected.ly} fmt={formatCurrency2} />
            <TableRow label="Qty" tw={selected.qty} ly={selected.lyQty} fmt={fmt0} />
            <div className="py-1.5 border-b border-gray-100">
              <span className="text-[10px] font-medium text-content/40 uppercase tracking-wide">Coupons</span>
            </div>
            <TableRow label="Digital" tw={selected.digital} ly={selected.lyDigital} fmt={fmtCpn} />
            <TableRow label="Elec in-store" tw={selected.elecInstore} ly={selected.lyElecInstore} fmt={fmtCpn} />
            <TableRow label="Elec store" tw={selected.elecStore} ly={selected.lyElecStore} fmt={fmtCpn} />
            <TableRow label="Store coupon" tw={selected.storeCpn} ly={selected.lyStoreCpn} fmt={fmtCpn} />
          </div>
        </div>
      )}

      <div className="px-3 py-2.5 border-t border-gray-200 flex justify-between items-center">
        {negRows.length > 0 ? (
          <span className="text-[11px] font-medium text-red-600">
            {negRows.length} dept{negRows.length > 1 ? "s" : ""} below LY
          </span>
        ) : (
          <span className="text-[11px] font-medium text-emerald-600">All depts above LY</span>
        )}
        <span className="text-[11px] font-medium text-content/70">Net: {formatCurrency2(twTotal)}</span>
      </div>
    </div>
  );
};

export default PopupSubDeptList;
