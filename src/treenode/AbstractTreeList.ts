import TreeNode from "./TreeNode";
import TreeList from "./TreeList";
import WindowNode from "../WindowNode";

export default abstract class AbstractTreeList implements TreeList {
  _children: TreeNode[];
  _title: TreeNode;
  _valid: boolean;

  abstract connectInitialChild(
    root: WindowNode,
    child: WindowNode,
    rootValue: TreeNode
  ): WindowNode;
  abstract connectChild(
    lastChild: WindowNode,
    child: WindowNode,
    rootValue: TreeNode
  ): WindowNode;

  constructor(title: TreeNode, children: TreeNode[]) {
    if (children) {
      this._children = [...children];
    } else {
      this._children = [];
    }
    this._title = title;
    this.invalidate();
  }

  length(): number {
    return this._children.length;
  }

  invalidate(): void {
    this._valid = false;
  }

  checkChild(child:TreeNode) {
    if(child === this) {
      throw new Error("Refusing to add list to itself");
    }
    if (this.indexOf(child) >= 0) {
      throw new Error("Child already contained in this list");
    }
  }

  appendChild(child: TreeNode) {
    this.checkChild(child);
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
    this.checkChild(child);
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

  childAt(index: number) {
    return this._children[index];
  }

  clear(): void {
    this._children = [];
  }

  connectSpecial(childValue: TreeNode): WindowNode {
    console.log(`${childValue}, child of ${this}, did not render a value`);
    return null;
  }

  render() {
    let lastChild: WindowNode = null;
    this._children.forEach((child, i) => {
      const childRoot = child.root();
      if (!childRoot) {
        lastChild = this.connectSpecial(child) || lastChild;
      } else if (i == 0) {
        lastChild = this.connectInitialChild(
          this._title.root(),
          childRoot,
          this
        );
      } else {
        lastChild = this.connectChild(lastChild, childRoot, this);
      }
    });
  }

  root(): WindowNode {
    if (!this._valid) {
      this.render();
    }
    return this._title.root();
  }
}
