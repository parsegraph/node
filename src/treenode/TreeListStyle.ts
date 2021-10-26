import WindowNode from "../WindowNode";
import TreeListNode from "./TreeListNode";

export default interface TreeListStyle<T extends WindowNode> {
  createNode(value?: any): T;
  createList(): TreeListNode<T>;
  appendSpecial(childValue: any, rootValue: any): T;
  appendInitialChild(root: WindowNode, child: WindowNode, rootValue: any): T;
  appendChild(lastChild: WindowNode, child: WindowNode, rootValue: any): T;
  createValue(): any;
  setLabel(node: TreeListNode<T>, label: string): void;
  setType(node: TreeListNode<T>, type: any): void;
}
