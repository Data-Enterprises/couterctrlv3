import { useAppSelector, useAppDispatch } from "../../../../hooks";
import {
  resetCompanyInfo,
  setCompanyInfo,
  setRefreshCompanies,
  setSelectedCompanyFormId,
} from "../../../../features/companySlice";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../../interfaces";

import Input from "../../../../components/inputs/Input";
import SingleSelect from "../../../../components/SingleSelect";
import { updateCompany } from "../../../../api/company";

const UpdateCompanyForm = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies, companyInfo } = useAppSelector((state) => state.company);
  const user = useAppSelector((state) => state.user);
  const { name, address, city, state, zip, phone, contact_email } = companyInfo;

  const handleName = (x: string) => {
    dispatch(setCompanyInfo({ key: "name", val: x }));
  };

  const handleAddress = (x: string) => {
    dispatch(setCompanyInfo({ key: "address", val: x }));
  };

  const handleCity = (x: string) => {
    dispatch(setCompanyInfo({ key: "city", val: x }));
  };

  const handleState = (x: string) => {
    dispatch(setCompanyInfo({ key: "state", val: x }));
  };

  const handleZip = (x: string) => {
    dispatch(setCompanyInfo({ key: "zip", val: x }));
  };

  const handlePhone = (x: string) => {
    dispatch(setCompanyInfo({ key: "phone", val: x }));
  };

  const handleEmail = (x: string) => {
    dispatch(setCompanyInfo({ key: "contact_email", val: x }));
  };

  const showZip = () => {
    if (zip === 0) {
      return "";
    }
    return zip.toString();
  };

  const handleCompanySelect = (id: string | number) => {
    dispatch(setSelectedCompanyFormId(Number(id)));
  };

  const handleSubmit = () => {
    updateCompany(url, token, companyInfo)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success(`Company ${name} updated, refreshing company list...`);
          dispatch(setRefreshCompanies(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div>
      <div className="bg-custom-white p-2 rounded-lg shadow-lg w-3/4">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 items-end">
          <SingleSelect
            label="Companies"
            data={companies.filter((c) =>
              user.companies.some((uc) => uc.company === c.id),
            )}
            displayKey="name"
            valueKey="id"
            innerClass="py-1"
            onSelect={handleCompanySelect}
          />
          <Input
            className="py-1"
            label="Name"
            value={name}
            setValue={handleName}
          />
          <Input
            className="py-1"
            label="Address"
            value={address}
            setValue={handleAddress}
          />
          <Input
            className="py-1"
            label="City"
            value={city}
            setValue={handleCity}
          />
          <Input
            className="py-1"
            label="State"
            value={state}
            setValue={handleState}
          />
          <Input
            className="py-1"
            label="Zip"
            value={showZip()}
            setValue={handleZip}
          />
          <Input
            className="py-1"
            label="Phone"
            value={phone}
            setValue={handlePhone}
          />
          <Input
            className="py-1"
            label="Contact Email"
            value={contact_email}
            setValue={handleEmail}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            data-testid="update-company-clear-btn"
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]"
            onClick={() => dispatch(resetCompanyInfo())}
          >
            Clear Fields
          </button>
          <button
            data-testid="update-company-submit-btn"
            className="btn-themeBlue bg-[rgb(30,45,80)] border-[rgb(30,45,80)] hover:bg-[rgb(30,45,80)]/75 hover:text-custom-white px-0 py-1.5 text-[13px]"
            onClick={handleSubmit}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCompanyForm;
