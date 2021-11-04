import WindowNode from "../../WindowNode";
import TreeNode from "../../treenode/TreeNode";
import DefaultNodePalette from "../../DefaultNodePalette";
import BlockTreeNode from "../../treenode/BlockTreeNode";
import BasicTreeList from "../../treenode/BasicTreeList";
import WrappingTreeList from "../../treenode/WrappingTreeList";
import TreeList from "../../treenode/TreeList";

class JSONASTNode {
  type: string;
  value: string;
  children: JSONASTNode[];
  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
    this.children = [];
  }
}

export default class JsonGraph implements TreeNode {
  _palette: DefaultNodePalette;
  _text: string;
  _title: BlockTreeNode;
  _tree: BasicTreeList;
  _root: WindowNode;

  constructor() {
    this._palette = new DefaultNodePalette();
    this._title = new BlockTreeNode();
    this._title.setLabel("JSON");

    this._tree = new BasicTreeList(this._title, [], this._palette);
  }

  setText(text: string) {
    this._text = text;
    this.invalidate();
  }

  invalidate() {
    this._root = null;
  }

  parseWithNewlines(text: string) {
    let stack = [];
    let idx = 0;
    text = text.trim();
    while (idx < text.length) {
      const chr = text.charAt(idx);
      if (chr === ",") {
        ++idx;
        continue;
      }
      if (chr === "\n") {
        const node = new JSONASTNode("newline", null);
        stack[stack.length - 1].children.push(node);
        ++idx;
      }
      if (chr === " " || chr === "\t") {
        ++idx;
        continue;
      }
      if (chr === '"') {
        const start = idx + 1;
        const endQuote = text.indexOf('"', start);
        const str = text.substring(start, endQuote);
        const node = new JSONASTNode("string", str);
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          stack.push(node);
        }
        idx = endQuote + 1;
        continue;
      }
      if (chr === "[") {
        const node = new JSONASTNode("list", null);
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        }
        stack.push(node);
        ++idx;
      }
      if (chr === "]") {
        if (stack.length > 1) {
          stack.pop();
        }
        ++idx;
      }
    }
    return stack[0];
  }

  graphWithNewlines(root: TreeList, list: JSONASTNode[]) {
    list.forEach((child) => {
      switch (child.type) {
        case "string":
          root.appendChild(new BlockTreeNode("b", child.value));
          break;
        case "list":
          const list = new WrappingTreeList(
            new BlockTreeNode("u"),
            [],
            new DefaultNodePalette()
          );
          this.graphWithNewlines(list, child.children);
          root.appendChild(list);
          break;
      }
    });
  }

  render(): void {
    const children = this.parseWithNewlines(this._text);
    this.graphWithNewlines(this._tree, [children]);
    this._root = this._tree.root();
  }

  root(): WindowNode {
    if (!this._root) {
      this.render();
    }
    return this._root;
  }
}
