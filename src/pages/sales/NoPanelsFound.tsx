import { WarningIcon } from "../../components/toasts/Icons";
import { useAppSelector } from "../../hooks";
import { addDays } from "../../utils";

const NoPanelsFound = () => {
  const { singleDate, endDate, lastStore, lastGroup, type } = useAppSelector(
    (state) => state.search,
  );
  const { dashboardOption } = useAppSelector((state) => state.sales);
  const { assignedStores } = useAppSelector((state) => state.user);
  const { groups } = useAppSelector((state) => state.group);

  const start = addDays(new Date(singleDate), -6).toISOString().split("T")[0];
  const formatDate = (dateStr: string) => {
    const split = dateStr.split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };
  const dateStr =
    dashboardOption === "daily"
      ? singleDate
      : `${formatDate(start)} to ${endDate}`;

  const renderGroupOrStore = () => {
    if (type === "Store") {
      const store = assignedStores.find((s) => s.storeid === lastStore);
      return "Store: " + (store ? store.store_name : "the selected store");
    } else {
      const group = groups.find((g) => g.id === lastGroup);
      return "Group: " + (group ? group.group_name : "the selected group");
    }
  };
  return (
    <div className="bg-custom-white py-4 px-12 flex flex-col items-center justify-center rounded-lg shadow-lg text-[13.5px] gap-2">
      <WarningIcon width={50} height={50} fill="#f97316" />
      <div>No sales records found for</div>
      <div className="font-medium">{renderGroupOrStore()}</div>
      <div className="font-medium">Date(s): {dateStr}</div>
      <div className="text-content/60 text-xs">*Please try another date or date range</div>
    </div>
  );
};

export default NoPanelsFound;
