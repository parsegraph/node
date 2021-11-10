import AbstractTreeList from "./AbstractTreeList";
import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import Direction, { NodePalette } from "parsegraph-direction";
import { SHRINK_SCALE } from "parsegraph-layout";

export class NewlineTreeNode implements TreeNode {
  root(): WindowNode {
    return null;
  }
}

export const NEWLINE = new NewlineTreeNode();

export default class WrappingTreeList extends AbstractTreeList {
  _palette: NodePalette<WindowNode>;
  _putInside: boolean;
  _lastRow: WindowNode;
  _shrinkNext: boolean;

  constructor(
    title: TreeNode,
    children: TreeNode[],
    palette: NodePalette<WindowNode>,
    putInside: boolean = true
  ) {
    super(title, children);
    if (!palette) {
      throw new Error("Palette must be given");
    }
    this._palette = palette;
    this._putInside = putInside;
  }

  getNewline(): TreeNode {
    return NEWLINE;
  }

  palette(): NodePalette<WindowNode> {
    return this._palette;
  }

  /*  createNode(value?: any): WindowNode {
    if (!value) {
      return this._palette.spawn();
    }
    switch (value.type) {
      case "literal": {
        const n = this._palette.spawn("u");
        n.setLabel(value.label);
        return n;
      }
      case "string": {
        const n = this._palette.spawn("b");
        n.setLabel(value.label);
        return n;
      }
      case "list": {
        return this._palette.spawn("s");
      }
      case "newline":
        return null;
    }
  }
  */

  connectSpecial(child: TreeNode): WindowNode {
    if (child !== NEWLINE) {
      return super.connectSpecial(child);
    }
    const bud = this._palette.spawn("u");
    this._lastRow.connectNode(Direction.DOWNWARD, bud);
    this._lastRow = bud;
    this._shrinkNext = true;
    return bud;
  }

  connectInitialChild(root: WindowNode, child: WindowNode): WindowNode {
    this._lastRow = child;
    this.connectChild(root, child);
    return child;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    const dir = this._putInside ? Direction.INWARD : Direction.FORWARD;
    lastChild.connectNode(dir, child);
    if (this._putInside) {
      child.setPaintGroup(true);
    }
    if (this._shrinkNext) {
      this._lastRow.nodeAt(dir).setScale(SHRINK_SCALE);
      this._shrinkNext = false;
    }
    this._putInside = false;
    return child;
  }
}
