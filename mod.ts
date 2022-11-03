// deno-lint-ignore-file no-explicit-any
/**
 * This module is browser compatible
 */
import origPTimeout from "https://deno.land/x/p_timeout@1.0.2/mod.ts";
import { Every } from "./Every.ts";
import { Interval, IntervalOptions } from "./Interval.ts";
import { Timeout, TimeoutOptions } from "./Timeout.ts";

export type Listener<T extends any[] = any[]> = (...args: T) => void;

export const TIMEOUT_MAX = 2147483647; // 2^31-1

export class AbortException extends DOMException {
  constructor(public cause?: any) {
    super("Delay was aborted.", "AbortError");
  }
}

export function setTimeout(cb: Listener, delay?: number, ...args: any[]) {
  const timeout = new Timeout(cb, delay, {
    args,
  });

  timeout.run();

  return timeout.timer!;
}

export function setInterval(cb: Listener, delay?: number, ...args: any[]) {
  const interval = new Interval(cb, delay, {
    args,
  });

  interval.run();

  return interval.timer!;
}

export function clearTimeout(id?: number) {
  globalThis.clearTimeout(id);
}

export function clearInterval(id?: number) {
  globalThis.clearInterval(id);
}

/**
 * Resolves after the given number of milliseconds.
 * @param ms milliseconds to wait
 *
 * ```ts
 * const MSG = "Please type your name";
 * const info = document.querySelector("p.info");
 * const nameInput = document.querySelector("input.name");
 * const abort = new AbortController();
 * const { signal } = abort;
 *
 * nameInput.addEventListener("input", () => abort.abort(), { once: true });
 *
 * await delay(2000, {
 *     signal
 * });
 *
 * info.textContent = MSG;
```
 */
export function delay(
  ms: number,
  options: Omit<TimeoutOptions, "args"> = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = new Timeout(resolve, ms, options);

    timeout.aborted.then(reject);

    try {
      timeout.run();
    } catch (e) {
      reject(new AbortException(e));
    }
  });
}

/**
 * execute a callback specified times with delay
 *
 * @example
 * ```ts
 * import { times } from "https://deno.land/x/timers@0.1.0/mod.ts";
 *
 * const paragraph = document.querySelector("p.numbers");
 * const abortBtn = document.querySelector("button.abort");
 * const abort = new AbortController();
 * const { signal } = abort;
 *
 * abortBtn.addEventListener("click", () => abort.abort(), { once: true })
 *
 * let i = 0;
 * times(() => {
 *     paragraph.textContent += `${i}, `;
 *
 *     i++;
 * }, 200, 20, {
 *     signal
 * });
```
 */
export function times<T extends any[] = any[]>(
  cb: Listener<T>,
  delay: number,
  times: number,
  options: Omit<IntervalOptions<T>, "times"> = {},
) {
  const interval = new Interval<T>(cb, delay, {
    ...options,
    times,
  });

  interval.run();

  return interval.timer!;
}

/**
 * A typed version of {@linkcode setTimeout}
 * @param cb the callback to call
 * @param delay the delay in milliseconds
 * @param options {@linkcode TimeoutOptions}
 */
export function timeout<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number,
  options: TimeoutOptions<T> = {},
) {
  const interval = new Timeout<T>(cb, delay, options);

  interval.run();

  return interval.timer!;
}

/**
 * A typed version of {@linkcode setInterval}
 * @param cb the callback to call
 * @param delay the delay in milliseconds
 * @param options {@linkcode IntervalOptions}
 */
export function interval<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number,
  options: IntervalOptions<T> = {},
) {
  const interval = new Interval<T>(cb, delay, options);

  interval.run();

  return interval.timer!;
}

/**
 * Timeout a promise after a specified amount of time.
 * @param options.promise - Promise to decorate.
 * @param options.milliseconds - Milliseconds before timing out.
 * @param options.fallbackFn - Do something other than rejecting with an error on timeout. You could for example retry.
 * @param options.failMessage - Specify a custom error message. Default: `'Promise timed out after 50 milliseconds'`.
 * @param options.failError - Specify a custom `Error`. It's recommended to sub-class `pTimeout.TimeoutError`.
 * @param options.customTimers - Specify custom implementations for the `setTimeout` and `clearTimeout` functions.
 * @returns A decorated `options.promise` that times out after `options.milliseconds` time. It has a `.clear()` method that clears the timeout.
 *
 * @example
 * ```ts
 * import pTimeout from './mod.ts'
 *
 * const delayedPromise = new Promise(resolve => setTimeout(resolve, 500))
 *
 * await pTimeout({
 *   promise: delayedPromise,
 *   milliseconds: 50
 * });
 *
 * //=> [TimeoutError: Promise timed out after 50 milliseconds]
 * ```
 */
export function pTimeout<T>(options: Parameters<typeof origPTimeout<T>>[0]) {
  return origPTimeout<T>({
    ...options,
    customTimers: {
      clearTimeout,
      setTimeout,
    },
  });
}

export { Interval, Timeout };
export type { IntervalOptions, TimeoutOptions };

export {
  clearInterval as clearLongInterval,
  clearTimeout as clearLongTimeout,
  setInterval as setLongInterval,
  setTimeout as setLongTimeout,
};

export { TimeoutError } from "https://deno.land/x/p_timeout@1.0.2/mod.ts";
export type { ClearablePromise } from "https://deno.land/x/p_timeout@1.0.2/mod.ts";
