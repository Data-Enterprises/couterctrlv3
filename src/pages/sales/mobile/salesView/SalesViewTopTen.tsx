import type { TopTenItem } from "../../../../interfaces";

interface SalesViewTopTenProps {
  topTen: TopTenItem[];
}
const SalesViewTopTen = ({ topTen }: SalesViewTopTenProps) => {
  console.log(topTen);
  return (
    <div>
      <div>Sales View - Top Ten</div>
    </div>
  );
};

export default SalesViewTopTen;
