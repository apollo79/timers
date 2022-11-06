/**
 * Adapted version of https://github.com/sindresorhus/p-timeout and https://github.com/khrj/p-timeout
 */
import { AbortablePromise, AbortException, Timeout } from "./mod.ts";

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
 * import pTimeout from './mod.ts'
 * const delayedPromise = new Promise(resolve => setTimeout(resolve, 500))
 * await pTimeout({
 *     promise: delayedPromise,
 *     milliseconds: 50
 * })
 * //=> [TimeoutError: Promise timed out after 50 milliseconds]
 * ```
 */
export function pTimeout<T>(
  promise: Promise<T>,
  delay: number | string,
  options: PTimeoutOptions<T> = {},
) {
  const { signal, fallbackFn, failError, failMessage } = options;

  let timeout: Timeout | undefined;

  const abortablePromise = new Promise((resolve, reject) => {
    if (delay === Infinity) {
      resolve(promise);
      return;
    }

    if (signal) {
      if (signal.aborted) {
        reject(new AbortException(signal.reason));
      }

      signal.addEventListener("abort", () => {
        reject(new AbortException(signal.reason));
      });
    }

    timeout = new Timeout(() => {
      if (fallbackFn) {
        try {
          resolve(fallbackFn());
        } catch (error) {
          reject(error);
        } finally {
          timeout!.abort();
        }

        return;
      }

      const message = failMessage ??
        `Promise timed out after ${delay} milliseconds`;
      const timeoutError = failError ?? new TimeoutError(message);

      abortablePromise.abort();

      reject(timeoutError);
    }, delay);

    timeout.run();

    async function run() {
      try {
        resolve(await promise);
      } catch (error) {
        reject(error);
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
