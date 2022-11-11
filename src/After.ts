// deno-lint-ignore-file no-explicit-any
import { Listener, Timeout, TimeoutOptions } from "../mod.ts";

export class After<T extends any[] = any[]> {
  protected _timeout?: Timeout<T>;

  get timeout() {
    return this._timeout;
  }

  protected cb?: Listener<never[]>;

  constructor(
    public readonly time: number | string,
    public readonly options: TimeoutOptions<T> = {},
  ) {}

  /**
   * runs the timeout
   */
  do(cb: Listener<T>) {
    if (this._timeout) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this._timeout?.abort();
    }

    this._timeout = new Timeout(cb.bind(this), this.time, this.options);

    this._timeout.run();

    return this;
  }

  stop(reason?: any) {
    this._timeout?.abort(reason);

    delete this._timeout;
  }
}
