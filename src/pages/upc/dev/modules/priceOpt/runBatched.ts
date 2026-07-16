// Rolling-concurrency runner — keeps `concurrency` workers pulling from a
// shared queue, starting the next item as soon as one finishes rather than
// waiting for a fixed-size wave to fully complete. One item failing doesn't
// stop the rest.
export async function runBatched<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
  onResult: (item: T, result: R) => void,
): Promise<void> {
  let next = 0;
  const runner = async () => {
    while (next < items.length) {
      const item = items[next++];
      try {
        const result = await worker(item);
        onResult(item, result);
      } catch {
        // skip — one UPC's lookup failing shouldn't block the rest
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, runner),
  );
}
