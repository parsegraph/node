import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import Caret from "../Caret";
import DefaultNodePalette from "../DefaultNodePalette";

export const TREE_LABEL_SYMBOL = Symbol("TreeLabel");
export default class TreeLabel extends TreeNode {
  _label: string;
  _type: any;
  _palette: DefaultNodePalette;

  constructor(type?: any, label?: string) {
    super();
    this._palette = new DefaultNodePalette();
    this._type = type || "b";
    this._label = label || "";
  }
  type() {
    return TREE_LABEL_SYMBOL;
  }
  getValue(): any {
    return this._label;
  }
  render(): WindowNode {
    const car = new Caret(this._type);
    car.label(this.getValue());
    return car.root();
  }
}
