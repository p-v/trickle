import Trickle from "../lib/trickle";
import { expect } from "chai";
import sinon from "sinon";
import { once } from "lodash";

describe("On trickle", () => {
  it("perform single operation", async () => {
    const ops: any[] = [];
    const trickle = new Trickle({}, {}, ops);
    await trickle.new(() => 3, []).done();
    expect(ops.length).to.be.equal(1);
  });

  it("perform multi operation", async () => {
    const ops: any[] = [];
    const trickle = new Trickle({}, {}, ops);
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
    const trickle = new Trickle(environment, {}, ops);
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
    const trickle = new Trickle(environment, context, ops);
    const cb = sinon.fake.returns("ok");
    const proxy = once(cb);

    await trickle
      .new((x, y) => x + ":" + y, ["{{env}}", 3])
      .store((x) => ({ res: x }))
      .new((x) => proxy(x), ["<<res>>"])
      .done();
    expect(cb.calledWith("production:3")).to.be.true;
  });
});
