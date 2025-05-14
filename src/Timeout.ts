// deno-lint-ignore-file no-explicit-any
import type { TimerOptions } from "./Timer.ts";
import { Interval, type Listener } from "../mod.ts";

export interface TimeoutOptions<T extends any[] = any[]>
  extends TimerOptions<T> {}

/**
 * @class The class representing a timeout
 *
 * ```ts
 * const abort = new AbortController();
 * const { signal } = abort;
 * const timeout = new Timeout(
 *   () => {
 *     console.log("hello world");
 *   },
 *   100,
 *   { signal, }
 * );
 *
 * timeout.run();
 *
 * yourService.addEventListener("error", () => abort.abort(), { once: true })
 * ```
 */
export class Timeout<T extends any[] = any[]> extends Interval<T> {
  /**
   * @param cb The callback to get executed
   * @param delay The time to delay
   * @param options
   * @param options.args The arguments to get passed to the callback
   * @param options.signal An AbortSignal. It can abort the timer
   * @param options.persistent Indicates whether the process should continue to run as long as the timer exists. This is `true` by default.
   */
  constructor(
    cb: Listener<T>,
    delay: number | string = 0,
    options: TimeoutOptions<T> = {},
  ) {
    super(cb, delay, { ...options, times: 1 });
  }
}
