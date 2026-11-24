/**
 * The dev -> prod rewrite every promotion script shares, so promote-page and
 * promote-lib can never swap a file two different ways.
 *
 *   src/components-dev/X          -> src/components/X
 *   features/dev/devXSlice        -> features/xSlice
 *   <unit>/dev/X (a split unit)   -> <unit>/prod/X
 *   state.dev.<key>               -> state.prod.<key>
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { specFor, SPEC_RE } from "./relocate.mjs";

const P = path.posix;
export const LIB = "src/components/";
export const DEVLIB = "src/components-dev/";

/** The swaps, bound to a resolver over the repo's files (relocate's makeResolver). */
export const makePromoter = (resolve) => {
  // dev path -> prod path, for every kind of dev-only file.
  const toProd = (f) => {
    if (f.startsWith(DEVLIB)) return LIB + f.slice(DEVLIB.length);
    const slice = f.match(/^src\/features\/dev\/dev(\w)(\w*Slice\.tsx?)$/);
    if (slice) return `src/features/${slice[1].toLowerCase()}${slice[2]}`;
    const unit = f.match(/^(src\/pages\/.+?)\/dev\/(.+)$/);
    if (unit && existsSync(`${unit[1]}/prod`)) return `${unit[1]}/prod/${unit[2]}`;
    return f;
  };

  // Rewrite a dev file's text for its prod location.
  const selectorParams = (src) => {
    const ps = new Set();
    for (const m of src.matchAll(/useAppSelector\(\s*\(?\s*(\w+)/g)) ps.add(m[1]);
    for (const m of src.matchAll(/\b(\w+)\s*:\s*RootState\b/g)) ps.add(m[1]);
    return ps;
  };
  const promoteText = (from, src) => {
    const to = toProd(from);
    let out = src.replace(SPEC_RE, (m, head, q, spec) => {
      const r = resolve(from, spec);
      if (!r) return m;
      const next = specFor(to, toProd(r.target), r.suffix);
      return next === spec ? m : `${head}${q}${next}${q}`;
    });
    // `s.dev.x` and `...s.dev.x`, but not a property `a.s.dev.x`.
    for (const p of selectorParams(out))
      out = out.replace(new RegExp(`(?<![\\w$])(?<!(?<!\\.\\.)\\.)${p}\\.dev\\.`, "g"), `${p}.prod.`);
    out = out.replace(/getState\(\)\.dev\./g, "getState().prod.");
    return out.replace(/\bThe dev tree\b/g, "The prod tree").replace(/\bdev tree\b/g, "prod tree");
  };

  // A dev slice back to its prod form: no "Dev copy" header, the prod name.
  const promoteSlice = (from, src, prodName) => {
    let out = promoteText(from, src);
    out = out.replace(/^\/\*\*\r?\n \* Dev copy of [\s\S]*?\*\/\r?\n/, "");
    out = out.replace(
      /^([ \t]*)\/\/ Distinct from the prod slice's "\w+"[^\n]*\n[ \t]*\/\/ string alone[^\n]*\n[ \t]*name:\s*"\w+"/m,
      (m, ind) => `${ind}name: "${prodName}"`,
    );
    out = out.replace(/(createSlice\(\{\s*(?:\/\/[^\n]*\n\s*)*name:\s*)"dev\w+"/, `$1"${prodName}"`);
    return out;
  };

  // The files a file imports, resolved.
  const edgesOf = (f) => {
    if (!/\.tsx?$/.test(f)) return [];
    const out = [];
    for (const m of readFileSync(f, "utf8").matchAll(SPEC_RE)) {
      const r = resolve(f, m[3]);
      if (r) out.push(r.target);
    }
    return out;
  };

  return { toProd, promoteText, promoteSlice, edgesOf };
};

// A slice's prod name from its prod file: features/salesCacheSlice.ts -> salesCache.
export const prodNameFromFile = (twin) => P.basename(twin).replace(/Slice\.tsx?$/, "");

/** A dev test's @/ imports pointed at prod: the page's tree, the library, the slices. */
export const promoteTestImports = (src, page) => {
  let out = src;
  if (page)
    out = out
      .replaceAll(`@/pages/${page}/dev/`, `@/pages/${page}/prod/`)
      .replaceAll(`@/pages/${page}/dev"`, `@/pages/${page}/prod"`);
  return out
    .replace(/@\/components-dev\//g, "@/components/")
    .replace(/@\/features\/dev\/dev(\w)(\w*Slice)/g, (m, c, rest) => `@/features/${c.toLowerCase()}${rest}`)
    .replace(/getState\(\)\.dev\./g, "getState().prod.");
};
