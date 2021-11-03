import { renderFullscreen } from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import TreeList from "../treenode/TreeList";
import BasicTreeList from "../treenode/BasicTreeList";
import WrappingTreeList from "../treenode/WrappingTreeList";
import parse, { LispCell, LispType } from "./anthonylisp";

function graphWithNewlines(root: TreeList, list: LispCell[], style?: TreeList) {
  if (!style) {
    style = new WrappingTreeList();
  }
  list.forEach((child) => {
    let newNode = style.createList();
    if (child.newLined) {
      let nl = style.createList();
      style.setType(nl, "newline");
      root.appendChild(nl);
    }
    root.appendChild(newNode);
    if (child.type === LispType.List) {
      style.setType(newNode, "list");
      graphWithNewlines(newNode, child.list, style);
    } else {
      style.setType(newNode, "string");
      style.setLabel(newNode, child.val);
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
    const children = parse(text);
    console.log(children);
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    const rootStyle = new BasicTreeList();
    const root = new TreeList<Node<DefaultNodeType>>(rootStyle);
    rootStyle.setType(root, "u");
    graphWithNewlines(root, children.list);
    caret.connect("f", root.root());
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("change", refresh);
  refresh();
  world.plot(caret.root());
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));

  fetch("/surface.lisp")
    .then((resp) => resp.text())
    .then((text) => {
      (document.getElementById("children") as HTMLInputElement).value = text;
    });
});
