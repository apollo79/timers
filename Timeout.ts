// deno-lint-ignore-file no-explicit-any
import { Base, BaseOptions } from "./Base.ts";
import { AbortException, Listener, TIMEOUT_MAX } from "./mod.ts";

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

  run(): number {
    if (this._running) {
      throw new Error("The timeout is already running");
    } else if (this._isAborted) {
      throw new Error("The timeout has been aborted before running");
    } else {
      if (this._timeLeft <= TIMEOUT_MAX) {
        this._timer = globalThis.setTimeout(
          (...args) => {
            this.cb?.(...(args as T));

            this.options.signal?.removeEventListener("abort", this.abort);

            this._running = false;
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

      this._running = true;
    }

    if (!this._persistent) {
      this.unref();
    }

    return this.timer!;
  }

  abort(reason?: any) {
    this._running = false;

    const exception = new AbortException(reason);

    this._resolveAborted(exception);

    globalThis.clearTimeout(this._timer);
  }
}
