// deno-lint-ignore-file no-explicit-any
import { Timer, type TimerOptions } from "./Timer.ts";
import type { Listener } from "../mod.ts";

/** The possible options to pass to an interval instance. These are the same as {@linkcode TimerOptions} */
export interface IntervalOptions<T extends any[] = any[]>
  extends TimerOptions<T> {}

/**
 * A class representing an Interval.
 * This just extends the {@linkcode Timer} class with a `runs` property
 * to get access to the number of times the callback has already been executed.
 */
export class Interval<T extends any[] = any[]> extends Timer<T> {
  declare readonly options: IntervalOptions<T>;

  /** The number of times the interval has already run the callback. */
  get runs(): number {
    return this._runs;
  }

  /**
   * @param cb The callback to get executed
   * @param delay The time to delay
   * @param options
   * @param options.args The arguments to get passed to the callback
   * @param options.signal An AbortSignal. It can abort the timer
   * @param options.persistent Indicates whether the process should continue to run as long as the timer exists. This is `true` by default.
   * @param options.times How often the timer should run
   */
  constructor(
    cb: Listener<T>,
    delay: number | string = 0,
    options: IntervalOptions<T> = {},
  ) {
    super(cb, delay, options);
  }
}
