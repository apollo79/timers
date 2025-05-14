// deno-lint-ignore-file no-explicit-any
import { Timer, type TimerOptions } from "./Timer.ts";
import { type Listener, TIMEOUT_MAX } from "../mod.ts";

export interface IntervalOptions<T extends any[] = any[]>
  extends TimerOptions<T> {
  /** How often the callback should get executed */
  times?: number;
}

/**
 * A class representing an Interval
 */
export class Interval<T extends any[] = any[]> extends Timer<T> {
  declare readonly options: IntervalOptions<T>;

  protected _runs: number;

  /** The number of times the interval has already run the callback. */
  get runs(): number {
    return this._runs;
  }

  /**
   * This will only be set to true, if the `times` options has been passed and the interval has run `times` often
   */
  get ran(): boolean {
    return this._ran;
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

    let { times } = options;

    if (times === undefined) {
      times = Infinity;
    } else if (times < 0) {
      throw new Error("`times` must be 0 or positive");
    }

    this.options = {
      times,
      ...this.options,
    };

    this._runs = 0;
  }

  /**
   * Private run method to deal with the {@link Timer._running} property, as the method may call itself
   */
  #run() {
    if (this._timeLeft <= TIMEOUT_MAX) {
      this._timer = globalThis.setTimeout(() => {
        // update runs
        this._runs++;

        // call the callback with the given args
        try {
          this.cb(...this.options.args!);
        } catch (e) {
          if (!this.options.silent) {
            this.abort();
            throw e;
          }
        }

        // reset timeLeft, so that the next run starts with the expected time
        this._timeLeft = this.delay;

        // if the runs are finished, abort
        if (this._runs! === this.options.times!) {
          this.options.signal?.removeEventListener("abort", this.abort);

          this._running = false;
          // set ran to true as all runs have completed
          this._ran = true;
        } // else continue running
        else {
          this.#run();
        }
      }, this._timeLeft);
    } else {
      // long timeout
      this._timer = globalThis.setTimeout(() => {
        // update the time left
        this._timeLeft -= TIMEOUT_MAX;

        // run again with remaining time
        this.#run();
      }, TIMEOUT_MAX);
    }

    if (!this._persistent) {
      this.unref();
    }
  }

  /**
   * Runs the interval.
   * @returns the timer's id
   */
  run(): number {
    if (this._running) {
      console.warn(
        "The interval is already running. The call to run will be ignored",
      );
    } else if (this._isAborted) {
      console.warn(
        "The interval has been aborted. The call to run will be ignored",
      );
    } else {
      this.#run();

      this._running = true;
    }

    return this.id;
  }
}
