import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import Caret from "../Caret";
import DefaultNodePalette from "../DefaultNodePalette";

export default class TreeLabel implements TreeNode {
  _label: string;
  _type: any;
  _palette: DefaultNodePalette;

  constructor(type: any, label: string) {
    this._palette = new DefaultNodePalette();
    this._type = type;
    this._label = label;
  }
  getValue(): any {
    return this._label;
  }
  root(): WindowNode {
    const car = new Caret(this._type);
    car.label(this.getValue());
    return car.root();
  }
}
