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
  _style: any;

  constructor(type?: any, label?: string, style?: any) {
    this._palette = new DefaultNodePalette();
    this._type = type;
    this._label = label;
    this._style = style;
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
    if (this._style) {
      this._root.setBlockStyle(this._style);
    }
  }

  root(): WindowNode {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}
