import { Component } from "parsegraph-window";
import WindowNode from "./WindowNode";
import PaintGroup from "./PaintGroup";
import log, { logEnterc, logLeave } from "parsegraph-log";
import GraphPainterAnalytics from "./GraphPainterAnalytics";
import Camera from "parsegraph-camera";
import NodeRenderData from "./NodeRenderData";

const renderData: NodeRenderData = new NodeRenderData();

const timer = (timeout:number)=>{
  const t: number = new Date().getTime();
  return function (): boolean {
    const isPast: boolean =
      timeout !== undefined && new Date().getTime() - t > timeout;
    if (isPast) {
      log(
        "Past time: timeout={0}, elapsed={1}",
        timeout,
        new Date().getTime() - t
      );
    }
    return isPast;
  };
}

export default class GraphPainterSlice {
  _comp: Component;
  _savedPaintGroup: WindowNode;
  _paintGroups: PaintGroup[];
  _root: WindowNode;

  constructor(comp:Component, root:WindowNode) {
    this._comp = comp;
    this._root = root;
    this._savedPaintGroup = root;
  }

  root() {
    return this._root;
  }

  window() {
    return this._comp.window();
  }

  isDirty() {
    return !!this._savedPaintGroup;
  }

  markDirty() {
    this._paintGroups = [];
    this._savedPaintGroup = this.root();
  }

  paint(timeout?: number): boolean {
    const window = this.window();
    logEnterc("Node paints", "Painting node for window={0}", window);
    log("{0} has paint group {1}", this.root(), this._savedPaintGroup);
    log("{0} is dirty={1}", this.root(), this.root().isDirty());

    if (window.gl().isContextLost()) {
      logLeave("Lost GL context");
      return false;
    }

    if (!this.root().isDirty() && !this.isDirty()) {
      return false;
    }

    if (timeout <= 0) {
      logLeave("Paint timeout=" + timeout);
      return true;
    }

    // Create paint groups
    const pastTime = timer(timeout);
    while (true) {
      if (pastTime()) {
        this.root()._dirty = true;
        logLeave("Ran out of time during painting (timeout={0})", timeout);
        return true;
      }

      const paintGroup: WindowNode = this._savedPaintGroup;
      const pg = new PaintGroup(this._comp, paintGroup);
      this._paintGroups.push(pg);
      pg.paint();

      this._savedPaintGroup = paintGroup.nextPaintGroup();
      if (this._savedPaintGroup === this.root()) {
        break;
      }
    }

    // Finalize painting
    this._savedPaintGroup = null;
    logLeave("Completed node painting");
    return false;
  }

  render(camera: Camera): boolean {
    const analytics = new GraphPainterAnalytics();
    analytics.recordStart();

    this._paintGroups.forEach(pg=>{
      if (pg.render(camera, renderData)) {
        analytics.recordDirtyRender();
      } else if (pg.consecutiveRenders() > 1) {
        analytics.recordConsecutiveRender(pg);
      }
    });

    analytics.recordCompletion();
    return analytics.isDirty();
  }
}
