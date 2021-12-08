import { Component } from "parsegraph-window";

import Camera from "parsegraph-camera";


import log from "parsegraph-log";
import WindowNode from "./WindowNode";
import GraphPainterSlice from "./GraphPainterSlice";

export default class GraphPainter {
  _root:WindowNode;

  _slices: Map<Component, GraphPainterSlice>;
  _commitLayoutFunc: Function;

  constructor(root:WindowNode) {
    this._root = root;
    this._slices = new Map();
    this._commitLayoutFunc = null;

    this._root.setDirtyListener(this.markDirty, this);
  }

  root():WindowNode {
    return this._root;
  }

  markDirty():void {
    this._commitLayoutFunc = null;
    this._slices.forEach(slice=>{
      slice.markDirty();
    });
  }

  commitLayout(timeout?:number):boolean {
    // Commit layout
    let cont: Function;
    if (this._commitLayoutFunc) {
      cont = this._commitLayoutFunc(timeout);
    } else {
      cont = this.root().value().getLayout().commitLayoutIteratively(timeout);
    }
    if (cont) {
      this._commitLayoutFunc = cont;
      return true;
    }
    log(this + " Committed all layout");
    this._commitLayoutFunc = null;
    return false;
  }

  paint(
    paintContext: Component,
    timeout?: number,
  ): boolean {
    if (!this.root().localPaintGroup()) {
      throw new Error("A node must be a paint group in order to be painted");
    }

    if (this.commitLayout(timeout)) {
      return true;
    }

    if (!this._slices.has(paintContext)) {
      this._slices.set(paintContext, new GraphPainterSlice(paintContext, this.root()));
    }
    const slice = this._slices.get(paintContext);
    return slice.paint(timeout);
  }

  render(
    paintContext: Component,
    camera: Camera
  ): boolean {
    if (!this._slices.has(paintContext)) {
      // No painter for window.
      return true;
    }
    const slice = this._slices.get(paintContext);
    return slice.render(camera);
  }
}
