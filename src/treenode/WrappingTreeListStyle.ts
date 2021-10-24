import TreeListStyle from './TreeListStyle';
import Caret from "../Caret";
import {DefaultNodePalette} from "..";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeListNode from "./TreeListNode";

export default class WrappingTreeListStyle
  implements TreeListStyle<Node<DefaultNodeType>> {

  _palette:DefaultNodePalette;

  constructor(palette?:DefaultNodePalette) {
    this._palette = palette || new DefaultNodePalette(false);
  }

  createList(): TreeListNode<Node<DefaultNodeType>> {
    return new TreeListNode<Node<DefaultNodeType>>(this);
  }

  createValue():any {
    return {type:'string', label:''};
  }

  setType(node:TreeListNode<Node<DefaultNodeType>>, type:any) {
    node._value.type = type;
  }

  setLabel(node:TreeListNode<Node<DefaultNodeType>>, label:string) {
    node._value.label = label;
  }

  createNode(value?:any): Node<DefaultNodeType> {
    if (!value) {
      return this._palette.defaultType();
    }
    switch(value.type) {
      case 'string':
        const n = this._palette.spawn('b');
        n.setLabel(value.label);
        return n;
      case 'list':
        return this._palette.spawn('s');
      case 'newline':
        return null;
    }
  }

  appendSpecial(
    value:any,
    rootValue:any
  ): Node<DefaultNodeType> {
    if (value.type !== 'newline') {
      throw new Error("Unexpected special: " + value.type);
    }
    const car = new Caret(rootValue.lastRow);
    car.spawnMove('d', 'u');
    rootValue.lastRow = car.node();
    rootValue.shrinkNext = true;
    return car.node();
  }

  appendInitialChild(
    root: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    rootValue.lastRow = child;
    rootValue.putInside = true;
    this.appendChild(root, child, rootValue);
    return child;
  }

  appendChild(
    lastChild: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>,
    rootValue: any
  ): Node<DefaultNodeType> {
    const car = new Caret(lastChild);
    car.connect(rootValue.putInside ? "i" : "f", child);
    rootValue.putInside = false;
    if (rootValue.shrinkNext) {
      new Caret(rootValue.lastRow).shrink('f');
      rootValue.shrinkNext = false;
    }
    return child;
  }
}
