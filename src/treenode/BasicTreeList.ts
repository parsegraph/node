import WindowNode from "../WindowNode";
import TreeNode from "./TreeNode";
import AbstractTreeList from "./AbstractTreeList";
import { SHRINK_SCALE } from "parsegraph-layout";
import Direction, { NodePalette } from "parsegraph-direction";

export default class BasicTreeList extends AbstractTreeList {
  _lastRow: WindowNode;
  _palette: NodePalette<WindowNode>;

  constructor(
    title: TreeNode,
    children: TreeNode[],
    palette: NodePalette<WindowNode>
  ) {
    super(title, children);
    if (!palette) {
      throw new Error("Palette must be given");
    }
    this._palette = palette;
  }

  connectSpecial(): WindowNode {
    return this._lastRow;
  }

  connectInitialChild(root: WindowNode, child: WindowNode): WindowNode {
    root.connectNode(Direction.FORWARD, child);
    child.setScale(SHRINK_SCALE);
    this._lastRow = root;
    return root;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    const bud = this._palette.spawn();
    lastChild.connectNode(Direction.DOWNWARD, bud);
    bud.connectNode(Direction.FORWARD, child);
    this._lastRow = bud;
    return bud;
  }
}
