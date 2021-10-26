import TreeListStyle from "./TreeListStyle";
import Caret from "../Caret";
import { DefaultNodePalette } from "..";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeListNode from "./TreeListNode";

export default class WrappingTreeListStyle
  implements TreeListStyle<Node<DefaultNodeType>> {
  _palette: DefaultNodePalette;

  constructor(palette?: DefaultNodePalette) {
    this._palette = palette || new DefaultNodePalette(false);
  }

  createList(): TreeListNode<Node<DefaultNodeType>> {
    return new TreeListNode<Node<DefaultNodeType>>(this);
  }

  createValue(): any {
    return { type: "b", label: "" };
  }

  setType(node: TreeListNode<Node<DefaultNodeType>>, type: any) {
    node._value.type = type;
  }

  setLabel(node: TreeListNode<Node<DefaultNodeType>>, label: string) {
    node._value.label = label;
  }

  createNode(value?: any): Node<DefaultNodeType> {
    const node = this._palette.spawn(value.type);
    if (typeof value.label === "string") {
      node.setLabel(value.label);
    }
    return node;
  }

  applyValue(node: Node<DefaultNodeType>, value: any) {
    this._palette.replace(node, value.type);
    if (typeof value.label === "string") {
      node.setLabel(value.label);
    }
  }

  appendSpecial(): Node<DefaultNodeType> {
    throw new Error("No special types supported for InlineTreeListStyle");
  }

  appendInitialChild(
    root: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>
  ): Node<DefaultNodeType> {
    const car = new Caret(root);
    car.replace("s");
    car.connect("i", child);
    car.shrink("i");
    return child;
  }

  appendChild(
    lastChild: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>
  ): Node<DefaultNodeType> {
    const car = new Caret(lastChild);
    car.connect("f", child);
    return child;
  }
}
