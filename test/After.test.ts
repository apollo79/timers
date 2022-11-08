/**
 * adapted from https://github.com/popomore/schedule/blob/master/test.js
 */

import { After } from "../src/After.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  Spy,
  spy,
} from "https://deno.land/std@0.162.0/testing/mock.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.162.0/testing/bdd.ts";
import { assert } from "https://deno.land/std@0.162.0/testing/asserts.ts";
import { FakeTime } from "https://deno.land/std@0.162.0/testing/time.ts";

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
