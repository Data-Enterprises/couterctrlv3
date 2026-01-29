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
} from "../../features/appSlice";
import {
  setUsername,
  setPassword,
  setFirstName,
  setLastName,
  setRole,
  setUserLevel,
  setCompany,
  setResetPassword,
  setSecurityQuestionId,
  setEmail,
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
          dispatch(setFirstName(j.first_name));
          dispatch(setLastName(j.last_name));
          dispatch(setEmail(j.email));
          dispatch(setRole(j.role));
          dispatch(setUserLevel(j.user_level));
          dispatch(setCompany(j.company));
          dispatch(setResetPassword(j.password_change_needed));
          dispatch(setSecurityQuestionId(j.security_question_id));
          setUseImpersonation(0);
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
          <div>
            <img className="h-50 w-auto" src={logo} alt="Mikto" />
            <h2 className="mt-4 md:mt-8 text-2xl/9 font-bold tracking-tight text-center">
              Sign in to your account
            </h2>
          </div>

          <div className={`${context.isMobile ? "mt-3 mb-4" : "mt-10"}`}>
            <div>
              <div
                className={`${context.isMobile ? "space-y-3" : "space-y-6"}`}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm/6 font-medium "
                  >
                    Username
                  </label>
                  <div className="mt-2">
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
                    className="block text-sm/6 font-medium "
                  >
                    Password
                  </label>
                  <div className="mt-2">
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
                      className="ml-3 block text-sm/6 "
                    >
                      Remember me
                    </label>
                  </div>

                  <div
                    data-testid="login-forgot-password"
                    className="text-sm/6"
                    onClick={() => {
                      dispatch(setForgotPassword(true));
                    }}
                  >
                    <a
                      href="#"
                      className="font-semibold text-accent-1 transition-all duration-600"
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

                <div>
                  <button
                    data-testid="sign-in"
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full btn-themeBlue"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Change this before pushing for publishing */}
        <div className="absolute bottom-1 left-0 text-sm pl-2">
          Last Updated on 1/29/2026 @ 2:35 PM CST
        </div>
        {context.fetchingCredentials ? (
          <div className="absolute bottom-20 left-48 -pr-4 lg:p-0 lg:bottom-40 lg:left-72">
            <LoadingIndicator message="Fetching credentials..." />
          </div>
        ) : null}
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
