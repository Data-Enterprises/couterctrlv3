import { useEffect, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { createUser } from "../../../../../api/team";
import {
  resetUserInfo,
  setRefresh,
  setUserInfo,
} from "../../../../../features/dev/devUsersSlice";
import type { CompanyBaseGroup, JsonError } from "../../../../../interfaces";
import UserFields from "./UserFields";
import AccessPanel from "../access/AccessPanel";
import { accessSets, type AccessPicks } from "../access/accessSets";
import {
  useAccessSave,
  outcomeSentence,
  ALL_CHANGED,
  type AccessOutcome,
} from "../access/useAccessSave";

interface AddUserPageProps {
  onComplete: () => void;
  onCancel: () => void;
}

const NO_PICKS: AccessPicks = { companies: [], baseGroups: [], stores: [] };

/**
 * Add user, on one screen.
 *
 * The three-step wizard asked for identity, then access, then a review of
 * what you had just typed twice. Nothing is sent until Create either way, so
 * the steps were pacing rather than protection — and the order they imposed
 * was the wrong one for the common job, which is "this person is like that
 * person, give them these stores".
 *
 * The call order is unchanged: create the account, then write its three
 * levels of access outermost first. What changed is that a failure halfway
 * now says so.
 */
const AddUserPage = ({ onComplete, onCancel }: AddUserPageProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const saveAccess = useAccessSave();

  const [picks, setPicks] = useState<AccessPicks>(NO_PICKS);
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [identityValid, setIdentityValid] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Set only once the account exists. What it names is a person who is
   *  already real, so the screen must not pretend the form is still unsent. */
  const [stranded, setStranded] = useState<{
    userid: number;
    name: string;
    outcome: AccessOutcome;
  } | null>(null);

  useEffect(() => {
    ctx.dispatch(resetUserInfo());

    const source = ctx.duplicateSource;
    if (!source) return;
    // Access copies, identity never does — a duplicate that half-becomes the
    // person it was copied from is worse than one that copies nothing.
    ctx.dispatch(setUserInfo({ key: "role", value: source.role }));
    ctx.dispatch(setUserInfo({ key: "user_level", value: source.user_level }));
    setCompanyGroups(
      source.groups.reduce<Record<number, CompanyBaseGroup[]>>((acc, g) => {
        acc[g.company] = [...(acc[g.company] ?? []), g];
        return acc;
      }, {}),
    );
    // The source's companies and groups are picked in their own right rather
    // than left to be re-derived from its stores: a group whose stores are all
    // unticked still has to survive the copy.
    setPicks({
      companies: Array.from(new Set(source.groups.map((g) => g.company))),
      baseGroups: source.groups.map((g) => g.id),
      stores: source.stores,
    });
  }, []);

  const sets = accessSets(picks);
  const hasAccess =
    sets.companyIds.length > 0 ||
    sets.baseGroupIds.length > 0 ||
    sets.storeIds.length > 0;
  const canCreate = identityValid && hasAccess && !saving;

  const finish = (name: string) => {
    toast.success(`${name} created`);
    ctx.dispatch(resetUserInfo());
    ctx.dispatch(setRefresh(true));
    onComplete();
  };

  const handleCreate = async () => {
    setSaving(true);
    const name =
      `${ctx.userInfo.first_name} ${ctx.userInfo.last_name}`.trim() ||
      ctx.userInfo.username;

    let userid: number;
    try {
      const resp = await createUser(ctx.url, ctx.token, ctx.userInfo);
      if (resp.data.error !== 0) {
        // Stay on the form with everything still in it. The reason is the
        // server's own — "username taken" belongs beside the field.
        toast.error(resp.data.msg ?? "The account could not be created");
        setSaving(false);
        return;
      }
      userid = resp.data.new_userid;
    } catch (err) {
      toast.error((err as JsonError).message);
      setSaving(false);
      return;
    }

    const outcome = await saveAccess(userid, sets, ALL_CHANGED);
    setSaving(false);
    if (outcome.ok) {
      finish(name);
      return;
    }
    // The account exists and its access does not. Hand back something that
    // can be finished rather than a toast that disappears.
    ctx.dispatch(setRefresh(true));
    setStranded({ userid, name, outcome });
  };

  const handleRetry = async () => {
    if (!stranded) return;
    setSaving(true);
    // The whole set again, including the calls that already landed: they
    // replace, so writing the same list twice writes the same list.
    const outcome = await saveAccess(stranded.userid, sets, ALL_CHANGED);
    setSaving(false);
    if (outcome.ok) {
      finish(stranded.name);
      return;
    }
    setStranded({ ...stranded, outcome });
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
        <h2 className="text-[15px] font-semibold text-content">Add user</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-brand_line text-content hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || stranded !== null}
            className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${
              canCreate && stranded === null
                ? "bg-brand_navy hover:bg-brand_navy/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>

      {/* Danger, not severity: the severity family grades data against a
          threshold, and this is a save that did not finish. */}
      {stranded && (
        <div className="flex flex-wrap items-center gap-3 mb-3 px-3 py-2.5 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <div className="flex-1 min-w-[260px]">
            <div className="text-[12.5px] font-semibold text-content">
              {stranded.name} was created, but their access didn’t finish
              saving.
            </div>
            <div className="text-[11.5px] text-content/85">
              {outcomeSentence(stranded.outcome)}
              {stranded.outcome.reason ? ` ${stranded.outcome.reason}` : ""}
            </div>
          </div>
          <button
            onClick={handleRetry}
            disabled={saving}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md bg-brand_navy text-custom-white hover:bg-brand_navy/85 flex-shrink-0"
          >
            {saving ? "Retrying…" : "Retry access"}
          </button>
          <button
            onClick={onComplete}
            className="text-[11.5px] font-medium text-content/85 flex-shrink-0"
          >
            Leave it for now
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex gap-4 overflow-auto thin-scrollbar">
        <div className="flex-shrink-0">
          <UserFields onValidityChange={setIdentityValid} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5 flex-shrink-0">
            Store access
          </div>
          <AccessPanel
            picks={picks}
            onPicksChange={setPicks}
            companyGroups={companyGroups}
            onCompanyGroupsChange={setCompanyGroups}
          />
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;
