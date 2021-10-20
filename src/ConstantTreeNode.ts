import TreeNode from "./TreeNode";
import WindowNode from "./WindowNode";
import Caret from "./Caret";

export default class ConstantTreeNode implements TreeNode {
  _label: string;
  _type: any;
  constructor(type: any, label: string) {
    this._type = type;
    this._label = label;
  }
  root(): WindowNode {
    const car = new Caret(this._type);
    car.label(this._label);
    return car.root();
  }
}
