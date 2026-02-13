import { useEffect } from "react";
import { useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useAdminContext } from "./hooks";

// reducers
import { setCompanies, setUsers, setRefresh } from "../../features/adminSlice";

// api
import { getCompanies } from "../../api/company";
import { getAllUsers } from "../../api/user";
import type {
  CompanyJsonResp,
  JsonError,
  UsersJsonResp,
} from "../../interfaces";

// components
import ControlsColumn from "./ControlsColumn";
import AdminPanels from "./panels/AdminPanels";
import LoadingIndicator from "../../components/loading/LoadingIndicator";

const AdminPage = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminContext();

  useEffect(() => {
    if (context.refresh) {
      getCompanies(context.url, context.token)
        .then((resp) => {
          const j: CompanyJsonResp = resp.data;
          if (j.error === 0) {
            dispatch(setCompanies(j.companies));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));

      getAllUsers(context.url, context.token)
        .then((resp) => {
          const j: UsersJsonResp = resp.data;
          if (j.error === 0) {
            dispatch(setUsers(j.users));
          }
        })
        .catch((err: JsonError) => toast.error(err.message))
        .finally(() => dispatch(setRefresh(false)));
    }
  }, [context.refresh]);

  if (context.users.length === 0 && context.companies.length === 0) {
    return (
      <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full overflow-hidden p-4 relative">
        <LoadingIndicator className="ml-4" message="Fetching Admin Data" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] w-full overflow-hidden p-4">
      <div className="grid grid-cols-[1fr_6.5fr] gap-4">
        <div className="grid gap-2">
          <ControlsColumn />
        </div>
        <AdminPanels />
      </div>
    </div>
  );
};

export default AdminPage;
