import { Component } from "parsegraph-window";
import WindowNode from "./WindowNode";
import PaintSubgroup from "./PaintSubgroup";
import Camera from "parsegraph-camera";

import {
  makeScale3x3I,
  makeTranslation3x3I,
  matrixMultiply3x3I,
  Matrix3x3,
} from "parsegraph-matrix";
import Rect from "parsegraph-rect";
import NodeRenderData from "./NodeRenderData";

let CACHED_RENDERS: number = 0;
let IMMEDIATE_RENDERS: number = 0;

// The maximum scale where nodes will be rendered from a cache.
export const CACHE_ACTIVATION_SCALE = 0.01;

export default class PaintGroup {
  _comp:Component;
  _root:WindowNode;
  _subgroups:PaintSubgroup[];
  _consecutiveRenders: number;
  _bounds: Rect;

  constructor(comp:Component, root:WindowNode) {
    this._comp = comp;
    this._root = root;
    this._subgroups = [];
    this._consecutiveRenders = 0;
    this._bounds = new Rect();
  }

  consecutiveRenders(): number {
    return this._consecutiveRenders;
  }

  root() {
    return this._root;
  }

  paint():boolean {
    const paintGroup = this.root();
    if (paintGroup.needsCommit()) {
      throw new Error("Need commit even though we should be done");
    }
    if (!paintGroup.isDirty()) {
      return;
    }

    let subgroup:PaintSubgroup = null;

    paintGroup.forEachNode((node:WindowNode)=>{
      const artist = node.value().getArtist();
      if (!subgroup || subgroup.artist() != artist) {
        subgroup = new PaintSubgroup(this._comp, artist, node);
        this._subgroups.push(subgroup);
      } else {
        subgroup.addNode();
      }
    });

    let needsRepaint = false;
    this._subgroups.forEach(subgroup=>{
      needsRepaint = subgroup.paint() || needsRepaint;
      const b = subgroup.context().bounds();
      this._bounds.include(b.x(), b.y(), b.width(), b.height());
    });

    if (!needsRepaint) {
      this.root().clearDirty();
    }
    return needsRepaint;
  }

  renderDirect(
    renderWorld: Matrix3x3,
    renderScale: number,
    forceSimple: boolean,
    cam: Camera,
  ): boolean {
    if (!this.root().localPaintGroup()) {
      throw new Error("Cannot render a node that is not a paint group");
    }
    ++this._consecutiveRenders;
    this._subgroups.forEach(group=>{
      group.render(renderWorld, renderScale, forceSimple, cam);
    });
    return false;
  }

  isPainted() {
    return this._subgroups.length > 0;
  }

  window() {
    return this._comp.window();
  }

  bounds() {
    return this._bounds;
  }

  render(
    camera: Camera,
    renderData?: NodeRenderData,
  ): boolean {
    // console.log("RENDERING THE NODE");
    if (!this.root().localPaintGroup()) {
      throw new Error("Cannot render a node that is not a paint group");
    }
    const window = this.window();
    if (!this.isPainted()) {
      console.log("Node has no painter for " + window.id());
      return false;
    }

    const layout = this.root().value().getLayout();
    if (layout.absoluteX() === null) {
      console.log("Node has no absolute pos");
      return false;
    }

    if (!renderData) {
      renderData = new NodeRenderData();
    }

    // Do not render paint groups that cannot be seen.
    const s: Rect = this.bounds().clone(renderData.bounds);
    s.scale(this.root().scale());
    s.translate(layout.absoluteX(), layout.absoluteY());
    if (camera && !camera.containsAny(s)) {
      // console.log("Out of bounds: " + this);
      return !layout._absoluteDirty;
    }

    const world: Matrix3x3 = camera.project();
    makeScale3x3I(renderData.scaleMat, layout._absoluteScale);
    makeTranslation3x3I(
      renderData.transMat,
      layout._absoluteXPos,
      layout._absoluteYPos
    );
    matrixMultiply3x3I(
      renderData.worldMat,
      renderData.scaleMat,
      renderData.transMat
    );
    const renderWorld: Matrix3x3 = matrixMultiply3x3I(
      renderData.worldMat,
      renderData.worldMat,
      world
    );
    const renderScale: number =
      layout._absoluteScale * (camera ? camera.scale() : 1);

    // console.log("Rendering paint group: " +
    //   this.absoluteX() + " " + this.absoluteY() +
    //   " " + this.absoluteScale());
    if (this.root().value().getCache().isFrozen() && renderScale < CACHE_ACTIVATION_SCALE) {
      window.log("Rendering " + this + " from cache.");
      const cleanRender = this.root().value().getCache().frozenNode().render(
        window,
        renderWorld,
        renderData,
        CACHED_RENDERS === 0
      );
      if (IMMEDIATE_RENDERS > 0) {
        // console.log("Immediately rendered " +IMMEDIATE_RENDERS + " times");
        IMMEDIATE_RENDERS = 0;
      }
      ++CACHED_RENDERS;
      return cleanRender && !layout._absoluteDirty;
    }
    if (CACHED_RENDERS > 0) {
      // console.log("Rendered from cache " + CACHED_RENDERS + " times");
      CACHED_RENDERS = 0;
    }
    ++IMMEDIATE_RENDERS;
    // console.log("Rendering " + this + " in scene.");
    // console.log(this.absoluteX(), this.absoluteY());
    const overlay = window.overlay();
    overlay.save();
    window.overlay().scale(camera.scale(), camera.scale());
    window
      .overlay()
      .translate(camera.x() + layout.absoluteX(), camera.y() + layout.absoluteY());
    window.overlay().scale(layout.absoluteScale(), layout.absoluteScale());
    this.renderDirect(renderWorld, renderScale, false, camera);
    overlay.restore();

    if (layout._absoluteDirty) {
      console.log("Node was rendered with dirty absolute position.");
    }
    if (this.root().isDirty()) {
      console.log("Node was rendered dirty.");
    }
    return !this.root().isDirty() && !layout._absoluteDirty;
  }
}
