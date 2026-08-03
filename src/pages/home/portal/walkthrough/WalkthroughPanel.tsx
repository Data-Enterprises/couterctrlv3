import { requestWalkthrough } from "../../../../api/portal";
import PortalPanel from "../shared/PortalPanel";
import PortalForm, { type PortalFormValues } from "../shared/PortalForm";
import PortalFormDone from "../shared/PortalFormDone";
import { WALKTHROUGH_COPY, WALKTHROUGH_FIELDS } from "./walkthroughContent";

interface Props {
  open: boolean;
  onClose: () => void;
  returnFocusTo?: HTMLElement | null;
}

const WalkthroughPanel = ({ open, onClose, returnFocusTo }: Props) => {
  const submit = async (v: PortalFormValues) => {
    await requestWalkthrough(import.meta.env.VITE_API_URL_DEV, {
      name: v.name,
      company: v.company,
      email: v.email,
      phone: v.phone,
      role: v.role,
      locations: v.locations,
      pos_system: v.pos_system,
      interest: v.interest,
      notes: v.notes,
    });
  };

  return (
    <PortalPanel
      open={open}
      onClose={onClose}
      kicker={WALKTHROUGH_COPY.kicker}
      title={WALKTHROUGH_COPY.title}
      width={560}
      returnFocusTo={returnFocusTo}
    >
      <PortalForm
        intro={WALKTHROUGH_COPY.intro}
        fields={WALKTHROUGH_FIELDS}
        submitLabel={WALKTHROUGH_COPY.submit}
        onSubmit={submit}
        renderConfirmation={(v) => (
          <PortalFormDone
            firstName={v.name.trim().split(" ")[0]}
            message={WALKTHROUGH_COPY.confirmation}
            recap={[
              { k: "Company", v: v.company },
              { k: "Email", v: v.email },
              ...(v.locations ? [{ k: "Locations", v: v.locations }] : []),
              ...(v.interest ? [{ k: "Interest", v: v.interest }] : []),
            ]}
          />
        )}
      />
    </PortalPanel>
  );
};

export default WalkthroughPanel;
