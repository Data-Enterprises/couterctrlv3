import { useEffect, useState } from "react";
import { useTeamCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { resetUserInfo, setRefresh, setSelectedUserId } from "../../../../../features/usersSlice";
import {
  resetSelectedBaseGroups,
  setAllSelectedBaseGroups,
  setSelectedNewUserStores,
  setStoresWithBGID,
} from "../../../../../features/baseGroupSlice";
import { assignBaseGroupToUser, assignUserToStore, checkEmail, checkUsername, createUser } from "../../../../../api/team";
import { assignUserToCompany } from "../../../../../api/user";
import type { JsonError } from "../../../../../interfaces";
import Stepper from "./Stepper";
import StepUserInfo from "./StepUserInfo";
import StepAccess from "./StepAccess";
import StepStores from "./StepStores";
import StepReview from "./StepReview";

const STEPS = [
  { id: 1, label: "User info" },
  { id: 2, label: "Access" },
  { id: 3, label: "Stores" },
  { id: 4, label: "Review" },
];

interface CreateUserWizardProps {
  onComplete: () => void;
}

const CreateUserWizard = ({ onComplete }: CreateUserWizardProps) => {
  const toast = useToast();
  const ctx = useTeamCtx();
  const [step, setStep] = useState(1);

  useEffect(() => {
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(resetSelectedBaseGroups());
    ctx.dispatch(setStoresWithBGID([]));
    ctx.dispatch(setSelectedNewUserStores([]));
    ctx.dispatch(setAllSelectedBaseGroups([]));
  }, []);

  const handleSubmit = async () => {
    let usernameResp;
    try {
      usernameResp = await checkUsername(ctx.url, ctx.token, ctx.userInfo.username);
    } catch (err) {
      toast.error(`Error with username check: ${ctx.userInfo.username}, ${(err as JsonError).message}`);
      return;
    }
    if (usernameResp.data.error !== 0) {
      toast.warn(`Error with username check: ${ctx.userInfo.username}, ${usernameResp.data.msg}`);
      return;
    }

    let emailResp;
    try {
      emailResp = await checkEmail(ctx.url, ctx.token, ctx.userInfo.email);
    } catch (err) {
      toast.error((err as JsonError).message);
      return;
    }
    if (emailResp.data.error !== 0) {
      toast.warn(`Error with email check: ${ctx.userInfo.email}, ${emailResp.data.msg}`);
      return;
    }

    let createResp;
    try {
      createResp = await createUser(ctx.url, ctx.token, ctx.userInfo);
    } catch (err) {
      toast.error("Error creating user " + (err as JsonError).message);
      return;
    }
    if (createResp.data.error !== 0) return;

    const userid = createResp.data.new_userid;
    ctx.dispatch(setSelectedUserId(userid));
    const companyIds = Array.from(new Set(ctx.selectedNewUserStores.map((s) => s.company)));
    const bgIds = Array.from(new Set(ctx.selectedNewUserStores.map((s) => s.base_group)));
    const storeIds = ctx.selectedNewUserStores.map((s) => s.storeid);

    try {
      const companyResp = await assignUserToCompany(ctx.url, ctx.token, userid, companyIds);
      if (companyResp.data.error !== 0) return;
    } catch (err) {
      toast.error((err as JsonError).message);
      return;
    }

    try {
      const bgResp = await assignBaseGroupToUser(ctx.url, ctx.token, userid, bgIds);
      if (bgResp.data.error !== 0) return;
    } catch (err) {
      toast.error((err as JsonError).message);
      return;
    }

    try {
      const storeResp = await assignUserToStore(ctx.url, ctx.token, userid, storeIds);
      if (storeResp.data.error === 0) {
        toast.success("User created and assigned to selected companies, base groups, and stores");
        ctx.dispatch(resetUserInfo());
        ctx.dispatch(setStoresWithBGID([]));
        ctx.dispatch(setSelectedNewUserStores([]));
        ctx.dispatch(setRefresh(true));
        onComplete();
      } else {
        toast.warn("Error assigning user to stores " + storeResp.data.msg);
      }
    } catch (err) {
      toast.error("Error assigning user to stores " + (err as JsonError).message);
    }
  };

  const completed = new Set(Array.from({ length: step - 1 }, (_, i) => i + 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepUserInfo onContinue={() => setStep(2)} />;
      case 2:
        return <StepAccess onContinue={() => setStep(3)} />;
      case 3:
        return <StepStores onContinue={() => setStep(4)} />;
      case 4:
        return <StepReview onSubmit={handleSubmit} onEdit={() => setStep(1)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 min-h-0">
      <Stepper steps={STEPS} current={step} completed={completed} onStepClick={setStep} />
      <div className="flex-1 min-w-0 p-4 overflow-y-auto thin-scrollbar">{renderStep()}</div>
    </div>
  );
};

export default CreateUserWizard;
