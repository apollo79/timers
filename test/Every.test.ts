/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { Every } from "../src/Every.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  type Spy,
  spy,
} from "@std/testing/mock";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";
import { FakeTime } from "@std/testing/time";

describe("every", function () {
  let fn: Spy;
  beforeEach(() => {
    fn = spy();
  });

  let time: FakeTime;
  beforeEach(() => {
    time = new FakeTime();
  });
  afterEach(() => {
    time.restore();
  });

  it("every", () => {
    const e = new Every("50ms").do(fn);

    time.tick(60);
    assertSpyCall(fn, 0, { self: e });

    time.tick(60);

    assertSpyCalls(fn, 2);

    time.tick(60);
    assertSpyCalls(fn, 3);

    e.stop();
  });

  it("times", () => {
    const e = new Every("50ms").limit(3).do(fn);

    time.tick(60);

    assertSpyCall(fn, 0, { self: e });

    time.tick(60);

    assertSpyCalls(fn, 2);

    time.tick(60);

    assertSpyCalls(fn, 3);
    assert(e.interval!.ran);
  });

  it("stop", () => {
    const e = new Every("50ms").do(fn);

    time.tick(60);

    assertSpyCall(fn, 0, { self: e });
    e.stop();

    time.tick(60);

    assertSpyCalls(fn, 1);
  });
});
