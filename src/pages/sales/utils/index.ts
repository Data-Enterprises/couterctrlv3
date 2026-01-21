import type {
  TopTenItem,
  TopTenData,
  GroupTopTenItem,
  WeeklySale,
  SelectedSalesPanel,
} from "../../../interfaces";

export const barColors = [
  "#00CC55",
  "#10b981",
  "#0099AA",
  "#0066FF",
  "#3366FF",
  "#3b82f6",
  "#6688FF",
  "#FFA500",
  "#FF9900",
  "#CC8844",
];

export const getDateLayout = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
};

export const formatTopTenData = (
  data: TopTenItem[] | GroupTopTenItem[]
): TopTenData[] => {
  return [...data]
    .map((item, idx) => ({
      id: item.product_description,
      label: item.product_code,
      value: item.total_sales || 0,
      fill: barColors[idx % barColors.length],
      color: barColors[idx % barColors.length],
      qty: item.qty || 0,
    }))
    .reverse();
};

export const calculateMetrics = (data: TopTenData[]) => {
  const totalSales = data.reduce((sum, item) => sum + item.value, 0);
  const totalQty = data.reduce((sum, item) => sum + item.qty, 0);
  const avgSales = data.length ? totalSales / data.length : 0;
  const avgQty = data.length ? totalQty / data.length : 0;

  return {
    totalSales,
    avgSales,
    totalQty,
    avgQty,
  };
};

export const rgbaColor = (hex: string, alpha: number) => {
  // if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const comparePanels = (a: WeeklySale, b: SelectedSalesPanel) => {
  const date = a.sale_date.split("T")[0];
  return (
    date === b.sale_date &&
    a.storeid === b.storeid &&
    b.store_name === a.store_name
  );
};
