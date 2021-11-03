import render from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeList from "../treenode/TreeList";
import BasicTreeList from "../treenode/BasicTreeList";
import InlineTreeList from "../treenode/InlineTreeList";

function ParsegraphTree(
  root: TreeListNode<Node<DefaultNodeType>>,
  list: any[],
  style: TreeListStyle<Node<DefaultNodeType>>
) {
  const buildNode = (child: any) => {
    if (typeof child === "object" && !Array.isArray(child)) {
      const type = "type" in child ? child.type : "b";
      const newNode = style.createList();
      style.setType(newNode, type);
      root.appendChild(newNode);
      if ("value" in child) {
        style.setLabel(newNode, child.value);
      }
      if (!("children" in child)) {
        return;
      }
      child = child.children;
      ParsegraphTree(newNode, child, style);
      return;
    }
    if (!Array.isArray(child)) {
      const newNode = style.createList();
      root.appendChild(newNode);
      style.setLabel(newNode, child);
      return;
    }
    const newNode = style.createList();
    style.setType(newNode, "u");
    ParsegraphTree(newNode, child, style);
    root.appendChild(newNode);
  };
  const buildChildren = (children: any[]) => {
    children.forEach((child: any) => {
      buildNode(child);
    });
  };
  if (Array.isArray(list)) {
    buildChildren(list);
  } else {
    buildNode(list);
  }
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
    const children = JSON.parse(text);
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    const childStyle = new InlineTreeListStyle();
    const style = new BasicTreeListStyle(null, childStyle);
    const root = style.createList();
    //style.setType(root, 'u');
    ParsegraphTree(root, children, style);
    caret.connect("f", root.root());
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("input", refresh);
  refresh();
  world.plot(caret.root());
  render(belt, world, document.getElementById("parsegraph-tree"));
});
