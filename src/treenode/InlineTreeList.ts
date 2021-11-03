import AbstractTreeList from "./AbstractTreeList";
import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import Direction from "parsegraph-direction";
import { SHRINK_SCALE } from "parsegraph-layout";

export default class InlineTreeList extends AbstractTreeList {
  constructor(title: TreeNode, children: TreeNode[]) {
    super(title, children);
  }

  connectInitialChild(root: WindowNode, child: WindowNode): WindowNode {
    root.connectNode(Direction.INWARD, child);
    child.setScale(SHRINK_SCALE);
    return child;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    lastChild.connectNode(Direction.FORWARD, child);
    return child;
  }
}
