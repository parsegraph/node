import TreeNode from "./TreeNode";
import WindowNode from "../WindowNode";
import TreeListStyle from "./TreeListStyle";

export default class TreeListNode<T extends WindowNode> implements TreeNode {
  _children: TreeNode[];
  _root: T;
  _style: TreeListStyle<T>;
  _value: any;

  constructor(style: TreeListStyle<T>, children?: TreeNode[]) {
    this._style = style;
    if (children) {
      this._children = [...children];
    } else {
      this._children = [];
    }
    this._value = this._style.createValue();
  }

  getValue(): any {
    return this._value;
  }

  invalidate(): void {
    this._root = null;
  }

  appendChild(child: TreeNode) {
    this._children.push(child);
    this.invalidate();
  }

  indexOf(child: TreeNode) {
    for (let i = 0; i < this._children.length; ++i) {
      if (this._children[i] === child) {
        return i;
      }
    }
    return -1;
  }

  insertBefore(child: TreeNode, ref: TreeNode) {
    const idx = this.indexOf(ref);
    if (idx >= 0) {
      this._children.splice(idx, 0, child);
      this.invalidate();
    }
    return idx >= 0;
  }

  removeChild(child: TreeNode) {
    const idx = this.indexOf(child);
    if (idx >= 0) {
      this._children.splice(idx, 1);
      this.invalidate();
    }
    return idx >= 0;
  }

  render() {
    this._root = this._style.createNode(this._value);
    if (!this._root) {
      return;
    }
    let lastChild: T = null;
    this._children.forEach((child, i) => {
      const childRoot = child.root();
      if (!childRoot) {
        lastChild = this._style.appendSpecial(child.getValue(), this._value);
      } else if (i == 0) {
        lastChild = this._style.appendInitialChild(this._root, childRoot, this._value);
      } else {
        lastChild = this._style.appendChild(lastChild, childRoot, this._value);
      }
    });
  }

  root(): T {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}
