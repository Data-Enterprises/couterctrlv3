import type { HourlySale } from "../../../../interfaces";

interface SalesViewHourlyProps {
  hourly: HourlySale[];
}

const SalesViewHourly = ({ hourly }: SalesViewHourlyProps) => {
  console.log(hourly);
  return (
    <div>
      <div>Sales View - Hourly</div>
    </div>
  )
};

export default SalesViewHourly;