import {
  assert,
  assertStrictEquals,
  assertThrows,
  unreachable,
} from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { Interval, TIMEOUT_MAX } from "../mod.ts";
import { assertSpyCalls, type Spy, spy } from "@std/testing/mock";
import { FakeTime } from "@std/testing/time";

const noop = () => {};

describe("Interval", () => {
  let time: FakeTime;
  beforeEach(() => {
    time = new FakeTime();
  });
  afterEach(() => {
    time.restore();
  });

  describe("abortable", () => {
    let fn: Spy;
    beforeEach(() => {
      fn = spy(() => {
        if (fn.calls.length == 2) {
          unreachable();
        }
      });
    });

    it("abort method", () => {
      const interval = new Interval(fn, 100);

      interval.run();

      assert(!interval.isAborted);

      time.tick(110);

      assert(!interval.isAborted);

      interval.abort();

      time.tick(110);

      assert(interval.isAborted);
    });

    describe("signal", () => {
      it("aborted while running", async () => {
        const start = new Date();
        const abort = new AbortController();

        const { signal } = abort;

        const interval = new Interval(fn, 100, {
          signal,
        });

        interval.run();

        time.tick(110);

        abort.abort();

        await interval.aborted.then(() => {
          const diff = new Date().getTime() - start.getTime();

          assert(diff < 200);
          assertSpyCalls(fn, 1);
        });

        time.tick(110);

        assert(interval.isAborted);
        assertSpyCalls(fn, 1);
      });

      it("aborted before running", async () => {
        const start = new Date();
        const abort = new AbortController();

        const { signal } = abort;

        abort.abort();

        const interval = new Interval(fn, 100, {
          signal,
        });

        assert(interval.isAborted);

        await interval.aborted.then(() => {
          const diff = new Date().getTime() - start.getTime();

          assert(diff < 100);
        });

        interval.run();

        time.tick(110);

        assertSpyCalls(fn, 0);
      });
    });
  });

  it("string time", () => {
    let start = new Date();

    const fn = spy(() => {
      const now = new Date(),
        diff = now.getTime() - start.getTime();

      assert(diff >= 100);

      start = now;
    });

    const interval = new Interval(fn, " 200milliseconds");

    interval.run();

    time.tick(210);

    assertSpyCalls(fn, 1);

    time.tick(210);

    assertSpyCalls(fn, 2);

    interval.abort();
  });

  it("running and ran property", () => {
    const interval = new Interval(noop, 100, {
      times: 2,
    });

    interval.run();

    assert(interval.running);
    assert(!interval.ran);

    time.tick(210);

    assert(!interval.running);
    assert(interval.ran);
  });

  it("times option", () => {
    const fn = spy(() => {
      if (fn.calls.length > 5) {
        unreachable();
      }
    });

    const interval = new Interval(fn, 100, {
      times: 5,
    });

    interval.run();

    for (let i = 0; i <= 7; i++) {
      time.tick(110);
    }
  });

  describe("silent option", () => {
    it("throws by default", () => {
      assertThrows(
        () => {
          const timeout = new Interval(() => {
            throw new Error("test error");
          }, 100);

          timeout.run();

          time.tick(100);
        },
        Error,
        "test error",
      );
    });

    it("doesn't throw when `silent` is enabled", () => {
      const timeout = new Interval(
        () => {
          throw new Error("test error");
        },
        100,
        {
          silent: true,
        },
      );

      timeout.run();

      time.tick(100);
    });
  });

  it("runs property", () => {
    const fn: Spy = spy<Interval<never>, never, void>(function () {
      assertStrictEquals(this.runs, fn.calls.length + 1);
    });

    const interval = new Interval(fn, 100, {
      times: 5,
    });

    interval.run();

    for (let i = 0; i <= 5; i++) {
      time.tick(110);
    }
  });

  it("long interval", () => {
    const fn = spy();

    const interval = new Interval(fn, TIMEOUT_MAX + 100);
    interval.run();

    time.tick(TIMEOUT_MAX);
    assertSpyCalls(fn, 0);

    time.tick(120);
    assertSpyCalls(fn, 1);

    time.tick(TIMEOUT_MAX + 120);
    assertSpyCalls(fn, 2);

    interval.abort();
  });
});
