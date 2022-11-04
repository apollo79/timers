// deno-lint-ignore-file no-explicit-any
import { Base, BaseOptions } from "./Base.ts";
import { Listener, TIMEOUT_MAX } from "./mod.ts";

// deno-lint-ignore no-empty-interface
export interface TimeoutOptions<T extends any[] = any[]>
  extends BaseOptions<T> {}

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
export class Timeout<T extends any[] = any[]> extends Base<T> {
  declare readonly options: TimeoutOptions<T>;

  protected _ran = false;

  get ran() {
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
    options: TimeoutOptions<T> = {},
  ) {
    super(cb, delay, options);
  }

  /**
   * private run method to deal with `_running` property, as the method may call itself
   */
  #run() {
    if (this._timeLeft <= TIMEOUT_MAX) {
      this._timer = globalThis.setTimeout(() => {
        this.cb(...this.options.args!);

        this.options.signal?.removeEventListener("abort", this.abort);

        this._running = false;
        this._ran = true;
      }, this._timeLeft);
    } else {
      this._timer = globalThis.setTimeout(() => {
        this._timeLeft -= TIMEOUT_MAX;

        globalThis.clearTimeout(this._timer);

        this._timer = undefined;

        this.#run();
      }, TIMEOUT_MAX);
    }
  }

  run(): number {
    if (this._running) {
      console.warn(
        "The timeout is already running. The call to run will be ignored",
      );
    } else if (this._isAborted) {
      console.warn(
        "The timeout has been aborted. The call to run will be ignored",
      );
    } else {
      this.#run();

      if (!this._persistent) {
        this.unref();
      }

      this._running = true;
    }

    return this.id;
  }
}
