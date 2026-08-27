/** Serial request queue with run-scoped cancellation.
 *
 *  Built for endpoints whose server-side cost is high enough that *concurrency*
 *  — not call count — is what hurts. UPC List was the first: one search fired
 *  three heavy marketing/* jobs in the same tick, and a re-search stacked three
 *  more on top of the ones still running, because nothing cancelled the old
 *  ones. A queue in front of them caps what a single browser tab can put on the
 *  container at any instant, no matter how fast the user clicks.
 *
 *  Two guarantees:
 *
 *  1. At most `concurrency` jobs in flight, with an optional `gapMs` of quiet
 *     between them so the server gets room to release memory between heavy
 *     jobs rather than meeting the next one at peak.
 *
 *  2. Work belongs to a *run*. `startRun()` abandons every job from earlier
 *     runs — queued ones never reach the network, in-flight ones are aborted —
 *     and any late response from an abandoned run resolves to `null` instead of
 *     reaching its caller. That last part is what makes staleness guards
 *     unnecessary at the call site: a superseded fetch cannot write into state.
 *
 *  3. Requests are de-duplicated by `key` within a run: asking twice for the
 *     same thing before the first answer arrives yields one network call and
 *     two callers sharing its result. A React `loading` flag in Redux can't do
 *     this job — an effect reads it from its own render's snapshot, so under
 *     StrictMode's double-invoke (and any genuine race) the second call sees a
 *     flag the first one has already set and fires anyway. The key is checked
 *     at enqueue time, which is the only place that can't go stale.
 *
 *  Deliberately knows nothing about any particular endpoint or about axios.
 */

export type QueuedFn<T> = (signal: AbortSignal) => Promise<T>;

interface Job<T = unknown> {
  runId: number;
  key: string;
  fn: QueuedFn<T>;
  controller: AbortController;
  // Method syntax, not arrow properties: the queue stores every job together
  // in one `Job<unknown>` collection, and only the bivariance of a method
  // signature lets a `Job<T>` sit in it. Sound here because a job's resolve is
  // only ever called with its own T, from `settle`.
  resolve(value: T | null): void;
  reject(err: unknown): void;
  /** Set the moment the job's slot is released, so every settle path is
   *  idempotent. An abandoned job's underlying request may still settle
   *  later — that late result must be ignored, not re-settle the caller. */
  settled: boolean;
}

export interface RequestQueue {
  /** Begin a new run, abandoning every job from previous runs. Returns the new
   *  run id, though callers rarely need it — `enqueue` stamps jobs with the
   *  current run on its own. */
  startRun: () => number;
  /** Queue a request. Resolves with `fn`'s value, or `null` if the job was
   *  abandoned by a later `startRun`/`abortAll` — so `if (!res) return;` is a
   *  complete staleness guard. Real failures still reject.
   *
   *  `key` identifies the request within the current run: a second enqueue
   *  under a live key returns the first one's promise rather than making a
   *  second call. Keys need only be unique per run, since a run is one search
   *  with fixed stores/dates/UPCs — "trend" and "priceOpt" are enough, while
   *  anything that varies inside a run (an association seed set) must say so
   *  in its key. */
  enqueue: <T>(key: string, fn: QueuedFn<T>) => Promise<T | null>;
  /** Abandon everything, without starting a new run. */
  abortAll: () => void;
  /** Jobs queued or in flight — for loading copy and tests. */
  pending: () => number;
}

interface QueueOptions {
  /** Jobs allowed in flight at once. Default 1 — raise only if the endpoints
   *  behind it are known to tolerate it. */
  concurrency?: number;
  /** Quiet period between the end of one job and the start of the next. */
  gapMs?: number;
}

/** Resolves after `ms`, or immediately if the signal aborts first. Never
 *  rejects — the abort is handled by the caller's own signal check. */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });

export const createRequestQueue = ({
  concurrency = 1,
  gapMs = 0,
}: QueueOptions = {}): RequestQueue => {
  const waiting: Job[] = [];
  const active = new Set<Job>();
  /** Live jobs by key — the de-duplication index. An entry exists for exactly
   *  as long as its job is unsettled. */
  const inflight = new Map<string, { job: Job; promise: Promise<unknown> }>();
  let runId = 0;
  let lastFinishedAt = 0;

  /** Free the job's slot. Returns false if it was already released, which is
   *  how every settle path below stays idempotent. */
  const release = (job: Job) => {
    if (job.settled) return false;
    job.settled = true;
    active.delete(job);
    // Guarded on identity: a job abandoned by startRun may already have been
    // replaced under the same key by the new run's own request.
    const entry = inflight.get(job.key);
    if (entry?.job === job) inflight.delete(job.key);
    lastFinishedAt = Date.now();
    return true;
  };

  const settle = <T,>(job: Job<T>, value: T | null) => {
    if (!release(job)) return;
    job.resolve(value);
    pump();
  };

  const fail = (job: Job, err: unknown) => {
    if (!release(job)) return;
    job.reject(err);
    pump();
  };

  /** Give up on a job: stop its request and resolve its caller with null.
   *
   *  The slot is freed here rather than when the underlying promise settles,
   *  because it might never settle — a request that doesn't honour its abort
   *  signal would otherwise hold the queue's only slot for the rest of the
   *  session and no UPC data would ever load again. Aborting is a request, not
   *  a guarantee; the queue can't wait to find out whether it was honoured. */
  const abandon = (job: Job) => {
    job.controller.abort();
    settle(job, null);
  };

  const pump = () => {
    while (waiting.length > 0 && active.size < concurrency) {
      const job = waiting.shift() as Job;
      active.add(job);
      void start(job);
    }
  };

  const start = async (job: Job) => {
    try {
      if (gapMs > 0) {
        const idle = Date.now() - lastFinishedAt;
        if (idle < gapMs) await sleep(gapMs - idle, job.controller.signal);
      }
      // Re-checked after the gap, and again after the request: a run can be
      // superseded at any point, and a response that arrives for an abandoned
      // run must not reach the caller.
      if (job.settled) return;
      if (job.runId !== runId) {
        abandon(job);
        return;
      }
      const value = await job.fn(job.controller.signal);
      if (job.settled) return;
      if (job.runId !== runId) {
        abandon(job);
        return;
      }
      settle(job, value);
    } catch (err) {
      if (job.settled) return;
      // An abort is an expected outcome, not a failure — the caller asked for
      // this work to stop. Anything else is a real error the caller must see.
      if (job.controller.signal.aborted || job.runId !== runId) abandon(job);
      else fail(job, err);
    }
  };

  const abandonAllBefore = (keepRunId: number) => {
    // Partitioned before anything is abandoned: settling a job pumps the queue,
    // which shifts `waiting` out from under a loop that's mutating it.
    const doomed = waiting.filter((job) => job.runId !== keepRunId);
    if (doomed.length > 0) {
      const survivors = waiting.filter((job) => job.runId === keepRunId);
      waiting.length = 0;
      waiting.push(...survivors);
    }
    for (const job of doomed) abandon(job);
    for (const job of [...active]) {
      if (job.runId !== keepRunId) abandon(job);
    }
  };

  return {
    startRun: () => {
      runId += 1;
      abandonAllBefore(runId);
      return runId;
    },
    enqueue: <T,>(key: string, fn: QueuedFn<T>) => {
      const existing = inflight.get(key);
      if (existing) return existing.promise as Promise<T | null>;

      let job!: Job<T>;
      const promise = new Promise<T | null>((resolve, reject) => {
        job = {
          runId,
          key,
          fn,
          controller: new AbortController(),
          resolve,
          reject,
          settled: false,
        };
        waiting.push(job as Job);
        // Safe to index the job after this: `start` always awaits before it
        // can settle, so nothing has removed the entry we're about to add.
        pump();
      });
      inflight.set(key, { job: job as Job, promise });
      return promise;
    },
    abortAll: () => {
      runId += 1;
      abandonAllBefore(runId);
    },
    pending: () => waiting.length + active.size,
  };
};
