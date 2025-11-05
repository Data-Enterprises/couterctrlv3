import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
// import { login, readPrefs } from "../../apis/login";
// import type { JsonError } from "../../interfaces";
import { useNavigate } from "react-router";
import logo from "../../assets/dcr_counterctrl-logo.png";

import React, { useEffect, useState } from "react";
import {
  setIsMobile,
  setIsTablet,
  setIsDesktop,
  setLoggedIn,
  setToken,
  setScope,
  setPasswordChangeNeeded,
  setForgotPassword,
} from "../../features/appSlice";
import { setLastRoute, setActiveMenuItem } from "../../features/navSlice";
import { setUsername, setPassword } from "../../features/userSlice";
// import ForgotPassword from "../../components/ForgotPassword";

const Login = () => {
  const state = useAppSelector((state) => state.user);
  const context = useAppSelector((state) => state.app);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [impersonate, setImpersonate] = useState(false);
  const [rememberme, setrememberme] = useState(false);
  const [useImpersonation, setUseImpersonation] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipod|android|windows phone/g.test(userAgent);
    const isTablet =
      /(ipad|macintosh|tablet|playbook|silk)|(android(?!.*mobile))/g.test(
        userAgent
      );

    dispatch(setIsMobile(isMobile));
    dispatch(setIsTablet(isTablet));
    dispatch(setIsDesktop(!isMobile && !isTablet));
  }, []);

  const handleSubmit = (
    e:
      | React.KeyboardEvent<HTMLInputElement>
      | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    // if (state.username === "otkim" && state.password === "!@#6Mikto6!@#") {
    //   setImpersonate(true);
    //   return;
    // }
  };

  // const getPrefs = (token: string) => {
  //   readPrefs(context.url, token)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error == "0") {
  //         const prefs = j.prefs[0];
  //         dispatch(setLastSearch(prefs.rLastSearch));
  //         dispatch(setLastSearchType(prefs.lastSearchType));
  //         dispatch(setType(prefs.lastSearchType as SEARCH_TYPE));
  //         dispatch(setLastStore(prefs.rLastSearch));
  //         dispatch(setLastGroup(prefs.lastGroup));
  //         dispatch(setScope(prefs.scope));

  //         // now dispatch these for the stors
  //         switch (prefs.lastSearchType) {
  //           case "1":
  //             dispatch(setSearchType("Single Store"));
  //             break;
  //           case "2":
  //             dispatch(setSearchType("Single Store"));
  //             break;
  //           case "3":
  //             dispatch(setSearchType("Group"));
  //             break;
  //           case "4":
  //             dispatch(setSearchType("Version"));
  //             break;
  //           case "5":
  //             dispatch(setSearchType("Sub Group"));
  //             break;
  //           case "6":
  //             dispatch(setSearchType("Store Id"));
  //             break;
  //           case "7":
  //             dispatch(setSearchType("Store #"));
  //             break;
  //           default:
  //             dispatch(setSearchType("Single Store"));
  //             break;
  //         }
  //         dispatch(setSingleSearchString(prefs.rLastSearch));
  //         dispatch(setStoreid(prefs.rLastSearch));
  //         dispatch(setSelectedScope(prefs.scope));
  //         dispatch(setLastRoute(prefs.lastRoute));
  //         dispatch(setScopes(j.scopes));
  //         const scope = j.scopes.find((s) => s.id === prefs.scope);
  //         if (scope) {
  //           dispatch(setSelectedScope(scope));
  //         }

  //         if (prefs.passwordChangeNeeded === "1") {
  //           dispatch(setPasswordChangeNeeded(true));
  //         }

  //         if (prefs.lastRoute) {
  //           navigate("/home/" + prefs.lastRoute);
  //           const caps =
  //             prefs.lastRoute.charAt(0).toUpperCase() +
  //             prefs.lastRoute.substr(1).toLowerCase();
  //           dispatch(setActiveMenuItem(caps));
  //         } else {
  //           navigate("/home/sales");
  //         }
  //       } else {
  //         toast.warn(j.msg);
  //       }
  //     })
  //     .catch((err: JsonError) => {
  //       toast.error(err.message);
  //     });
  // };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleImpersonate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      dispatch(setUsername(""));
      dispatch(setPassword(""));
      setUseImpersonation(true);
    }
  };

  const oldStyle =
    "flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24";

  // const newStyle =
  //   "flex flex-1 flex-col justify-center px-4 my-16 mx-16 sm:px-6 lg:flex-none rounded-3xl bg-custom-white/30 shadow-xl";

  const handleFakeLogin = () => {
    navigate("/home");
  };

  return (
    <div data-testid="login-page" className="flex min-h-full justify-center">
      <div className={`${oldStyle}`}>
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
                      className="basic-input bg-custom-white"
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
                      className="basic-input bg-custom-white"
                      onKeyPress={handleKeyPress}
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

                {impersonate ? (
                  <div className="row justify-content-center">
                    <div className="bg-bkg">
                      <input
                        type="checkbox"
                        style={{ opacity: "1", visibility: "visible" }}
                        className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        value={rememberme as unknown as string}
                        onChange={handleImpersonate}
                        id="check1"
                      />
                      <label className="" htmlFor="check1">
                        Impersonate User
                      </label>
                    </div>
                  </div>
                ) : null}

                <div>
                  <button
                    data-testid="sign-in"
                    // onClick={handleSubmit}
                    onClick={handleFakeLogin} // Just for demo purposes
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
          Last Updated on 10/27/2025 @ 8:43am
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 size-full object-cover"
          src="dashboard.jpg"
          alt=""
        />
      </div>
      {/* <ForgotPassword
        open={context.showForgotPassword}
        setOpen={(x) => {
          dispatch(setForgotPassword(x));
        }}
      /> */}
    </div>
  );
};

export default Login;
