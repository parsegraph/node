import { BasicWindow, Component } from "parsegraph-window";

import Interactive from "../interact/Interactive";
import Interaction from "../interact/Interaction";

import { logc } from "parsegraph-log";
import Painted from "../windownode/Painted";
import WindowNode from "../windownode/WindowNode";
import {Layout} from "parsegraph-layout";
import FreezerCache from "../freezer/FreezerCache";
import Freezable from "../freezer/Freezable";
import Artist from "../windownode/Artist";
import PaintContext from "../windownode/PaintContext";
import {Matrix3x3} from "parsegraph-matrix";
import Camera from "parsegraph-camera";

class StandardArtist implements Artist {
  setup(ctx: PaintContext) {

  }


  render(
    world: Matrix3x3,
    scale: number,
    forceSimple: boolean,
    camera: Camera ,
    ctx:PaintContext
  ): void {

  }

  static _instance:StandardArtist = null;
  static instance() {
    if (!StandardArtist._instance) {
      StandardArtist._instance = new StandardArtist();
    }
    return StandardArtist._instance;
  }
}

export default class StandardSurface implements Interactive, Painted, Freezable {
  _layout:Layout;
  _interactor:Interaction;
  _windowPainter: Map<BasicWindow, WindowPainter>;
  _node: WindowNode;
  _cache: FreezerCache;

  constructor(node:WindowNode) {
    this._node = node;
    this._node.setDirtyListener(this.markDirty, this);
    this._interactor = new Interaction();
    this._layout = new Layout(node);
    this._cache = new FreezerCache(node);
    this._windowPainter = new Map();
  }

  paint(ctx:PaintContext): boolean {
    return false;
  }

  getArtist(): Artist {
    return StandardArtist.instance();
  }

  node():WindowNode {
    return this._node;
  }

  getCache() {
    return this._cache;
  }

  getLayout():Layout {
    return this._layout;
  }

  interact():Interaction {
    return this._interactor;
  }

  markDirty(): void {
    this.node().markDirty();
    logc("Dirty nodes", "Marking {0} as dirty", this);
  }

  getPainter(
    paintContext: Component
  ): WindowPainter {
    return this.painter(paintContext.window());
  }

  painter(window: BasicWindow): WindowNodePainter {
    if (!window) {
      throw new Error("No window key was provided to get its painter");
    }
    return this._windowPainter.get(window);
  }

  setPainter(window: BasicWindow, painter: WindowNodePainter) {
    if (!window) {
      throw new Error(
        "A window must be provided for a WindowNodePainter to be set"
      );
    }
    this._windowPainter.set(window, painter);
  }
}
