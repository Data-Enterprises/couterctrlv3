// Utils
import { CASHIERS_PHONE_HELP } from "./cashiers";
import { CATEGORIES_PHONE_HELP } from "./categories";
import { COUPON_SALES_PHONE_HELP } from "./couponSales";
import { COUPONS_PHONE_HELP } from "./coupons";
import { ITEM_LOOKUP_PHONE_HELP } from "./itemLookup";
import { LOSS_PREVENTION_PHONE_HELP } from "./lossPrevention";
import { ORDERS_PHONE_HELP } from "./orders";
import { RECEIVERS_PHONE_HELP } from "./receivers";
import { SALES_PHONE_HELP } from "./sales";
import { STORE_GROUPS_PHONE_HELP } from "./storeGroups";
import { SUB_DEPT_MARGINS_PHONE_HELP } from "./subDeptMargins";
import { VENDORS_PHONE_HELP } from "./vendors";

// Interfaces
import type { HelpPage } from "../../../constants/helpPages";
import type { PhoneHelp } from "../helpTypes";

/**
 * Every phone screen's help, by the name its "?" passes.
 *
 * These were the `-mobile` documents in the help bucket, shown in an iframe.
 * They are data now, in the repo and shipped with the build, the same as the
 * desktop help in `../content` — so they change with the screen they describe
 * instead of waiting on an upload.
 *
 * `Partial` because only the screens that exist on a phone have one: the nav
 * marks the rest `mobile: false`, and a phone never reaches them. A page left
 * out here falls back to its desktop help rather than to nothing.
 *
 * Written from the DEV tree, which is the tree these screens run in.
 */
export const PHONE_HELP: Partial<Record<HelpPage, PhoneHelp>> = {
  cashiers: CASHIERS_PHONE_HELP,
  categories: CATEGORIES_PHONE_HELP,
  "coupon-sales": COUPON_SALES_PHONE_HELP,
  coupons: COUPONS_PHONE_HELP,
  "item-lookup": ITEM_LOOKUP_PHONE_HELP,
  "loss-prevention": LOSS_PREVENTION_PHONE_HELP,
  orders: ORDERS_PHONE_HELP,
  receivers: RECEIVERS_PHONE_HELP,
  sales: SALES_PHONE_HELP,
  "store-groups": STORE_GROUPS_PHONE_HELP,
  "sub-dept-margins": SUB_DEPT_MARGINS_PHONE_HELP,
  vendors: VENDORS_PHONE_HELP,
};

export const phoneHelpFor = (page: HelpPage): PhoneHelp | undefined =>
  PHONE_HELP[page];
