import render from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import { Direction, turnPositive, readDirection } from "parsegraph-direction";

function ParsegraphList(
  root: Node<DefaultNodeType>,
  list: any[],
  spawnDir: string | Direction,
  align: any
) {
  const caret = new Caret(root);

  const buildNode = (child: any) => {
    if (typeof child === "object" && !Array.isArray(child)) {
      caret.spawnMove(spawnDir, "type" in child ? child.type : "b");
      if ("value" in child) {
        caret.label(child.value);
      }
      if (!("children" in child)) {
        return;
      }
      child = child.children;
    } else if (!Array.isArray(child)) {
      caret.spawnMove(spawnDir, "b");
      caret.label(child);
      return;
    }
    ParsegraphList(caret.node(), child, spawnDir, align);
  };
  const buildChildren = (children: any[]) => {
    children.forEach((child: any, i: number) => {
      if (i == 0) {
        if (align !== false) {
          caret.align(spawnDir, align === undefined ? "c" : align);
        }
        caret.spawnMove(spawnDir, "u");
      } else {
        caret.spawnMove(turnPositive(readDirection(spawnDir)), "u");
      }
      caret.pull(spawnDir);
      caret.push();
      buildNode(child);
      caret.pop();
    });
  };
  if (Array.isArray(list)) {
    buildChildren(list);
  } else {
    buildNode(list);
  }
}
var refresh;
refresh = () => {
  alert("Refreshing");
};
document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new Caret();

  refresh = () => {
    console.log("Refreshing");
    console.log(
      "children",
      (document.getElementById("children") as HTMLInputElement).value
    );
    const children = JSON.parse(
      (document.getElementById("children") as HTMLInputElement).value
    );
    const align = (document.getElementById("align") as HTMLInputElement).checked
      ? "c"
      : "none";
    console.log(align, typeof align);
    const spawnDir = (document.getElementById("spawnDir") as HTMLSelectElement)
      .value;
    caret.moveToRoot();
    caret.disconnect("f");
    caret.disconnect("b");
    caret.disconnect("d");
    caret.disconnect("u");
    caret.align(spawnDir, align);
    ParsegraphList(caret.root(), children, spawnDir, align);
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };

  document.getElementById("children").addEventListener("change", refresh);
  document.getElementById("align").addEventListener("change", refresh);
  document.getElementById("spawnDir").addEventListener("change", refresh);

  world.plot(caret.root());
  render(belt, world, document.getElementById("list-of-one"));
  refresh();
});
