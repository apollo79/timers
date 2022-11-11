// deno-lint-ignore-file no-explicit-any
/**
 * This module is browser compatible
 */
import { After } from "./src/After.ts";
import { timers } from "./src/Timer.ts";
import { Every, EveryOptions } from "./src/Every.ts";
import { Interval, IntervalOptions } from "./src/Interval.ts";
import { Timeout, TimeoutOptions } from "./src/Timeout.ts";

export type Listener<T extends any[] = any[]> = (...args: T) => void;

export const TIMEOUT_MAX = 2147483647; // 2^31-1

export class AbortException extends DOMException {
  constructor(public cause?: any) {
    super("The timer was aborted.", "AbortException");
  }
}

export interface AbortablePromise<T> extends Promise<T> {
  /**
   * Clear the timeout.
   */
  abort: () => void;
}

export function setTimeout(cb: Listener, delay?: number, ...args: any[]) {
  const timeout = new Timeout(cb, delay, {
    args,
  });

  return timeout.run();
}

export function setInterval(cb: Listener, delay?: number, ...args: any[]) {
  const interval = new Interval(cb, delay, {
    args,
  });

  return interval.run();
}

export function clearTimeout(id = 0) {
  timers.get(id)?.abort();
}

export function clearInterval(id = 0) {
  clearTimeout(id);
}

/**
 * Resolves after the given number of milliseconds.
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
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
  delay: number | string,
  options: Omit<TimeoutOptions, "args"> = {},
): AbortablePromise<void> {
  let timeout: Timeout | undefined;

  const abortablePromise = new Promise((resolve, reject) => {
    timeout = new Timeout(
      () => {
        abortablePromise.abort();

        resolve();
      },
      delay,
      options,
    );

    timeout.aborted.then(reject);

    try {
      timeout.run();
    } catch (e) {
      reject(new AbortException(e));
    }
  }) as AbortablePromise<void>;

  abortablePromise.abort = () => {
    timeout?.abort();
    timeout = undefined;
  };

  return abortablePromise;
}

/**
 * execute a callback specified times with delay
 *
 * @example
 * ```ts
 * import { times } from "https://deno.land/x/timers@v0.1.0/mod.ts";
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
  delay: number | string,
  times: number,
  options: Omit<IntervalOptions<T>, "times"> = {},
) {
  const interval = new Interval<T>(cb, delay, {
    ...options,
    times,
  });

  return interval.run();
}

/**
 * A typed version of {@linkcode setTimeout}
 * @param cb the callback to call
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options {@linkcode TimeoutOptions}
 */
export function timeout<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number | string,
  options: TimeoutOptions<T> = {},
) {
  const interval = new Timeout<T>(cb, delay, options);

  return interval.run();
}

/**
 * A typed version of {@linkcode setInterval}
 * @param cb the callback to call
 * @param delay the delay in milliseconds
 * @param options {@linkcode IntervalOptions}
 */
export function interval<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number | string,
  options: IntervalOptions<T> = {},
) {
  const interval = new Interval<T>(cb, delay, options);

  return interval.run();
}

/**
 * @param time
 * @returns
 */
export function every<T extends any[] = any[]>(
  time: string | number,
  options: EveryOptions<T> = {},
) {
  return new Every(time, options);
}

/**
 * @todo document, write tests and add to Readme
 * @param time
 * @returns
 */
export function after<T extends any[] = any[]>(
  time: string | number,
  options: TimeoutOptions<T> = {},
) {
  return new After(time, options);
}

export { pTimeout, TimeoutError } from "./src/pTimeout.ts";
export type { PTimeoutOptions } from "./src/pTimeout.ts";

export { After, Every, Interval, Timeout };
export type { IntervalOptions, TimeoutOptions };

export {
  clearInterval as clearLongInterval,
  clearTimeout as clearLongTimeout,
  setInterval as setLongInterval,
  setTimeout as setLongTimeout,
};

export { Timer } from "./src/Timer.ts";
