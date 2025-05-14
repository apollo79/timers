// deno-lint-ignore-file no-explicit-any
import { AbortException, type Listener } from "../mod.ts";
import { strToMs } from "./util.ts";

export interface TimerOptions<T extends any[] = any[]> {
  args?: T;
  signal?: AbortSignal;
  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  persistent?: boolean;
  silent?: boolean;
}

/** A global Map of all the timers, used for clearing them. */
export const timers: Map<number, Timer> = new Map<number, Timer>();

let nextId = 1;

/**
 * Shared functionality of the `Timeout` and `Interval` classes
 */
export abstract class Timer<T extends any[] = any[]> {
  /** A unique id for this timer */
  public readonly id: number;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  protected _persistent: boolean;

  /** The timer's id */
  protected _timer?: number;

  /** The time left for the timer. This is important when the timer's delay is longer than the standard maximum delay of the engine. */
  protected _timeLeft!: number;

  /** Indicates whether the timer ran already. */
  protected _ran = false;

  /** Indicates whether the timer is currently running. */
  protected _running = false;

  readonly options: TimerOptions<T>;

  /** A Promise which resolves when the timer gets aborted. */
  readonly aborted: Promise<AbortException>;

  /** An internal method which resolves the {@link Timer.aborted} promise. */
  protected _resolveAborted!: (value: AbortException) => void;

  /** A boolean value that indicates whether the timer has been aborted. */
  protected _isAborted = false;

  /** The timer's delay. After this delay the timer's callback is executed. */
  public readonly delay: number;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  get persistent(): boolean {
    return this._persistent;
  }

  /** The timer's id */
  get timer(): number {
    return this.id;
  }

  /** Indicates whether the timer is currently running */
  get running(): boolean {
    return this._running;
  }

  /**
   * A boolean value that indicates whether the timer has been aborted.
   * Can be used as synchronous check instead of having to use the promise {@link Timer.aborted}
   */
  get isAborted(): boolean {
    return this._isAborted;
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
    public readonly cb: Listener<T>,
    delay: number | string,
    options: TimerOptions<T>,
  ) {
    // convert string to number of milliseconds
    delay = typeof delay === "number" ? delay : strToMs(delay);

    if (![1, 0].includes(Math.sign(delay))) {
      throw new TypeError(
        `Expected \`delay\` to be a positive number, got \`${delay}\``,
      );
    }

    if (delay === Infinity) {
      throw new TypeError("`delay` must not be `Infinity`");
    }

    this.delay = delay;

    // timeLeft is the `delay` at beginning
    this._timeLeft = this.delay;

    const { signal, args, persistent } = options;

    // unique id
    this.id = nextId++;

    // add this timer to the `timers` Map
    timers.set(this.id, this as unknown as Timer);

    this._persistent = persistent ?? true;

    this.options = {
      args: (args ?? []) as T,
      persistent: this._persistent,
      silent: false,
      ...options,
    };

    this.aborted = new Promise<AbortException>((resolve) => {
      this._resolveAborted = (exception: AbortException) => {
        this._isAborted = true;

        resolve(exception);
      };
    });

    // if the AbortController's `abort` method was called before instantiating this timer
    if (signal?.aborted) {
      const exception = new AbortException(signal.reason);

      this._resolveAborted(exception);
    } else {
      signal?.addEventListener("abort", this.abort, {
        once: true,
      });
    }
  }

  /**
   * Makes the timer of the given id not block the event loop from finishing.
   */
  unref() {
    if (this._persistent && this._timer) {
      try {
        // @ts-ignore For browser compatibility
        Deno.unrefTimer(this._timer);
        this._persistent = false;
      } catch (error) {
        if (!(error instanceof ReferenceError)) {
          throw error;
        }

        console.error("unreffing and reffing is only available in Deno");
      }
    }
  }

  /**
   * Makes the timer of the given id block the event loop from finishing.
   */
  ref() {
    if (!this._persistent && this._timer) {
      try {
        // @ts-ignore For browser compatibility
        Deno.refTimer(this._timer);
        this._persistent = true;
      } catch (error) {
        if (!(error instanceof ReferenceError)) {
          throw error;
        }

        console.error("unreffing and reffing is only available in Deno");
      }
    }
  }

  /**
   * Runs the timer.
   * @returns the timer's id
   */
  abstract run(): number;

  /**
   * Clears without resolving {@link Timer.aborted}.
   */
  protected clear() {
    // clearTimeout and clearInterval are interchangeable, this is ugly, but works
    globalThis.clearTimeout(this._timer);
  }

  /**
   * Aborts the timer.
   * @param reason optional reason for aborting
   */
  abort = (reason?: any): void => {
    this.clear();

    this._running = false;

    const exception = new AbortException(reason);

    this._resolveAborted(exception);

    timers.delete(this.id);

    this._timer = undefined;

    this.options.signal?.removeEventListener("abort", this.abort);
  };
}
