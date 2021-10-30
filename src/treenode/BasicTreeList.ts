import Caret from "../Caret";
import { DefaultNodePalette, TreeNode } from "..";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import AbstractTreeList from "./AbstractTreeList";

export default class BasicTreeList<V> extends AbstractTreeList<
  Node<DefaultNodeType>,
  V
> {
  _palette: DefaultNodePalette;

  constructor(value: V, children: TreeNode[], palette: DefaultNodePalette) {
    super(value, children);
    this._palette = palette;
  }

  createNode(value?: V): Node<DefaultNodeType> {
    const node = this._palette.spawn(value.type);
    if (typeof value.label === "string") {
      node.setLabel(value.label);
    }
    return node;
  }

  connectSpecial(_: any, rootValue: any): Node<DefaultNodeType> {
    return rootValue.lastRow;
  }

  connectInitialChild(
    root: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    const car = new Caret(root);
    car.connect("f", child);
    car.shrink("f");
    rootValue.lastRow = root;
    return car.root();
  }

  connectChild(
    lastChild: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    const car = new Caret(lastChild);
    car.spawnMove("d", "u");
    rootValue.lastRow = car.node();
    car.connect("f", child);
    car.shrink("f");
    return car.node();
  }
}
