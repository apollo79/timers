// deno-lint-ignore-file no-explicit-any
import { Listener, Timeout } from "../mod.ts";

export class After {
  protected timeout?: Timeout<never[]>;

  protected cb?: Listener<never[]>;

  constructor(public readonly time: number | string) {}

  /**
   * runs the timeout
   */
  do(cb: Listener<never[]>) {
    if (this.timeout) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );

      this.timeout?.abort();
    }

    this.timeout = new Timeout(cb.bind(this), this.time);

    this.timeout.run();
  }

  stop(reason?: any) {
    this.timeout?.abort(reason);

    delete this.timeout;
  }
}
