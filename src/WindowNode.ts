import { elapsed } from "parsegraph-timing";

import { BasicWindow, Component, Keystroke, INTERVAL } from "parsegraph-window";

import {
  matrixIdentity3x3,
  makeScale3x3I,
  makeTranslation3x3I,
  matrixMultiply3x3I,
  Matrix3x3,
} from "parsegraph-matrix";

import Rect from "parsegraph-rect";
import WindowNodePainter from "./WindowNodePainter";
import Camera from "parsegraph-camera";
import Freezer from "./Freezer";

import { Direction } from "parsegraph-direction";
import { LayoutNode } from "parsegraph-layout";
import Viewport from "./Viewport";
import DefaultNodeType from "./DefaultNodeType";
import Node from "./Node";

import log, { logc, logEnterc, logLeave } from "./log";

// The largest scale at which nodes are shown in camera.
// export const NATURAL_VIEWPORT_SCALE = 0.5;
export const NATURAL_VIEWPORT_SCALE = 1.0;

// The maximum scale where nodes will be rendered from a cache.
export const CACHE_ACTIVATION_SCALE = 0.01;

class NodeRenderData {
  bounds: Rect;
  scaleMat: Matrix3x3;
  transMat: Matrix3x3;
  worldMat: Matrix3x3;

  constructor() {
    this.bounds = new Rect(0, 0, 0, 0);
    this.scaleMat = matrixIdentity3x3();
    this.transMat = matrixIdentity3x3();
    this.worldMat = matrixIdentity3x3();
  }
}
const renderTimes: number[] = [];
const renderData: NodeRenderData = new NodeRenderData();
let CACHED_RENDERS: number = 0;
let IMMEDIATE_RENDERS: number = 0;

export function chainTab(
  a: WindowNode,
  b: WindowNode,
  swappedOut?: WindowNode[]
): void {
  a.ensureExtended();
  b.ensureExtended();
  if (swappedOut) {
    swappedOut[0] = a ? a._extended.nextTabNode : null;
    swappedOut[1] = b ? b._extended.prevTabNode : null;
  }
  // console.log(a, b);
  if (a) {
    a._extended.nextTabNode = b;
  }
  if (b) {
    b._extended.prevTabNode = a;
  }
}

export function chainAllTabs(...args: WindowNode[]): void {
  if (args.length < 2) {
    return;
  }
  const firstNode: WindowNode = args[0];
  const lastNode: WindowNode = args[args.length - 1];

  for (let i = 0; i <= args.length - 2; ++i) {
    chainTab(args[i], args[i + 1]);
  }
  chainTab(lastNode, firstNode);
}

// ////////////////////////////////////////////////////////////////////////////
//
// Extended node
//
// ////////////////////////////////////////////////////////////////////////////

export type KeyListener = (event: Keystroke, comp: Component) => boolean;

export class ExtendedNode {
  ignoresMouse: boolean;
  keyListener: KeyListener;
  keyListenerThisArg: object;
  clickListener: Function;
  clickListenerThisArg: object;
  changeListener: Function;
  changeListenerThisArg: object;
  prevTabNode: WindowNode;
  nextTabNode: WindowNode;

  constructor() {
    this.ignoresMouse = false;
    this.keyListener = null;
    this.keyListenerThisArg = null;
    this.clickListener = null;
    this.clickListenerThisArg = null;
    this.changeListener = null;
    this.changeListenerThisArg = null;
    this.prevTabNode = null;
    this.nextTabNode = null;
  }
}

export default abstract class WindowNode extends LayoutNode {
  _windowPainter: Map<BasicWindow, WindowNodePainter>;
  _windowPaintGroup: { [key: string]: WindowNode };
  _commitLayoutFunc: Function;
  _cache: any;
  _element: any;
  _windowElement: Map<Component, HTMLElement>;
  _extended: ExtendedNode;

  constructor(fromNode?: WindowNode, parentDirection?: Direction) {
    super(fromNode, parentDirection);
    this._windowPainter = new Map();
    this._windowPaintGroup = {};
    this._windowElement = new Map();
    this._commitLayoutFunc = null;
    this._cache = null;
    this._element = null;
    this._extended = null;
  }

  element(): any {
    return this._element;
  }

  setElement(element: any): void {
    this._element = element;
    this.layoutWasChanged(Direction.INWARD);
  }

  setClickListener(listener: Function, thisArg?: object): void {
    if (!listener) {
      if (this._extended) {
        this._extended.clickListener = null;
        this._extended.clickListenerThisArg = null;
      }
      return;
    }
    if (!thisArg) {
      thisArg = this;
    }
    this.ensureExtended();
    this._extended.clickListener = listener;
    this._extended.clickListenerThisArg = thisArg;
    // console.log("Set click listener for node " + this._id);
  }

  ensureExtended(): ExtendedNode {
    if (!this._extended) {
      // console.log(new Error("Extending"));
      this._extended = new ExtendedNode();
    }
    return this._extended;
  }

  isClickable(): boolean {
    return this.hasClickListener() || !this.ignoresMouse();
  }

  setIgnoreMouse(value: boolean): void {
    if (!value && !this._extended) {
      return;
    }
    this.ensureExtended();
    this._extended.ignoresMouse = value;
  }

  ignoresMouse(): boolean {
    if (!this._extended) {
      return false;
    }
    return this._extended.ignoresMouse;
  }

  hasClickListener(): boolean {
    return this._extended && this._extended.clickListener != null;
  }

  click(comp: Component): any {
    // Invoke the click listener.
    if (!this.hasClickListener()) {
      return;
    }
    return this._extended.clickListener.call(
      this._extended.clickListenerThisArg,
      comp,
      this
    );
  }

  setKeyListener(listener: KeyListener, thisArg?: object): void {
    if (!listener) {
      if (this._extended) {
        this._extended.keyListener = null;
        this._extended.keyListenerThisArg = null;
      }
      return;
    }
    if (!thisArg) {
      thisArg = this;
    }
    if (!this._extended) {
      this._extended = new ExtendedNode();
    }
    this._extended.keyListener = listener;
    this._extended.keyListenerThisArg = thisArg;
  }

  hasKeyListener(): boolean {
    return this._extended && this._extended.keyListener != null;
  }

  key(event: Keystroke, comp?: Component): any {
    // Invoke the key listener.
    if (!this.hasKeyListener()) {
      return;
    }
    return this._extended.keyListener.call(
      this._extended.keyListenerThisArg,
      event,
      comp
    );
  }

  toString(): string {
    return "[WindowNode " + this._id + "]";
  }

  markDirty(): void {
    super.markDirty();
    logc("Dirty nodes", "Marking {0} as dirty", this);
    this._commitLayoutFunc = null;
    for (const wid in this._windowPaintGroup) {
      if (Object.prototype.hasOwnProperty.call(this._windowPaintGroup, wid)) {
        this._windowPaintGroup[wid] = null;
      }
    }
  }

  abstract newPainter(
    window: BasicWindow,
    paintContext: Component
  ): WindowNodePainter;

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

  freeze(freezer: Freezer): void {
    if (!this.localPaintGroup()) {
      throw new Error("A node must be a paint group in order to be frozen.");
    }
    this._cache = freezer.cache(this);
  }

  isFrozen(): boolean {
    return this._cache;
  }

  thaw(): void {
    if (!this.localPaintGroup()) {
      throw new Error("A node must be a paint group in order to be thawed.");
    }
    if (this._cache) {
      this._cache.invalidate();
      this._cache = null;
    }
  }

  showNodeInCamera(cam: Camera): void {
    this.commitLayoutIteratively();
    const bodySize = this.absoluteSize();

    // const bodyRect = new Rect(
    // this.absoluteX(),
    // this.absoluteY(),
    // bodySize[0],
    // bodySize[1],
    // );
    // if(cam.ContainsAll(bodyRect)) {
    // return;
    // }

    const nodeScale = this.absoluteScale();

    const camScale = cam.scale();
    const screenWidth = cam.width();
    const screenHeight = cam.height();

    let scaleAdjustment;
    const widthIsBigger =
      screenWidth / (bodySize[0] * nodeScale) <
      screenHeight / (bodySize[1] * nodeScale);
    if (widthIsBigger) {
      scaleAdjustment = screenWidth / (bodySize[0] * nodeScale);
    } else {
      scaleAdjustment = screenHeight / (bodySize[1] * nodeScale);
    }
    if (scaleAdjustment > camScale) {
      scaleAdjustment = camScale;
    } else {
      cam.setScale(scaleAdjustment);
    }

    const ax = this.absoluteX();
    const ay = this.absoluteY();
    cam.setOrigin(
      -ax + screenWidth / (scaleAdjustment * 2),
      -ay + screenHeight / (scaleAdjustment * 2)
    );
  }

  showInCamera(cam: Camera, onlyScaleIfNecessary: boolean): void {
    // console.log("Showing node in camera");
    this.commitLayoutIteratively();
    const bodySize = this.extentSize();
    const nodeScale = this.absoluteScale();
    const camScale = cam.scale();
    const screenWidth = cam.width();
    const screenHeight = cam.height();
    if (Number.isNaN(screenWidth) || Number.isNaN(screenHeight)) {
      throw new Error(
        "Camera size must be set before a node can be shown in it."
      );
    }

    // Adjust camera scale.
    let scaleAdjustment;
    const widthIsBigger =
      screenWidth / bodySize[0] < screenHeight / bodySize[1];
    if (widthIsBigger) {
      scaleAdjustment = screenWidth / bodySize[0];
    } else {
      scaleAdjustment = screenHeight / bodySize[1];
    }
    const scaleMaxed = scaleAdjustment > NATURAL_VIEWPORT_SCALE;
    if (scaleMaxed) {
      scaleAdjustment = NATURAL_VIEWPORT_SCALE;
    }
    if (onlyScaleIfNecessary && scaleAdjustment / nodeScale > camScale) {
      scaleAdjustment = camScale;
    } else {
      cam.setScale(scaleAdjustment / nodeScale);
    }

    // Get node extents.
    let x;
    let y;
    const bv: number[] = [null, null, null];
    this.extentsAt(Direction.BACKWARD).boundingValues(bv);
    x = bv[2] * nodeScale;
    this.extentsAt(Direction.UPWARD).boundingValues(bv);
    y = bv[2] * nodeScale;

    if (widthIsBigger || scaleMaxed) {
      y += screenHeight / (cam.scale() * 2) - (nodeScale * bodySize[1]) / 2;
    }
    if (!widthIsBigger || scaleMaxed) {
      x += screenWidth / (cam.scale() * 2) - (nodeScale * bodySize[0]) / 2;
    }

    // Move camera into position.
    const ax = this.absoluteX();
    const ay = this.absoluteY();
    cam.setOrigin(x - ax, y - ay);
  }

  contextChanged(isLost: boolean, window: BasicWindow): void {
    if (!this.localPaintGroup()) {
      return;
    }
    this.forEachPaintGroup((node: WindowNode) => {
      node.markDirty();
      node.painter(window).contextChanged(isLost);
    });
  }

  elementFor(context: Component): HTMLElement {
    return this._windowElement.get(context);
  }

  getWorldElement(window: BasicWindow, paintContext: Component): Element {
    if (!window.containerFor(paintContext)) {
      return null;
    }
    let worldEle:HTMLElement = window.containerFor(paintContext).querySelector(".world");
    if (worldEle) {
      return worldEle;
    }
    worldEle = document.createElement("div");
    worldEle.className = "world";
    worldEle.style.width = "100vw";
    worldEle.style.height = "100vh";
    worldEle.style.transformOrigin = "top left";
    worldEle.style.position = "relative";
    worldEle.style.pointerEvents = "none";
    window.containerFor(paintContext).appendChild(worldEle);
    return worldEle;
  }

  prepare(window: BasicWindow, paintContext: Component): void {
    if (!window.containerFor(paintContext)) {
      return;
    }
    // Loop back to the first node, from the root.
    this.forEachPaintGroup((pg: WindowNode) => {
      pg.forEachNode((node: WindowNode) => {
        if (!node.element()) {
          return;
        }
        if (node.elementFor(paintContext)) {
          return;
        }
        const elem = node.element()(window);
        if (
          elem.parentNode !== this.getWorldElement(window, paintContext)
        ) {
          if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
          }
          const sizer = document.createElement("div");
          // sizer.style.width = "100%";
          // sizer.style.height = "100%";
          sizer.style.display = "none";
          sizer.style.position = "absolute";
          new ResizeObserver(() => {
            node.layoutWasChanged();
            (paintContext as Viewport).world().scheduleRepaint();
            (paintContext as Viewport).scheduleUpdate();
            window.scheduleUpdate();
          }).observe(elem);
          this.getWorldElement(window, paintContext).appendChild(sizer);
          sizer.appendChild(elem);

          sizer.style.display = "block";
          sizer.style.transformOrigin = "center";
          sizer.style.cursor = "pointer";
          sizer.style.overflow = "hidden";
          sizer.style.transformOrigin = "top left";

          sizer.addEventListener("click", () => {
            const viewport = paintContext as Viewport;
            viewport.showInCamera(node as Node<DefaultNodeType>);
            node.click(viewport);
          });
          sizer.addEventListener("hover", () => {
            (paintContext as Viewport).setCursor("pointer");
          });
          sizer.addEventListener("blur", () => {
            (paintContext as Viewport).setCursor(null);
          });
        }
        node._windowElement.set(paintContext, elem);
      });
    });
  }

  paint(
    window: BasicWindow,
    timeout?: number,
    paintContext?: Component
  ): boolean {
    if (!this.localPaintGroup()) {
      throw new Error("A node must be a paint group in order to be painted");
    }

    // Load saved state.
    const wid: string = window.id();
    let savedPaintGroup: WindowNode = this._windowPaintGroup[wid];
    if (!this.isDirty()) {
      return false;
    }

    if (window.gl().isContextLost()) {
      logLeave("Lost GL context");
      return false;
    }
    if (timeout <= 0) {
      logLeave("Paint timeout=" + timeout);
      return true;
    }

    logEnterc("Node paints", "Painting node for window={0}", wid);
    log("{0} has paint group {1}", this, savedPaintGroup);
    log("{0} is dirty={1}", this, this.isDirty());

    const t: number = new Date().getTime();
    const pastTime: Function = function (): boolean {
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

    let cont: Function;
    if (this._commitLayoutFunc) {
      log("Continuing commit layout in progress");
      cont = this._commitLayoutFunc(timeout);
    } else if (!savedPaintGroup) {
      this.prepare(window, paintContext);
      log("Starting new commit layout");
      cont = this.commitLayoutIteratively(timeout);
    }

    if (cont) {
      this._commitLayoutFunc = cont;
      logLeave("Timed out during commitLayout");
      return true;
    } else {
      log(this + " Committed all layout");
      this._commitLayoutFunc = null;
      this._windowPaintGroup[wid] = this;
      savedPaintGroup = this;
    }

    // Continue painting.
    while (true) {
      if (pastTime()) {
        this._dirty = true;
        logLeave("Ran out of time during painting (timeout={0})", timeout);
        return true;
      }

      const paintGroup: WindowNode = savedPaintGroup;
      let painter: WindowNodePainter = paintGroup.painter(window);
      if (paintGroup.needsCommit()) {
        throw new Error("Need commit even though we should be done");
      }
      if (paintGroup.isDirty() || !painter) {
        // Paint and render nodes marked for the current group.
        log("Painting " + paintGroup);
        if (!painter) {
          painter = paintGroup.newPainter(window, paintContext);
          paintGroup.setPainter(window, painter);
        }

        painter.paint(paintContext);

        if (paintGroup.isFrozen()) {
          paintGroup._cache.paint(window);
        }
      }
      paintGroup._dirty = false;
      this._windowPaintGroup[wid] = paintGroup._paintGroupNext;
      savedPaintGroup = this._windowPaintGroup[wid];
      if (this._windowPaintGroup[wid] === this) {
        break;
      }
    }

    this._windowPaintGroup[wid] = null;
    logLeave("Completed node painting");
    return false;
  }

  renderIteratively(
    window: BasicWindow,
    camera: Camera,
    paintContext: Component
  ): boolean {
    const start: Date = new Date();
    // console.log("Rendering iteratively");
    let dirtyRenders: number = 0;
    // let nodesRendered:number = 0;
    let heaviestPaintGroup: WindowNode = null;
    let mostRenders: number = 0;

    this.forEachPaintGroup((paintGroup: WindowNode) => {
      logEnterc("Node renders", "Rendering node {0}", paintGroup);
      const painter: WindowNodePainter = paintGroup.painter(window);
      if (!paintGroup.render(window, camera, renderData, paintContext)) {
        log("Node rendered dirty.");
        ++dirtyRenders;
      } else if (painter.consecutiveRenders() > 1) {
        mostRenders = Math.max(painter.consecutiveRenders(), mostRenders);
        if (heaviestPaintGroup === null) {
          heaviestPaintGroup = paintGroup;
        } else if (
          painter.weight() > heaviestPaintGroup.painter(window).weight()
        ) {
          heaviestPaintGroup = paintGroup;
        }
      }
      // ++nodesRendered;
      logLeave();
    });
    // console.log(nodesRendered +
    //   " paint groups rendered " +
    //   (dirtyRenders > 0 ? "(" +
    //   dirtyRenders +
    //   " dirty)" : ""));

    const renderTime: number = elapsed(start);
    if (renderTimes.length === 11) {
      renderTimes.splice(Math.floor(Math.random() * 11), 1);
    }
    if (mostRenders > 1) {
      renderTimes.push(renderTime);
      renderTimes.sort(function (a, b) {
        return a - b;
      });
      const meanRenderTime = renderTimes[Math.floor(renderTimes.length / 2)];
      if (meanRenderTime > INTERVAL / 2) {
        /* console.log("Freezing heaviest node " +
         *   heaviestPaintGroup + " (weight=" +
         *   heaviestPaintGroup.painter(window).weight() + ") because
         *   rendering took " + meanRenderTime +
         *   "ms (most renders = " + mostRenders + ")");
                let str:string = "[";
                for(var i = 0; i < renderTimes.length; ++i) {
                    if(i > 0) {
                        str += ", ";
                    }
                    str += renderTimes[i];
                }
                str += "]";
                console.log(str);*/
      }
    }
    // console.log("Drity renders: ", dirtyRenders);
    return dirtyRenders > 0;
  }

  getHeaviestNode(window: BasicWindow): WindowNode {
    let heaviest: number = 0;
    let heaviestNode: WindowNode = this;
    this.forEachPaintGroup((node: WindowNode) => {
      const painter: WindowNodePainter = node.painter(window);
      if (!painter) {
        return;
      }
      const nodeWeight: number = painter.weight();
      if (heaviest < nodeWeight) {
        heaviestNode = node;
        heaviest = nodeWeight;
      }
    });
    return heaviestNode;
  }
  renderOffscreen(
    window: BasicWindow,
    renderWorld: Matrix3x3,
    renderScale: number,
    forceSimple: boolean,
    cam: Camera,
    paintContext: Component
  ): boolean {
    if (!this.localPaintGroup()) {
      throw new Error("Cannot render a node that is not a paint group");
    }
    const painter: WindowNodePainter = this.painter(window);
    if (!painter) {
      return false;
    }
    painter.render(renderWorld, renderScale, forceSimple, cam, paintContext);
  }

  render(
    window: BasicWindow,
    camera: Camera,
    renderData: NodeRenderData,
    paintContext: Component
  ): boolean {
    // console.log("RENDERING THE NODE");
    if (!this.localPaintGroup()) {
      throw new Error("Cannot render a node that is not a paint group");
    }
    const painter: WindowNodePainter = this.painter(window);
    if (!painter) {
      console.log("Node has no painter for " + window.id());
      return false;
    }
    if (this._absoluteXPos === null) {
      console.log("Node has no absolute pos");
      return false;
    }

    if (!renderData) {
      renderData = new NodeRenderData();
    }

    // Do not render paint groups that cannot be seen.
    const s: Rect = painter.bounds().clone(renderData.bounds);
    s.scale(this.scale());
    s.translate(this._absoluteXPos, this._absoluteYPos);
    if (camera && !camera.containsAny(s)) {
      // console.log("Out of bounds: " + this);
      return !this._absoluteDirty;
    }

    this.prepare(window, paintContext);

    const world: Matrix3x3 = camera.project();
    makeScale3x3I(renderData.scaleMat, this._absoluteScale);
    makeTranslation3x3I(
      renderData.transMat,
      this._absoluteXPos,
      this._absoluteYPos
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
      this._absoluteScale * (camera ? camera.scale() : 1);

    // console.log("Rendering paint group: " +
    //   this.absoluteX() + " " + this.absoluteY() +
    //   " " + this.absoluteScale());
    if (this._cache && renderScale < CACHE_ACTIVATION_SCALE) {
      window.log("Rendering " + this + " from cache.");
      const cleanRender = this._cache.render(
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
      return cleanRender && !this._absoluteDirty;
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
      .translate(camera.x() + this.absoluteX(), camera.y() + this.absoluteY());
    window.overlay().scale(this.absoluteScale(), this.absoluteScale());
    painter.render(renderWorld, renderScale, false, camera, paintContext);
    overlay.restore();

    if (this._absoluteDirty) {
      console.log("Node was rendered with dirty absolute position.");
    }
    if (this.isDirty()) {
      console.log("Node was rendered dirty.");
    }
    return !this.isDirty() && !this._absoluteDirty;
  }
}
