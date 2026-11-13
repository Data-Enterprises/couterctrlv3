// Hooks
import { useEffect } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useTicketsCtx } from "../../hooks";

// Redux
import { closeReportIssue } from "../../../../../features/appSlice";

// Components
import NewTicketModal from "./NewTicketModal";

/**
 * Filing a ticket without leaving the page. Mounted once in `App`, because
 * the title bar that asks for it is prod-tree and cannot reach a dev page.
 */
const ReportIssueModal = () => {
  const dispatch = useAppDispatch();
  const ctx = useTicketsCtx();
  const from = ctx.reportIssue;

  useEffect(() => {
    if (!ctx.lookups) ctx.loadLookups();
  }, [ctx.lookups]);

  if (!from) return null;

  return (
    <NewTicketModal
      from={from}
      onClose={() => dispatch(closeReportIssue())}
    />
  );
};

export default ReportIssueModal;
