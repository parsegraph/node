import render from "../render";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import DefaultNodePalette from "../DefaultNodePalette";
import log, { connectLog, logEnter, logLeave } from "../log";

document.addEventListener("DOMContentLoaded", () => {
  connectLog("wss://fritocomp.aaronfaanes/log");
  logEnter("Demos", "Starting log demo");
  const belt = new TimingBelt();
  const world = new World();
  const dfp = new DefaultNodePalette();
  log("Making graph");
  world.plot(dfp.spawn("b"));
  logLeave();
  render(belt, world, document.getElementById("parsegraph-tree"));
});
