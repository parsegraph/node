import WindowNode from "./WindowNode";
import Caret from "./Caret";
import Node from "./Node";
import DefaultNodeType from "../dist/DefaultNodeType";

export default interface TreeListStyle<T extends WindowNode> {
  createRoot(): T;
  appendInitialChild(root: WindowNode, child: WindowNode): T;
  appendChild(lastChild: WindowNode, child: WindowNode): T;
}

export class BasicTreeListStyle
  implements TreeListStyle<Node<DefaultNodeType>> {
  createRoot(): Node<DefaultNodeType> {
    const car = new Caret("u");
    return car.root();
  }
  appendInitialChild(
    root: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>
  ): Node<DefaultNodeType> {
    const car = new Caret(root);
    car.connect("f", child);
    return car.root();
  }
  appendChild(
    lastChild: Node<DefaultNodeType>,
    child: Node<DefaultNodeType>
  ): Node<DefaultNodeType> {
    const car = new Caret(lastChild);
    car.spawnMove("d", "u");
    car.connect("f", child);
    return car.node();
  }
}
