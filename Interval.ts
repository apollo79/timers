// deno-lint-ignore-file no-explicit-any
import { Base, BaseOptions } from "./Base.ts";
import { Listener, TIMEOUT_MAX } from "./mod.ts";

export interface IntervalOptions<T extends any[] = any[]>
  extends BaseOptions<T> {
  times?: number;
}

/**
 * @class A class representing an Interval
 */
export class Interval<T extends any[] = any[]> extends Base<T> {
  declare readonly options: IntervalOptions<T>;
  protected _runs: number;

  get runs() {
    return this._runs;
  }

  /**
   * @deprecated is never true with Interval
   */
  get ran() {
    return false;
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

    const { times } = options;

    this.options = {
      times: times ?? Infinity,
      ...this.options,
    };

    this._runs = 0;
  }

  run(): number {
    if (this._isAborted) {
      throw new Error("The interval has been aborted before running");
    } else {
      if (this._timeLeft <= TIMEOUT_MAX) {
        this._timer = globalThis.setTimeout(() => {
          // order is important!
          // first update
          this._runs++;

          // then call the callback

          this.cb(...this.options.args!);

          globalThis.clearTimeout(this._timer);

          // if the runs are finished, abort
          if (this._runs! === this.options.times!) {
            this.abort();
          } // else continue running
          else {
            this.run();
          }
        }, this._timeLeft);
      } else {
        this._timer = globalThis.setTimeout(() => {
          this._timeLeft -= TIMEOUT_MAX;

          globalThis.clearTimeout(this._timer);

          this.run();
        }, TIMEOUT_MAX);
      }

      if (!this._persistent) {
        this.unref();
      }
    }

    return this.id;
  }
}
