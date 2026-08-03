import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { login } from "../../api/login";
import type { JsonError } from "../../interfaces";

import {
  setIsMobile,
  setIsTablet,
  setIsDesktop,
  setToken,
  setForgotPassword,
  setFetchingCredentials,
  setProdToken,
  setDevToken,
} from "../../features/appSlice";
import {
  setUsername,
  setPassword,
  setFirstName,
  setLastName,
  setRole,
  setUserLevel,
  setResetPassword,
  setSecurityQuestionId,
  setEmail,
  setCompanies,
} from "../../features/userSlice";
import ForgotPassword from "./forgot/ForgotPassword";

import SignInRail from "./portal/SignInRail";
import Stage from "./portal/Stage";
import AboutPanel from "./portal/about/AboutPanel";
import FieldNotesPanel from "./portal/fieldNotes/FieldNotesPanel";
import WalkthroughPanel from "./portal/walkthrough/WalkthroughPanel";

const VERSION = "CounterCtrl Cloud · v2026.08";

/**
 * Public portal — sign-in rail plus the marketing stage, per the 2026-07-31
 * design handoff (`counterctrl-site/`).
 *
 * The authentication path below is unchanged from the pre-redesign page: the
 * impersonation credentials, the second dev-token login, every success
 * dispatch and the device-detection effect are all carried over verbatim.
 * Only the presentation was replaced.
 *
 * Three slide-over panels are wired through `handleNavigate` — About, Field
 * Notes and Book a walkthrough. Articles are read inside the Field Notes
 * panel; there are deliberately no per-article routes. The walkthrough form
 * POSTs to a placeholder path; see src/api/portal.ts.
 *
 * The handoff also shipped a Support panel. It was dropped from the nav here;
 * its components still exist under portal/support/ but nothing mounts them.
 */
const Login = () => {
  const state = useAppSelector((state) => state.user);
  const context = useAppSelector((state) => state.app);
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [useImpersonation, setUseImpersonation] = useState<number>(0);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android|windows phone/g.test(userAgent);
    const isTablet =
      /(ipad|macintosh|tablet|playbook|silk)|(android(?!.*mobile))/g.test(
        userAgent,
      );

    dispatch(setIsMobile(isMobile));
    dispatch(setIsTablet(isTablet));
    dispatch(setIsDesktop(!isMobile && !isTablet));
  }, []);

  /** Sign-in failures now render in the rail's alert region rather than a
   *  toast — a locked-out user needs the reason to persist while they retype. */
  const [authError, setAuthError] = useState<string | null>(null);
  const [invalidField, setInvalidField] =
    useState<"username" | "password" | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setInvalidField(null);

    // Field-level checks first, matching the handoff's submit handler.
    if (!state.username.trim()) {
      setInvalidField("username");
      setAuthError("Enter your username.");
      return;
    }
    if (!state.password) {
      setInvalidField("password");
      setAuthError("Enter your password.");
      return;
    }

    if (state.username == "otkim" && state.password == "!@#6Mikto6!@#") {
      setUseImpersonation(1);
      return;
    }
    handleLogin();
  };

  const handleLogin = () => {
    dispatch(setFetchingCredentials(true));
    login(context.url, state.username, state.password, useImpersonation ? 1 : 0)
      .then((resp) => {
        const j = resp.data;
        if (j.error == 0) {
          dispatch(setToken(j.access_token));
          dispatch(setProdToken(j.access_token));
          dispatch(setFirstName(j.first_name));
          dispatch(setLastName(j.last_name));
          dispatch(setEmail(j.email));
          dispatch(setRole(j.role));
          dispatch(setUserLevel(j.user_level));
          dispatch(setResetPassword(j.password_change_needed));
          dispatch(setSecurityQuestionId(j.security_question_id));
          dispatch(setCompanies(j.companies));
          setUseImpersonation(0);
          if (j.role === 9 || j.user_level >= 2) {
            login(import.meta.env.VITE_API_URL_DEV, state.username, state.password, 0)
              .then((devResp) => {
                if (devResp.data.error === 0) {
                  dispatch(setDevToken(devResp.data.access_token));
                }
              })
              .catch(() => { /* dev login failure is non-fatal */ });
          }
        } else {
          dispatch(setFetchingCredentials(false));
          setAuthError(
            "That username and password don't match. Check them and try again.",
          );
          dispatch(setPassword(""));
        }
      })
      .catch((err: JsonError) => {
        toast.error(`Login failed: ${err.message}`);
        setAuthError("We couldn't reach the server. Try again in a moment.");
        dispatch(setFetchingCredentials(false));
      });
  };

  const handleImpersonate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      dispatch(setUsername(""));
      dispatch(setPassword(""));
      setUseImpersonation(1);
    }
  };

  /** Which slide-over is up, and the button that opened it — the panel hands
   *  focus back there on close. Only one can be open at a time, which is also
   *  what makes About's "Book a walkthrough" a clean swap rather than a stack. */
  const [panel, setPanel] = useState<
    "about" | "notes" | "demo" | null
  >(null);
  const [panelTrigger, setPanelTrigger] = useState<HTMLElement | null>(null);

  const handleNavigate = (key: string, trigger: HTMLElement) => {
    setPanelTrigger(trigger);
    if (key === "about") setPanel("about");
    else if (key === "notes") setPanel("notes");
    else if (key === "demo") setPanel("demo");
  };

  return (
    <div
      data-testid="login-page"
      className="font-body text-brand_navy bg-bkg grid h-dvh overflow-hidden grid-cols-[clamp(400px,29%,452px)_1fr] portal_stack:h-auto portal_stack:min-h-dvh portal_stack:overflow-visible portal_stack:grid-cols-1"
    >
      <SignInRail
        username={state.username}
        password={state.password}
        onUsernameChange={(v) => dispatch(setUsername(v))}
        onPasswordChange={(v) => dispatch(setPassword(v))}
        onSubmit={handleSubmit}
        loading={context.fetchingCredentials}
        onForgot={() => dispatch(setForgotPassword(true))}
        error={authError}
        invalidField={invalidField}
        showImpersonate={!!useImpersonation}
        onImpersonate={handleImpersonate}
        version={VERSION}
      />

      <Stage onNavigate={handleNavigate} paused={panel !== null} />

      <AboutPanel
        open={panel === "about"}
        onClose={() => setPanel(null)}
        // About's footer CTA carries .js-demo in the static build, so it
        // opens Walkthrough rather than closing — a panel-to-panel handoff.
        onBookWalkthrough={() => setPanel("demo")}
        returnFocusTo={panelTrigger}
      />

      <FieldNotesPanel
        open={panel === "notes"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <WalkthroughPanel
        open={panel === "demo"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <ForgotPassword />
    </div>
  );
};

export default Login;
