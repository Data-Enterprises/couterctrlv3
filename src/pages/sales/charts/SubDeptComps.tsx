import { useAppSelector } from "../../../hooks";
import SubDeptPeriodCard from "./SubDeptPeriodCard";

interface Props {
  inReport?: boolean;
}

const SubDeptComps = ({ inReport = false }: Props) => {
  const sales = useAppSelector((state) => state.sales);

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="grid md:grid-cols-3 h-full gap-2">
      <SubDeptPeriodCard
        inReport={inReport}
        data={sales.subSales}
        dateRange={"This Week"}
        period={1}
      />
      <SubDeptPeriodCard
        inReport={inReport}
        data={sales.subSalesWk2}
        dateRange={"Last Week"}
        period={2}
      />
      <SubDeptPeriodCard
        inReport={inReport}
        data={sales.subSalesWk3}
        dateRange={"Last Year"}
        period={3}
      />
    </div>
  );
};

export default SubDeptComps;
