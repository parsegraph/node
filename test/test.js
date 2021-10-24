import { expect } from "chai";
import { Caret } from "../dist/parsegraph-node.lib";

describe("Package", function () {
  it("works", () => {
    expect(new Caret()).to.be.an.instanceof(Caret);
  });
});
