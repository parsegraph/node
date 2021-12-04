import TreeNode from "./TreeNode";
import DefaultNodePalette from "../DefaultNodePalette";

export const BLOCK_TREE_NODE = Symbol("BlockTreeNode");
export default class BlockTreeNode extends TreeNode {
  _label: string;
  _nodeType: any;
  _palette: DefaultNodePalette;
  _style: any;

  constructor(nodeType?: any, label?: string, style?: any) {
    super();
    this._palette = new DefaultNodePalette();
    this._nodeType = nodeType;
    this._label = label;
    this._style = style;
    this.invalidate();
  }
  type() {
    return BLOCK_TREE_NODE;
  }

  getType(): any {
    return this._nodeType;
  }
  setType(nodeType: any) {
    this._nodeType = nodeType;
    this.invalidate();
  }
  getLabel(): any {
    return this._label;
  }
  setLabel(label: string) {
    this._label = label;
    this.invalidate();
  }

  render() {
    const root = this._palette.spawn(this.getType());
    if (this._label != null) {
      root.setLabel(this._label);
    }
    if (this._style) {
      root.setBlockStyle(this._style);
    }
    return root;
  }
}
