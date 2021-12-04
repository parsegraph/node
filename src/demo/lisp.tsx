import { renderFullscreen } from "../render";
import Caret from "../Caret";
import { TimingBelt } from "parsegraph-window";
import World from "../World";
import Node from "../Node";
import DefaultNodeType from "../DefaultNodeType";
import Lisp from "./ebnf/Lisp";
import log, { logEnter, logEnterc, logLeave, connectLog } from "../log";
import WindowNode from "../WindowNode";
import Direction, { DirectionNode, nameDirection } from "parsegraph-direction";

function dumpNode(root: WindowNode) {
  if (root.isRoot()) {
    logEnter("Root node id={0}", root._id);
  } else if (root.localPaintGroup()) {
    logEnter("Paint group node id={0}", root._id);
  } else {
    logEnter("Node id={0}", root._id);
  }

  if (!root.isRoot()) {
    log("Parent id=", root.parentNode()._id);
  }

  if (root._paintGroupNext !== root) {
    log("Paint group next", root._paintGroupNext);
    log("Paint group prev", root._paintGroupPrev);
  }
  log("Layout prev = {0}", root._layoutPrev._id);
  log("Layout next = {0}", root._layoutNext._id);

  root.eachChild((child: DirectionNode, dir: Direction) => {
    logEnter("Child in {0}", nameDirection(dir));
    dumpNode(child as WindowNode);
    logLeave();
  });
  console.log(root);
  logLeave();
}

document.addEventListener("DOMContentLoaded", () => {
  connectLog("wss://fritocomp.aaronfaanes/log");
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
  lisp.setOnScheduleUpdate(() => {
    logEnterc("Lisp refreshes", "Refreshing");

    caret.moveToRoot();

    logEnter("Original root");
    dumpNode(caret.root());
    let pgs = caret.root().dumpPaintGroups();
    pgs.forEach((pg) => log("Paint group " + pg._id));
    logLeave();

    logEnter("Lisp root");
    dumpNode(lisp.root());
    lisp
      .root()
      .dumpPaintGroups()
      .forEach((pg) => log("Lisp paint group " + pg._id));
    logLeave();

    caret.connect("f", lisp.root() as Node<DefaultNodeType>);

    logEnter("After connection");
    dumpNode(caret.root());
    pgs = caret.root().dumpPaintGroups();
    pgs.forEach((pg) => log("Paint group " + pg._id));
    logLeave();

    world.scheduleRepaint();
    belt.scheduleUpdate();

    logLeave();
  });
  world.plot(caret.root());
  const [window, viewport] = renderFullscreen(
    belt,
    world,
    document.getElementById("parsegraph-tree")
  );
  /*window.containerFor(viewport).addEventListener("keydown", ()=>{
    alert("KEYDOWN");
    });*/
  window.container().addEventListener("focus", (e) => {
    console.log("FOCUS", e.target);
  });
  window.container().addEventListener("blur", (e) => {
    console.log("BLUR", e.target);
  });

  fetch("/surface.lisp")
    .then((resp) => resp.text())
    .then((text) => {
      (document.getElementById("children") as HTMLInputElement).value = text;
    });
});
