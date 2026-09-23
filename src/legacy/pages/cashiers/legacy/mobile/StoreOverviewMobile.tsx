import type { StoreCard } from "../../../../interfaces";

interface StoreCardProps {
  store: StoreCard;
}

const StoreOverviewMobile = ({ store }: StoreCardProps) => {

  return (
    <div className="text-[13px] bg-custom-white rounded-lg shadow-md p-2">
      <div>{store.store_name}</div>
    </div>
  )
};

export default StoreOverviewMobile;
