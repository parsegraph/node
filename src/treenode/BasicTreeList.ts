import WindowNode from "../WindowNode";
import TreeNode from "./TreeNode";
import AbstractTreeList from "./AbstractTreeList";
import { Alignment, SHRINK_SCALE } from "parsegraph-layout";
import Direction, {
  PreferredAxis,
  NodePalette,
  turnPositive,
  getDirectionAxis,
  Axis,
} from "parsegraph-direction";

export const BASIC_TREE_LIST_SYMBOL = Symbol("BasicTreeList");
export default class BasicTreeList extends AbstractTreeList {
  _lastRow: WindowNode;
  _palette: NodePalette<WindowNode>;

  _direction: Direction;
  _align: Alignment;

  /**
   * Creates a new BasicTreeList in the forward direction with no alignment.
   *
   * @param {TreeNode} title The root node of this tree list.
   * @param {TreeNode[]} children The initial children of this tree list.
   * @param {NodePalette<WindowNode>} palette The palette to use to construct joining buds.
   */
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

  type() {
    return BASIC_TREE_LIST_SYMBOL;
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
    root.setLayoutPreference(
      getDirectionAxis(this._direction) === Axis.VERTICAL
        ? PreferredAxis.VERTICAL
        : PreferredAxis.HORIZONTAL
    );
    child.setScale(SHRINK_SCALE);
    this._lastRow = root;
    return root;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    const bud = this._palette.spawn();
    lastChild.connectNode(turnPositive(this._direction), bud);
    bud.connectNode(this._direction, child);
    bud.setLayoutPreference(
      getDirectionAxis(this._direction) === Axis.VERTICAL
        ? PreferredAxis.VERTICAL
        : PreferredAxis.HORIZONTAL
    );
    this._lastRow = bud;
    return bud;
  }
}
