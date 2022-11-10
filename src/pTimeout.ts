/**
 * Adapted version of https://github.com/sindresorhus/p-timeout and https://github.com/khrj/p-timeout
 */
import { AbortablePromise, AbortException, Timeout } from "../mod.ts";

export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export interface PTimeoutOptions<T> {
  signal?: AbortSignal;
  fallbackFn?: () => Promise<T>;
  failMessage?: string;
  failError?: Error;
}

/**
 * Timeout a promise after a specified amount of time.
 * @param options.promise - Promise to decorate.
 * @param options.milliseconds - Milliseconds before timing out.
 * @param options.fallbackFn - Do something other than rejecting with an error on timeout. You could for example retry.
 * @param options.failMessage - Specify a custom error message. Default: `'Promise timed out after 50 milliseconds'`.
 * @param options.failError - Specify a custom `Error`. It's recommended to sub-class {@linkcode TimeoutError}.
 * @param options.customTimers - Specify custom implementations for the `setTimeout` and `clearTimeout` functions.
 * @returns A decorated `options.promise` that times out after `options.milliseconds` time. It has a `.clear()` method that clears the timeout.
 * @example
 * ```
 * import pTimeout from 'https://deno.land/x/timers@v0.1.0/mod.ts'
 * const delayedPromise = new Promise(resolve => setTimeout(resolve, 500))
 * await pTimeout({
 *     promise: delayedPromise,
 *     milliseconds: 50
 * })
 * //=> [TimeoutError: Promise timed out after 50 milliseconds]
 * ```
 */
export function pTimeout<T>(
  promise: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  delay: number | string,
  options: PTimeoutOptions<T> = {},
) {
  const { signal, fallbackFn, failError, failMessage } = options;

  let timeout: Timeout | undefined;

  const abort = new AbortController();

  const abortablePromise = new Promise((resolve, reject) => {
    abort.signal.addEventListener("abort", () => {
      reject(abort.signal.reason);
    }, { once: true });

    if (delay === Infinity && !signal?.aborted) {
      resolve(typeof promise == "function" ? promise(abort.signal) : promise);
      return;
    }

    if (signal) {
      if (signal.aborted) {
        abort.abort(new AbortException(signal.reason));
      }

      signal.addEventListener(
        "abort",
        () => abort.abort(new AbortException(signal.reason)),
        { once: true },
      );
    }

    if (typeof promise == "function") {
      if (!signal?.aborted) {
        promise = promise(abort.signal);
      }
    }

    timeout = new Timeout(
      () => {
        if (fallbackFn) {
          try {
            resolve(fallbackFn());
          } catch (error) {
            abort.abort(error);
          } finally {
            timeout!.abort();
          }

          return;
        }

        const message = failMessage ??
          `Promise timed out after ${delay} milliseconds`;
        const timeoutError = failError ?? new TimeoutError(message);

        abort.abort(timeoutError);

        abortablePromise.abort();
      },
      delay,
      { signal },
    );

    timeout.run();

    async function run() {
      try {
        resolve(
          await (typeof promise == "function"
            ? promise(abort.signal)
            : promise),
        );
      } catch (error) {
        abort.abort(error);
      } finally {
        timeout?.abort();
      }
    }

    run();
  }) as AbortablePromise<T>;

  abortablePromise.abort = () => {
    timeout?.abort();
    timeout = undefined;
  };

  return abortablePromise;
}

export default pTimeout;
