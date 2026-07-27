import { useEffect } from "react";
import { useTicketsCtx } from "./hooks";
import { useResizableBox } from "../../hooks/useResizableBox";
import ResizeHandle from "../../components/ResizeHandle";
import { getUserLevels } from "../../api/team";
import { setUserLevels } from "../../features/usersSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, UserLevelJsonResp } from "../../interfaces";
import { setActiveTab, type TicketsTab } from "./ticketsSlice";
import { isElevatedTicketUser } from "./access";
import TicketsTabView from "./tickets/TicketsTab";
import HistoryTab from "./history/HistoryTab";
import ConfigsTab from "./configs/ConfigsTab";
import TemplatesTab from "./templates/TemplatesTab";
import ApiKeysTab from "./apiKeys/ApiKeysTab";
import TicketDocsTab from "./docs/TicketDocsTab";

const ALL_TABS: { id: TicketsTab; label: string; elevatedOnly?: boolean }[] = [
  { id: "tickets", label: "Tickets" },
  { id: "configs", label: "Configs" },
  { id: "templates", label: "Templates" },
  { id: "apiKeys", label: "API keys", elevatedOnly: true },
  { id: "docs", label: "Ticket docs" },
  { id: "history", label: "History" },
];

const Tickets = () => {
  const ctx = useTicketsCtx();
  const toast = useToast();
  const isElevated = isElevatedTicketUser(ctx.userLevel, ctx.userLevels);
  const visibleTabs = ALL_TABS.filter((t) => !t.elevatedOnly || isElevated);

  const { width, height, boxRef, handleProps } = useResizableBox({
    storageKey: "tickets-panel-size",
    defaultWidth: 1120,
    defaultHeight: 640,
    minWidth: 760,
    maxWidth: 1600,
    minHeight: 450,
    maxHeight: 950,
  });

  useEffect(() => {
    if (ctx.userLevels.length > 0) return;
    getUserLevels(ctx.url, ctx.token)
      .then((resp) => {
        const j: UserLevelJsonResp = resp.data;
        if (j.error === 0) ctx.dispatch(setUserLevels(j.levels));
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, []);

  // A non-elevated user could have been on API keys before their level was
  // re-evaluated (or before userLevels finished loading) — bounce back to
  // Tickets rather than leaving them stranded on a tab they can't see.
  useEffect(() => {
    if (ctx.activeTab === "apiKeys" && !isElevated) {
      ctx.dispatch(setActiveTab("tickets"));
    }
  }, [ctx.activeTab, isElevated]);

  const renderTab = () => {
    switch (ctx.activeTab) {
      case "tickets":
        return <TicketsTabView isElevated={isElevated} />;
      case "history":
        return <HistoryTab isElevated={isElevated} />;
      case "configs":
        return <ConfigsTab isElevated={isElevated} />;
      case "templates":
        return <TemplatesTab />;
      case "apiKeys":
        return isElevated ? <ApiKeysTab /> : null;
      case "docs":
        return <TicketDocsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] pt-12 px-4 pb-4 flex justify-center">
      <div
        ref={boxRef}
        className="relative max-w-[95vw] max-h-[calc(100vh-8rem)] flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white self-start"
        style={{ width, height }}
      >
        <div className="bg-[#1e2a4a] px-3 py-2 flex-shrink-0 flex items-center gap-3">
          <span className="text-custom-white font-semibold text-[13px] flex-shrink-0">
            Client Help Desk
          </span>
        </div>

        <div className="flex border-b border-gray-100 flex-shrink-0">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => ctx.dispatch(setActiveTab(t.id))}
              className={`text-[12px] font-semibold py-2.5 px-4 whitespace-nowrap border-b-2 transition-colors ${
                ctx.activeTab === t.id
                  ? "border-[#1e2a4a] text-[#1e2a4a]"
                  : "border-transparent text-content"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {renderTab()}
        </div>

        <ResizeHandle {...handleProps} />
      </div>
    </div>
  );
};

export default Tickets;
