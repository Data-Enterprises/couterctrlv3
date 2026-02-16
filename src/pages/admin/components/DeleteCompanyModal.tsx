import { deleteCompany } from "../../../api/company";
import Modal from "../../../components/Modal";
import {
  resetCompanyForm,
  setDeleteCompanyModalOpen,
  setRefresh,
} from "../../../features/adminSlice";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError } from "../../../interfaces";
import { useAdminContext } from "../hooks";

const DeleteCompanyModal = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, deleteCompanyModalOpen, companyForm } = useAdminContext();

  const handleClose = () => {
    dispatch(setDeleteCompanyModalOpen(false));
  };

  const handleDelete = () => {
    deleteCompany(url, token, companyForm.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setRefresh(true));
          dispatch(resetCompanyForm());
          handleClose();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <Modal
      isOpen={deleteCompanyModalOpen}
      onClose={handleClose}
      modalClassName="bg-custom-white space-y-4"
    >
      <div className="flex justify-center gap-1">
        Are you sure you want to delete{" "}
        <div className="font-medium underline">{companyForm.name}</div>?
      </div>
      <div className="flex justify-center gap-4">
        <button className="btn-themeGreen w-1/2" onClick={handleDelete}>
          Confrim
        </button>
        <button className="btn-themeOrange w-1/2" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </Modal>
  );
};

export default DeleteCompanyModal;
