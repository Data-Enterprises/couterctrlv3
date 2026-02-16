import { useAppSelector, useAppDispatch } from "../../../hooks";
import Modal from "../../../components/Modal";
import {
  setCompanyModalOpen,
  setUserCompanyIds,
  updateUserCompanies,
} from "../../../features/usersSlice";
import CheckBox from "../../../components/inputs/CheckBox";
import { assignUserToCompany } from "../../../api/user";
import type { JsonError } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";
import Input from "../../../components/inputs/Input";
import { useEffect } from "react";

const AssignCompanyModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const {
    companyModalOpen,
    allCompanies,
    selectedUserId,
    userCompanyIds,
    users,
  } = useAppSelector((state) => state.users);
  const { url, token } = useAppSelector((state) => state.app);

  useEffect(() => {
    if (selectedUserId > 0) {
      const companies = users
        .filter((u) => u.id === selectedUserId)[0]
        .companies.reduce((acc: number[], curr) => {
          acc.push(curr.company);
          return acc;
        }, []);
      dispatch(setUserCompanyIds(companies));
    }
  }, [selectedUserId]);

  const handleClose = () => {
    dispatch(setCompanyModalOpen(false));
  };

  const handleCompanyIdState = (x: boolean | number) => {
    const copy = [...userCompanyIds];
    if (copy.includes(Number(x))) {
      dispatch(setUserCompanyIds(copy.filter((id) => id !== Number(x))));
    } else {
      dispatch(setUserCompanyIds([...copy, Number(x)]));
    }
  };

  const handleSubmit = () => {
    assignUserToCompany(url, token, selectedUserId, userCompanyIds)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          handleClose();
          dispatch(updateUserCompanies(j.companies));
        } else {
          dispatch(setUserCompanyIds([]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setUserCompanyIds([]));
        toast.error(err.message);
      });
  };

  return (
    <Modal
      isOpen={companyModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white"
    >
      <div>
        <Input label="Search Company" value="" setValue={() => {}} />
      </div>
      <div className="grid grid-cols-3 gap-2 my-4">
        {allCompanies.map((c) => (
          <CheckBox
            id={c.id}
            value={userCompanyIds.includes(c.id)}
            label={c.name}
            onChange={handleCompanyIdState}
            isBool={false}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn-themeGreen w-1/3" onClick={handleSubmit}>
          Submit
        </button>
        <button
          className="btn-themeBlue w-1/3"
          onClick={() => dispatch(setUserCompanyIds([]))}
        >
          Reset
        </button>
        <button className="btn-themeOrange w-1/3" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default AssignCompanyModal;
