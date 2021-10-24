import { expect } from "chai";
import { ConstantTreeNode, TreeListNode } from "../dist/parsegraph-node.lib";

describe("TreeNode", function () {
  it("works as list", () => {
    expect(new TreeListNode(null, [])).to.be.instanceof(TreeListNode);
  });
  it("works as constant", () => {
    expect(new ConstantTreeNode("b", "No time")).to.be.instanceof(
      ConstantTreeNode
    );
  });
});
