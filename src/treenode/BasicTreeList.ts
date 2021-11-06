import WindowNode from "../WindowNode";
import TreeNode from "./TreeNode";
import AbstractTreeList from "./AbstractTreeList";
import { Alignment, SHRINK_SCALE } from "parsegraph-layout";
import Direction, { NodePalette, turnRight } from "parsegraph-direction";

export default class BasicTreeList extends AbstractTreeList {
  _lastRow: WindowNode;
  _palette: NodePalette<WindowNode>;

  _direction: Direction;
  _align: Alignment;

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
    this._direction = Direction.FORWARD;
    this._align = Alignment.NONE;
  }

  setAlignment(align: Alignment) {
    this._align = align;
    this.invalidate();
  }

  setDirection(dir: Direction) {
    this._direction = dir;
    this.invalidate();
  }

  connectSpecial(): WindowNode {
    return this._lastRow;
  }

  connectInitialChild(root: WindowNode, child: WindowNode): WindowNode {
    root.connectNode(this._direction, child);
    root.setNodeAlignmentMode(this._direction, this._align);
    child.setScale(SHRINK_SCALE);
    this._lastRow = root;
    return root;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    const bud = this._palette.spawn();
    lastChild.connectNode(turnRight(this._direction), bud);
    bud.connectNode(this._direction, child);
    this._lastRow = bud;
    return bud;
  }
}
