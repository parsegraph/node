import { renderFullscreen } from "../render";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Direction from "parsegraph-direction";
import DefaultNodePalette from "../DefaultNodePalette";
import EBNF from "./ebnf/EBNF";
import WindowCaret from "../WindowCaret";
import WindowNode from "../WindowNode";

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const caret = new WindowCaret<WindowNode>(new DefaultNodePalette(), "u");
  const ebnf = new EBNF();

  const refresh = () => {
    console.log("Refreshing");
    const text = (document.getElementById("children") as HTMLInputElement)
      .value;
    console.log("children", text);

    caret.moveToRoot();
    caret.disconnect(Direction.FORWARD);
    ebnf.setText(text);
    caret.connect(Direction.FORWARD, ebnf.root());
    world.scheduleRepaint();
    belt.scheduleUpdate();
  };
  document.getElementById("children").addEventListener("change", refresh);
  world.plot(caret.root());
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));

  fetch("/w3cbnf.grammar")
    .then((resp) => resp.text())
    .then((text) => {
      (document.getElementById("children") as HTMLInputElement).value = text;
      refresh();
    });
});
