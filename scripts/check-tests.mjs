// Keeps the tests/ tree honest (repo-health-guideline Part 1 §6).
//
//   node scripts/check-tests.mjs        (npm run check:tests)
//
// 1. No test is left inside a dev tree in src: they live in tests/dev.
// 2. Every test in tests/dev still has the source folder it mirrors:
//      tests/dev/pages/<page>/<rest>  <-  src/pages/<page>/dev/<rest>
//      tests/dev/components/<rest>    <-  src/components-dev/<rest>
//      tests/dev/features/<rest>      <-  src/features/dev/<rest>
//    A test whose folder is gone is an orphan: move it with its source or
//    delete it.
//
// Prod-tree and shared-code tests (src/utils, src/store, …) have not moved
// yet; this script does not look at them.
import { execSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const P = path.posix;
const isTest = (f) => /\.test\.tsx?$/.test(f);
const isDir = (d) => existsSync(d) && statSync(d).isDirectory();
const list = (where) =>
  execSync(`git ls-files -co --exclude-standard ${where}`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => f && existsSync(f));

let failures = 0;
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

// 1. Nothing left behind in the dev trees.
const leftBehind = list("src").filter(
  (f) =>
    isTest(f) &&
    (/^src\/pages\/.+?\/dev\//.test(f) ||
      f.startsWith("src/components-dev/") ||
      f.startsWith("src/features/dev/")),
);
leftBehind.forEach((f) => fail(`test inside a dev tree, move it to tests/dev: ${f}`));

// 2. Every tests/dev test mirrors a source folder that exists.
const sourceDirOf = (t) => {
  const dir = P.dirname(t);
  let m;
  if ((m = dir.match(/^tests\/dev\/components(\/.*)?$/))) return [`src/components-dev${m[1] ?? ""}`];
  if ((m = dir.match(/^tests\/dev\/features(\/.*)?$/))) return [`src/features/dev${m[1] ?? ""}`];
  if ((m = dir.match(/^tests\/dev\/pages\/(.+)$/))) {
    // The page may be nested (pages/shared/itemPerf), so try each split.
    const parts = m[1].split("/");
    return parts.map((_, i) =>
      ["src/pages", ...parts.slice(0, i + 1), "dev", ...parts.slice(i + 1)].join("/"),
    );
  }
  return null;
};

const testsDev = list("tests/dev").filter(isTest);
for (const t of testsDev) {
  const candidates = sourceDirOf(t);
  if (!candidates) fail(`not under tests/dev/{pages,components,features}: ${t}`);
  else if (!candidates.some(isDir)) fail(`orphan, no source folder ${candidates[candidates.length - 1]}: ${t}`);
}

console.log(
  failures
    ? `\n${failures} failure(s)`
    : `ok    ${testsDev.length} tests in tests/dev, each with its source folder; none left in the dev trees`,
);
process.exit(failures ? 1 : 0);
