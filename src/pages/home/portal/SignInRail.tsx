import React from "react";
import PasswordField from "./PasswordField";
import { SIGN_IN_COPY } from "./portalContent";
import logo from "../../../assets/portal/logo.webp";

interface Props {
  username: string;
  password: string;
  onUsernameChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  /** Native form submit — Enter and the button both land here. */
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  onForgot: () => void;
  /** Shown in the alert region above the fields. */
  error: string | null;
  /** Which field submit rejected, so it can be outlined. */
  invalidField: "username" | "password" | null;
  /** Only surfaced once the impersonation credentials are entered — see
   *  handleSubmit in Login.tsx. */
  showImpersonate: boolean;
  onImpersonate: (e: React.ChangeEvent<HTMLInputElement>) => void;
  version: string;
  /** Opens the Terms panel. Passes its own element up so focus returns
   *  here on close, same contract as the stage buttons. */
  onTerms: (trigger: HTMLElement) => void;
  onPrivacy: (trigger: HTMLElement) => void;
}

/** The `.gate` — fixed left rail of the portal.
 *
 *  Presentational only. Username and password still live in userSlice exactly
 *  as they did before the redesign, so this takes them as props and reports
 *  changes upward; none of the auth logic moved.
 *
 *  It is a real <form> as of the Aug 2026 handoff revision: Enter submits
 *  natively, the fields carry `name` attributes so password managers offer to
 *  save, and failures surface in a `role="alert"` region above the fields
 *  rather than as a toast that disappears.
 *
 *  The full-card LoadingIndicator is gone with it — the button now carries the
 *  busy state (spinner + aria-busy), which keeps the error region and the
 *  entered values visible while the request is in flight. */
const SignInRail = ({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  loading,
  onForgot,
  error,
  invalidField,
  showImpersonate,
  onImpersonate,
  version,
  onTerms,
  onPrivacy,
}: Props) => (
  <section className="relative bg-custom-white flex flex-col overflow-hidden h-dvh border-r border-brand_line portal_stack:h-auto portal_stack:overflow-visible portal_stack:border-r-0 portal_stack:border-b">
    <div className="flex-1 min-h-0 flex flex-col justify-center px-[46px] py-8 w-full max-w-[430px] mx-auto portal_short:py-6 portal_stack:px-[26px] portal_stack:pt-[34px] portal_stack:pb-[26px]">
      <div className="mb-[34px] portal_short:mb-[26px] portal_shorter:mb-5">
        <img src={logo} alt="CounterCtrl Cloud" className="block w-[242px] max-w-[84%] h-auto" />
      </div>

      <div>
        <h1 className="font-display text-[25px] portal_shorter:text-[22px] font-extrabold text-brand_navy tracking-[-0.03em] leading-[1.12]">
          {SIGN_IN_COPY.heading}
        </h1>
        <p className="text-[13.5px] text-brand_slate mt-2 leading-[1.6]">
          {SIGN_IN_COPY.subheading}
        </p>
      </div>

      <form className="mt-[26px]" onSubmit={onSubmit} noValidate>
        {error && (
          <p
            role="alert"
            className="mb-4 text-[13px] leading-[1.55] text-brand_danger bg-brand_danger_bg border border-brand_danger_line rounded-lg px-3.5 py-2.5"
          >
            {error}
          </p>
        )}

        <div className="mb-[15px]">
          <label htmlFor="username" className="block text-[12.5px] font-semibold mb-[7px] text-brand_navy">
            {SIGN_IN_COPY.usernameLabel}
          </label>
          <input
            data-testid="username"
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            required
            value={username}
            disabled={loading}
            onChange={(e) => onUsernameChange(e.target.value)}
            className={`w-full px-3.5 py-3 font-body text-[15px] text-brand_navy bg-custom-white border rounded-lg outline-none transition-colors placeholder:text-brand_placeholder focus:border-brand_green focus:shadow-[0_0_0_3.5px_rgba(30,158,82,0.15)] ${
              invalidField === "username" ? "border-brand_danger" : "border-brand_line_2"
            }`}
          />
        </div>

        <PasswordField
          value={password}
          onChange={onPasswordChange}
          disabled={loading}
          invalid={invalidField === "password"}
        />

        <div className="flex items-center justify-between mt-1 mb-[18px]">
          <label className="flex items-center gap-2 text-[13.5px] text-brand_slate cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              className="w-[15px] h-[15px] accent-brand_green cursor-pointer"
            />
            {SIGN_IN_COPY.remember}
          </label>
          <button
            data-testid="login-forgot-password"
            type="button"
            onClick={onForgot}
            className="text-[13.5px] font-medium text-brand_green_dark hover:underline cursor-pointer"
          >
            {SIGN_IN_COPY.forgot}
          </button>
        </div>

        {showImpersonate && (
          <div className="flex items-center gap-2 mb-4 px-2.5 py-2 rounded-lg bg-bkg border border-brand_line">
            <input
              data-testid="impersonate-checkbox"
              id="impersonate"
              type="checkbox"
              className="w-[15px] h-[15px] accent-brand_green cursor-pointer"
              onChange={onImpersonate}
            />
            <label htmlFor="impersonate" className="text-[13.5px] text-brand_slate cursor-pointer">
              Impersonate user
            </label>
          </div>
        )}

        <button
          data-testid="sign-in"
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full flex items-center justify-center gap-2.5 font-display font-semibold text-[15px] text-custom-white bg-brand_navy rounded-lg px-[18px] py-3 transition-colors hover:bg-brand_navy_hover disabled:opacity-70 cursor-pointer"
        >
          {loading && (
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-full border-2 border-custom-white/35 border-t-custom-white animate-spin motion-reduce:animate-none"
            />
          )}
          {loading ? SIGN_IN_COPY.submitting : SIGN_IN_COPY.submit}
        </button>

        <p className="text-[12.5px] text-brand_slate text-center mt-[18px]">
          {SIGN_IN_COPY.note}
        </p>
      </form>
    </div>

    <div className="flex-none border-t border-brand_line bg-brand_paper px-[46px] py-[15px] portal_stack:px-[26px]">
      <span className="block font-mono text-[9.5px] tracking-[0.1em] uppercase text-brand_slate_2">
        {version}
      </span>
      <div className="flex items-center gap-2.5 mt-1.5 font-mono text-[9.5px] tracking-[0.1em] uppercase text-brand_slate_2">
        <button
          type="button"
          onClick={(e) => onTerms(e.currentTarget)}
          className="hover:text-brand_green_dark hover:underline cursor-pointer"
        >
          Terms &amp; Conditions
        </button>
        <span aria-hidden="true" className="text-brand_line_2">
          ·
        </span>
        <button
          type="button"
          onClick={(e) => onPrivacy(e.currentTarget)}
          className="hover:text-brand_green_dark hover:underline cursor-pointer"
        >
          Privacy Policy
        </button>
      </div>
    </div>
  </section>
);

export default SignInRail;
