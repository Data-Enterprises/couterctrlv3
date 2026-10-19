#!/usr/bin/env node
/**
 * The dev server, reachable from a handheld over USB.
 *
 *   npm run dev:mobile
 *
 * Wires `adb reverse` so the device's own `localhost:5173` is this machine's
 * dev server, then starts Vite on it. Open `http://localhost:5173` in Chrome on
 * the device; `chrome://inspect/#devices` here gives it full DevTools.
 *
 * Why over USB rather than the LAN address: `http://<lan-ip>` is not a secure
 * context, and the two APIs the scanning pages are built on are gated on one.
 * `navigator.mediaDevices` is undefined, so the camera cannot start, and
 * `navigator.userAgentData` is undefined, so scan-gun hardware reads as an
 * ordinary phone and the capture field never arms itself. Over adb the origin
 * is `http://localhost`, which browsers trust, and both work — which is the
 * whole reason this script exists instead of a note telling you to use --host.
 *
 * The three failures this script turns into sentences, all of which otherwise
 * surface on the device as a bare ERR_EMPTY_RESPONSE with nothing to go on:
 * no device attached, a device that has not accepted the debugging prompt, and
 * Vite landing on another port because 5173 was busy.
 */
import { execFileSync, spawn } from "node:child_process";
import { connect } from "node:net";

/**
 * Pinned, and `--strictPort` with it.
 *
 * The reverse names one port. If Vite rolled to 5174 because something already
 * had 5173, the tunnel would point at nothing and the device would show an
 * empty response — a failure that looks identical to the server being down.
 * Better to refuse to start and say which port is taken.
 */
const PORT = 5173;

const red = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

const die = (message, hint) => {
  console.error(`\n${red("✗")} ${message}`);
  if (hint) console.error(`  ${dim(hint)}`);
  console.error("");
  process.exit(1);
};

const adb = (...args) =>
  execFileSync("adb", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

/**
 * The attached device, or a reason there isn't one.
 *
 * `adb devices` lists a state beside each serial. "device" is ready;
 * "unauthorized" means the USB debugging prompt on the handheld has not been
 * accepted, which is far and away the most common reason this does not work
 * and says nothing useful by itself.
 */
const attachedDevice = () => {
  let out;
  try {
    out = adb("devices");
  } catch {
    die(
      "adb is not on PATH.",
      "It ships with Android platform-tools. Vysor installs a copy of its own.",
    );
  }

  const rows = out
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [serial, state] = line.split(/\s+/);
      return { serial, state };
    });

  const ready = rows.filter((r) => r.state === "device");
  const unauthorized = rows.filter((r) => r.state === "unauthorized");

  if (!rows.length) {
    die("No device attached.", "Plug the handheld in over USB and enable USB debugging.");
  }
  if (!ready.length && unauthorized.length) {
    die(
      "The device is attached but has not authorised this computer.",
      'Unlock it and accept the "Allow USB debugging?" prompt, then run this again.',
    );
  }
  if (!ready.length) {
    die(
      `The device is attached but not ready (${rows.map((r) => r.state).join(", ")}).`,
      "Unplug it and plug it back in.",
    );
  }
  // More than one is fine as long as the choice is deliberate: adb refuses to
  // act on an ambiguous target rather than guessing, and so does this.
  if (ready.length > 1 && !process.env.ANDROID_SERIAL) {
    die(
      `${ready.length} devices are attached: ${ready.map((r) => r.serial).join(", ")}.`,
      "Set ANDROID_SERIAL to the one you mean, then run this again.",
    );
  }
  return process.env.ANDROID_SERIAL ?? ready[0].serial;
};

const serial = attachedDevice();

try {
  adb("-s", serial, "reverse", `tcp:${PORT}`, `tcp:${PORT}`);
} catch (err) {
  die(`Could not set up the tunnel on ${serial}.`, String(err?.stderr ?? err).trim());
}

console.log(`
${bold("Dev server, on the handheld")}

  device    ${serial}
  tunnel    device localhost:${PORT} → this machine
  open      ${bold(`http://localhost:${PORT}`)}  ${dim("in Chrome on the device")}
  devtools  chrome://inspect/#devices  ${dim("here, not on the device")}

${dim(`Use localhost on the device, not this machine's IP — the LAN address is not a`)}
${dim(`secure context, and the camera and scan-gun detection both need one.`)}
`);

/**
 * Is a dev server already up on the port the tunnel points at?
 *
 * Checked on `127.0.0.1` specifically, because that is the address adb dials:
 * a server listening only on `::1` is not one this tunnel can reach, and has
 * to read as "nothing there" rather than "already running".
 */
const serverAlreadyUp = () =>
  new Promise((resolve) => {
    const socket = connect({ host: "127.0.0.1", port: PORT });
    const settle = (up) => {
      socket.destroy();
      resolve(up);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });

/**
 * Replugging the handheld drops the tunnel but leaves the dev server running,
 * which is the common case by a mile — so re-running this must mean "put the
 * tunnel back", not "start a second server". Starting one would fail on
 * `--strictPort` anyway, and the exit handler below would then tear down the
 * tunnel this run had just set, leaving things worse than before it ran.
 */
if (await serverAlreadyUp()) {
  console.log(
    `${dim(`A dev server is already serving ${PORT}. Tunnel is set — leave it running.`)}\n`,
  );
  process.exit(0);
}

/**
 * `--check` stops here: tunnel wired, nothing started.
 *
 * The device half of this is what breaks, and it breaks while the server is
 * running happily — so being able to prove the tunnel without taking over a
 * terminal is worth the four lines.
 */
if (process.argv.includes("--check")) {
  console.log(`${dim("--check: tunnel is up, server not started.")}\n`);
  process.exit(0);
}

/**
 * Vite, on IPv4 loopback.
 *
 * `vite.config.ts` already pins this, and it is repeated here so the script
 * stays correct if that default is ever relaxed: Node on Windows resolves
 * "localhost" to `::1`, while `adb reverse` connects upstream over `127.0.0.1`,
 * and a server bound only to IPv6 is a server the tunnel cannot reach.
 *
 * `shell: true` for the .cmd shim npm writes on Windows. Every argument here is
 * a literal — nothing from the environment reaches the command line.
 */
const vite = spawn(
  `npx vite --host 127.0.0.1 --port ${PORT} --strictPort`,
  { stdio: "inherit", shell: true },
);

/**
 * Take the tunnel down on the way out.
 *
 * A reverse outlives the process that set it, so leaving it in place means a
 * later session finds the device pointed at a port with nothing behind it —
 * the same empty response, with no running server to suspect.
 */
const cleanUp = () => {
  try {
    adb("-s", serial, "reverse", "--remove", `tcp:${PORT}`);
  } catch {
    /* the device may already be unplugged, which removes it anyway */
  }
};

process.on("SIGINT", () => vite.kill("SIGINT"));
process.on("SIGTERM", () => vite.kill("SIGTERM"));
vite.on("exit", (code) => {
  cleanUp();
  process.exit(code ?? 0);
});
