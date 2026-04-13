import { calculateCogs } from "..";
import type { SubDeptCost, SubDeptMargin } from "../../../interfaces";
import type { ItemRowMobile } from "../display/widgets";

export const formatSubDate = (date: string) => {
  const split = date.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const reduceItemData = (data: SubDeptMargin[]) => {
  return data.reduce((acc: ItemRowMobile[], margin) => {
    const found = acc.find((item) => item.product_code === margin.product_code);
    if (!found) {
      acc.push({
        sub_department_description: margin.sub_department_description,
        product_code: margin.product_code,
        product_description: margin.product_description,
        cogs: calculateCogs(
          margin.net_cost,
          margin.cost,
          margin.case_size,
          margin.qty,
          margin.weight,
        ),
        cost_fees: margin.cost_fees,
        total_sales: margin.total_sales,
        net_sales: margin.net_sales,
        total_tax: margin.total_tax,
        qty: margin.qty,
        margin: 0,
        calculated_cost: margin.calculated_cost,
        cost: margin.cost,
      });
    } else {
      found.cogs += calculateCogs(
        margin.net_cost,
        margin.cost,
        margin.case_size,
        margin.qty,
        margin.weight,
      );
      found.total_sales += margin.total_sales;
      found.net_sales += margin.net_sales;
      found.total_tax += margin.total_tax;
      found.qty += margin.qty;
    }
    return acc;
  }, []);
};

// export const reduceItemData = (data: SubDeptMargin[]) => {
//   return data.reduce((acc: ItemRow[], margin) => {
//     const found = acc.find((item) => item.product_code === margin.product_code);
//     if (!found) {
//       acc.push({
//         sub_department_description: margin.sub_department_description,
//         product_code: margin.product_code,
//         product_description: margin.product_description,
//         cogs: calculateCogs(
//           margin.net_cost,
//           margin.cost,
//           margin.case_size,
//           margin.qty,
//           margin.weight,
//         ),
//         cost_fees: margin.cost_fees,
//         total_sales: margin.total_sales - margin.total_tax,
//         net_sales: margin.net_sales,
//         total_tax: margin.total_tax,
//         qty: margin.qty,
//         margin: 0,
//       });
//     } else {
//       found.cogs += calculateCogs(
//         margin.net_cost,
//         margin.cost,
//         margin.case_size,
//         margin.qty,
//         margin.weight,
//       );
//       found.total_sales += margin.total_sales - margin.total_tax;
//       found.net_sales += margin.net_sales;
//       found.total_tax += margin.total_tax;
//       found.qty += margin.qty;
//     }
//     return acc;
//   }, []);
// };

export const formatDate = (dte: string) => {
  const split = dte.split("T")[0].split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

export const reduceCostData = (data: SubDeptMargin[]) => {
  return data.reduce((acc: SubDeptCost[], curr) => {
    const found = acc.find((item) => item.product_code === curr.product_code);
    if (!found) {
      acc.push({
        date: formatDate(curr.sale_date),
        product_code: curr.product_code,
        description: curr.product_description,
        calculated_cost: curr.calculated_cost,
        cost: curr.cost,
        qty: curr.qty,
        total_cost: calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        ),
      });
    } else {
      found.qty += curr.qty;
      found.total_cost += calculateCogs(
        curr.net_cost,
        curr.cost,
        curr.case_size,
        curr.qty,
        curr.weight,
      );
    }
    return acc;
  }, []);
};
