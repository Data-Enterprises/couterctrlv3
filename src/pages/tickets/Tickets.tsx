// Hooks
import { useAppSelector } from "../../hooks";
import { DEV_API_URL } from "../../hooks/useDevApi";

// Components
import DevOnlyNotice from "../../components/DevOnlyNotice";
import DevTickets from "./dev/Tickets";

const Tickets = () => {
  const { apiEnv, url } = useAppSelector((state) => state.app);
  if (apiEnv !== "dev" || url !== DEV_API_URL) return <DevOnlyNotice />;
  return <DevTickets />;
};

export default Tickets;
