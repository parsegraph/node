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

interface GrammarVisitor {

}

interface Grammar {
  name():string;
  parse(content: any, visitor: GrammarVisitor):void;
}

class Parsegraph extends TreeNode {
  static TYPE:Symbol = Symbol("Parsegraph");
  _head:Node<DefaultNodeType>;
  _grammar:Grammar;
  _content:any;

  constructor() {
    super();
    this._head = new DefaultNodePalette().spawn("b");
  }

  setContent(content:any) {
    this._content = content;
    this.invalidate();
  }

  setGrammar(grammar:Grammar) {
    this._grammar = grammar;
    this.invalidate();
  }

  type(): Symbol {
    return Parsegraph.TYPE;
  }

  render(): WindowNode {
    this._head.realLabel().setText(this._grammar.name());
    return this._head;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();
  const spawner = new Spawner([]);
  spawner.setBuilder(()=>{
    return new Parsegraph();
  });

  const refresh = () => {
    world.clear();
    world.plot(spawner.root());
    belt.scheduleUpdate();
    world.scheduleRepaint();
  };

  spawner.setOnScheduleUpdate(refresh);

  refresh();
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));
});
