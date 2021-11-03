import Direction from "parsegraph-direction";
import GraphicsWindow from "parsegraph-window";
import WindowNode from "./WindowNode";
import World from "./World";

export default interface Widget {
  root(): WindowNode;
  allowConnection(dir: Direction): boolean;
  window(): GraphicsWindow;
  world(): World;
}
