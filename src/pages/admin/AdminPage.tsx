import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useAdminContext } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

// reducers
import {
  setCompanies,
  setUsers,
  setRefresh,
  setCompanyForm,
  setSelectedCompanyForm,
  resetCompanyForm,
  setDeleteCompanyModalOpen,
} from "../../features/adminSlice";

// api
import { createCompany, getCompanies, updateCompany } from "../../api/company";
import { getAllUsers } from "../../api/user";
import type {
  CompanyJsonResp,
  JsonError,
  UsersJsonResp,
} from "../../interfaces";
import SingleSelect from "../../components/SingleSelect";
import Input from "../../components/inputs/Input";
import DeleteCompanyModal from "./components/DeleteCompanyModal";

// components

const AdminPage = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAdminContext();
  const { userLevel } = useAppSelector((state) => state.user);

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

  // Dispatch functions for Company CRUD operations
  const setName = (x: string) => {
    dispatch(setCompanyForm({ key: "name", val: x }));
  };

  const setAddress = (x: string) => {
    dispatch(setCompanyForm({ key: "address", val: x }));
  };

  const setCity = (x: string) => {
    dispatch(setCompanyForm({ key: "city", val: x }));
  };

  const setState = (x: string) => {
    dispatch(setCompanyForm({ key: "state", val: x }));
  };

  const setZip = (x: string) => {
    dispatch(setCompanyForm({ key: "zip", val: Number(x) }));
  };

  const setPhone = (x: string) => {
    dispatch(setCompanyForm({ key: "phone", val: x }));
  };

  const setContactEmail = (x: string) => {
    dispatch(setCompanyForm({ key: "contact_email", val: x }));
  };

  const handleFormSelect = (x: string | number) => {
    const form = context.companies.find((comp) => comp.id === Number(x));
    dispatch(setSelectedCompanyForm(form!));
  };

  const handleReset = () => {
    dispatch(resetCompanyForm());
  };

  const handleCreateOrUpdateCompany = () => {
    const isCreating = context.companyForm.id === 0;

    if (isCreating) {
      createCompany(context.url, context.token, context.companyForm)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setRefresh(true));
            handleReset();
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    } else {
      updateCompany(context.url, context.token, context.companyForm)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setRefresh(true));
            handleReset();
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const openDeleteCompanyModal = () => {
    dispatch(setDeleteCompanyModalOpen(true));
  };

  // END Company CRUD/dispatch operations

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4">
      <DeleteCompanyModal />
      {/* Company Form Card */}
      <div
        className={`${userLevel === 9 ? "bg-custom-white p-4 w-[30%] rounded-lg shadow-lg" : "hidden"}`}
      >
        <div className="grid grid-cols-2 gap-x-2">
          <div className="flex items-end gap-2 col-span-2">
            <SingleSelect
              label="Companies"
              data={context.companies}
              displayKey="name"
              valueKey="id"
              onSelect={handleFormSelect}
              // resetQuery={true}
              // defaultQuery={context.companyForm.name}
              innerClass="py-1.5"
            />
            <button
              className="btn-themeBlue w-1/2 px-0 py-1.5"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          <Input
            label="Name"
            value={context.companyForm.name}
            setValue={setName}
          />
          <Input
            label="Address"
            value={context.companyForm.address}
            setValue={setAddress}
          />
          <Input
            label="City"
            value={context.companyForm.city}
            setValue={setCity}
          />
          <Input
            label="State"
            value={context.companyForm.state}
            setValue={setState}
          />
          <Input
            label="Zip"
            value={context.companyForm.zip.toString()}
            setValue={setZip}
          />
          <Input
            label="Phone"
            value={context.companyForm.phone}
            setValue={setPhone}
          />
          <Input
            label="Contact Email"
            value={context.companyForm.contact_email}
            setValue={setContactEmail}
          />
          <div className="flex items-end gap-2">
            <button
              className="btn-themeBlue py-1.5 px-0 w-1/2"
              onClick={handleCreateOrUpdateCompany}
            >
              {context.companyForm.id === 0 ? "Create" : "Update"}
            </button>
            <button
              className={`btn-themeOrange py-1.5 px-0 w-1/2 ${context.companyForm.id < 1 && "opacity-50 pointer-events-none"}`}
              onClick={openDeleteCompanyModal}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
