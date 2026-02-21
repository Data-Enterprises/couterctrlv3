import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  resetCompanyInfo,
  setCompanyInfo,
  setRefreshCompanies,
  setSelectedCompanyFormId,
} from "../../../features/companySlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";

import Input from "../../../components/inputs/Input";
import SingleSelect from "../../../components/SingleSelect";
import { updateCompany } from "../../../api/company";

const UpdateCompany = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { companies, companyInfo } = useAppSelector((state) => state.company);
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
    <div className="bg-custom-white p-4 rounded-lg shadow-lg w-[40vw]">
      <div className="grid grid-cols-2 gap-2 items-end">
        <SingleSelect
          label="Companies"
          data={companies}
          displayKey="name"
          valueKey="id"
          innerClass="py-1.5"
          onSelect={handleCompanySelect}
        />
        <Input
          className="py-1.5"
          label="Name"
          value={name}
          setValue={handleName}
        />
        <Input
          className="py-1.5"
          label="Address"
          value={address}
          setValue={handleAddress}
        />
        <Input
          className="py-1.5"
          label="City"
          value={city}
          setValue={handleCity}
        />
        <Input
          className="py-1.5"
          label="State"
          value={state}
          setValue={handleState}
        />
        <Input
          className="py-1.5"
          label="Zip"
          value={showZip()}
          setValue={handleZip}
        />
        <Input
          className="py-1.5"
          label="Phone"
          value={phone}
          setValue={handlePhone}
        />
        <Input
          className="py-1.5"
          label="Contact Email"
          value={contact_email}
          setValue={handleEmail}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          className="btn-themeBlue"
          onClick={() => dispatch(resetCompanyInfo())}
        >
          Clear Fields
        </button>
        <button className="btn-themeBlue" onClick={handleSubmit}>
          Update
        </button>
      </div>
    </div>
  );
};

export default UpdateCompany;
