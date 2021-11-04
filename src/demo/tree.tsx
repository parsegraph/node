import render from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import BasicTreeList from "../treenode/BasicTreeList";
import TreeList from "../treenode/TreeList";
import BlockTreeNode from "../treenode/BlockTreeNode";
import InlineTreeList from "../treenode/InlineTreeList";
import DefaultNodePalette from "../DefaultNodePalette";

function ParsegraphTree(root: TreeList, list: any[]) {
  const buildNode = (child: any) => {
    if (typeof child === "object" && !Array.isArray(child)) {
      const newNode = new BlockTreeNode("type" in child ? child.type : "b");
      root.appendChild(newNode);
      if ("value" in child) {
        newNode.setLabel(child.value);
      }
      if (!("children" in child)) {
        return;
      }
      const list = new BasicTreeList(newNode, [], new DefaultNodePalette());
      ParsegraphTree(list, child.children);
      return;
    }
    if (!Array.isArray(child)) {
      const newNode = new BlockTreeNode("b", child);
      root.appendChild(newNode);
      return;
    }
    const list = new BasicTreeList(
      new BlockTreeNode("u"),
      [],
      new DefaultNodePalette()
    );
    ParsegraphTree(list, child);
    root.appendChild(list);
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
    const root = new InlineTreeList(new BlockTreeNode("u"), []);
    //style.setType(root, 'u');
    ParsegraphTree(root, children);
    caret.connect("f", root.root() as Node<DefaultNodeType>);
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("input", refresh);
  refresh();
  world.plot(caret.root());
  render(belt, world, document.getElementById("parsegraph-tree"));
});
