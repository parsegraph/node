import { renderFullscreen } from "../render";
import { Color, Component, TimingBelt } from "parsegraph-window";
import { Direction, NodePalette, PreferredAxis } from "parsegraph-direction";
import World from "../World";
import BlockTreeNode from "../treenode/BlockTreeNode";
import DefaultNodePalette from "../DefaultNodePalette";
import { Alignment } from "parsegraph-layout";
import AbstractTreeList from "../treenode/AbstractTreeList";
import WindowNode from "../WindowNode";
import TreeNode from "../treenode/TreeNode";
import { BUD_RADIUS, copyStyle } from "../DefaultNodeStyle";
import ActionCarousel from "../ActionCarousel";
import DefaultNodeType from "../DefaultNodeType";
import Node from "../Node";

import Multislot from "../treenode/Multislot";
import Spawner from "../treenode/Spawner";

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();

  const refresh = () => {
    world.clear();

    world.plot(multislot.root());
    belt.scheduleUpdate();
    world.scheduleRepaint();
  };

  const multislot = new Spawner([]);
  multislot.setOnScheduleUpdate(refresh);

  "You can do this".split(" ").forEach((label) => {
    const style = copyStyle("b");
    style.backgroundColor = new Color(
      Math.random(),
      Math.random(),
      Math.random(),
      1
    );
    style.borderColor = new Color(
      Math.random(),
      Math.random(),
      Math.random(),
      1
    );

    const c = new Multislot(
      new BlockTreeNode("b", label, style),
      [],
      new DefaultNodePalette(),
      refresh
    );
    for (let i = 0; i < label.length; ++i) {
      c.appendChild(new BlockTreeNode("b", label.charAt(i), style));
    }
    multislot.appendChild(c);
  });
  refresh();
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));
});
