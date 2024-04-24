// deno-lint-ignore-file no-explicit-any
import { AbortException, Listener } from "../mod.ts";
import { strToMs } from "./util.ts";

export interface TimerOptions<T extends any[] = any[]> {
  args?: T;
  signal?: AbortSignal;
  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  persistent?: boolean;
  silent?: boolean;
}

export const timers: Map<number, Timer> = new Map<number, Timer>();

let nextId = 1;

// shared functionality
export abstract class Timer<T extends any[] = any[]> {
  public readonly id: number;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  protected _persistent: boolean;

  /** The timer Id */
  protected _timer?: number;

  protected _timeLeft!: number;

  /**
   * Indicates whether the timer ran already
   */
  protected _ran = false;

  /**
   * Indicates whether the timer is currently running
   */
  protected _running = false;

  readonly options: TimerOptions<T>;
  /** A Promise, that resolves when the timer gets aborted */
  readonly aborted: Promise<AbortException>;

  protected _resolveAborted!: (value: AbortException) => void;

  /** A boolean value that indicates whether the timer has been aborted */
  protected _isAborted = false;
  public readonly delay: number;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  get persistent(): boolean {
    return this._persistent;
  }

  /**
   * The timer Id
   * @deprecated Don't use this as it doesn't represent the timer Id you should use with `clearTimeout` and `clearInterval`
   */
  get timer(): number {
    return this.id;
  }

  /**
   * Indicates whether the timer is currently running
   */
  get running(): boolean {
    return this._running;
  }

  /** A boolean value that indicates whether the timer has been aborted */
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
    options: TimerOptions<T>
  ) {
    // convert string to number of milliseconds
    delay = typeof delay === "number" ? delay : strToMs(delay);

    if (![1, 0].includes(Math.sign(delay))) {
      throw new TypeError(
        `Expected \`delay\` to be a positive number, got \`${delay}\``
      );
    }

    if (delay === Infinity) {
      throw new TypeError("`delay` must not be `Infinity`");
    }

    this.delay = delay;

    // timeLeft is the `delay` at beginning
    this._timeLeft = this.delay;

    const { signal, args, persistent } = options;

    // unique ID
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
   * makes the process not continue to run as long as the timer exists
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
   * makes the process not continue to run as long as the timer exists
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
   * runs the timer
   * @returns the timer ID
   */
  abstract run(): number;

  /**
   * clear without resolve {@linkcode Timer.aborted}
   */
  protected clear() {
    // clearTimeout and clearInterval are interchangeable, this is ugly, but works
    globalThis.clearTimeout(this._timer);
  }

  /**
   * aborts the timer
   * @param reason
   */
  abort = (reason?: any) => {
    this.clear();

    this._running = false;

    const exception = new AbortException(reason);

    this._resolveAborted(exception);

    timers.delete(this.id);

    this._timer = undefined;

    this.options.signal?.removeEventListener("abort", this.abort);
  };
}
