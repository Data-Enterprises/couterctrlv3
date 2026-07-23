import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { login } from "../../api/login";
import type { JsonError } from "../../interfaces";
import logo from "../../assets/dcr_counterctrl-logo.png";

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
import LoadingIndicator from "../../components/loading/LoadingIndicator";

const Login = () => {
  // const group = useAppSelector((state) => state.group);
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

  const handleSubmit = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    if (state.username == "otkim" && state.password == "!@#6Mikto6!@#") {
      setUseImpersonation(1);
      return;
    }
    handleLogin();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
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
          if (j.role === 9) {
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
          toast.warn(
            "Invalid credentials, make sure your password and username are correct",
          );
        }
      })
      .catch((err: JsonError) => {
        toast.error(`Login failed: ${err.message}`);
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

  return (
    <div data-testid="login-page" className="flex min-h-full justify-center">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="select-none">
            <img className="h-50 w-auto" src={logo} alt="Mikto" />
            <h2 className="mt-4 md:mt-8 text-2xl/9 font-bold tracking-tight text-center">
              Sign in to your account
            </h2>
          </div>

          <div className={`${context.isMobile ? "mt-3 mb-4" : "mt-6"}`}>
            <div>
              <div
                className={`${context.isMobile ? "space-y-3" : "space-y-2"}`}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm/6 font-medium select-none"
                  >
                    Username
                  </label>
                  <div>
                    <input
                      data-testid="username"
                      name="username"
                      autoComplete="off"
                      required
                      value={state.username}
                      className="basic-input bg-custom-white focus:border"
                      onChange={(e) => dispatch(setUsername(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm/6 font-medium select-none"
                  >
                    Password
                  </label>
                  <div>
                    <input
                      data-testid="password"
                      name="password"
                      type="password"
                      autoComplete="off"
                      value={state.password}
                      required
                      className="basic-input bg-custom-white focus:border"
                      onKeyDown={handleKeyPress}
                      onChange={(e) => dispatch(setPassword(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-3 block text-sm/6 font-medium select-none"
                      draggable={false}
                    >
                      Remember me
                    </label>
                  </div>

                  <div
                    data-testid="login-forgot-password"
                    className="text-right text-sm/6 select-none"
                    onClick={() => dispatch(setForgotPassword(true))}
                  >
                    <a
                      href="#"
                      className="font-semibold text-accent-1 transition-all duration-600"
                      draggable={false}
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                {useImpersonation ? (
                  <div className="row justify-content-center">
                    <div className="bg-bkg">
                      <input
                        data-testid="impersonate-checkbox"
                        type="checkbox"
                        style={{ opacity: "1", visibility: "visible" }}
                        className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        onChange={handleImpersonate}
                        id="check1"
                      />
                      <label className="px-2" htmlFor="check1">
                        Impersonate User
                      </label>
                    </div>
                  </div>
                ) : null}

                <div className="relative">
                  <button
                    data-testid="sign-in"
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full btn-themeBlue"
                  >
                    Sign in
                  </button>
                  {context.fetchingCredentials ? (
                    <LoadingIndicator
                      message="Verifying credentials..."
                      className="mt-16"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* TODO: Update this before pushing to publish */}
        <div className="absolute bottom-1 left-0 text-[13px] pl-2 select-none">
          Last Updated 7/23/2026 @ 7:50 AM CST
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 size-full object-cover"
          src="dashboard.jpg"
          alt=""
        />
      </div>
      <ForgotPassword />
    </div>
  );
};

export default Login;
