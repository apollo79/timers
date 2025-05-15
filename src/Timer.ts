// deno-lint-ignore-file no-explicit-any
import { AbortException, type Listener, TIMEOUT_MAX } from "../mod.ts";
import { strToMs } from "./util.ts";

export interface TimerOptions<T extends any[] = any[]> {
  /** The args to pass to the timer's callback */
  args?: T;
  /** An AbortSignal with which one can abort the timer */
  signal?: AbortSignal;
  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. Only works in `Deno`. */
  persistent?: boolean;
  /** If true, errors thrown in the timer's callback are ignored */
  silent?: boolean;
  /** How often the callback should get executed */
  times?: number;
}

/** A global Map of all the timers, used for clearing them. */
export const timers: Map<number, Timer> = new Map<number, Timer>();

/** starts with 1 to prevent the default value of {@linkcode clearTimeout}'s id argument (0) to clear a timeout */
let nextId = 1;

/**
 * Shared functionality of the `Timeout` and `Interval` classes
 */
export abstract class Timer<T extends any[] = any[]> {
  /** A unique id for this timer */
  public readonly id: number;

  /** Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. */
  protected _persistent: boolean;

  /** The timer's id, this is the id from the  */
  protected _timer?: number;

  /** The time left for the timer. This is important when the timer's delay is longer than the standard maximum delay of the engine. */
  protected _timeLeft!: number;

  /** Indicates whether the timer ran already. */
  protected _ran = false;

  /**
   * This will only be set to true, if the `times` options has been passed and the interval has run `times` often
   */
  get ran(): boolean {
    return this._ran;
  }

  /** Indicates how often the timer has run already. */
  protected _runs: number;

  /** Indicates whether the timer is currently running. */
  protected _running = false;

  readonly options: TimerOptions<T>;

  /** A Promise which resolves when the timer gets aborted. */
  readonly aborted: Promise<AbortException>;

  /** An internal method which resolves the {@linkcode Timer.aborted} promise. */
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
   * Can be used as synchronous check instead of having to use the promise {@linkcode Timer.aborted}
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
   * @param options.persistent Indicates whether the process should continue to run as long as the timer exists. This is `true` by default. Only works in `Deno`.
   * @param options.times How often the timer should run
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
   * Private run method to deal with the {@linkcode Timer._running} property, as the method may call itself
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
          this.clear();
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
   * Runs the timer.
   * @returns the timer's id
   */
  run(): number {
    if (this._ran) {
      console.warn("The timer already ran. The call to run will be ignored");
    }
    if (this._running) {
      console.warn(
        "The timer is already running. The call to run will be ignored",
      );
    } else if (this._isAborted) {
      console.warn(
        "The timer has been aborted. The call to run will be ignored",
      );
    } else {
      this.#run();

      this._running = true;
    }

    return this.id;
  }
  /**
   * Clears the timer, sets it's state to not running and removes it from the global store, but without resolving {@linkcode Timer.aborted}.
   */
  protected clear() {
    // clearTimeout and clearInterval are interchangeable, this is ugly, but works
    globalThis.clearTimeout(this._timer);

    this._running = false;

    // remove timer from the global store
    timers.delete(this.id);

    this._timer = undefined;

    this.options.signal?.removeEventListener("abort", this.abort);
  }

  /**
   * Aborts the timer.
   * @param reason optional reason for aborting
   */
  abort = (reason?: any): void => {
    this.clear();

    const exception = new AbortException(reason);

    this._resolveAborted(exception);
  };
}
