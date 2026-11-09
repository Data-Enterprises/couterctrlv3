export type MarkdownType = "Price" | "Perc" | "Waste";

export interface MarkdownRequest {
  startDate: string;
  endDate: string;
  searchValue: number;
  useGroups: number;
  page?: number;
  type?: MarkdownType | null;
}

export interface MarkdownItem {
  id: number;
  storeid: number;
  storenumber: string;
  storename: string;
  userid: string;
  order_date: string;
  product_code: string;
  original_price: number | null;
  new_price: number | null;
  markdown: number | null;
  markdown_percent: number | null;
  markdown_id: number | null;
  type: MarkdownType | null;
  qty: number | null;
  weight: number | null;
  retail: number | null;
  description: string | null;
  category: number | null;
  category_description: string | null;
  sub_department: number | null;
  sub_department_description: string | null;
  case_size: number | null;
  vendor_id: string | null;
  vendor_name: string | null;
  last_update_time: string;
  case_cost: number | null;
  scalable: 1 | 0 | null;
}

export interface MarkdownResponse {
  error: number;
  success: boolean;
  msg: string;
  store_count: number;
  total_pages: number;
  total_records: number;
  page: number;
  count: number;
  markdowns: MarkdownItem[];
}

export interface MarkdownFilters {
  types: MarkdownType[] | null;
  storeNumbers: string[];
  dates: string[];
  subIds: number[];
  categories: number[];
  vendorIds: string[];
  search: string;
  minPercent: number | null;
};
