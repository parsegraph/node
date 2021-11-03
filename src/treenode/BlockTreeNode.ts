import WindowNode from "../WindowNode";
import TreeNode from "./TreeNode";
import DefaultNodePalette from "../DefaultNodePalette";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";

export default class BlockTreeNode implements TreeNode {
  _label: string;
  _type: any;
  _palette: DefaultNodePalette;
  _root: Node<DefaultNodeType>;

  constructor(type?: any, label?: string) {
    this._palette = new DefaultNodePalette();
    this._type = type;
    this._label = label;
    this.invalidate();
  }
  getType(): any {
    return this._type;
  }
  setType(type: any) {
    this._type = type;
    this.invalidate();
  }
  getLabel(): any {
    return this._label;
  }
  setLabel(label: string) {
    this._label = label;
    this.invalidate();
  }
  invalidate() {
    this._root = null;
  }

  render() {
    this._root = this._palette.spawn(this._type);
    if (this._label != null) {
      this._root.setLabel(this._label);
    }
  }

  root(): WindowNode {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}