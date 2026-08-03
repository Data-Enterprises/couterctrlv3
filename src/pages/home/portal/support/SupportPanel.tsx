// import { useAppSelector } from "../../../../hooks";
// import { requestWalkthrough } from "../../../../api/portal";
import PortalPanel from "../shared/PortalPanel";
import PortalForm, { type PortalFormValues } from "../shared/PortalForm";
import PortalFormDone from "../shared/PortalFormDone";
import { SUPPORT_COPY, SUPPORT_FIELDS } from "./supportContent";

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

const SupportPanel = ({ open, onClose, returnFocusTo }: Props) => {
  // const url = useAppSelector((s) => s.app.url);

  const submit = async (v: PortalFormValues) => {
    console.log(v);
    // await requestWalkthrough(url, {
    //   name: v.name,
    //   company: v.company,
    //   email: v.email,
    //   phone: v.phone,
    //   location: v.location,
    //   urgency: v.urgency,
    //   issue_type: v.issue_type,
    //   message: v.message,
    // });
  };

  return (
    <PortalPanel
      open={open}
      onClose={onClose}
      kicker={SUPPORT_COPY.kicker}
      title={SUPPORT_COPY.title}
      width={560}
      returnFocusTo={returnFocusTo}
    >
      <PortalForm
        intro={SUPPORT_COPY.intro}
        fields={SUPPORT_FIELDS}
        submitLabel={SUPPORT_COPY.submit}
        onSubmit={submit}
        renderConfirmation={(v) => (
          <PortalFormDone
            firstName={v.name.trim().split(" ")[0]}
            message={SUPPORT_COPY.confirmation}
            recap={[
              { k: "Company", v: v.company },
              { k: "Email", v: v.email },
              { k: "Issue", v: v.issue_type },
              ...(v.urgency ? [{ k: "Urgency", v: v.urgency }] : []),
            ]}
          />
        )}
      />
    </PortalPanel>
  );
};

export default SupportPanel;
