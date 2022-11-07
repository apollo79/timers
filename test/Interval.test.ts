import {
  assert,
  assertStrictEquals,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import {
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { Interval } from "../mod.ts";
import { delay as stdDelay } from "https://deno.land/std@0.162.0/async/delay.ts";
import {
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";

const noop = () => {};

describe("Interval", () => {
  describe("abortable", () => {
    let fn: Spy;
    beforeEach(() => {
      fn = spy(() => {
        if (fn.calls.length == 2) {
          unreachable();
        }
      });
    });

    it("abort method", async () => {
      const interval = new Interval(fn, 100);

      interval.run();

      assert(!interval.isAborted);

      await stdDelay(110);

      assert(!interval.isAborted);

      interval.abort();

      await stdDelay(110);

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

        await stdDelay(110);

        abort.abort();

        await interval.aborted.then(() => {
          const diff = new Date().getTime() - start.getTime();

          assert(diff < 200);
          assertSpyCalls(fn, 1);
        });

        await stdDelay(110);

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

        await stdDelay(110);

        assertSpyCalls(fn, 0);
      });
    });
  });

  it("string time", async () => {
    let start = new Date();

    const fn = spy(() => {
      const now = new Date(),
        diff = now.getTime() - start.getTime();

      assert(diff >= 100);

      start = now;
    });

    const interval = new Interval(fn, " 200milliseconds");

    interval.run();

    await stdDelay(210);

    assertSpyCalls(fn, 1);

    await stdDelay(210);

    assertSpyCalls(fn, 2);

    interval.abort();
  });

  it("persistent property", () => {
    const interval = new Interval(noop, 100, {
      persistent: false,
    });

    interval.ref();
    assert(!interval.persistent);

    interval.run();
    assert(!interval.persistent);

    interval.ref();
    assert(interval.persistent);

    interval.unref();
    assert(!interval.persistent);
    interval.abort();
  });

  it("running and ran property", async () => {
    const interval = new Interval(noop, 100, {
      times: 2,
    });

    interval.run();

    assert(interval.running);
    assert(!interval.ran);

    await stdDelay(220);

    assert(!interval.running);
    assert(interval.ran);
  });

  it("times option", async () => {
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
      await stdDelay(110);
    }
  });

  it("runs property", async () => {
    const fn: Spy = spy<Interval<never>, never, void>(function () {
      assertStrictEquals(this.runs, fn.calls.length + 1);
    });

    const interval = new Interval(fn, 100, {
      times: 5,
    });

    interval.run();

    for (let i = 0; i <= 5; i++) {
      await stdDelay(110);
    }
  });
});
