import WindowNode from "../../WindowNode";
import TreeNode from "../../treenode/TreeNode";
import DefaultNodePalette from "../../DefaultNodePalette";
import BlockTreeNode from "../../treenode/BlockTreeNode";
import BasicTreeList from "../../treenode/BasicTreeList";
import WrappingTreeList from "../../treenode/WrappingTreeList";
import parse, { LispCell, LispType } from "../anthonylisp";
import TreeList from "../../treenode/TreeList";

export default class Lisp implements TreeNode {
  _palette: DefaultNodePalette;
  _text: string;
  _title: BlockTreeNode;
  _tree: WrappingTreeList;
  _root: WindowNode;

  constructor() {
    this._palette = new DefaultNodePalette();
    this._title = new BlockTreeNode();
    this._title.setLabel("Lisp");

    this._tree = new WrappingTreeList(this._title, [], this._palette, false);
  }

  graphWithNewlines(root: TreeList, list: LispCell[]) {
    list.forEach((child) => {
      if (child.newLined) {
        root.appendChild((root as WrappingTreeList).getNewline());
      }
      if (child.type === LispType.List) {
        const list = new WrappingTreeList(
          new BlockTreeNode("s"),
          [],
          new DefaultNodePalette()
        );
        this.graphWithNewlines(list, child.list);
        root.appendChild(list);
      } else {
        root.appendChild(new BlockTreeNode("b", child.val));
      }
    });
  }

  setText(text: string) {
    this._text = text;
    this.invalidate();
  }

  invalidate() {
    this._root = null;
  }

  render() {
    this._tree.clear();
    const children = parse(this._text);
    this.graphWithNewlines(this._tree, children.list);
    this._root = this._tree.root();
  }

  root(): WindowNode {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}
