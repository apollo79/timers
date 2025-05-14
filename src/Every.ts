// deno-lint-ignore-file no-explicit-any
import { Interval, type IntervalOptions, type Listener } from "../mod.ts";

export interface EveryOptions<T extends any[] = any[]>
  extends Omit<IntervalOptions<T>, "times"> {}

/**
 * A class which provides methods to chain together for controlling an interval.
 * Should be used with the `every` function.
 *
 * ```ts
 * const interval = new Every("1min");
 *
 * interval.limit(60).do(() => {
 *   console.log(new Date().toLocaleTimeString());
 * });
 * ```
 */
export class Every<T extends any[] = any[]> {
  protected _interval?: Interval<T>;

  get interval(): Interval<T> | undefined {
    return this._interval;
  }

  #limit = Infinity;

  constructor(
    public readonly time: number | string,
    public readonly options: EveryOptions<T> = {},
  ) {}

  /**
   * Limits the times the callback (provided via the `do` method) gets executed.
   * @param limit the limit as a positive number
   * @returns the object for chained calls
   */
  limit(limit: number): Every<T> {
    if (this.interval) {
      console.warn(
        "The interval is already running. times() should only get called before do()",
      );
    } else {
      this.#limit = limit;
    }

    return this;
  }

  /**
   * Runs the interval.
   * @param cb
   * @returns the object for chained calls
   */
  do(cb: Listener<T>): Every<T> {
    if (this.interval) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this.interval?.abort();
    }

    const options = Object.assign(this.options, {
      times: this.#limit,
    });

    this._interval = new Interval(cb.bind(this), this.time, options);

    this._interval.run();

    return this;
  }

  /**
   * Aborts the timer.
   * @param reason optional reason for aborting
   */
  stop(reason?: any): void {
    this.interval?.abort(reason);

    delete this._interval;
  }
}
