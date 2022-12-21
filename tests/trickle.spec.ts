import Trickle, { retryFn as retry } from "../lib";
import { expect } from "chai";
import sinon from "sinon";
import { once } from "lodash";

describe("On trickle", () => {
  it("perform single operation", async () => {
    const ops: any[] = [];
    const trickle = new Trickle({}, {}, {}, ops);
    await trickle.new(() => 3, []).done();
    expect(ops.length).to.be.equal(1);
  });

  it("perform multi operation", async () => {
    const ops: any[] = [];
    const trickle = new Trickle({}, {}, {}, ops);
    await trickle
      .new(() => 3, [])
      .continue(() => 3)
      .done();
    expect(ops.length).to.be.equal(2);
  });

  it("use environment variable", async () => {
    const ops: any[] = [];
    const environment = {
      env: "production",
    };
    const trickle = new Trickle(environment, {}, {}, ops);
    const cb = sinon.fake();
    const proxy = once(cb);
    await trickle
      .new((x, y) => x + ":" + y, ["{{env}}", 3])
      .continue((x) => {
        proxy(x);
      })
      .done();
    expect(cb.calledWith("production:3")).to.be.true;
  });

  it("store and use context argument", async () => {
    const ops: any[] = [];
    const environment = {
      env: "production",
    };
    const context = {};
    const trickle = new Trickle(environment, context, {}, ops);
    const cb = sinon.fake.returns("ok");
    const proxy = once(cb);

    await trickle
      .new((x, y) => x + ":" + y, ["{{env}}", 3])
      .store((x) => ({ res: x }))
      .new((x) => proxy(x), ["<<res>>"])
      .done();
    expect(cb.calledWith("production:3")).to.be.true;
  });

  it("use environment and context variables", async () => {
    let envArgs = {
      outputTemplate: "The result is ",
    };
    let trickle = new Trickle(envArgs, {});

    const cb1 = sinon.fake();
    const cb2 = sinon.fake();

    await trickle
      .new((x) => x * x, [4])
      .transform((x) => x / 2)
      .store((x) => ({ output: x }))
      .continue((x) => `Half of 16 is ${x}`)
      .continue(cb1)
      .new(
        (format, value) => format + value,
        ["{{outputTemplate}}", "<<output>>"]
      )
      .continue(cb2)
      .done();

    expect(cb1.calledWith("Half of 16 is 8"));
    expect(cb2.calledWith("The result is 8"));
  });

  it("with retries perform sucessful operation", async () => {
    const myFunc = () => {
      let x = 3;
      return () => {
        x = x - 1;
        return x;
      };
    };
    const generator = myFunc();

    const retryableFn = retry((x: number) => x == 0, {
      retryCount: 5,
      delayInterval: 5,
    });
    const cb = sinon.fake();

    const ops: any[] = [];
    const trickle = new Trickle({}, {}, {}, ops);
    await trickle.new(retryableFn, [generator]).continue(cb).done();

    expect(ops.length).to.be.equal(2);
    expect(cb.calledWith(0)).to.be.true;
  });
});
