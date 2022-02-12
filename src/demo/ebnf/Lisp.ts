import WindowNode from "../../WindowNode";
import TreeNode from "../../treenode/TreeNode";
import DefaultNodePalette from "../../DefaultNodePalette";
import BlockTreeNode from "../../treenode/BlockTreeNode";
import WrappingTreeList from "../../treenode/WrappingTreeList";
import parse, { LispCell, LispType } from "../anthonylisp";
import TreeList from "../../treenode/TreeList";
import { Direction } from "../..";
import ActionCarousel from "../../ActionCarousel";
import { logEnterc, logLeave } from "../../log";
import Node from "../../Node";
import DefaultNodeType from "../../DefaultNodeType";
import { Keystroke } from "parsegraph-window";

interface LispHandler extends TreeList {
  nest(node: TreeNode): void;
}

interface LispNode extends TreeNode {
  setHandler(handler: LispHandler): void;
}

const LISP_LIST_SYMBOL = Symbol("LispList");
class LispList extends WrappingTreeList implements LispHandler, LispNode {
  _handler: LispHandler;

  constructor(children: TreeNode[] = []) {
    super(new BlockTreeNode("s"), children, new DefaultNodePalette(), true);
  }

  setHandler(handler: LispHandler) {
    this._handler = handler;
  }

  type() {
    return LISP_LIST_SYMBOL;
  }

  nest(node: LispNode): void {
    const idx = this.indexOf(node);
    if (idx < 0) {
      return;
    }
    // alert("NESTING" + idx);
    const list = new LispList();
    list.setOnScheduleUpdate(() => this.invalidate());
    this.insertBefore(list, node);
    this.removeChild(node);
    list.appendChild(node);
    list.setHandler(this);
    node.setHandler(list);
    console.log(this._children);
  }

  removeMe(): void {
    this._handler && this._handler.removeChild(this);
  }

  render(): WindowNode {
    const root = super.render() as Node<DefaultNodeType>;

    const ac = new ActionCarousel();
    ac.addAction("Delete", () => {
      this.removeMe();
    });
    ac.install(root);

    return root;
  }
}

const LISP_CELL_SYMBOL = Symbol("LispCell");
class LispCellNode extends TreeNode implements LispNode {
  _palette: DefaultNodePalette;
  _value: string;

  _handler: LispHandler;

  constructor(val: string) {
    super();
    this._palette = new DefaultNodePalette();
    this._value = val;
  }
  type() {
    return LISP_CELL_SYMBOL;
  }

  setHandler(handler: LispHandler) {
    this._handler = handler;
  }

  createNewCell(): LispCellNode {
    const n = new LispCellNode("");
    n.setHandler(this._handler);
    return n;
  }

  insertLispCell(): void {
    this._handler && this._handler.insertBefore(this.createNewCell(), this);
  }

  appendLispCell(): void {
    this._handler && this._handler.insertAfter(this.createNewCell(), this);
  }

  removeMe(): void {
    this._handler && this._handler.removeChild(this);
  }

  editCell(): void {
    alert("Edit");
  }

  render() {
    const n = this._palette.spawn("b");
    n.setLabel(this._value);

    const ac = new ActionCarousel();
    ac.addAction("Insert", () => {
      this.insertLispCell();
    });
    ac.addAction("Append", () => {
      this.appendLispCell();
    });
    ac.addAction("Edit", () => {
      ac.uninstall();
      n.realLabel().setEditable(true);
    });
    ac.addAction("Delete", () => {
      this.removeMe();
    });
    ac.install(n);

    n.setKeyListener((event: Keystroke) => {
      const key = event.key();
      if (key === "(") {
        this._handler && this._handler.nest(this);
        return;
      }
      if (key === " ") {
        this.insertLispCell();
        return;
      }
      if (key === "Shift") {
        return false;
      }
      if (key === "Backspace") {
        this._value = this._value.substring(0, this._value.length - 1);
        this.invalidate();
        return;
      }
      this._value += key;
      this.invalidate();
      return true;
    });
    return n;
  }
}

const LISP_SYMBOL = Symbol("Lisp");
export default class Lisp extends TreeNode {
  _palette: DefaultNodePalette;
  _oldText: string;
  _text: string;
  _title: BlockTreeNode;
  _tree: LispList;

  type() {
    return LISP_SYMBOL;
  }

  constructor() {
    super();
    this._palette = new DefaultNodePalette();
    this._title = new BlockTreeNode();
    this._title.setLabel("Lisp");
    this._title.setOnScheduleUpdate(() => this.invalidate());

    this._tree = new LispList();
    this._tree.setOnScheduleUpdate(() => this.invalidate());
  }

  graphWithNewlines(root: LispList, list: LispCell[]) {
    list.forEach((child) => {
      if (child.newLined) {
        root.appendChild((root as WrappingTreeList).getNewline());
      }
      if (child.type === LispType.List) {
        const list = new LispList();
        this.graphWithNewlines(list, child.list);
        root.appendChild(list);
      } else {
        const cell = new LispCellNode(child.val);
        root.appendChild(cell);
        cell.setHandler(root);
      }
    });
  }

  setText(text: string) {
    this._oldText = this._text;
    this._text = text;
    this.invalidate();
  }

  render() {
    logEnterc("Lisp renders", "Rendering Lisp node");
    if (this._oldText !== this._text) {
      this._tree.clear();
      const children = parse(this._text);
      this.graphWithNewlines(this._tree, children.list);
      this._oldText = this._text;
    }
    const treeRoot = this._tree.root();
    const root = this._title.root();
    root.connectNode(Direction.FORWARD, treeRoot);
    logLeave();
    return root;
  }
}
