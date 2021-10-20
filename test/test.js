import { expect } from "chai";
import { Caret } from "../dist/parsegraph-node";

describe("Package", function () {
  it("works", () => {
    expect(new Caret()).to.be.an.instanceof(Caret);
  });
});
