// deno-lint-ignore-file no-explicit-any
import { AbortException, Listener } from "./mod.ts";

export interface BaseOptions<T extends any[] = any[]> {
  args?: T;
  signal?: AbortSignal;
  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  persistent?: boolean;
}

// shared functionality
export abstract class Base<T extends any[] = any[]> {
  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  protected _persistent: boolean;
  /** The timer Id */
  protected _timer?: number;
  protected _timeLeft!: number;
  /** Indicates whether the timer ran already */
  protected _ran = false;
  /** Indicates whether the timer is currently running */
  protected _running = false;
  readonly options: BaseOptions<T>;
  /** A Promise, that resolves when the timer gets aborted */
  readonly aborted: Promise<AbortException>;
  protected _resolveAborted!: (value: AbortException) => void;
  /** A boolean value that indicates whether the timer has been aborted */
  protected _isAborted = false;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  get persistent() {
    return this._persistent;
  }

  /** The timer Id */
  get timer() {
    return this._timer;
  }

  /** Indicates whether the timer ran already */
  get ran() {
    return this._ran;
  }

  /** Indicates whether the timer is currently running */
  get running() {
    return this._running;
  }

  /** A boolean value that indicates whether the timer has been aborted */
  get isAborted() {
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
    public readonly delay: number,
    options: BaseOptions<T>,
  ) {
    this._timeLeft = this.delay;

    const { signal, args, persistent } = options;

    this._persistent = persistent ?? true;

    this.options = {
      args: (args ?? []) as T,
      persistent: this._persistent,
      ...options,
    };

    this._timeLeft = delay;

    this.aborted = new Promise<AbortException>((resolve) => {
      this._resolveAborted = (exception: AbortException) => {
        this._isAborted = true;

        resolve(exception);
      };
    });

    if (signal?.aborted) {
      const exception = new AbortException(signal.reason);

      this._resolveAborted(exception);
    } else {
      signal?.addEventListener("abort", () => this.abort(), {
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
   * aborts the timer
   * @param reason
   */
  abstract abort(reason?: any): void;
}
