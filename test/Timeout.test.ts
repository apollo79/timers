import {
  assert,
  assertStrictEquals,
  unreachable,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { Timeout, TIMEOUT_MAX } from "../mod.ts";
import { FakeTime } from "https://deno.land/std@0.162.0/testing/time.ts";
import {
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";

const noop = () => {};

describe("Timeout", () => {
  let time: FakeTime;
  beforeEach(() => {
    time = new FakeTime();
  });
  afterEach(() => {
    time.restore();
  });

  describe("abortable", () => {
    it("abort method", () => {
      const timeout = new Timeout(unreachable, 100);
      timeout.run();

      assert(!timeout.isAborted);

      timeout.abort();

      time.tick(110);

      assert(timeout.isAborted);
      assert(!timeout.ran);
    });

    describe("signal", () => {
      it("aborted while running", () => {
        const abort = new AbortController();

        const { signal } = abort;

        const timeout = new Timeout(unreachable, 100, {
          signal,
        });

        timeout.run();

        assert(!timeout.isAborted);

        abort.abort();

        time.tick(110);

        assert(timeout.isAborted);
      });

      it("aborted before running", () => {
        const abort = new AbortController();

        const { signal } = abort;

        const timeout = new Timeout(unreachable, 100, {
          signal,
        });

        abort.abort();

        assert(timeout.isAborted);

        timeout.run();

        time.tick(110);

        assert(timeout.isAborted);
      });
    });
  });

  it("string time", () => {
    const start = new Date();
    let i = 0;

    const timeout = new Timeout(() => {
      const diff = new Date().getTime() - start.getTime();

      assert(diff >= 100);

      i++;
    }, "100 ms");

    timeout.run();

    time.tick(110);

    assertStrictEquals(i, 1);
  });

  it("persistent property", () => {
    const timeout = new Timeout(noop, 100, {
      persistent: false,
    });

    timeout.ref();
    assert(!timeout.persistent);

    timeout.run();
    assert(!timeout.persistent);

    timeout.ref();
    assert(timeout.persistent);

    timeout.unref();
    assert(!timeout.persistent);
    timeout.abort();
  });

  it("running and ran property", () => {
    const timeout = new Timeout(noop, 100);
    timeout.run();

    assert(timeout.running);
    assert(!timeout.ran);

    time.tick(110);

    assert(!timeout.running);
    assert(timeout.ran);
  });

  it("long timeout", () => {
    const fn = spy();

    const timeout = new Timeout(fn, TIMEOUT_MAX + 100);
    timeout.run();

    time.tick(TIMEOUT_MAX);
    assertSpyCalls(fn, 0);

    time.tick(110);
    assertSpyCalls(fn, 1);
  });
});
