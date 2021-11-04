import DefaultNodePalette from "../../DefaultNodePalette";
import TreeNode from "../../treenode/TreeNode";
import WindowNode from "../../WindowNode";
import BasicTreeList from "../../treenode/BasicTreeList";
import TreeList from "../../treenode/TreeList";
import { Grammars, IToken } from "ebnf";
import BlockTreeNode from "../../treenode/BlockTreeNode";
import InlineTreeList from "../../treenode/InlineTreeList";
import WrappingTreeList from "../../treenode/WrappingTreeList";

class LiteralNode implements TreeNode {
  _title: BlockTreeNode;

  constructor(value?: string) {
    this._title = new BlockTreeNode("u");
    if (arguments.length > 0) {
      this.setValue(value);
    }
  }

  value(): string {
    return this._title.getLabel();
  }

  setValue(text: string) {
    this._title.setLabel(text);
  }

  root() {
    return this._title.root();
  }
}

class ChoiceNode extends BasicTreeList {
  constructor(children?: TreeNode[]) {
    super(new BlockTreeNode("u"), children, new DefaultNodePalette());
  }
}

class ListNode extends InlineTreeList {
  constructor(children?: TreeNode[]) {
    super(new BlockTreeNode("s"), children);
  }
}

class TitledListNode implements TreeNode {
  _list: TreeList;
  constructor(title: TreeNode, children?: TreeNode[]) {
    this._list = new WrappingTreeList(title, children, new DefaultNodePalette());
  }

  tree(): TreeList {
    return this._list;
  }

  root(): WindowNode {
    return this._list.root();
  }
}

export default class EBNF implements TreeNode {
  _palette: DefaultNodePalette;
  _text: string;

  _title: BlockTreeNode;
  _tree: BasicTreeList;
  _root: WindowNode;

  constructor() {
    this._palette = new DefaultNodePalette();
    this._title = new BlockTreeNode();
    this._title.setLabel("EBNF");

    this._tree = new BasicTreeList(this._title, [], this._palette);
  }

  buildNode(root: TreeList, child: IToken): TreeNode {
    console.log("Creating node", child);
    switch (child.type) {
      case "Choice":
        return this.graphWithNewlines(new ChoiceNode(), child.children);
      case "SequenceOrDifference":
        return this.graphWithNewlines(root, child.children);
      case "Production":
      case "CharClass":
      case "CharRange":
      case "Item":
      case "SubItem":
        return this.graphWithNewlines(new ListNode(), child.children);
      case "PrimaryDecoration":
        return new LiteralNode(child.text);
      case "StringLiteral":
      case "CharCodeRange":
      case "CharCode":
      case "RULE_Char":
      case "NCName":
        return new LiteralNode(child.text);
      default:
        const listNode = new TitledListNode(new LiteralNode(child.type + " " + child.text));
        this.graphWithNewlines(listNode.tree(), child.children);
        return listNode;
    }
  }

  graphWithNewlines(root: TreeList, list: IToken[]):TreeList {
    list.map(child=>this.buildNode(root, child)).forEach((node) => node && root.appendChild(node));
    return root;
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
    let bnfParser = new Grammars.W3C.Parser(this._text);
    const children = bnfParser.getAST(this._text);
    this.graphWithNewlines(this._tree, children.children);
    this._root = this._tree.root();
  }

  root(): WindowNode {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}
