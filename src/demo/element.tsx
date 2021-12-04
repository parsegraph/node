import { renderFullscreen } from "../render";
import { TimingBelt } from "parsegraph-window";
import { PreferredAxis } from "parsegraph-direction";
import World from "../World";
import DefaultNodePalette from "../DefaultNodePalette";
import Direction from "parsegraph-direction";

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();

  const b = new DefaultNodePalette().spawn("b");
  b.setLabel("No time.");

  b.setLayoutPreference(PreferredAxis.VERTICAL);

  const c = new DefaultNodePalette().spawn("b");
  b.connectNode(Direction.FORWARD, c);

  const f = new DefaultNodePalette().spawn("b");
  c.connectNode(Direction.DOWNWARD, f);

  const e = new DefaultNodePalette().spawn("e");
  e.setElement(() => {
    const div = document.createElement("div");
    div.innerHTML = "Hey it's your div";
    div.style.backgroundColor = "white";
    setInterval(() => {
      div.style.fontSize = Math.round(36 * Math.random()) + "px";
      console.log(div.style.fontSize);
    }, 1000);
    return div;
  });

  b.connectNode(Direction.DOWNWARD, e);

  const refresh = () => {
    world.clear();

    world.plot(b);
    belt.scheduleUpdate();
    world.scheduleRepaint();
  };

  refresh();
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));
});
