import type { PieData } from "..";

interface SalesViewWeeklyProps {
  weekly: PieData[];
}

const SalesViewWeekly = ({ weekly }: SalesViewWeeklyProps) => {
  console.log(weekly);

  return (
    <div>
      <div>Sales View - Weekly</div>
    </div>
  )
};

export default SalesViewWeekly;