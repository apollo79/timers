// deno-lint-ignore-file no-explicit-any
import { Interval, Listener } from "../mod.ts";

export class Every {
  protected _interval?: Interval<never[]>;

  get interval() {
    return this._interval;
  }

  #limit = Infinity;

  constructor(public readonly time: number | string) {
  }

  limit(limit: number) {
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
   * runs the interval
   * @param cb
   */
  do(cb: Listener<never[]>) {
    if (this.interval) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this.interval?.abort();
    }

    this._interval = new Interval(cb.bind(this), this.time, {
      times: this.#limit,
    });

    this._interval.run();

    return this;
  }

  stop(reason?: any) {
    this.interval?.abort(reason);

    delete this._interval;
  }
}
