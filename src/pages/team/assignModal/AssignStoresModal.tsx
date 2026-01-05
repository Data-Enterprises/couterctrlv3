import { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setAssignModalOpen,
  setSelectedUserStores,
} from "../../../features/usersSlice";
import { getUserStores } from "../../../api/user";
import { getQuicksightStoresForUser } from "../../../api/quicksight";
import type { JsonError, Store } from "../../../interfaces";

// Modal and Modes
import Modal from "../../../components/Modal";
import CounterCtrlStores from "./CounterCtrlStores";
import QuickSightStores from "./QuicksightStores";
import { setQsUserStores } from "../../../features/qsSlice";

const AssignStoresModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const users = useAppSelector((state) => state.users);
  const qs = useAppSelector((state) => state.quicksight);
  const [mode, setMode] = useState<"ctrl" | "qs">("ctrl");

  useEffect(() => {
    setMode("ctrl");
    if (users.assignModalOpen) {
      getData();
    }

    if (qs.validUser && users.assignModalOpen) {
      // Get quicksight stores
      getQsStores();
    }
  }, [users.assignModalOpen]);

  const filterNulls = (arr: Store[]) => {
    return arr.filter((store) => store.store_name !== null);
  };

  const getData = () => {
    getUserStores(context.url, context.token, users.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned: filterNulls(j.assigned_stores),
            unassigned: filterNulls(j.unassigned_stores),
          };
          dispatch(setSelectedUserStores(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error fetching available stores " + err.message);
      });
  };

  const getQsStores = () => {
    getQuicksightStoresForUser(
      context.url,
      context.token,
      qs.selectedQsUserEmail
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const stores = {
            assigned_stores: filterNulls(j.assigned_stores),
            unassigned_stores: filterNulls(j.unassigned_stores),
          };
          dispatch(setQsUserStores(stores));
        }
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
      });
  };

  return (
    <Modal
      isOpen={users.assignModalOpen}
      onClose={() => dispatch(setAssignModalOpen(false))}
      modalClassName="bg-bkg w-[600px]"
    >
      <div className={`${qs.validUser ? "flex space-x-4 mb-2" : "hidden"}`}>
        <button
          data-testid="assign-stores-ctrl-btn"
          className={`${
            mode === "ctrl" ? "btn-themeGreen" : "btn-themeBlue"
          } w-1/2`}
          onClick={() => setMode("ctrl")}
        >
          CounterCtrl Stores
        </button>
        <button
          data-testid="assign-stores-qs-btn"
          className={`${
            mode === "qs" ? "btn-themeGreen" : "btn-themeBlue"
          } w-1/2`}
          onClick={() => setMode("qs")}
        >
          QuickSight Stores
        </button>
      </div>
      {mode === "ctrl" && <CounterCtrlStores getData={getData} />}
      {mode === "qs" && <QuickSightStores />}
    </Modal>
  );
};

export default AssignStoresModal;
