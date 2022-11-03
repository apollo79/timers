import { Base, BaseOptions } from "./Base.ts";
import { AbortException, Listener, TIMEOUT_MAX } from "./mod.ts";

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
    delay: number = 0,
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
    if (this._running) {
      throw new Error("The interval is already running");
    } else if (this._ran) {
      throw new Error("The interval ran already");
    } else if (this._isAborted) {
      throw new Error("The interval has been aborted before running");
    } else {
      if (this.delay <= TIMEOUT_MAX) {
        this._timer = globalThis.setInterval(
          (...args) => {
            // order is important!
            // first update
            this._runs++;

            // then call the callback
            this.cb(...(args as T));

            // if the runs are finished, abort
            if (this._runs! === this.options.times!) {
              this.abort();
            }
          },
          this.delay,
          ...this.options.args!,
        );
      } else {
        if (this._timeLeft <= TIMEOUT_MAX) {
          this._timer = globalThis.setTimeout(
            (...args) => {
              this.cb(...(args as T));

              this._timeLeft = this.delay;
            },
            this._timeLeft,
            ...this.options.args!,
          );
        } else {
          this._timer = globalThis.setTimeout(
            () => {
              this._timeLeft -= TIMEOUT_MAX;

              this.run();
            },
            TIMEOUT_MAX,
            ...this.options.args!,
          );
        }
      }

      if (this._persistent) {
        this.unref();
      }

      this._running = true;
    }

    return this._timer!;
  }

  abort(reason?: any) {
    this._running = false;

    const exception = new AbortException(reason);

    this._resolveAborted(exception);

    globalThis.clearTimeout(this._timer);
  }
}
