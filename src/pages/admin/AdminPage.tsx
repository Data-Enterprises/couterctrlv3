import { useEffect } from "react";
import { useAppDispatch } from "../../hooks";
import { useAdminContext } from "./hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

// reducers
import { setAdminForm, setCompanies } from "../../features/adminSlice";

// api
import { getCompanies } from "../../api/company";
import type { CompanyJsonResp, JsonError } from "../../interfaces";
import CreateComp from "./forms/CreateComp";

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
    }
  }, [context.refresh]);

  // const handleFormSelect = (x: string | number) => {
  //   const form = context.companies.find((comp) => comp.id === Number(x));
  //   dispatch(setSelectedCompanyForm(form!));
  // };

  // const handleCreateOrUpdateCompany = () => {
  //   const isCreating = context.companyForm.id === 0;

  //   if (isCreating) {
  //     createCompany(context.url, context.token, context.companyForm)
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           dispatch(setRefresh(true));
  //           handleReset();
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   } else {
  //     updateCompany(context.url, context.token, context.companyForm)
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           dispatch(setRefresh(true));
  //           handleReset();
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   }
  // };

  const renderSelectedForm = () => {
    switch (context.adminForm) {
      case "create":
        return <CreateComp />;
      case "update":
        return <div>Update</div>;
      case "delete":
        return <div>Delete</div>;
      case "store_activity":
        return <div>Store Activity</div>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4 text-sm">
      <div className="min-w-[178px] max-w-[178px]">
        <div className="bg-custom-white rounded-lg shadow-lg py-1">
          <div className="font-medium px-2">Company Forms</div>
          <div className="grid grid-cols-2 h-[1.5px] mt-0.5">
            <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
            <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
          </div>
          <div className="grid">
            <div
              className="py-1 transition-all duration-200 cursor-pointer hover:bg-blue-200 px-2"
              onClick={() => dispatch(setAdminForm("create"))}
            >
              Create
            </div>
            <div
              className="py-1 transition-all duration-200 cursor-pointer hover:bg-blue-200 px-2"
              onClick={() => dispatch(setAdminForm("update"))}
            >
              Update
            </div>
            <div
              className="py-1 transition-all duration-200 cursor-pointer hover:bg-blue-200 px-2"
              onClick={() => dispatch(setAdminForm("delete"))}
            >
              Delete
            </div>
            <div
              className="py-1 transition-all duration-200 cursor-pointer hover:bg-blue-200 px-2"
              onClick={() => dispatch(setAdminForm("store_activity"))}
            >
              Store Activity
            </div>
          </div>
        </div>
      </div>
      <div>{renderSelectedForm()}</div>
      {/* <div
        className="bg-custom-white p-2 rounded-lg shadow-lg"
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
      </div> */}
    </div>
  );
};

export default AdminPage;
