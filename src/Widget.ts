import Direction from "parsegraph-direction";
import GraphicsWindow from "parsegraph-window";
import EventNode from "./EventNode";
import World from "./World";

export default interface Widget {
  root(): EventNode;
  allowConnection(dir: Direction): boolean;
  window(): GraphicsWindow;
  world(): World;
}
