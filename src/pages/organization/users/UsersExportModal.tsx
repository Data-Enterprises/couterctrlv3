import { useState } from "react";
import ResizableModalShell from "../../../components/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { User, UserLevel } from "../../../interfaces";
import { rowsToCsv, downloadCsv } from "../../../utils/csvExport";
import { roles } from "../constants";

interface UsersExportModalProps {
  onClose: () => void;
  allUsers: User[];
  filteredUsers: User[];
  userLevels: UserLevel[];
  scopeLabel: string;
}

type ExportDataset = "all" | "filtered";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  const split = dateStr.split("-");
  return `${split[1]}/${split[2]}/${split[0]}`;
};

const buildUsersCsv = (
  users: User[],
  userLevels: UserLevel[],
  label: string,
) => {
  const renderRoleText = (role: number | null) =>
    roles.find((r) => r.value == role)?.label ?? "";
  const renderLvlText = (lvl: number) =>
    userLevels.find((l) => l.id === lvl)?.name ?? "N/A";

  const headers = [
    "Username",
    "First name",
    "Last name",
    "Email",
    "Role",
    "Level",
    "Last visited",
  ];
  const rows = users.map((u) => [
    u.username,
    u.first_name || "",
    u.last_name || "",
    u.email ?? "",
    renderRoleText(u.role),
    renderLvlText(u.user_level),
    formatDate(u.last_visit),
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

const UsersExportModal = ({
  onClose,
  allUsers,
  filteredUsers,
  userLevels,
  scopeLabel,
}: UsersExportModalProps) => {
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());
  const isFiltered = filteredUsers.length !== allUsers.length;

  const handleDownload = () => {
    const sections: string[] = [];
    if (selected.has("all"))
      sections.push(buildUsersCsv(allUsers, userLevels, `All Users — ${scopeLabel}`));
    if (selected.has("filtered"))
      sections.push(
        buildUsersCsv(filteredUsers, userLevels, `Filtered Results — ${scopeLabel}`),
      );
    if (!sections.length) return;
    const safeName = scopeLabel.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_users.csv`);
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:org-users"
      defaultWidth={560}
      defaultHeight={560}
    >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">{scopeLabel}</p>
          </div>
          <div />
          <button
            onClick={onClose}
            className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 space-y-3">
          <p className="text-[11px] text-content uppercase tracking-wide font-medium">
            Select data to include
          </p>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.has("all")}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("all") ? n.delete("all") : n.add("all");
                  return n;
                })
              }
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                All users
              </p>
              <p className="text-[12px] text-content mt-0.5">
                {allUsers.length} users — {scopeLabel}
              </p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 ${isFiltered ? "cursor-pointer" : "opacity-40 cursor-not-allowed"} group`}
          >
            <input
              type="checkbox"
              checked={selected.has("filtered")}
              disabled={!isFiltered}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("filtered") ? n.delete("filtered") : n.add("filtered");
                  return n;
                })
              }
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                Current filter results
              </p>
              <p className="text-[12px] text-content mt-0.5">
                {isFiltered
                  ? `${filteredUsers.length} users match the current filters`
                  : "No filters currently applied"}
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
          <button onClick={onClose} className="text-[12px] text-content transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
    </ResizableModalShell>
  );
};

export default UsersExportModal;
