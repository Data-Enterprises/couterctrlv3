import type { Company } from "../../../../../interfaces";

export const blankCompany: Company = {
  id: 0,
  address: "",
  city: "",
  contact_email: "",
  name: "",
  phone: "",
  state: "",
  zip: 0,
};

export const canSubmit = (c: Company) =>
  c.name !== "" &&
  c.address !== "" &&
  c.city !== "" &&
  c.contact_email !== "" &&
  c.state !== "" &&
  c.zip !== 0 &&
  c.phone !== "";


  export const formTitles = [
    "Name",
    "Address",
    "City",
    "State",
    "Zip",
    "Phone",
    "Contact Email",
    ""
  ]