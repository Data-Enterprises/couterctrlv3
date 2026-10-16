import type { HelpPage } from "../../../constants/helpPages";
import type { HelpContent } from "../helpTypes";
import { ADMIN_HELP } from "./admin";
import { CASHIERS_HELP } from "./cashiers";
import { CATEGORIES_HELP } from "./categories";
import { COUPON_SALES_HELP } from "./couponSales";
import { COUPONS_HELP } from "./coupons";
import { FORECASTING_HELP } from "./forecasting";
import { ITEM_LOOKUP_HELP } from "./itemLookup";
import { LOSS_PREVENTION_HELP } from "./lossPrevention";
import { ORDERS_HELP } from "./orders";
import { RECEIVERS_HELP } from "./receivers";
import { SALES_HELP } from "./sales";
import { SALES_EXPORT_HELP } from "./salesExport";
import { STORE_GROUPS_HELP } from "./storeGroups";
import { SUB_DEPT_MARGINS_HELP } from "./subDeptMargins";
import { UPC_LIST_HELP } from "./upcList";
import { USER_MANAGEMENT_HELP } from "./userManagement";
import { VENDORS_HELP } from "./vendors";

/**
 * Every screen's help, by the name its "?" passes.
 *
 * `Record` rather than `Partial<Record>` on purpose now that all of them are
 * written: a page added to `HELP_PAGES` without content is a compile error
 * here, which is the only moment anybody would notice before a user does.
 *
 * Each file is written from the screen it describes and from that screen's
 * own previous help, which was reviewed. Every chip is a label as the control
 * carries it, and the content follows the DEV tree — which is the tree this
 * panel runs in, and which has moved ahead of prod on some screens.
 */
export const HELP_CONTENT: Record<HelpPage, HelpContent> = {
  admin: ADMIN_HELP,
  cashiers: CASHIERS_HELP,
  categories: CATEGORIES_HELP,
  "coupon-sales": COUPON_SALES_HELP,
  coupons: COUPONS_HELP,
  forecasting: FORECASTING_HELP,
  "item-lookup": ITEM_LOOKUP_HELP,
  "loss-prevention": LOSS_PREVENTION_HELP,
  orders: ORDERS_HELP,
  receivers: RECEIVERS_HELP,
  sales: SALES_HELP,
  "sales-export": SALES_EXPORT_HELP,
  "store-groups": STORE_GROUPS_HELP,
  "sub-dept-margins": SUB_DEPT_MARGINS_HELP,
  "upc-list": UPC_LIST_HELP,
  "user-management": USER_MANAGEMENT_HELP,
  vendors: VENDORS_HELP,
};

export const helpContentFor = (page: HelpPage): HelpContent | undefined =>
  HELP_CONTENT[page];
