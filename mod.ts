// deno-lint-ignore-file no-explicit-any
/**
 * This module is browser compatible
 */
import { AbortException, Base, BaseOptions } from "./Base.ts";
import origPTimeout from "https://deno.land/x/p_timeout@1.0.2/mod.ts";

export type Listener<T extends any[] = any[]> = (...args: T) => void;

// deno-lint-ignore no-empty-interface
export interface TimeoutOptions<T extends any[] = any[]>
  extends BaseOptions<T> {}

export interface IntervalOptions<T extends any[] = any[]>
  extends BaseOptions<T> {
  times?: number;
}

const TIMEOUT_MAX = 2147483647; // 2^31-1

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
    delay: number = 0,
    options: TimeoutOptions<T> = {}
  ) {
    super(cb, delay, options);
  }

  run(): number {
    if (this._running) {
      throw new Error("The timeout is already running");
    } else if (this._ran) {
      throw new Error("The timeout ran already");
    } else if (this._isAborted) {
      throw new Error("The timeout has been aborted before running");
    } else {
      if (this._timeLeft <= TIMEOUT_MAX) {
        this._timer = globalThis.setTimeout(
          (...args) => {
            this.cb?.(...(args as T));

            this.options.signal?.removeEventListener("abort", this.abort);

            this._running = false;
            this._ran = true;
          },
          this._timeLeft,
          ...this.options.args!
        );
      } else {
        this._timer = globalThis.setTimeout(
          () => {
            this._timeLeft -= TIMEOUT_MAX;
            this.run();
          },
          TIMEOUT_MAX,
          ...this.options.args!
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
    options: IntervalOptions<T> = {}
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
          ...this.options.args!
        );
      } else {
        if (this._timeLeft <= TIMEOUT_MAX) {
          this._timer = globalThis.setTimeout(
            (...args) => {
              this.cb(...(args as T));

              this._timeLeft = this.delay;
            },
            this._timeLeft,
            ...this.options.args!
          );
        } else {
          this._timer = globalThis.setTimeout(
            () => {
              this._timeLeft -= TIMEOUT_MAX;

              this.run();
            },
            TIMEOUT_MAX,
            ...this.options.args!
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

export function setTimeout(cb: Listener, delay?: number, ...args: any[]) {
  const timeout = new Timeout(cb, delay, {
    args,
  });

  timeout.run();

  return timeout.timer!;
}

export function setInterval(cb: Listener, delay?: number, ...args: any[]) {
  const interval = new Interval(cb, delay, {
    args,
  });

  interval.run();

  return interval.timer!;
}

export function clearTimeout(id?: number) {
  globalThis.clearTimeout(id);
}

export function clearInterval(id?: number) {
  globalThis.clearInterval(id);
}

/**
 * Resolves after the given number of milliseconds.
 * @param ms milliseconds to wait
 * 
 * ```ts
 * const MSG = "Please type your name";
 * const info = document.querySelector("p.info");
 * const nameInput = document.querySelector("input.name"); 
 * const abort = new AbortController();
 * const { signal } = abort;
 * 
 * nameInput.addEventListener("input", () => abort.abort(), { once: true });
 * 
 * await delay(2000, {
 *     signal
 * });
 * 
 * info.textContent = MSG;
```
 */
export function delay(
  ms: number,
  options: Omit<TimeoutOptions, "args"> = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = new Timeout(resolve, ms, options);

    timeout.aborted.then(reject);

    try {
      timeout.run();
    } catch (e) {
      reject(new AbortException(e));
    }
  });
}

/**
 * execute a callback specified times with delay
 * 
 * @example
 * ```ts
 * import { times } from "https://deno.land/x/timers@0.1.0/mod.ts";
 * 
 * const paragraph = document.querySelector("p.numbers");
 * const abortBtn = document.querySelector("button.abort");
 * const abort = new AbortController();
 * const { signal } = abort;
 * 
 * abortBtn.addEventListener("click", () => abort.abort(), { once: true })
 * 
 * let i = 0;
 * times(() => {
 *     paragraph.textContent += `${i}, `;
 * 
 *     i++;
 * }, 200, 20, {
 *     signal
 * });
```
 */
export function times<T extends any[] = any[]>(
  cb: Listener<T>,
  delay: number,
  times: number,
  options: Omit<IntervalOptions<T>, "times">
) {
  const interval = new Interval<T>(cb, delay, {
    ...options,
    times,
  });

  interval.run();

  return interval.timer!;
}

/**
 * A typed version of {@linkcode setTimeout}
 * @param cb the callback to call
 * @param delay the delay in milliseconds
 * @param options {@linkcode TimeoutOptions}
 */
export function timeout<T extends any[] = any[]>(
  cb: Listener<T>,
  delay: number,
  options: TimeoutOptions<T>
) {
  const interval = new Timeout<T>(cb, delay, options);

  interval.run();

  return interval.timer!;
}

/**
 * A typed version of {@linkcode setInterval}
 * @param cb the callback to call
 * @param delay the delay in milliseconds
 * @param options {@linkcode IntervalOptions}
 */
export function interval<T extends any[] = any[]>(
  cb: Listener<T>,
  delay: number,
  options: IntervalOptions<T> = {}
) {
  const interval = new Interval<T>(cb, delay, options);

  interval.run();

  return interval.timer!;
}

/**
 * Timeout a promise after a specified amount of time.
 * @param options.promise - Promise to decorate.
 * @param options.milliseconds - Milliseconds before timing out.
 * @param options.fallbackFn - Do something other than rejecting with an error on timeout. You could for example retry.
 * @param options.failMessage - Specify a custom error message. Default: `'Promise timed out after 50 milliseconds'`.
 * @param options.failError - Specify a custom `Error`. It's recommended to sub-class `pTimeout.TimeoutError`.
 * @param options.customTimers - Specify custom implementations for the `setTimeout` and `clearTimeout` functions.
 * @returns A decorated `options.promise` that times out after `options.milliseconds` time. It has a `.clear()` method that clears the timeout.
 *
 * @example
 * ```ts
 * import pTimeout from './mod.ts'
 *
 * const delayedPromise = new Promise(resolve => setTimeout(resolve, 500))
 *
 * await pTimeout({
 *   promise: delayedPromise,
 *   milliseconds: 50
 * });
 *
 * //=> [TimeoutError: Promise timed out after 50 milliseconds]
 * ```
 */
export function pTimeout<T>(options: Parameters<typeof origPTimeout<T>>[0]) {
  return origPTimeout<T>({
    ...options,
    customTimers: {
      clearTimeout,
      setTimeout,
    },
  });
}

export {
  setTimeout as setLongTimeout,
  setInterval as setLongInterval,
  clearTimeout as clearLongTimeout,
  clearInterval as clearLongInterval,
};
