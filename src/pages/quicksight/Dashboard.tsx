import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError } from "../../interfaces";

import { getEmbedUrl } from "../../api/quicksight";
import { setEmbedUrl } from "../../features/qsSlice";

import logo from "../../assets/dcr_counterctrl-favicon_512_lg.png";
import LoadingIndicator from "../../components/loading/LoadingIndicator";

const Dashboard = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const { email } = useAppSelector((state) => state.user);
  const { embedUrl } = useAppSelector(
    (state) => state.quicksight
  );

  useEffect(() => {
    dispatch(setEmbedUrl(""));
    getEmbedUrl(url, token, email)
      .then((resp) => {
        const j = resp.data;
        if (j.error == 0) {
          dispatch(setEmbedUrl(j.embed_url));
        } else {
          toast.warn("Failed to load dashboard")
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, []);

  return (
    <div data-testid="dashboard-page" className="h-[calc(100vh-3rem)]">
      {embedUrl ? (
        <iframe
          className="w-[calc(100vw-3rem)] h-[calc(100vh-3rem)]"
          src={embedUrl}
        />
      ) : (
        <div className="h-full flex flex-col justify-center items-center pb-28">
          <img className="h-56" src={logo} alt="Mikto" />
          <div className="relative bg-custom-white min-h-24 -mt-4 p-4 rounded-lg shadow-lg">
            <p className="text-content text-[17px]">
              Please wait while we load your dashboard...
            </p>
            <LoadingIndicator message="" className="mt-6" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
