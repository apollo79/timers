import {
  assert,
  assertRejects,
  assertStrictEquals,
} from "https://deno.land/std@0.162.0/testing/asserts.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { AbortablePromise, AbortException, delay } from "../mod.ts";
import pTimeout, { TimeoutError } from "../src/pTimeout.ts";

const fixture = Symbol("fixture");
const fixtureError = new Error("fixture");

describe("pTimeout", () => {
  it("resolves before timeout", async () => {
    assertStrictEquals(
      await pTimeout(delay(50).then(() => fixture), 200),
      fixture,
    );
  });

  it("handles milliseconds being `Infinity`", async () => {
    assertStrictEquals(
      await pTimeout(delay(50).then(() => fixture), Infinity),
      fixture,
    );
  });

  it("rejects after timeout", async () => {
    const delayed = delay(200);
    await assertRejects(() => pTimeout(delayed, 50), TimeoutError);
    delayed.abort();
  });

  it("rejects before timeout if specified promise rejects", async () => {
    await assertRejects(() =>
      pTimeout(
        delay(50).then(() => {
          throw fixtureError;
        }),
        200,
      ), fixtureError.message);
  });

  describe("fallback argument", () => {
    let delayed: AbortablePromise<void>;

    beforeEach(() => {
      delayed = delay(200);
    });

    afterEach(() => {
      delayed.abort();
    });

    it("failMessage", async () => {
      await assertRejects(
        () => pTimeout(delayed, 50, { failMessage: "rainbow" }),
        "rainbow",
      );
    });

    it("failError", async () => {
      await assertRejects(() =>
        pTimeout(delayed, 50, {
          failError: new RangeError("cake"),
        }), RangeError);
    });

    it("rejecting fallbackFn", async () => {
      await assertRejects(() =>
        pTimeout(delayed, 50, {
          fallbackFn: () => Promise.reject(fixtureError),
        }), fixtureError.message);
    });

    it("throwing fallbackFn", async () => {
      await assertRejects(() =>
        pTimeout(delayed, 50, {
          fallbackFn() {
            throw new RangeError("cake");
          },
        }), RangeError);
    });
  });

  it("`.clear()` method", async () => {
    const start = new Date();
    const delayed = delay(300);
    const promise = pTimeout(delayed, 200);

    promise.abort();

    await promise;
    const diff = new Date().getTime() - start.getTime();
    assert(diff > 0 && diff < 350);
    delayed.abort();
  });

  it("rejects when calling `AbortController#abort()`", async () => {
    const abort = new AbortController();
    const { signal } = abort;
    const delayed = delay(3000);

    const promise = pTimeout(delayed, 2000, {
      signal,
    });

    abort.abort();

    await assertRejects(() => promise, AbortException);
    delayed.abort();
  });

  it("already aborted signal", async () => {
    const abort = new AbortController();
    const { signal } = abort;
    const delayed = delay(3000);

    abort.abort();

    await assertRejects(() =>
      pTimeout(delayed, 2000, {
        signal,
      }), AbortException);

    delayed.abort();
  });
});
