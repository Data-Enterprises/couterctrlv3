// These functions are for calculating metrics based on data provided from any endpoint that returns the required parameters

/**
 * @name GPM
 * @description Calculates the Gross Profit Margin based on revenue and cost of goods sold
 * @param rev revenue aka total sales
 * @param cogs cost of goods sold
 *
 * @returns Gross Profit Margin => string percentage value e.g. '45.32%'
 */
export const gpm = (rev: number, cogs: number) => {
  if (!rev) return "0%";
  const margin = ((rev - cogs) / rev) * 100;
  return `${margin.toFixed(2)}%`;
};

/**
 * @name RPU
 * @description Calculates the Revenue Per Unit based on revenue and units sold
 * @param rev revenue aka total sales
 * @param units units sold aka quantity sold
 *
 * @returns number Revenue Per Unit
 */
export const rpu = (rev: number, units: number) => {
  if (!rev) return 0;
  return rev / units;
};

/**
 * @name PPU
 * @description Calculates the Profit Per Unit based on revenue, cost, and units sold
 * @param rev
 * @param cost
 * @param units
 * @returns number Profit Per Unit
 */
export const ppu = (rev: number, cost: number, units: number) => {
  if (!rev) return 0;
  // profit / units
  return (rev - cost) / units;
};

export const cpu = (cost: number, units: number) => {
  return cost / units;
};

/**
 * @name dateRange
 * @description Calculates the number of days between two dates, inclusive
 * @param startDate
 * @param endDate
 * @returns date range => number
 */
export const dateRange = (startDate: string, endDate: string) => {
  const range = new Date(endDate).getTime() - new Date(startDate).getTime();
  return range / (1000 * 60 * 60 * 24) + 1;
};

/**
 * @name velocity
 * @description Calculates the velocity (average per day) of revenue or quantity over a date range
 * @param data revenue or quantity
 * @param sd start date string
 * @param ed end date string
 * @returns velocity => number
 */
export const velocity = (data: number, sd: string, ed: string) => {
  if (data === 0) return 0;
  const days = dateRange(sd, ed);
  return data / days;
};

export type TrendData = {
  total_sales: number;
  cost: number;
  sale_date: string;
}[];

export type MarginTrend = {
  points: { x: string; y: number }[];
  gpms: number[];
  avg: number;
};
/**
 * @name marginTrend
 * @description Calculates the margin trend points and average margin percentage over a set of TrendData
 * @param data TrendData that contains total sales and cost of goods for a single date
 * @returns Gross Profit Margin Trend Data
 */
export const marginTrend = (data: TrendData): MarginTrend => {
  const chartPoints = data.map((d) => ({
    x: d.sale_date,
    y: parseFloat(gpm(d.total_sales, d.cost).replace("%", "")),
  }));

  const gpms = data.map((d) =>
    parseFloat(gpm(d.total_sales, d.cost).replace("%", "")),
  );

  const avg = gpms.reduce((acc, val) => acc + val, 0) / gpms.length;

  return {
    points: chartPoints,
    gpms,
    avg,
  };
};

/**
 * @name atv
 * @description Calculates the Average Transaction Value based on revenue and number of transactions
 * @param rev revenue aka total sales
 * @param transactions number of transactions
 * @returns Average Transaction Value => number
 */
export const atv = (rev: number, transactions: number) => {
  return transactions === 0 ? 0 : rev / transactions;
};

/**
 * @name crr
 * @description Calculates the Coupon Redemption Rate based on number of coupons and total units sold
 * @param coupons array of total coupons redeemed => number[]
 * @param units total units aka quantity sold => number
 * @returns Coupon Redemption Rate => string percentage value e.g. '12.34%'
 */
export const crr = (coupons: number[], units: number) => {
  const totalCoupons = coupons.reduce((acc, val) => acc + val, 0);
  if (units === 0) return "0%";

  const rate = (totalCoupons / units) * 100;
  return `${rate.toFixed(2)}%`;
};

/**
 * @name couponSalePct
 * @description Calculates the Coupon Sales Percentage based on total value of coupons and total sales
 * @param coupons array of amount of coupons => number[]
 * @param net net sales => number
 * @returns Coupon Redemption Rate => string percentage value e.g. '12.34%'
 */
export const couponSalePct = (coupons: number[], net: number) => {
  const couponSales = coupons.reduce((acc, val) => acc + val, 0);
  return ((couponSales / net) * 100).toFixed(2) + "%";
};

/**
 * @name netSalesPct
 * @description Calculates the Net Sales Percentage based on net sales and revenue
 * @summary Shows how much revenueis leaked through discounts =>
 *          > 95% is good
 *          < 90% is bad
 *          Dropping % signals over-discounting/promotions and wil help management adjust
 *          pricing/promo strategies before profits are impacted too severely
 * @param net net sales => number
 * @param rev revenue aka total sales => number
 * @returns Net Sales Percent => string
 */
export const netSalesPct = (net: number, rev: number) => {
  const pct = (net / rev) * 100;
  return `${pct.toFixed(2)}%`;
};

/**
 * @name promoLeakage
 * @description Calculates the Promo Leakage percentage based on net sales and revenue
 * @summary Shows how much sales are being lost to promotions/discounts
 *          Higher % means more leakage => management can use this to adjust promo strategies
 *          <1% great: Elite control—promos drive volume without hurting margins
 *          <2% acceptable: Room to promote while staying profitable
 *          >2% problematic: Signals promo dependency risk, even if net sales % still looks "good" => hurts margins
 * @param net net sales => number
 * @param rev revenue aka total sales => number
 * @returns Net Sales Percent => string
 */
export const promoLeakage = (net: number, rev: number) => {
  const pct = ((rev - net) / rev) * 100;
  return `${pct.toFixed(2)}%`;
};
