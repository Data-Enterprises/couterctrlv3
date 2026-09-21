import { useAppDispatch, useAppSelector } from "../../../hooks";

// Flat context-selector hook, mirrors useOrganizationCtx()/useAdminPageCtx().
// userLevel/companies come from the logged-in user's own login data
// (state.user); userLevels (the full level list, for the elevated-access
// check) is Tickets' own copy in ticketsSlice — Tickets is on hold as an
// experiment and touches no other page's state.
export const useTicketsCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { userid, userLevel, companies } = useAppSelector(
    (state) => state.user,
  );
  const {
    userLevels,
    activeTab,
    tickets,
    messages,
    attachments,
    configs,
    templates,
    apiKeys,
    docs,
    staff,
    selectedTicketId,
    quickFilter,
    searchText,
    statusFilter,
    companyFilter,
    replyDraft,
    replyIsInternal,
    historyCompanyFilter,
    configSearchText,
    templateSearchText,
    docSearchText,
  } = useAppSelector((state) => state.dev.tickets);

  return {
    dispatch,
    url,
    token,
    userid,
    userLevel,
    companies,
    userLevels,
    activeTab,
    tickets,
    messages,
    attachments,
    configs,
    templates,
    apiKeys,
    docs,
    staff,
    selectedTicketId,
    quickFilter,
    searchText,
    statusFilter,
    companyFilter,
    replyDraft,
    replyIsInternal,
    historyCompanyFilter,
    configSearchText,
    templateSearchText,
    docSearchText,
  };
};
