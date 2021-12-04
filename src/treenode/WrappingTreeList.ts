import AbstractTreeList from "./AbstractTreeList";
import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import Direction, { NodePalette } from "parsegraph-direction";
import { SHRINK_SCALE } from "parsegraph-layout";

const NEWLINE_SYMBOL = Symbol("NewlineTreeNode");
export class NewlineTreeNode extends TreeNode {
  type() {
    return NEWLINE_SYMBOL;
  }
  render(): WindowNode {
    return null;
  }
}

export const NEWLINE = new NewlineTreeNode();

export const WRAPPING_TREE_LIST_SYMBOL = Symbol("WrappingTreeList");
export default class WrappingTreeList extends AbstractTreeList {
  _palette: NodePalette<WindowNode>;
  _putInside: boolean;
  _putFirstInside: boolean;
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
    this._putFirstInside = this._putInside = putInside;
  }

  type() {
    return WRAPPING_TREE_LIST_SYMBOL;
  }

  getNewline(): TreeNode {
    return new NewlineTreeNode();
  }

  isNewline(node: TreeNode) {
    return node && node.type() === NEWLINE_SYMBOL;
  }

  palette(): NodePalette<WindowNode> {
    return this._palette;
  }

  checkChild(child: TreeNode) {
    if (this.isNewline(child)) {
      return;
    }
    super.checkChild(child);
  }

  connectSpecial(child: TreeNode): WindowNode {
    if (!this.isNewline(child)) {
      return super.connectSpecial(child);
    }
    const bud = this._palette.spawn("u");
    this._lastRow.connectNode(Direction.DOWNWARD, bud);
    this.nodeConnected(child, bud);
    this._lastRow = bud;
    this._shrinkNext = true;
    return bud;
  }

  nodeConnected(child: TreeNode, childRoot: WindowNode): void {
    console.log("node connected", child, childRoot);
  }

  connectInitialChild(
    root: WindowNode,
    child: WindowNode,
    childValue: TreeNode
  ): WindowNode {
    this._lastRow = child;
    this._putInside = this._putFirstInside;
    this._shrinkNext = false;
    this.connectChild(root, child, childValue);
    this.nodeConnected(childValue, child);
    return child;
  }

  connectChild(
    lastChild: WindowNode,
    child: WindowNode,
    childValue: TreeNode
  ): WindowNode {
    const dir = this._putInside ? Direction.INWARD : Direction.FORWARD;
    lastChild.connectNode(dir, child);
    this.nodeConnected(childValue, child);
    if (this._putInside) {
      child.setPaintGroup(true);
    }
    if (this._shrinkNext) {
      this._lastRow.nodeAt(dir).setScale(SHRINK_SCALE);
      this._shrinkNext = false;
    }
    this._putInside = false;
    child.disconnectNode(Direction.FORWARD);
    return child;
  }
}
