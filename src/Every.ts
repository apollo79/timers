// deno-lint-ignore-file no-explicit-any
import { Interval, Listener } from "../mod.ts";

export class Every {
  protected interval?: Interval<never[]>;

  #times = Infinity;

  constructor(public readonly time: number | string) {
  }

  times(times: number) {
    if (this.interval) {
      console.warn(
        "The interval is already running. times() should only get called before do()",
      );
    } else {
      this.#times = times;
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

    this.interval = new Interval(cb.bind(this), this.time, {
      times: this.#times,
    });

    this.interval.run();

    return this;
  }

  stop(reason?: any) {
    this.interval?.abort(reason);

    delete this.interval;
  }
}
