import render from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import TreeList from "../treenode/TreeList";
import WrappingTreeList from "../treenode/WrappingTreeList";
import JsonGraph from "./ebnf/JsonGraph";
import DefaultNodeType from "../DefaultNodeType";
import Node from "../Node";

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new Caret();
  const graph = new JsonGraph();

  const refresh = () => {
    console.log("Refreshing");
    const text = (document.getElementById("children") as HTMLInputElement)
      .value;
    console.log("children", text);
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    graph.setText(text);
    caret.connect("f", graph.root() as Node<DefaultNodeType>);
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("change", refresh);
  refresh();
  world.plot(caret.root());
  render(belt, world, document.getElementById("parsegraph-tree"));
});
