import { useEffect, useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import Modal from "../../../components-dev/Modal";
import { useExportBuilderCtx } from "./hooks";
import {
  clearBuilds,
  openDownloads,
} from "../../../features/dev/devExportBuilderSlice";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Minutes left on a link, which can be negative. */
const minutesLeft = (builtAt: number, expiresIn: number, now: number) =>
  Math.round(expiresIn - (now - builtAt) / 60_000);

const builtAtLabel = (builtAt: number) =>
  new Date(builtAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

/**
 * Every file built this session, while its link lasts.
 *
 * The links are presigned and expire — an hour, usually — so this is a shelf
 * rather than a library: it holds what is still downloadable and says plainly
 * when something is not. Nothing here survives a reload, because nothing on
 * the other end would either.
 *
 * It exists because building the second file used to take the first one off
 * the screen. A week of stores is often four files, and rebuilding three of
 * them because the fourth finished is an hour nobody has.
 */
const DownloadsModal = () => {
  const ctx = useExportBuilderCtx();
  const [now, setNow] = useState(() => Date.now());

  // The countdowns are the point of the list, so they tick.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(timer);
  }, []);

  const close = () => ctx.dispatch(openDownloads(false));

  return (
    <Modal
      isOpen
      onClose={close}
      modalClassName="bg-card_bg w-[760px] max-w-[94vw] max-h-[80vh]"
    >
      <div className="flex flex-col gap-3 p-4 min-h-0">
        <div className="flex items-baseline gap-3 flex-shrink-0">
          <h2 className="text-[15px] font-semibold">Files you have built</h2>
          <span className="text-[11.5px] text-content/60">
            this session · links expire, the files do not come back
          </span>
          <div className="flex-1" />
          {ctx.builds.length > 0 && (
            <button
              type="button"
              onClick={() => ctx.dispatch(clearBuilds())}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg border border-brand_line_2 hover:border-brand_slate transition-colors"
            >
              Clear the list
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className="text-[12px] font-medium px-3 py-1.5 rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar flex flex-col gap-2">
          {ctx.builds.map((build) =>
            build.files.map((file) => {
              const left = minutesLeft(
                build.builtAt,
                build.urlExpiresInMinutes,
                now,
              );
              const expired = left <= 0;
              return (
                <div
                  key={`${build.id}-${file.key}`}
                  className={`flex items-center gap-3 border rounded-xl px-3 py-2.5 ${
                    expired
                      ? "border-brand_line bg-custom-white opacity-70"
                      : "border-brand_green bg-card_bg"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      expired ? "bg-brand_line" : "bg-brand_green_tint"
                    }`}
                  >
                    <ArrowDownTrayIcon
                      className={`w-4 h-4 ${
                        expired ? "text-content/40" : "text-brand_green"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">
                      {file.key.split("/").pop()}
                    </div>
                    <div className="text-[11.5px] text-content/70 mt-0.5 truncate">
                      {build.label}
                    </div>
                    <div className="text-[11px] text-content/55 mt-0.5">
                      {build.rowsUploaded.toLocaleString()} rows · {mb(file.bytes)}{" "}
                      · built at {builtAtLabel(build.builtAt)}
                    </div>
                  </div>
                  {expired ? (
                    <span className="text-[11.5px] text-content/60 text-right max-w-[15ch]">
                      Link has expired — build it again
                    </span>
                  ) : (
                    <>
                      <span className="text-[11.5px] font-semibold text-amber-900">
                        {left} min left
                      </span>
                      <a
                        href={file.url}
                        download
                        className="bg-[#1e2a4a] hover:bg-[#2a3a63] text-custom-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        Download
                      </a>
                    </>
                  )}
                </div>
              );
            }),
          )}

          {ctx.builds.length === 0 && (
            <div className="py-8 text-center">
              <div className="text-[13px] font-semibold">Nothing built yet</div>
              <div className="text-[12.5px] text-content/70 mt-1.5">
                Files you build land here and stay while their links last, so
                the next one does not take the last one away.
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DownloadsModal;
