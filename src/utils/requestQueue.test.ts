import { describe, it, expect } from "vitest";
import { createRequestQueue } from "./requestQueue";

/** A job that resolves only when told to, and reports whether it was aborted.
 *  Lets a test hold requests "in flight" and control the interleaving. */
const deferred = (label: string, log: string[]) => {
  let release!: (value: string) => void;
  const started: { value: boolean } = { value: false };
  const fn = (signal: AbortSignal) =>
    new Promise<string>((resolve, reject) => {
      started.value = true;
      log.push(`start:${label}`);
      release = resolve;
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    });
  return { fn, started, release: (v = label) => release(v) };
};

describe("createRequestQueue", () => {
  it("runs one job at a time, in order", async () => {
    const log: string[] = [];
    const q = createRequestQueue();
    const a = deferred("a", log);
    const b = deferred("b", log);
    const c = deferred("c", log);

    const results = Promise.all([q.enqueue("a", a.fn), q.enqueue("b", b.fn), q.enqueue("c", c.fn)]);
    await Promise.resolve();

    // Only the first has been handed to the network — this is the property
    // the whole change exists for.
    expect(log).toEqual(["start:a"]);
    expect(b.started.value).toBe(false);
    expect(c.started.value).toBe(false);

    a.release();
    await new Promise((r) => setTimeout(r, 0));
    expect(log).toEqual(["start:a", "start:b"]);

    b.release();
    await new Promise((r) => setTimeout(r, 0));
    c.release();
    expect(await results).toEqual(["a", "b", "c"]);
    expect(q.pending()).toBe(0);
  });

  it("resolves an in-flight job to null and aborts its signal when superseded", async () => {
    const log: string[] = [];
    const q = createRequestQueue();
    let aborted = false;

    const inFlight = q.enqueue(
      "job",
      (signal) =>
        new Promise<string>((_resolve, reject) => {
          log.push("start");
          signal.addEventListener("abort", () => {
            aborted = true;
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    await Promise.resolve();
    expect(log).toEqual(["start"]);

    q.startRun();

    // null, not a rejection: the call site's `if (!res) return` is the whole
    // staleness guard, so a superseded fetch can never write into state.
    expect(await inFlight).toBeNull();
    expect(aborted).toBe(true);
  });

  it("drops queued jobs from a superseded run before they reach the network", async () => {
    const log: string[] = [];
    const q = createRequestQueue();
    const a = deferred("a", log);
    const queued = deferred("queued", log);

    const first = q.enqueue("a", a.fn);
    const second = q.enqueue("queued", queued.fn);
    await Promise.resolve();

    q.startRun();

    expect(await first).toBeNull();
    expect(await second).toBeNull();
    // The queued job never started — that request was never made at all.
    expect(queued.started.value).toBe(false);
    expect(log).toEqual(["start:a"]);
    expect(q.pending()).toBe(0);
  });

  it("runs jobs enqueued after startRun normally", async () => {
    const q = createRequestQueue();
    q.enqueue("stuck", () => new Promise<string>(() => {})); // never settles
    await Promise.resolve();

    q.startRun();
    const fresh = await q.enqueue("fresh", async () => "fresh");
    expect(fresh).toBe("fresh");
  });

  it("rejects real failures rather than swallowing them as staleness", async () => {
    const q = createRequestQueue();
    await expect(
      q.enqueue("boom", async () => {
        throw new Error("500 from the server");
      }),
    ).rejects.toThrow("500 from the server");
    // A failed job must still free the queue for the next one.
    expect(await q.enqueue("next", async () => "next")).toBe("next");
  });

  it("collapses a repeated key into one call and shares the result", async () => {
    const q = createRequestQueue();
    let calls = 0;
    const fn = async () => {
      calls += 1;
      return "value";
    };

    // The StrictMode double-invoke case: the same effect fires twice from the
    // same render snapshot, so its Redux `loading` guard reads false both
    // times. The key is what stops the second network call.
    const [a, b] = await Promise.all([q.enqueue("salesComp:ly", fn), q.enqueue("salesComp:ly", fn)]);

    expect(calls).toBe(1);
    expect(a).toBe("value");
    expect(b).toBe("value");
  });

  it("frees a key once its job settles, so a later request runs again", async () => {
    const q = createRequestQueue();
    let calls = 0;
    const fn = async () => {
      calls += 1;
      return calls;
    };

    expect(await q.enqueue("trend:90", fn)).toBe(1);
    expect(await q.enqueue("trend:90", fn)).toBe(2);
  });

  it("does not hand a new run the abandoned run's promise for the same key", async () => {
    const q = createRequestQueue();
    const stale = q.enqueue(
      "priceOpt",
      (signal) =>
        new Promise<string>((_, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );
    await Promise.resolve();

    q.startRun();
    expect(await stale).toBeNull();

    // A re-search asks for the same module again — it must get its own live
    // request, not the abandoned one's null.
    expect(await q.enqueue("priceOpt", async () => "fresh data")).toBe("fresh data");
  });

  it("leaves a gap between jobs", async () => {
    const q = createRequestQueue({ gapMs: 40 });
    const startedAt: number[] = [];
    const stamp = async () => {
      startedAt.push(Date.now());
      return "ok";
    };

    await q.enqueue("first", stamp);
    await q.enqueue("second", stamp);

    expect(startedAt[1] - startedAt[0]).toBeGreaterThanOrEqual(35);
  });
});
