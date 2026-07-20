import { useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { resetUserInfo, setRefresh } from "../../../../features/usersSlice";
import {
  assignBaseGroupToUser,
  assignUserToStore,
  checkEmail,
  checkUsername,
  createUser,
} from "../../../../api/team";
import { assignUserToCompany } from "../../../../api/user";
import type { CompanyBaseGroup, JsonError } from "../../../../interfaces";
import type { SelectableStore } from "../../types";
import Stepper from "./Stepper";
import StepUserInfo from "./StepUserInfo";
import StepAssignments from "./StepAssignments";
import StepReview from "./StepReview";

const STEPS = [
  { id: 1, label: "User info" },
  { id: 2, label: "Assignments" },
  { id: 3, label: "Review" },
];

interface CreateUserWizardProps {
  onComplete: () => void;
}

const CreateUserWizard = ({ onComplete }: CreateUserWizardProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const [step, setStep] = useState(1);
  const [selectedStores, setSelectedStores] = useState<SelectableStore[]>([]);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});

  useEffect(() => {
    ctx.dispatch(resetUserInfo());
  }, []);

  const handleSubmit = async () => {
    let usernameResp;
    try {
      usernameResp = await checkUsername(
        ctx.url,
        ctx.token,
        ctx.userInfo.username,
      );
    } catch (err) {
      toast.error(
        `Error with username check: ${ctx.userInfo.username}, ${(err as JsonError).message}`,
      );
      return;
    }
    if (usernameResp.data.error !== 0) {
      toast.warn(
        `Error with username check: ${ctx.userInfo.username}, ${usernameResp.data.msg}`,
      );
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
      toast.warn(
        `Error with email check: ${ctx.userInfo.email}, ${emailResp.data.msg}`,
      );
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
    const companyIds = Array.from(
      new Set(selectedStores.map((s) => s.company)),
    );
    const bgIds = Array.from(
      new Set(selectedStores.map((s) => s.base_group)),
    );
    const storeIds = selectedStores.map((s) => s.storeid);

    try {
      const companyResp = await assignUserToCompany(
        ctx.url,
        ctx.token,
        userid,
        companyIds,
      );
      if (companyResp.data.error !== 0) return;
    } catch (err) {
      toast.error((err as JsonError).message);
      return;
    }

    try {
      const bgResp = await assignBaseGroupToUser(
        ctx.url,
        ctx.token,
        userid,
        bgIds,
      );
      if (bgResp.data.error !== 0) return;
    } catch (err) {
      toast.error((err as JsonError).message);
      return;
    }

    try {
      const storeResp = await assignUserToStore(
        ctx.url,
        ctx.token,
        userid,
        storeIds,
      );
      if (storeResp.data.error === 0) {
        toast.success(
          "User created and assigned to selected companies, base groups, and stores",
        );
        ctx.dispatch(resetUserInfo());
        ctx.dispatch(setRefresh(true));
        onComplete();
      } else {
        toast.warn("Error assigning user to stores " + storeResp.data.msg);
      }
    } catch (err) {
      toast.error(
        "Error assigning user to stores " + (err as JsonError).message,
      );
    }
  };

  const completed = new Set(Array.from({ length: step - 1 }, (_, i) => i + 1));

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepUserInfo onContinue={() => setStep(2)} />;
      case 2:
        return (
          <StepAssignments
            selectedStores={selectedStores}
            onChange={setSelectedStores}
            companyGroups={companyGroups}
            onCompanyGroupsChange={setCompanyGroups}
            onContinue={() => setStep(3)}
          />
        );
      case 3:
        return (
          <StepReview
            selectedStores={selectedStores}
            companyGroups={companyGroups}
            onSubmit={handleSubmit}
            onEditStep={setStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 min-h-0 w-[700px]">
      <Stepper
        steps={STEPS}
        current={step}
        completed={completed}
        onStepClick={setStep}
      />
      <div className="flex-1 min-w-0 p-4 overflow-y-auto thin-scrollbar">
        {renderStep()}
      </div>
    </div>
  );
};

export default CreateUserWizard;
