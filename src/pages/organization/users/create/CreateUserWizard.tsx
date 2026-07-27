import { useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  resetUserInfo,
  setRefresh,
  setUserInfo,
  clearDuplicateSource,
} from "../../../../features/usersSlice";
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
  onCancel: () => void;
}

const CreateUserWizard = ({ onComplete, onCancel }: CreateUserWizardProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(),
  );
  const [selectedStores, setSelectedStores] = useState<SelectableStore[]>([]);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  // Authoritative company/base-group ids from a duplicated user — kept
  // separate from selectedStores because a duplicated base group with none
  // of its stores selected would otherwise never surface in the ids derived
  // from selectedStores at submit time.
  const [duplicatedCompanyIds, setDuplicatedCompanyIds] = useState<number[]>(
    [],
  );
  const [duplicatedBaseGroupIds, setDuplicatedBaseGroupIds] = useState<
    number[]
  >([]);

  useEffect(() => {
    ctx.dispatch(resetUserInfo());

    const source = ctx.duplicateSource;
    if (source) {
      ctx.dispatch(setUserInfo({ key: "role", value: source.role }));
      ctx.dispatch(
        setUserInfo({ key: "user_level", value: source.user_level }),
      );
      setSelectedStores(source.stores);
      setCompanyGroups(
        source.groups.reduce<Record<number, CompanyBaseGroup[]>>(
          (acc, g) => {
            acc[g.company] = [...(acc[g.company] ?? []), g];
            return acc;
          },
          {},
        ),
      );
      setDuplicatedCompanyIds(source.companyIds);
      setDuplicatedBaseGroupIds(source.baseGroupIds);
      setMaxStep(3);
      setCompletedSteps(new Set([2, 3]));
      ctx.dispatch(clearDuplicateSource());
    }
  }, []);

  const handleCancel = () => {
    ctx.dispatch(resetUserInfo());
    onCancel();
  };

  const goToStep = (id: number) => {
    if (id <= maxStep) setStep(id);
  };

  const advanceTo = (id: number) => {
    setMaxStep((prev) => Math.max(prev, id));
    setCompletedSteps((prev) => new Set(prev).add(id - 1));
    setStep(id);
  };

  // Mirrors StepUserInfo's own canContinue check — re-verified here so the
  // final submit can't fire with an incomplete user (e.g. if the stepper rail
  // is used to jump straight to Review without visiting step 1/2 first).
  const userInfoValid =
    ctx.userInfo.username.trim() !== "" &&
    ctx.userInfo.email.trim() !== "" &&
    ctx.userInfo.first_name.trim() !== "" &&
    ctx.userInfo.last_name.trim() !== "" &&
    ctx.userInfo.password.length > 0 &&
    ctx.userInfo.password === ctx.userInfo.confirm_password &&
    ctx.userInfo.role > 0 &&
    ctx.userInfo.user_level > 0;
  const assignmentsValid = selectedStores.length > 0;
  const canSubmit = userInfoValid && assignmentsValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;
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
      new Set([
        ...selectedStores.map((s) => s.company),
        ...duplicatedCompanyIds,
      ]),
    );
    const bgIds = Array.from(
      new Set([
        ...selectedStores.map((s) => s.base_group),
        ...duplicatedBaseGroupIds,
      ]),
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepUserInfo onContinue={() => advanceTo(2)} />;
      case 2:
        return (
          <StepAssignments
            selectedStores={selectedStores}
            onChange={setSelectedStores}
            companyGroups={companyGroups}
            onCompanyGroupsChange={setCompanyGroups}
            onContinue={() => advanceTo(3)}
          />
        );
      case 3:
        return (
          <StepReview
            selectedStores={selectedStores}
            companyGroups={companyGroups}
            onSubmit={handleSubmit}
            onEditStep={goToStep}
            canSubmit={canSubmit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 w-full">
      <button
        onClick={handleCancel}
        className="text-[11px] text-content/60 m-4 mb-0 self-start"
      >
        ← Back to users
      </button>
      <div className="flex flex-1 min-h-0">
        <Stepper
          steps={STEPS}
          current={step}
          completed={completedSteps}
          onStepClick={goToStep}
        />
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto thin-scrollbar p-4">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default CreateUserWizard;
