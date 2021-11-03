import render from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeList from "../treenode/TreeList";
import BasicTreeList from "../treenode/BasicTreeList";
import WrappingTreeList from "../treenode/WrappingTreeList";

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

function parseWithNewlines(text: string) {
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

function graphWithNewlines(
  root: TreeList,
  list: JSONASTNode[],
  style?: TreeList
) {
  if (!style) {
    style = new WrappingTreeList();
  }
  list.forEach((child) => {
    let newNode = style.createList();
    style.setType(newNode, child.type);
    root.appendChild(newNode);
    switch (child.type) {
      case "string":
        style.setLabel(newNode, child.value);
        break;
      case "list":
        graphWithNewlines(newNode, child.children, style);
        break;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new Caret();

  const refresh = () => {
    console.log("Refreshing");
    const text = (document.getElementById("children") as HTMLInputElement)
      .value;
    console.log("children", text);
    const children = parseWithNewlines(text);
    console.log(children);
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    const root = new BasicTreeList();
    graphWithNewlines(root, [children]);
    caret.connect("f", root.root());
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("change", refresh);
  refresh();
  world.plot(caret.root());
  render(belt, world, document.getElementById("parsegraph-tree"));
});
