// deno-lint-ignore-file no-explicit-any
import { Timer, type TimerOptions } from "./Timer.ts";
import { type Listener, TIMEOUT_MAX } from "../mod.ts";

export interface TimeoutOptions<T extends any[] = any[]>
  extends TimerOptions<T> {}

/**
 * @class The class representing a timeout
 * @example
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
export class Timeout<T extends any[] = any[]> extends Timer<T> {
  declare readonly options: TimeoutOptions<T>;

  protected _ran = false;

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
   */
  constructor(
    cb: Listener<T>,
    delay: number | string = 0,
    options: TimeoutOptions<T> = {}
  ) {
    super(cb, delay, options);
  }

  /**
   * private run method to deal with `_running` property, as the method may call itself
   */
  #run() {
    // if the remaining time to wait is in the range that is possible to handle for the native methods
    if (this._timeLeft <= TIMEOUT_MAX) {
      this._timer = globalThis.setTimeout(() => {
        // call the callback with the given args
        try {
          this.cb(...this.options.args!);
        } catch (e) {
          if (!this.options.silent) {
            this.abort();
            throw e;
          }
        }

        this.options.signal?.removeEventListener("abort", this.abort);

        this._running = false;
        this._ran = true;
      }, this._timeLeft);
    } else {
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

  run(): number {
    if (this._running) {
      console.warn(
        "The timeout is already running. The call to run will be ignored"
      );
    } else if (this._isAborted) {
      console.warn(
        "The timeout has been aborted. The call to run will be ignored"
      );
    } else {
      this.#run();

      this._running = true;
    }

    return this.id;
  }
}
