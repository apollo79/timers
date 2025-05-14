// deno-lint-ignore-file no-explicit-any
/**
 * This is the main module of the @apollo79/timers package.
 * It mainly exports all the functions of the package and also adds some trivial abstractions.
 */

import { After } from "./src/After.ts";
import { timers } from "./src/Timer.ts";
import { Every, type EveryOptions } from "./src/Every.ts";
import { Interval, type IntervalOptions } from "./src/Interval.ts";
import { Timeout, type TimeoutOptions } from "./src/Timeout.ts";

/**
 * The type of the callback expected by all the functions this package provides
 */
export type Listener<T extends any[] = any[]> = (...args: T) => void;

/**
 * The normal maximum timeout for timing functions in browsers and js engines
 * This maximum timeout does not apply to this package as it includes mechanisms to make longer timeouts work.
 */
export const TIMEOUT_MAX = 2147483647; // 2^31-1

/**
 * A special exception type used when a timer gets aborted.
 */
export class AbortException extends DOMException {
  constructor(public override cause?: any) {
    super("The timer was aborted.", "AbortException");
  }
}

/**
 * This interface expands the Promise type with an `abort` method. This is used in {@linkcode pTimeout}`
 */
export interface AbortablePromise<T> extends Promise<T> {
  /**
   * Clears the timeout
   */
  abort: () => void;
}

/**
 * Non-strictly typed setTimeout function, replaces the standard setTimeout, but with support for longer timeouts
 *
 * ```ts
 * setTimeout(() => { console.log('hello'); }, 500);
 * ```
 *
 * @param cb the callback to call after the specified delay
 * @param delay the delay after which to call the callback in milliseconds
 * @param args arguments to pass to the callback
 * @returns the timer's id, which can be used with {@linkcode clearTimeout}
 */
export function setTimeout(
  cb: Listener,
  delay?: number,
  ...args: any[]
): number {
  const timeout = new Timeout(cb, delay, {
    args,
  });

  return timeout.run();
}

/**
 * Non-strictly typed setInterval function, replaces the standard setInterval, but with support for longer timeouts
 *
 * ```ts
 * // Outputs 'hello' to the console every 500ms
 * setInterval(() => { console.log('hello'); }, 500)
 * ```
 *
 * @param cb the callback to call every [`delay`] milliseconds
 * @param delay the delay after which to call the callback in milliseconds
 * @param args arguments to pass to the callback
 * @returns the timer's id, which can be used with {@linkcode clearInterval}
 */
export function setInterval(
  cb: Listener,
  delay?: number,
  ...args: any[]
): number {
  const interval = new Interval(cb, delay, {
    args,
  });

  return interval.run();
}

/**
 * Cancels a scheduled action initiated by {@linkcode setTimeout}.
 *
 * ```ts
 * const id = setTimeout(() => {console.log('hello');}, 500);
 * // ...
 * clearTimeout(id);
 * ```
 *
 * @param id the timer's id
 */
export function clearTimeout(id = 0): void {
  timers.get(id)?.abort();
}

/**
 * Cancels a scheduled action initiated by {@linkcode setInterval}.
 *
 * ```ts
 * const id = setInterval(() => {console.log('hello');}, 500);
 * // ...
 * clearInterval(id);
 * ```
 *
 * @param id the timer's id
 */
export function clearInterval(id = 0): void {
  clearTimeout(id);
}

/**
 * Returns a promise which resolves after the given number of milliseconds.
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
 * ```
 *
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of milliseconds
 * @param options {@linkcode TimeoutOptions}
 * @returns an {@linkcode AbortablePromise}
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
 * Executes a callback [specified times] with delay.
 *
 * ```ts
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
 * ```
 * @param cb the callback to call
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of milliseconds
 * @param times how often the callback should be called
 * @param options {@linkcode TimeoutOptions}
 * @returns the timer's id, which can be used with {@linkcode clearInterval}
 */
export function times<T extends any[] = any[]>(
  cb: Listener<T>,
  delay: number | string,
  times: number,
  options: Omit<IntervalOptions<T>, "times"> = {},
): number {
  const interval = new Interval<T>(cb, delay, {
    ...options,
    times,
  });

  return interval.run();
}

/**
 * A typed version of {@linkcode setTimeout}
 *
 * ```ts
 * const timeout = timeout(() => {
 *   console.log("in 30 days");
 * }, "30 days");
 * ```
 *
 * @param cb the callback to call
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options {@linkcode TimeoutOptions}
 * @returns the timer's id, which can be used with {@linkcode clearTimeout}
 */
export function timeout<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number | string,
  options: TimeoutOptions<T> = {},
): number {
  const interval = new Timeout<T>(cb, delay, options);

  return interval.run();
}

/**
 * A typed version of {@linkcode setInterval}
 *
 * ```ts
 * const interval = interval(() => {
 *   console.log("every 30 days");
 * }, "30 days");
 * ```
 *
 * @param cb the callback to call
 * @param delay the delay as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options {@linkcode IntervalOptions}
 * @returns the timer's id, which can be used with {@linkcode clearInterval}
 */
export function interval<T extends any[] = any[]>(
  cb: Listener<T>,
  delay?: number | string,
  options: IntervalOptions<T> = {},
): number {
  const interval = new Interval<T>(cb, delay, options);

  return interval.run();
}

/**
 * Uses chained methods to control an interval.
 *
 * ```ts
 * every("1min").limit(60).do(() => {
 *   console.log(new Date().toLocaleTimeString());
 * });
 * ```
 *
 * @param time the time after which the callback (specified via the `do` method)
 * as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options {@linkcode EveryOptions}
 * @returns an instance of the {@linkcode Every} class, on which one can call the `limit`, `do` and `stop` methods
 */
export function every<T extends any[] = any[]>(
  time: string | number,
  options: EveryOptions<T> = {},
): Every<T> {
  return new Every(time, options);
}

/**
 * Uses chained methods to control a timeout.
 *
 * ```ts
 * after("1min").do(() => {
 *   console.log(new Date().toLocaleTimeString());
 * });
 * ```
 *
 * @param time the time after which the callback (specified via the `do` method)
 * as string containing the time in a human readable format (e.g. "1 day and 3hours") or a number of in milliseconds
 * @param options {@linkcode EveryOptions}
 * @returns an instance of the {@linkcode After} class, on which one can call the `do` and `stop` methods
 */
export function after<T extends any[] = any[]>(
  time: string | number,
  options: TimeoutOptions<T> = {},
): After<T> {
  return new After(time, options);
}

export { pTimeout, TimeoutError } from "./src/pTimeout.ts";
export type { PTimeoutOptions } from "./src/pTimeout.ts";

export { After, Every, type EveryOptions, Interval, Timeout };
export type { IntervalOptions, TimeoutOptions };

export {
  clearInterval as clearLongInterval,
  clearTimeout as clearLongTimeout,
  setInterval as setLongInterval,
  setTimeout as setLongTimeout,
};

export { Timer, type TimerOptions } from "./src/Timer.ts";
