import render from "../render";
import { Color, TimingBelt } from "parsegraph-window";
import { Direction, NodePalette, PreferredAxis } from "parsegraph-direction";
import World from "../World";
import BlockTreeNode from "../treenode/BlockTreeNode";
import DefaultNodePalette from "../DefaultNodePalette";
import { Alignment } from "parsegraph-layout";
import AbstractTreeList from "../treenode/AbstractTreeList";
import WindowNode from "../WindowNode";
import TreeNode from "../treenode/TreeNode";
import { copyStyle } from "../DefaultNodeStyle";
import ActionCarousel from "../ActionCarousel";
import DefaultNodeType from "../DefaultNodeType";
import Node from "../Node";

const MULTISLOT_SYMBOL = Symbol("Multislot");
class Multislot extends AbstractTreeList {
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

  type() {
    return MULTISLOT_SYMBOL;
  }

  connectSpecial(): WindowNode {
    return this._lastRow;
  }

  makeBud(): WindowNode {
    const bud = this._palette.spawn() as Node<DefaultNodeType>;
    bud.setLayoutPreference(PreferredAxis.VERTICAL);
    const carousel = new ActionCarousel();
    carousel.addAction("Edit", () => {
      alert("Editing this node");
    });
    carousel.addAction("Delete", () => {
      alert("Deleting this node");
    });
    carousel.addAction("Append", () => {
      alert("Adding node");
    });
    carousel.addAction("Insert", () => {
      alert("Insert node");
    });
    carousel.install(bud);
    return bud;
  }

  connectInitialChild(root: WindowNode, child: WindowNode): WindowNode {
    const bud = this.makeBud();
    root.connectNode(Direction.DOWNWARD, bud);
    root.setNodeAlignmentMode(Direction.DOWNWARD, Alignment.CENTER);
    bud.connectNode(Direction.DOWNWARD, child);
    this._lastRow = bud;
    return this._lastRow;
  }

  connectChild(lastChild: WindowNode, child: WindowNode): WindowNode {
    const bud = this.makeBud();
    lastChild.connectNode(Direction.FORWARD, bud);
    bud.connectNode(Direction.DOWNWARD, child);
    this._lastRow = bud;
    return this._lastRow;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const multislot = new Multislot(
    new BlockTreeNode("b", "Multislot"),
    [],
    new DefaultNodePalette()
  );

  "You can do this".split(" ").forEach((label) => {
    const style = copyStyle("b");
    style.backgroundColor = new Color(
      Math.random(),
      Math.random(),
      Math.random(),
      1
    );
    style.borderColor = new Color(
      Math.random(),
      Math.random(),
      Math.random(),
      1
    );

    const c = new Multislot(
      new BlockTreeNode("b", label, style),
      [],
      new DefaultNodePalette()
    );
    for (let i = 0; i < label.length; ++i) {
      c.appendChild(new BlockTreeNode("b", label.charAt(i), style));
    }
    multislot.appendChild(c);
  });
  world.plot(multislot.root());
  render(belt, world, document.getElementById("parsegraph-tree"));
});
