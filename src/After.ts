// deno-lint-ignore-file no-explicit-any
import { type Listener, Timeout, type TimeoutOptions } from "../mod.ts";

/**
 * A class which provides methods to chain together for controlling a timeout.
 * Should be used with the `after` function.
 *
 * ```ts
 * const timeout = new After(2000);
 *
 * timeout.do(() => {
 *   console.log(new Date().toLocaleTimeString());
 * })
 * ```
 */
export class After<T extends any[] = any[]> {
  protected _timeout?: Timeout<T>;

  get timeout(): Timeout<T> | undefined {
    return this._timeout;
  }

  protected cb?: Listener<never[]>;

  constructor(
    public readonly time: number | string,
    public readonly options: TimeoutOptions<T> = {},
  ) {}

  /**
   * Runs the timeout with the provided callback.
   * @param cb the callback to call
   * @returns the object for chained calls
   */
  do(cb: Listener<T>): After<T> {
    if (this._timeout) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this._timeout?.abort();
    }

    this._timeout = new Timeout(cb.bind(this), this.time, this.options);

    this._timeout.run();

    return this;
  }

  /**
   * Aborts the timer.
   * @param reason optional reason for aborting
   */
  stop(reason?: any): void {
    this._timeout?.abort(reason);

    this._timeout = undefined;
  }
}
