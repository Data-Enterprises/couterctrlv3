import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../../../api/user";
import {
  setRefresh,
  setSelectedUserStores,
  setUserCompanyIds,
} from "../../../../../features/dev/devUsersSlice";
import type {
  CompanyBaseGroup,
  JsonError,
  Store,
} from "../../../../../interfaces";
import AccessPanel from "../access/AccessPanel";
import { accessSets, changedSets, hasChanges } from "../access/accessSets";
import type { AccessPicks } from "../access/accessSets";
import { useExistingAccess } from "../access/useExistingAccess";
import {
  useAccessSave,
  outcomeSentence,
  type AccessOutcome,
} from "../access/useAccessSave";

/**
 * One tab for all three levels of a person's access.
 *
 * It replaces the Companies, Base groups and Stores tabs, which were three
 * screens asking three halves of one question — and which could not express
 * the common answer at all, because a company with no stores had no row to
 * tick anywhere.
 *
 * Add and Edit now share both the panel and the save. The only difference
 * here is that Edit starts from what the person already holds, and sends only
 * the lists that actually moved.
 */
const AccessTab = () => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const saveAccess = useAccessSave();
  const existing = useExistingAccess();

  const [picks, setPicks] = useState<AccessPicks>(existing.picks);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<AccessOutcome | null>(null);

  /** The person's stores are not on the grid row, so the tab fetches them —
   *  the same call the Stores tab made, kept because the panel is seeded from
   *  the result. */
  useEffect(() => {
    if (!ctx.selectedUserId) return;
    const noNulls = (arr: Store[]) => arr.filter((s) => s.store_name !== null);
    getUserStores(ctx.url, ctx.token, ctx.selectedUserId)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        ctx.dispatch(
          setSelectedUserStores({
            assigned: noNulls(j.assigned_stores),
            unassigned: noNulls(j.unassigned_stores),
          }),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching stores " + err.message),
      );
  }, [ctx.selectedUserId]);

  /** Re-seed whenever what they hold changes under us — a different user
   *  opened, or the stores arriving a moment after the tab did. */
  useEffect(() => {
    setPicks(existing.picks);
    setFailure(null);
  }, [existing.picks]);

  const before = useMemo(
    () => accessSets(existing.picks, existing.carried),
    [existing],
  );
  const next = accessSets(picks, existing.carried);
  const changed = changedSets(next, before);
  const dirty = hasChanges(next, before);

  const handleSave = async () => {
    setSaving(true);
    setFailure(null);
    const outcome = await saveAccess(ctx.selectedUserId, next, changed);
    setSaving(false);
    ctx.dispatch(setRefresh(true));

    if (!outcome.ok) {
      setFailure(outcome);
      return;
    }
    // Keep the ids the rest of the screen reads in step with what was just
    // written, so a second save this session starts from the new truth.
    ctx.dispatch(setUserCompanyIds(next.companyIds));
    const saved = outcome.saved.length;
    toast.success(
      saved === 0 ? "Nothing to save" : "Access saved",
    );
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 flex-shrink-0">
        <span className="text-[11.5px] text-content/85">
          {dirty
            ? "Unsaved changes"
            : "Companies, base groups and stores this person holds"}
        </span>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
            dirty && !saving
              ? "bg-brand_navy hover:bg-brand_navy/85"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving…" : "Save access"}
        </button>
      </div>

      {failure && (
        <div className="mb-2 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="text-[12.5px] font-semibold text-content">
            Access didn’t finish saving.
          </div>
          <div className="text-[11.5px] text-content/85">
            {outcomeSentence(failure)}
            {failure.reason ? ` ${failure.reason}` : ""} Press Save access to
            try again.
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AccessPanel
          picks={picks}
          onPicksChange={setPicks}
          companyGroups={companyGroups}
          onCompanyGroupsChange={setCompanyGroups}
        />
      </div>
    </div>
  );
};

export default AccessTab;
