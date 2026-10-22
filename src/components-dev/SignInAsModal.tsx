import { useState } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../hooks";
import { impersonate } from "../api/login";
import {
  resetAppSlice,
  setApiEnv,
  setFetchingCredentials,
} from "../features/appSlice";
import { setUsername } from "../features/userSlice";
import { applySession, impersonateFailureText } from "../utils/session";
import Modal from "./Modal";
import TextField from "./inputs/TextField";

/**
 * Sign in as someone else. Level 9, dev only.
 *
 * Replaced the impersonate checkbox on the sign-in page (22 Oct), which a
 * hardcoded username and password unlocked and which sent an `ov` flag the
 * backend honoured for anyone. This asks the backend from an existing level 9
 * session instead, and the backend checks the level from the database.
 *
 * Success is a sign-out followed by a sign-in as them, not a token swap. The
 * store is emptied the way Sign out empties it, so none of your own searches,
 * stores or page rows survive into their session, and then their session is
 * taken in by the same `applySession` the sign-in page uses. Their stores,
 * groups and last page load exactly as they would for them.
 *
 * Dev only because `/auth/impersonate` is on the dev API alone so far. The
 * session it opens is on dev for the same reason, and holds no prod or legacy
 * token: switching Mode while signed in as someone has nothing to switch to.
 * It lasts 60 minutes; Sign out ends it sooner.
 */
const SignInAsModal = ({ onClose }: { onClose: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const context = useAppSelector((state) => state.app);
  const [username, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const who = username.trim();
    if (!who || busy) return;
    setBusy(true);
    setProblem(null);
    impersonate(context.url, context.token, who)
      .then((resp) => {
        const j = resp.data;
        navigate("/");
        dispatch(resetAppSlice());
        dispatch(setFetchingCredentials(true));
        dispatch(setApiEnv("dev"));
        dispatch(setUsername(who));
        applySession(dispatch, j, "dev");
      })
      .catch((err) => {
        setBusy(false);
        setProblem(impersonateFailureText(err, who));
      });
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      modalClassName="bg-card_bg w-[400px] max-w-[94vw] flex flex-col"
    >
      <form onSubmit={go} className="flex flex-col gap-3 p-4">
        <div>
          <h2 className="text-[17px] font-semibold">Sign in as</h2>
          <p className="text-[12.5px] text-content/85 mt-1">
            You will see the app as they do, on dev, for up to an hour. Sign
            out to come back as yourself.
          </p>
        </div>
        <TextField
          label="Username"
          value={username}
          onChange={(v) => {
            setName(v);
            setProblem(null);
          }}
          placeholder="tjsmith"
        />
        {problem && (
          <p role="alert" className="text-[12px] text-red-700 m-0">
            {problem}
          </p>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[12.5px] font-medium px-4 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!username.trim() || busy}
            className="text-[12.5px] font-semibold px-5 py-1.5 rounded-lg bg-brand_navy text-custom-white hover:bg-brand_navy_hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Signing in..." : "Sign in as them"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SignInAsModal;
