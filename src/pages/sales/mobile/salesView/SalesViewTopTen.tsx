import { cpu, gpm, ppu, rpu } from "../../../../functions";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import { useMobileSalesCtx } from "../hooks";

interface SalesViewTopTenProps {
  displayName: string;
}

const SalesViewTopTen = ({ displayName }: SalesViewTopTenProps) => {
  const ctx = useMobileSalesCtx();

  return (
    <div className="bg-custom-white rounded-lg shadow-md pt-0.5">
      <div className="flex justify-between font-medium px-2 text-[11px]">
        <div>Top Ten Items</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1 px-2">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div>
        {ctx.salesViewTopTen.map((item, i) => (
          <div
            key={i}
            className="text-[10px] border-t even:bg-content/10 border-content/10 px-2 grid grid-cols-4 py-0.5 first:border-t-0 last:rounded-b-lg"
          >
            <div className="col-span-4 flex justify-between font-medium">
              <div className="min-w-0">
                {/* <div className="text-[9px] text-content/60">UPC</div> */}
                <div className="truncate">UPC: {item.product_code}</div>
              </div>

              <div className="min-w-0">
                {/* <div className="text-[9px] text-content/60">Desc</div> */}
                <div className="truncate">{item.product_description}</div>
              </div>
            </div>

            <div>
              <div className="text-[9px] text-content/85">Sales</div>
              <div className="font-medium">
                {formatCurrency2(item.total_sales)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-content/85">Qty</div>
              <div className="font-medium">{formatBigNumber(item.qty, 0)}</div>
            </div>

            {/* Column 2 */}
            <div>
              <div className="text-[9px] text-content/85">COGS</div>
              <div className="font-medium">{formatCurrency2(item.cost)}</div>
            </div>
            <div>
              <div className="text-[9px] text-content/85">Profit</div>
              <div className="font-medium">
                {formatCurrency2(item.total_sales - item.cost)}
              </div>
            </div>

            {/* 3rd row: 2x4 grid (GPM / RPU / PPU / CPU) */}
            <div>
              <div className="text-[9px] text-content/85">GPM</div>
              <div className="font-medium">
                {gpm(item.total_sales, item.cost)}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-content/85">RPU</div>
              <div className="font-medium">
                {formatCurrency2(rpu(item.total_sales, item.qty))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-content/85">PPU</div>
              <div className="font-medium">
                {formatCurrency2(ppu(item.total_sales, item.cost, item.qty))}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-content/85">CPU</div>
              <div className="font-medium">
                {formatCurrency2(cpu(item.cost, item.qty))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesViewTopTen;
