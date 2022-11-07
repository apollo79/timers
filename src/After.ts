// deno-lint-ignore-file no-explicit-any
import { Listener, Timeout } from "../mod.ts";

export class After {
  protected _timeout?: Timeout<never[]>;

  get timeout() {
    return this._timeout;
  }

  protected cb?: Listener<never[]>;

  constructor(public readonly time: number | string) {}

  /**
   * runs the timeout
   */
  do(cb: Listener<never[]>) {
    if (this._timeout) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this._timeout?.abort();
    }

    this._timeout = new Timeout(cb.bind(this), this.time);

    this._timeout.run();
  }

  stop(reason?: any) {
    this._timeout?.abort(reason);

    delete this._timeout;
  }
}
