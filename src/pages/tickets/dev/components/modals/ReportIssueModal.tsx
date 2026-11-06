import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { closeReportIssue } from "../../../features/appSlice";
import { useTicketsCtx } from "./hooks";
import NewTicketModal from "./NewTicketModal";

/**
 * Filing a ticket without leaving the page the problem is on.
 *
 * Mounted once, at the app level, and drawn only while the shared slice says
 * somebody asked for it. That is the whole reason it exists as its own
 * component: the title bar raises the flag and the title bar is prod-tree,
 * which may not reach a dev page — but `App` is neither tree, so it can hold
 * the door open for both.
 *
 * Sending somebody to the help desk to describe a problem they are looking at
 * is asking them to leave the evidence behind. The form comes to them.
 *
 * It asks for the pickers rather than the queue: a category list and the
 * attachment limits are all it needs, and `load` would pull every ticket the
 * reader can see to get them.
 */
const ReportIssueModal = () => {
  const dispatch = useAppDispatch();
  const from = useAppSelector((state) => state.app.reportIssue);
  const ctx = useTicketsCtx();

  useEffect(() => {
    if (!ctx.lookups) ctx.loadLookups();
  }, [ctx.lookups]);

  if (!from) return null;

  return (
    <NewTicketModal
      ctx={ctx}
      from={from}
      onClose={() => dispatch(closeReportIssue())}
    />
  );
};

export default ReportIssueModal;
