import type { SubDeptMargin } from "../../../../interfaces";

interface WeekOverviewProps {
  dates: string;
  data: SubDeptMargin[];
}

const WeekOverview = ({ dates }: WeekOverviewProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-lg text-sm">
      <div className="bg-blue-500 text-custom-white font-medium px-2 py-0.5 flex items-center justify-between rounded-t-lg">
        <div>Week Overview</div>
        <div>{dates}</div>
      </div>
    </div>
  );
};

export default WeekOverview;
