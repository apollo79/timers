/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { After } from "../src/After.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  type Spy,
  spy,
} from "@std/testing/mock";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assert } from "@std/assert";
import { FakeTime } from "@std/testing/time";

describe("after", function () {
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

  it("after", () => {
    const a = new After("50ms").do(fn);

    time.tick(60);

    assertSpyCall(fn, 0, { self: a });
    assert(a.timeout!.ran);
  });

  it("after stop", () => {
    const e = new After("50ms").do(fn);

    time.tick(30);

    assertSpyCalls(fn, 0);
    e.stop();

    time.tick(60);

    assertSpyCalls(fn, 0);
  });
});
