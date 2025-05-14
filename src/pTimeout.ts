/**
 * Adapted version of {@link https://github.com/sindresorhus/p-timeout} and {@link https://github.com/khrj/p-timeout}
 */
import { type AbortablePromise, AbortException, Timeout } from "../mod.ts";

/** The default error used in {@linkcode pTimeout} when aborting / rejecting the promise after the  */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/** The possible options for {@linkcode pTimeout} */
export interface PTimeoutOptions<T> {
  /** An AbortSignal, which can be used to abort the promise manually */
  signal?: AbortSignal;
  /** A function to run if the promise times out */
  fallbackFn?: () => Promise<T>;
  /** A custom message for the error message with which the promise gets rejected / aborted. Default: `'Promise timed out after 50 milliseconds'` */
  failMessage?: string;
  /** Specify a custom `Error`. It's recommended for this `Error` to inherit {@linkcode TimeoutError}. */
  failError?: Error;
}

/**
 * Times out a promise after a specified amount of time.
 *
 * ```ts
 * const delayedPromise = new Promise(resolve => setTimeout(resolve, 500))
 * await pTimeout(delayedPromise, 50):
 * //=> [TimeoutError: Promise timed out after 50 milliseconds]
 * ```
 *
 * @param promise the promise to decorate or a function which returns a promise
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options.promise promise to decorate.
 * @param options.fallbackFn do something other than rejecting with an error on timeout. You could for example retry.
 * @param options.failMessage Specify a custom error message. Default: `'Promise timed out after 50 milliseconds'`.
 * @param options.failError Specify a custom `Error`. It's recommended for this `Error` to inherit {@linkcode TimeoutError}.
 * @returns A decorated `options.promise` that times out after [delay] time. It has a `.clear()` method that clears the timeout.
 */
export function pTimeout<T>(
  promise: Promise<T> | ((signal: AbortSignal) => Promise<T>),
  delay: number | string,
  options: PTimeoutOptions<T> = {},
): AbortablePromise<T> {
  const { signal, fallbackFn, failError, failMessage } = options;

  // the used `Timeout` instance
  let timeout: Timeout | undefined;

  // internal abort controller
  const abort = new AbortController();

  const onSignalAbort = () => abort.abort(new AbortException(signal?.reason));

  // the returned promise
  const abortablePromise = new Promise((resolve, reject) => {
    // central point to reject the abortable promise
    abort.signal.addEventListener(
      "abort",
      () => {
        signal?.removeEventListener("abort", onSignalAbort);
        reject(abort.signal.reason);
      },
      { once: true },
    );

    if (delay === Infinity && !signal?.aborted) {
      resolve(typeof promise == "function" ? promise(abort.signal) : promise);
      return;
    }

    // handle the provided abort signal
    if (signal) {
      // if the signal has already been aborted
      if (signal.aborted) {
        abort.abort(new AbortException(signal.reason));
      }

      // wait for the signal to be aborted
      signal.addEventListener(
        "abort",
        onSignalAbort,
        { once: true },
      );
    }

    // ensure the `Promise` type of `promise`
    if (typeof promise == "function") {
      if (!signal?.aborted) {
        promise = promise(abort.signal);
      }
    }

    timeout = new Timeout(
      () => {
        // try running the fallback function
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

        // if there is no fallback function
        const message = failMessage ??
          `Promise timed out after ${delay} milliseconds`;

        const timeoutError = failError ?? new TimeoutError(message);

        abort.abort(timeoutError);

        abortablePromise.abort();
      },
      delay,
      { signal },
    );

    // run the timer
    timeout.run();

    // now run the promise
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
