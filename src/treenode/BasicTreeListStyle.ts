import TreeListStyle from './TreeListStyle';
import Caret from "../Caret";
import {DefaultNodePalette} from "..";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeListNode from "./TreeListNode";

export default class BasicTreeListStyle
  implements TreeListStyle<Node<DefaultNodeType>> {
  _palette:DefaultNodePalette;
  _childStyle:TreeListStyle<Node<DefaultNodeType>>

  constructor(palette?:DefaultNodePalette, childStyle?:TreeListStyle<Node<DefaultNodeType>>) {
    this._palette = palette || new DefaultNodePalette(false);
    this._childStyle = childStyle || this;
  }

  createList(): TreeListNode<Node<DefaultNodeType>> {
    return new TreeListNode<Node<DefaultNodeType>>(this._childStyle);
  }

  createValue():any {
    return {type:'b', label:''};
  }

  setType(node:TreeListNode<Node<DefaultNodeType>>, type:any) {
    node._value.type = type;
  }

  setLabel(node:TreeListNode<Node<DefaultNodeType>>, label:string) {
    node._value.label = label;
  }

  createNode(value?:any): Node<DefaultNodeType> {
    const node = this._palette.spawn(value.type);
    if (typeof value.label === "string") {
      node.setLabel(value.label);
    }
    return node;
  }

  appendSpecial(_: any, rootValue: any): Node<DefaultNodeType> {
    return rootValue.lastRow;
  }

  appendInitialChild(
    root: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    const car = new Caret(root);
    car.connect("f", child);
    car.shrink('f');
    rootValue.lastRow = root;
    return car.root();
  }

  appendChild(
    lastChild: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    const car = new Caret(lastChild);
    car.spawnMove("d", "u");
    rootValue.lastRow = car.node();
    car.connect("f", child);
    car.shrink('f');
    return car.node();
  }
}
