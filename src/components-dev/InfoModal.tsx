import { useAppSelector } from "../hooks";
import type { HelpPage } from "../constants/helpPages";
import HelpPanel from "./help/HelpPanel";
import PhoneHelpSheet from "./help/PhoneHelpSheet";
import { HELP_CONTENT } from "./help/content";
import { phoneHelpFor } from "./help/phone";

interface InfoModalProps {
  /** Which screen's help to show. Phone or desktop is picked here, not by
   *  the caller, so a page passes its own name and nothing else. */
  page: HelpPage;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The "?" help, for whichever device this is.
 *
 * All of it is data in the repo now, shipped with the build. It used to be
 * complete HTML documents in an S3 bucket shown in an iframe: desktop moved to
 * the panel first, and the phone's `-mobile` documents followed, as
 * `help/phone`. Nothing here fetches anything, so there is no loading state
 * and no error for a page that was never uploaded.
 *
 * **A phone** gets its own help when the screen has one, because the phone
 * screens are a separate tree with their own layout and their own words. A
 * page with no phone help falls back to the desktop panel, which on a phone is
 * full width.
 */
const InfoModal = ({ page, isOpen, onClose }: InfoModalProps) => {
  const isMobile = useAppSelector((state) => state.app.isMobile);
  if (!isOpen) return null;

  const phone = isMobile ? phoneHelpFor(page) : undefined;
  return phone ? (
    <PhoneHelpSheet content={phone} onClose={onClose} />
  ) : (
    <HelpPanel content={HELP_CONTENT[page]} onClose={onClose} />
  );
};

export default InfoModal;
