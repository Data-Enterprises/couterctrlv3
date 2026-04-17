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
      <div className="flex justify-between font-medium px-2">
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
            className="text-[12px] even:bg-blue-200 py-1 px-2 last:rounded-b-lg"
          >
            <div className="flex justify-between font-medium">
              <div>{item.product_code}</div>
              <div>{item.product_description}</div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div>
                <div className="text-content/60">Sales</div>
                <div className="font-medium">
                  {formatCurrency2(item.total_sales)}
                </div>
              </div>
              <div>
                <div className="text-content/60">Qty</div>
                <div className="font-medium">
                  {formatBigNumber(item.qty, 0)}
                </div>
              </div>
              <div>
                <div className="text-content/60">COGS</div>
                <div className="font-medium">{formatCurrency2(item.cost)}</div>
              </div>
              <div>
                <div className="text-content/60">Profit</div>
                <div className="font-medium">
                  {formatCurrency2(item.total_sales - item.cost)}
                </div>
              </div>
              <div>
                <div className="text-content/60">GPM</div>
                <div className="font-medium">
                  {gpm(item.total_sales, item.cost)}
                </div>
              </div>
              <div>
                <div className="text-content/60">RPU</div>
                <div className="font-medium">
                  {formatCurrency2(rpu(item.total_sales, item.qty))}
                </div>
              </div>
              <div>
                <div className="text-content/60">PPU</div>
                <div className="font-medium">
                  {formatCurrency2(ppu(item.total_sales, item.cost, item.qty))}
                </div>
              </div>
              <div>
                <div className="text-content/60">CPU</div>
                <div className="font-medium">
                  {formatCurrency2(cpu(item.cost, item.qty))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesViewTopTen;
