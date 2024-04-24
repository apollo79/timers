// deno-lint-ignore-file no-explicit-any
import { Interval, IntervalOptions, Listener } from "../mod.ts";

// deno-lint-ignore no-empty-interface
export interface EveryOptions<T extends any[] = any[]>
  extends Omit<IntervalOptions<T>, "times"> {}

export class Every<T extends any[] = any[]> {
  protected _interval?: Interval<T>;

  get interval(): Interval<T> | undefined {
    return this._interval;
  }

  #limit = Infinity;

  constructor(
    public readonly time: number | string,
    public readonly options: EveryOptions<T> = {}
  ) {}

  limit(limit: number): Every<T> {
    if (this.interval) {
      console.warn(
        "The interval is already running. times() should only get called before do()"
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
  do(cb: Listener<T>): Every<T> {
    if (this.interval) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts."
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

  stop(reason?: any): void {
    this.interval?.abort(reason);

    delete this._interval;
  }
}
