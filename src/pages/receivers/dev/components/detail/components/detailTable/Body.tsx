// Hooks
import { useAppSelector } from "../../../../../../../hooks";

// Components
import BodyRow from "./BodyRow";

const Body = () => {
  const state = useAppSelector((s) => s.dev.receivers);

  return (
    <tbody className="divide-y divide-brand_navy/15 text-[13px]">
      {state.details.map((item) => (
        <BodyRow key={item.line_number} item={item} />
      ))}
    </tbody>
  );
};

export default Body;
