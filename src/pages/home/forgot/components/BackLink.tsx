// Utils
import { LINK } from "../utils";

interface BackLinkProps {
  label: string;
  onClick: () => void;
}

/** The way back, centred under the submit. */
const BackLink = ({ label, onClick }: BackLinkProps) => (
  <div className="text-center mt-4">
    <button type="button" onClick={onClick} className={LINK}>
      ‹ {label}
    </button>
  </div>
);

export default BackLink;
