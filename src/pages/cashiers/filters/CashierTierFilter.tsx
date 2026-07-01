import { useCashierCtx } from "..";
import SingleSelect from "../../../components/SingleSelect";
import type { RiskLevel } from "../../../features/cashiersSlice";
import { useCashiersActions } from "../hooks/useCashiersActions";

const tierOptions = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

const CashierTierFilter = () => {
  const ctx = useCashierCtx();
  const actions = useCashiersActions();

  const label =
    ctx.cashierFilterType === "risk_level" ? "Risk Tiers" : "Exception Tiers";

  const handleSelect = (x: string | number) => {
    if (ctx.cashierFilterType === "risk_level") {
      ctx.dispatch(actions.setRiskLevelFilter(x.toString() as RiskLevel));
    } else if (ctx.cashierFilterType === "exception_tier") {
      ctx.dispatch(actions.setExceptionTierFilter(x.toString() as RiskLevel));
    }
  };

  return (
    <div>
      <SingleSelect
        label={label}
        data={tierOptions}
        displayKey="label"
        valueKey="value"
        onSelect={handleSelect}
        resetQuery={true}
        defaultQuery={
          ctx.cashierFilterType === "risk_level"
            ? ctx.riskLevelFilter
            : ctx.exceptionTierFilter
        }
      />
    </div>
  );
};

export default CashierTierFilter;
