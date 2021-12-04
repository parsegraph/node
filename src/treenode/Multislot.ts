import { renderFullscreen } from "../render";
import { Color, Component, Keystroke, TimingBelt } from "parsegraph-window";
import { Direction, NodePalette, PreferredAxis } from "parsegraph-direction";
import World from "../World";
import BlockTreeNode from "../treenode/BlockTreeNode";
import DefaultNodePalette from "../DefaultNodePalette";
import { Alignment } from "parsegraph-layout";
import AbstractTreeList from "../treenode/AbstractTreeList";
import WindowNode from "../WindowNode";
import TreeNode from "../treenode/TreeNode";
import { BUD_RADIUS, copyStyle } from "../DefaultNodeStyle";
import ActionCarousel from "../ActionCarousel";
import DefaultNodeType from "../DefaultNodeType";
import Node from "../Node";

const MULTISLOT_SYMBOL = Symbol("Multislot");
export default class Multislot extends AbstractTreeList {
  _lastRow: WindowNode;
  _palette: NodePalette<WindowNode>;
  _callback: () => void;

  constructor(
    title: TreeNode,
    children: TreeNode[],
    palette: NodePalette<WindowNode>,
    callback: () => void
  ) {
    super(title, children);
    if (!palette) {
      throw new Error("Palette must be given");
    }
    this._palette = palette;
    this._callback = callback;
  }

  type() {
    return MULTISLOT_SYMBOL;
  }

  invalidate(): void {
    super.invalidate();
    console.log("Calling invalidate callback");
    this._callback && this._callback();
  }

  connectSpecial(): WindowNode {
    return this._lastRow;
  }

  makeBud(value: TreeNode): WindowNode {
    const bud = this._palette.spawn() as Node<DefaultNodeType>;
    bud.setKeyListener((key: Keystroke) => {
      console.log(key);
      return true;
    });
    bud.setLayoutPreference(PreferredAxis.VERTICAL);
    const carousel = new ActionCarousel();
    carousel.addAction("Delete", () => {
      console.log("Deleting this node");
      this.removeChild(value);
    });
    carousel.addAction("Append", () => {
      console.log("Adding node");
      this.insertAfter(this.createNew(), value);
    });
    carousel.addAction("Insert", () => {
      console.log("Insert node");
      this.insertBefore(this.createNew(), value);
    });
    carousel.install(bud);
    return bud;
  }

  createNew(): TreeNode {
    return new BlockTreeNode("b", "Added");
  }

  makeFirstBud(value: TreeNode): WindowNode {
    const bud = this.makeSmallBud();
    bud.setClickListener(() => {
      this.insertBefore(this.createNew(), value);
    });
    return bud;
  }

  makeSmallBud(): Node<DefaultNodeType> {
    const bud = this._palette.spawn("u") as Node<DefaultNodeType>;
    /*bud.setBlockStyle({
      ...bud.blockStyle(),
      minWidth: BUD_RADIUS * 2,
      minHeight: BUD_RADIUS * 2,
      borderRoundness: BUD_RADIUS * 4,
      borderThickness: BUD_RADIUS * 2 * (2 / 3),
      horizontalPadding: 0,
      verticalPadding: 0,
    });*/
    return bud;
  }

  makeNextBud(value: TreeNode): WindowNode {
    const bud = this.makeSmallBud();
    bud.setClickListener(() => {
      this.insertAfter(this.createNew(), value);
    });
    return bud;
  }

  connectInitialChild(
    root: WindowNode,
    child: WindowNode,
    childValue: TreeNode
  ): WindowNode {
    const bud = this.makeBud(childValue);
    root.connectNode(Direction.DOWNWARD, bud);
    root.setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
    bud.connectNode(Direction.DOWNWARD, child);
    const firstBud = this.makeFirstBud(childValue);
    bud.connectNode(Direction.BACKWARD, firstBud);
    const nextBud = this.makeNextBud(childValue);
    bud.connectNode(Direction.FORWARD, nextBud);
    this._lastRow = nextBud;
    return this._lastRow;
  }

  connectChild(
    lastChild: WindowNode,
    child: WindowNode,
    childValue: TreeNode
  ): WindowNode {
    const bud = this.makeBud(childValue);
    lastChild.connectNode(Direction.FORWARD, bud);
    bud.connectNode(Direction.DOWNWARD, child);
    const nextBud = this.makeNextBud(childValue);
    bud.connectNode(Direction.FORWARD, nextBud);
    this._lastRow = nextBud;
    return this._lastRow;
  }
}
