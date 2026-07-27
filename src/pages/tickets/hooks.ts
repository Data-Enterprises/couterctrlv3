import { useAppDispatch, useAppSelector } from "../../hooks";

// Flat context-selector hook, mirrors useOrganizationCtx()/useAdminPageCtx().
// userLevel/companies come from the logged-in user's own login data
// (state.user); userLevels (the full level list, for the elevated-access
// check) is shared, already-fetched-elsewhere data owned by usersSlice —
// read here rather than duplicated into ticketsSlice.
export const useTicketsCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isDesktop, isTablet } = useAppSelector(
    (state) => state.app,
  );
  const { userid, userLevel, companies } = useAppSelector(
    (state) => state.user,
  );
  const { userLevels } = useAppSelector((state) => state.users);
  const {
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
  } = useAppSelector((state) => state.tickets);

  return {
    dispatch,
    url,
    token,
    isDesktop,
    isTablet,
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
