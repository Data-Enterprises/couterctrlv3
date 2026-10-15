import { useCallback, useEffect, useMemo, useState } from "react";
import { useBaseGroupCompanies, useBaseGroupsCtx } from "../baseGroups/hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getAllUsers } from "../../../../api/user";
import type { JsonError, User } from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import CompanyUsersPanel from "./CompanyUsersPanel";

/**
 * User Management → Companies: who holds each company.
 *
 * Deliberately *only* that. The Admin page already creates, renames and
 * deletes companies, and which stores a company owns is a column on `stores`
 * that nothing here is safe to move — changing it orphans the store's base
 * group memberships in its old company and leaves that company's users still
 * seeing it. That wants its own endpoint and its own screen.
 *
 * So this is the one job the existing endpoints already do cleanly: the
 * user ↔ company link, in the same shape as the base group users tab.
 */
const Companies = () => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();
  const companies = useBaseGroupCompanies();

  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  /** The users are the whole dataset here: both columns and every write are
   *  derived from them, since each row carries its own company list. */
  const loadUsers = useCallback(() => {
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setUsers(j.users ?? []);
        else toast.error(j.msg || "Could not load users");
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching users " + err.message),
      );
  }, [ctx.url, ctx.token]);

  useEffect(loadUsers, [loadUsers]);

  // One company is the usual case, and a list of one with nothing chosen is a
  // step that only ever has one answer.
  useEffect(() => {
    if (selected === null && companies.length > 0) setSelected(companies[0].id);
  }, [companies, selected]);

  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    users.forEach((u) =>
      (u.companies ?? []).forEach((c) => {
        map[c.company] = (map[c.company] ?? 0) + 1;
      }),
    );
    return map;
  }, [users]);

  const q = search.trim().toLowerCase();
  const shown = q
    ? companies.filter((c) => c.name.toLowerCase().includes(q))
    : companies;

  const company = companies.find((c) => c.id === selected) ?? null;

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search companies…"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 thin-scrollbar">
          {companies.length === 0 && (
            <div className="p-3 text-[11px] text-content">No companies</div>
          )}
          {companies.length > 0 && shown.length === 0 && (
            <div className="p-3 text-[11px] text-content">
              No companies match
            </div>
          )}
          {shown.map((c) => {
            const isSel = selected === c.id;
            const count = counts[c.id] ?? 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  isSel
                    ? "bg-brand_navy text-custom-white"
                    : "hover:bg-gray-50 text-content"
                }`}
              >
                <span className="text-[12px] font-semibold truncate">
                  {c.name}
                </span>
                <span
                  className={`text-[10.5px] font-semibold tabular-nums flex-shrink-0 ${
                    isSel ? "text-custom-white/85" : "text-content/85"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {company === null ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select a company
          </div>
        ) : (
          <CompanyUsersPanel
            key={company.id}
            company={company}
            users={users}
            onChanged={loadUsers}
          />
        )}
      </div>
    </div>
  );
};

export default Companies;
