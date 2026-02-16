import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCompanyModalOpen,
  setUserCompanyIds,
  updateUserCompanies,
} from "../../../features/usersSlice";
import { assignUserToCompany } from "../../../api/user";
import type { JsonError } from "../../../interfaces";

import Modal from "../../../components/Modal";
import CheckBox from "../../../components/inputs/CheckBox";
import Input from "../../../components/inputs/Input";

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
  const [filterText, setFilterText] = useState<string>("");

  useEffect(() => {
    if (selectedUserId > 0) {
      setInitialUserCompanies();
    }
  }, [selectedUserId]);

  const setInitialUserCompanies = () => {
    const companies = users
      .filter((u) => u.id === selectedUserId)[0]
      .companies.reduce((acc: number[], curr) => {
        acc.push(curr.company);
        return acc;
      }, []);
    dispatch(setUserCompanyIds(companies));
  };

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

  const handleTextChange = (x: string) => {
    setFilterText(x);
  };

  const isHidden = (name: string) => {
    if (filterText.length === 0) {
      return false;
    } else {
      console.log(
        name,
        filterText,
        filterText.trim().toLowerCase().includes(name.trim().toLowerCase()),
      );
      return !name
        .trim()
        .toLowerCase()
        .includes(filterText.trim().toLowerCase());
    }
  };

  return (
    <Modal
      isOpen={companyModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white"
    >
      <div>
        <Input
          label="Search Company"
          value={filterText}
          setValue={handleTextChange}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 my-4 max-h-[120px] min-w-[496px] overflow-y-scroll no-scrollbar">
        {allCompanies.map((c) => (
          <CheckBox
            id={c.id}
            value={userCompanyIds.includes(c.id)}
            label={c.name}
            onChange={handleCompanyIdState}
            isBool={false}
            className={`${isHidden(c.name) && "hidden"}`}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button className="btn-themeGreen w-1/3" onClick={handleSubmit}>
          Submit
        </button>
        <button
          className="btn-themeBlue w-1/3"
          onClick={() => setInitialUserCompanies()}
        >
          Reset
        </button>
        <button
          className="btn-themeBlue w-1/3"
          onClick={() => dispatch(setUserCompanyIds([]))}
        >
          Clear
        </button>
        <button className="btn-themeOrange w-1/3" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default AssignCompanyModal;
