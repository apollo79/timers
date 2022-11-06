// deno-lint-ignore-file no-explicit-any
import { Listener, Timeout } from "../mod.ts";

export class After {
  protected interval?: Timeout<never[]>;

  protected cb?: Listener<never[]>;

  constructor(public readonly time: number | string) {}

  /**
   * runs the timeout
   */
  do(cb: Listener<never[]>) {
    if (this.interval) {
      console.warn(
        "The interval is already running and gets cancelled now and restarts.",
      );
    }

    this.interval = new Timeout(cb, this.time);

    this.interval.run();
  }

  stop(reason?: any) {
    this.interval?.abort(reason);

    delete this.interval;
  }
}
