import React, { useState, useEffect, useRef } from "react";
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
import TermsPanel from "./portal/terms/TermsPanel";
import PrivacyPanel from "./portal/privacy/PrivacyPanel";
import PerspectivesPanel from "./portal/perspectives/PerspectivesPanel";
import {
  readRememberedUsername,
  saveRememberedUsername,
  clearRememberedUsername,
} from "./portal/rememberedUser";
import type { SeatId } from "./portal/perspectives/perspectivesContent";
import { getBlogs, getBlogFile } from "../../api/portal";
import { POSTS, toPosts, type Post } from "../../content/posts";

const VERSION = "Last updated 8/4/2026 @ 5:11 PM CST";

/** PLACEHOLDER: `/html_pages/` only exists on the dev API today, and this page
 *  runs before sign-in — `context.url` is always VITE_API_URL_PROD here, since
 *  devMode can't be toggled until a session exists. Swap this for `context.url`
 *  once the endpoint ships to prod. */
const BLOG_API = import.meta.env.VITE_API_URL_DEV;

/**
 * Public portal — sign-in rail plus the marketing stage, per the 2026-07-31
 * design handoff (since removed from the repo — see git history, and
 * handoff-DEV-NOTES.md / handoff-PORTAL-README.md at the root).
 *
 * The authentication path below is unchanged from the pre-redesign page: the
 * impersonation credentials, the second dev-token login, every success
 * dispatch and the device-detection effect are all carried over verbatim.
 * Only the presentation was replaced.
 *
 * Four slide-over panels are wired through `handleNavigate` — About, Field
 * Notes, Book a walkthrough, and Terms and Conditions. The first three open
 * from the stage; Terms opens from the rail's footer. Articles are read inside
 * the Field Notes panel; there are deliberately no per-article routes.
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

  /** Field Notes content. Starts as the copy bundled with the build so the
   *  panel is populated the instant it opens, then swaps to the bucket's copy
   *  if that fetch succeeds — a new post appears without a deploy, and a
   *  failure leaves the panel intact rather than empty.
   *
   *  Fetched on first open rather than on mount, per DEV-HANDOFF §2 — most
   *  visitors here are signing in and never open the panel, and this payload
   *  has no business on the login page's critical path. */
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const blogsRequested = useRef(false);

  const loadBlogs = () => {
    if (blogsRequested.current) return;
    blogsRequested.current = true;
    // Two hops: the endpoint lists the bucket's objects and their public URLs,
    // then the content is fetched from S3 directly. Returning the inner promise
    // keeps both hops inside the one catch below.
    getBlogs(BLOG_API)
      .then((resp) => {
        const file = resp.data?.files?.find((f) => f.filename === "posts.json");
        if (!file) return;
        return getBlogFile(file.url).then((r) => {
          const incoming = toPosts(r.data);
          if (incoming.length) setPosts(incoming);
        });
      })
      .catch(() => { /* bundled copy stands; never blank out the panel */ });
  };

  /** Sign-in failures now render in the rail's alert region rather than a
   *  toast — a locked-out user needs the reason to persist while they retype. */
  /** "Remember me". Seeded from localStorage so the box reflects reality on
   *  arrival rather than defaulting to off next to a prefilled username. */
  const [remember, setRemember] = useState<boolean>(() => !!readRememberedUsername());

  // Prefill on landing. Runs once; if nothing is stored this is a no-op and
  // the field stays empty.
  useEffect(() => {
    const saved = readRememberedUsername();
    if (saved) dispatch(setUsername(saved));
    // Mount only — re-running would fight the user as they edit the field.
  }, [dispatch]);

  /** Unticking clears immediately, rather than waiting for a login that may
   *  never come — on a shared terminal that wait is the whole problem. */
  const handleRememberChange = (on: boolean) => {
    setRemember(on);
    if (!on) clearRememberedUsername();
  };

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
          // Saved here, not on change: only a username that actually signed in
          // is worth prefilling next time.
          if (remember) saveRememberedUsername(state.username);
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
    "about" | "notes" | "demo" | "terms" | "privacy" | "perspectives" | null
  >(null);
  const [panelTrigger, setPanelTrigger] = useState<HTMLElement | null>(null);
  /** Which Perspectives seat is showing. Lives here rather than in the panel
   *  because the strip opens the panel and picks the seat in one click. */
  const [seat, setSeat] = useState<SeatId>("exec");

  /** Perspectives hands off to About and to Walkthrough. Unlike About's own
   *  handoff, PERSPECTIVES-IMPLEMENTATION.md asks for the panel to close first
   *  and the next one to open after the slide-out — 330ms, just past the 300ms
   *  transform — so the two panels don't cross-fade their contents. */
  const handoff = (next: "about" | "demo") => {
    setPanel(null);
    setTimeout(() => setPanel(next), 330);
  };

  const handleNavigate = (key: string, trigger: HTMLElement) => {
    setPanelTrigger(trigger);
    if (key === "about") setPanel("about");
    else if (key === "notes") {
      loadBlogs();
      setPanel("notes");
    } else if (key === "demo") setPanel("demo");
    else if (key === "terms") setPanel("terms");
    else if (key === "privacy") setPanel("privacy");
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
        remember={remember}
        onRememberChange={handleRememberChange}
        error={authError}
        invalidField={invalidField}
        showImpersonate={!!useImpersonation}
        onImpersonate={handleImpersonate}
        version={VERSION}
        onTerms={(t) => handleNavigate("terms", t)}
        onPrivacy={(t) => handleNavigate("privacy", t)}
      />

      <Stage
        onNavigate={handleNavigate}
        onOpenPerspective={(s, trigger) => {
          setPanelTrigger(trigger);
          setSeat(s);
          setPanel("perspectives");
        }}
        paused={panel !== null}
      />

      <PerspectivesPanel
        open={panel === "perspectives"}
        onClose={() => setPanel(null)}
        seat={seat}
        onSeatChange={setSeat}
        onOpenAbout={() => handoff("about")}
        onOpenWalkthrough={() => handoff("demo")}
        returnFocusTo={panelTrigger}
      />

      <AboutPanel
        open={panel === "about"}
        onClose={() => setPanel(null)}
        // About's footer CTA carries .js-demo in the static build, so it
        // opens Walkthrough rather than closing — a panel-to-panel handoff.
        onBookWalkthrough={() => setPanel("demo")}
        returnFocusTo={panelTrigger}
      />

      <FieldNotesPanel
        posts={posts}
        open={panel === "notes"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <WalkthroughPanel
        open={panel === "demo"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <TermsPanel
        open={panel === "terms"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <PrivacyPanel
        open={panel === "privacy"}
        onClose={() => setPanel(null)}
        returnFocusTo={panelTrigger}
      />

      <ForgotPassword />
    </div>
  );
};

export default Login;
