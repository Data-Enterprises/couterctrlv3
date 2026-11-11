// Hooks
import { useEffect, useMemo, useState } from "react";
import { useBaseGroupsCtx } from "../../hooks";

// API
import { getBaseGroupUsers } from "../../../../../api/baseGroups";

// Utils
import { downloadCsv } from "../../../../../utils/csvExport";
import { buildStoresCsv, buildUsersCsv, callReason } from "../utils";
import { withinReachOf } from "../utils/userReach";

// Interfaces
import type { ExportDataset } from "../interfaces";
import type {
  BaseGroupUserRow,
  BaseGroupUsersResp,
  CompanyBaseGroup,
  Store,
  User,
} from "../../../../../interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import Option from "./Option";

interface BaseGroupExportModalProps {
  onClose: () => void;
  group: CompanyBaseGroup;
  companyName: string;
  assigned: Store[];
  unassigned: Store[];
  /** Every user, with levels: the group's user rows carry none. */
  users: User[];
}

/** The Export CSV pop-up for a base group: tick assigned or unassigned stores and users, then download.
 *  Users are limited to those the viewer's level can reach. */
const BaseGroupExportModal = ({
  onClose,
  group,
  companyName,
  assigned,
  unassigned,
  users,
}: BaseGroupExportModalProps) => {
  const ctx = useBaseGroupsCtx();
  const groupName = group.name;
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());
  const toggle = (d: ExportDataset) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(d) ? n.delete(d) : n.add(d);
      return n;
    });

  /**
   * The group's users, read when the window opens (the Users tab's copy may
   * not be loaded), narrowed by the same level rule as the screen.
   */
  const [people, setPeople] = useState<{
    assigned: BaseGroupUserRow[];
    unassigned: BaseGroupUserRow[];
  } | null>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getBaseGroupUsers(ctx.url, ctx.token, group.id, group.company)
      .then((resp) => {
        if (!live) return;
        const j: BaseGroupUsersResp = resp.data;
        if (j.error === 0) {
          setPeople({ assigned: j.assigned, unassigned: j.unassigned });
        } else {
          setPeopleError(j.msg || "Could not read this group's users.");
        }
      })
      .catch((err) => live && setPeopleError(callReason(err)));
    return () => {
      live = false;
    };
  }, [group.id, group.company]);

  const reach = useMemo(
    () => withinReachOf(users, ctx.userLevel),
    [users, ctx.userLevel],
  );
  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const assignedUsers = people?.assigned.filter(reach) ?? [];
  const unassignedUsers = people?.unassigned.filter(reach) ?? [];
  // Levels arrive with the full user list; until then nobody is in reach,
  // which would read as an empty group rather than as still loading.
  const peopleReady = people !== null && users.length > 0;

  const userDetail = (count: number, some: string, none: string) =>
    peopleError
      ? peopleError
      : !peopleReady
        ? "Loading users…"
        : count
          ? some
          : none;

  const handleDownload = () => {
    const sections: string[] = [];
    if (selected.has("assigned"))
      sections.push(buildStoresCsv(assigned, `Assigned Stores — ${groupName}`));
    if (selected.has("unassigned"))
      sections.push(buildStoresCsv(unassigned, `Unassigned Stores — ${groupName}`));
    if (selected.has("assignedUsers"))
      sections.push(buildUsersCsv(assignedUsers, byId, `Assigned Users — ${groupName}`));
    if (selected.has("unassignedUsers"))
      sections.push(
        buildUsersCsv(unassignedUsers, byId, `Unassigned Users — ${groupName}`),
      );
    if (!sections.length) return;

    const hasStores = selected.has("assigned") || selected.has("unassigned");
    const hasUsers = selected.has("assignedUsers") || selected.has("unassignedUsers");
    const what =
      hasStores && hasUsers ? "stores_and_users" : hasUsers ? "users" : "stores";
    const safeName = `${companyName}_${groupName}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${what}.csv`);
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:org-groups"
      defaultWidth={560}
      defaultHeight={560}
    >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <div>
            <p className="cc-navy-title text-[13px]">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">
              {companyName} — {groupName}
            </p>
          </div>
          <div />
          <button
            onClick={onClose}
            className="cc-navy-link justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 space-y-3">
          <p className="text-[11px] text-content uppercase tracking-wide font-medium">
            Stores
          </p>
          <Option
            checked={selected.has("assigned")}
            disabled={!assigned.length}
            onToggle={() => toggle("assigned")}
            title="Assigned stores"
            detail={
              assigned.length
                ? `${assigned.length} stores in ${groupName}`
                : "No stores assigned yet"
            }
          />
          <Option
            checked={selected.has("unassigned")}
            disabled={!unassigned.length}
            onToggle={() => toggle("unassigned")}
            title="Unassigned stores"
            detail={
              unassigned.length
                ? `${unassigned.length} stores not in ${groupName}`
                : "None remaining"
            }
          />

          <p className="text-[11px] text-content uppercase tracking-wide font-medium pt-2">
            Users
          </p>
          <Option
            checked={selected.has("assignedUsers")}
            disabled={!peopleReady || !assignedUsers.length}
            onToggle={() => toggle("assignedUsers")}
            title="Assigned users"
            detail={userDetail(
              assignedUsers.length,
              `${assignedUsers.length} users holding ${groupName}`,
              "Nobody holds this group yet",
            )}
          />
          <Option
            checked={selected.has("unassignedUsers")}
            disabled={!peopleReady || !unassignedUsers.length}
            onToggle={() => toggle("unassignedUsers")}
            title="Unassigned users"
            detail={userDetail(
              unassignedUsers.length,
              `${unassignedUsers.length} users who don't hold it`,
              "Everyone holds it",
            )}
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-line_hair mt-2">
          <button onClick={onClose} className="text-[12px] text-content transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 cc-btn-primary hover:bg-brand_navy/85 text-[12px]"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
    </ResizableModalShell>
  );
};

export default BaseGroupExportModal;
