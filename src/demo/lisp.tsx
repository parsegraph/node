import { renderFullscreen } from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import parse from "./anthonylisp";
import Lisp from "./ebnf/Lisp";

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new Caret();
  const lisp = new Lisp();

  const refresh = () => {
    console.log("Refreshing");
    const text = (document.getElementById("children") as HTMLInputElement)
      .value;
    caret.moveToRoot();
    caret.disconnect("f");
    lisp.setText(text);
    caret.connect("f", lisp.root() as Node<DefaultNodeType>);
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
