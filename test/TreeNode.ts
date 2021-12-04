import { expect, assert } from "chai";
import {
  DefaultNodePalette,
  BlockTreeNode,
  BasicTreeList,
  TreeLabel,
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
  it("can add nodes", () => {
    const list = new BasicTreeList(
      new TreeLabel(),
      [],
      new DefaultNodePalette()
    );
    list.appendChild(new TreeLabel("No time"));
    list.appendChild(new BlockTreeNode("123"));
    list.appendChild(
      new BasicTreeList(new TreeLabel(), [], new DefaultNodePalette())
    );
    assert.ok(list.root());
    assert.equal(3, list.length());
    assert.equal(list.root(), list.root());
    const root = list.root();
    list.appendChild(new BlockTreeNode("NEW"));
    assert.equal(root, list.root());
  });
});
