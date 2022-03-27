import Trickle from "../lib/trickle";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("On trickle", () => {
  it("perform single operation", async () => {
    const store = { ops: [], g: {} };
    await Trickle.perform(() => 3, [], store).done();
    expect(store.ops.length).to.be.equal(1);
  });

  it("throw exception when validate fails", async () => {
    await expect(
      Trickle.perform(() => 3, [])
        .validate((x) => x === 4)
        .done()
    ).to.be.rejected;
  });

  it("finish when validate pass", async () => {
    await expect(
      Trickle.perform(() => 3, [])
        .validate((x) => x === 3)
        .done()
    ).to.not.be.rejected;
  });
});
