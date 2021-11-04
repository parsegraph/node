import { expect } from "chai";
import {
  DefaultNodePalette,
  BlockTreeNode,
  BasicTreeList,
} from "../dist/parsegraph-node.lib";

describe("TreeNode", function () {
  it("works as list", () => {
    expect(
      new BasicTreeList(null, [], new DefaultNodePalette())
    ).to.be.instanceof(BasicTreeList);
  });
  it("works as constant", () => {
    expect(new BlockTreeNode("b", "No time")).to.be.instanceof(BlockTreeNode);
  });
});
