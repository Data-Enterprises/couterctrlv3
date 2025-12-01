import type { WeekDay } from ".";

interface WeekCardProps {
  week: string;
  sales: WeekDay;
}

const WeekCard = ({ week, sales }: WeekCardProps) => {
  console.log(week, sales)
  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      <div></div>
    </div>
  )
};

export default WeekCard;