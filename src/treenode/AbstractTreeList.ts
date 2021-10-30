import TreeNode from "./TreeNode";
import TreeList from "./TreeList";
import WindowNode from "../WindowNode";

export default abstract class AbstractTreeList<T extends WindowNode>
  implements TreeList {
  _children: TreeNode[];
  _root: TreeNode;

  abstract connectSpecial(childValue: TreeNode, rootValue: TreeNode): T;
  abstract connectInitialChild(
    root: WindowNode,
    child: WindowNode,
    rootValue: TreeNode
  ): T;
  abstract connectChild(
    lastChild: WindowNode,
    child: WindowNode,
    rootValue: TreeNode
  ): T;

  constructor(root: TreeNode, children: TreeNode[]) {
    if (children) {
      this._children = [...children];
    } else {
      this._children = [];
    }
    this._root = root;
  }

  getValue(): V {
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
    this._root = this.createNode(this._value);
    if (!this._root) {
      return;
    }
    let lastChild: T = null;
    this._children.forEach((child, i) => {
      const childRoot = child.root();
      if (!childRoot) {
        lastChild = this.connectSpecial(child.getValue(), this._value);
      } else if (i == 0) {
        lastChild = this.connectInitialChild(
          this._root,
          childRoot,
          this._value
        );
      } else {
        lastChild = this.connectChild(lastChild, childRoot, this._value);
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
