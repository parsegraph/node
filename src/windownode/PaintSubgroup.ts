import PaintContext from "./PaintContext";
import WindowNode from "./WindowNode";
import Artist from "./Artist";
import {Component} from "parsegraph-window";
import {Matrix3x3} from "parsegraph-matrix";
import Camera from "parsegraph-camera";
import log from "parsegraph-log";

export default class PaintSubgroup {
  _root:WindowNode;
  _length: number;
  _context: PaintContext;

  constructor(comp:Component, artist:Artist, root:WindowNode) {
    this._root = root;
    this._context = new PaintContext(comp, artist);
    this._length = 1;
  }

  paint():boolean {
    let needsRepaint = false;
    this.forEachNode((node:WindowNode, ctx:PaintContext)=>{
      /*
      if (paintGroup.isDirty() || !painter) {
        if (!painter) {
          painter = paintGroup.newPainter(window, paintContext);
          paintGroup.setPainter(window, painter);
        }
      }*/
      log("Painting " + node);
      needsRepaint = node.value().paint(ctx) || needsRepaint;
      if (node.value().getCache().isFrozen()) {
        node.value().getCache().frozenNode().paint(ctx.window())
      }
    });
    return needsRepaint;
  }

  render(
    world: Matrix3x3,
    scale: number,
    forceSimple: boolean,
    camera: Camera
  ): void {
    this.artist().render(world, scale, forceSimple, camera, this.context());
  }

  addNode() {
    ++this._length;
  }

  forEachNode(cb:(node:WindowNode, ctx:PaintContext)=>void) {
    let n = this._root;
    for(let i = 0; i < this._length; ++i) {
      cb(n, this.context());
      n = n.nextLayout();
    }
  }

  artist(): Artist {
    return this._context.artist();
  }

  context() {
    return this._context;
  }
};

