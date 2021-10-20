import Window, { TimingBelt } from "parsegraph-window";
import World from "./World";
import Viewport from "./Viewport";
import EventNode from "./EventNode";

/**
 * Show a basic graph given a node.
 */
export default function showGraph(rootNode: EventNode) {
  const window = new Window();
  const world = new World();

  const belt = new TimingBelt();
  belt.addWindow(window);

  const viewport = new Viewport(world);
  window.addComponent(viewport.component());

  world.plot(rootNode);
  viewport.showInCamera(rootNode);

  return window.container();
}
