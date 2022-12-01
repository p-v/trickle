import retry from '../../lib/helpers/retry';

import { expect } from "chai";
import sinon from "sinon";

describe("On retry", () => {
  it("with multiple retries perform successful operation", async () => {
    const retryableFn = retry(({val}: {val: number}) => val == 0, {
      retryCount: 2,
      delayInterval: 10
    })

    let input = {
      val: 2
    }
    const cb = sinon.fake();

    const res = await retryableFn((x: typeof input) => {
      x['val'] -= 1;
      cb();
      return x;
    }, input)

    expect(cb.calledTwice).to.be.true;
    expect(res).to.deep.equals({ val: 0 });
  });

  it("with multiple retries perform failure operation", async () => {
    const retryableFn = retry(({val}: {val: number}) => val == 2, {
      retryCount: 2,
      delayInterval: 10
    })

    let input = {
      val: 6
    }
    const cb = sinon.fake();

    try {
      await retryableFn((x: typeof input) => {
        --x.val;
        cb();
        return x;
      }, input)
      expect.fail("The operation should not pass")
    } catch (e: any) {
      expect(e.message).to.equals("Condition timeout")
      expect(cb.calledThrice).to.be.true;
    }
  });
});

