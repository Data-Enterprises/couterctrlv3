import { MODULE_INFO } from "../moduleInfo";
import type { UpcDevTab } from "../../../../features/upcDevSlice";
import InfoPopover from "../../../../components/InfoPopover";

interface Props {
  tab: UpcDevTab;
  onClose: () => void;
}

const ModuleInfoPopover = ({ tab, onClose }: Props) => {
  const info = MODULE_INFO[tab];
  if (!info) return null;

  return <InfoPopover title={info.title} purpose={info.purpose} glossary={info.glossary} onClose={onClose} />;
};

export default ModuleInfoPopover;
