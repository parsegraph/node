import {elapsed} from 'parsegraph-timing';

// The largest scale at which nodes are shown in camera.
// export const NATURAL_VIEWPORT_SCALE = 0.5;
export const NATURAL_VIEWPORT_SCALE = 1.0;

// The maximum scale where nodes will be rendered from a cache.
export const CACHE_ACTIVATION_SCALE = 0.01;

import { Component, INTERVAL } from "parsegraph-window";

import {
  matrixIdentity3x3,
  makeScale3x3I,
  makeTranslation3x3I,
  matrixMultiply3x3I,
  Matrix3x3
} from 'parsegraph-matrix';

import Rect from 'parsegraph-rect';
import Window from 'parsegraph-window';
import NodePainter from './NodePainter';
import Camera from 'parsegraph-camera';
import Freezer from './Freezer';

import {
  Direction,
} from 'parsegraph-direction';
import {LayoutNode} from 'parsegraph-layout';

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
export default abstract class WindowNode extends LayoutNode {
  _windowPainter: { [key: string]: NodePainter };
  _windowPaintGroup: { [key: string]: WindowNode };
  _commitLayoutFunc: Function;
  _cache: any;
  _element: any;
  _windowElement: Map<Component, HTMLElement>;

  constructor(fromNode?: WindowNode, parentDirection?: Direction) {
    super(fromNode, parentDirection);
    this._windowPainter = {};
    this._windowPaintGroup = {};
    this._windowElement = new Map();
    this._commitLayoutFunc = null;
    this._cache = null;
    this._element = null;
  }

  element(): any {
    return this._element;
  }

  setElement(element: any): void {
    this._element = element;
    this.layoutWasChanged(Direction.INWARD);
  }

  toString(): string {
    return '[WindowNode ' + this._id + ']';
  }

  markDirty(): void {
    super.markDirty();
    this._commitLayoutFunc = null;
    for (const wid in this._windowPaintGroup) {
      if (Object.prototype.hasOwnProperty.call(
          this._windowPaintGroup,
          wid)) {
        this._windowPaintGroup[wid] = null;
      }
    }
  }

  abstract newPainter(window:Window, paintContext: Component): NodePainter;

  painter(window: Window): NodePainter {
    if (!window) {
      throw new Error(
          'A window must be provided for a NodePainter to be selected',
      );
    }
    return this._windowPainter[window.id()];
  }

  freeze(freezer: Freezer): void {
    if (!this.localPaintGroup()) {
      throw new Error('A node must be a paint group in order to be frozen.');
    }
    this._cache = freezer.cache(this);
  }

  isFrozen(): boolean {
    return this._cache;
  }

  thaw(): void {
    if (!this.localPaintGroup()) {
      throw new Error('A node must be a paint group in order to be thawed.');
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
        -ay + screenHeight / (scaleAdjustment * 2),
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
          'Camera size must be set before a node can be shown in it.',
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
    const bv:number[] = [null, null, null];
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

  contextChanged(isLost: boolean, window: Window): void {
    if (!this.localPaintGroup()) {
      return;
    }
    this.forEachPaintGroup((node:WindowNode)=>{
      node.markDirty();
      for (const wid in node._windowPainter) {
        if (!Object.prototype.hasOwnProperty.call(node._windowPainter, wid)) {
          continue;
        }
        const painter: NodePainter = node._windowPainter[wid];
        if (window.id() == wid) {
          painter.contextChanged(isLost);
        }
      }
    });
  }

  elementFor(context: Component):HTMLElement {
    return this._windowElement.get(context);
  }

  prepare(window: Window, paintContext: Component):void {
    // Loop back to the first node, from the root.
    this.forEachPaintGroup((pg:WindowNode)=>{
      pg.forEachNode((node:WindowNode)=>{
        console.log("Preparing node", node);
        if (node.element() && !node.elementFor(paintContext)) {
          const elem = node.element()(window);
          if (elem.parentNode !== window.containerFor(paintContext)) {
            if (elem.parentNode) {
              elem.parentNode.removeChild(elem);
            }
            window.containerFor(paintContext).appendChild(elem);
          }
          node._windowElement.set(paintContext, elem);
          elem.style.position = "absolute";
        }
      });
    });
  }

  paint(window: Window, timeout?: number, paintContext?: Component): boolean {
    if (!this.localPaintGroup()) {
      throw new Error('A node must be a paint group in order to be painted');
    }
    if (!this.isDirty()) {
      // window.log(this + " is not dirty");
      return false;
    } else {
      // window.log(this + " is dirty");
    }
    if (window.gl().isContextLost()) {
      return false;
    }
    if (timeout <= 0) {
      window.log('Paint timeout=' + timeout);
      return true;
    }

    const t: number = new Date().getTime();
    const pastTime: Function = function(): boolean {
      const isPast: boolean =
        timeout !== undefined && new Date().getTime() - t > timeout;
      if (isPast) {
        // console.log("Past time: timeout=" +
        //   timeout + ", elapsed="+(new Date().getTime() - t));
      }
      return isPast;
    };

    // Load saved state.
    const wid: string = window.id();
    let savedPaintGroup: WindowNode = this._windowPaintGroup[wid];

    let cont: Function;
    if (this._commitLayoutFunc) {
      // console.log("Continuing commit layout in progress");
      cont = this._commitLayoutFunc(timeout);
    } else if (!savedPaintGroup) {
      this.prepare(window, paintContext);
      // console.log("Starting new commit layout");
      cont = this.commitLayoutIteratively(timeout);
    }

    if (cont) {
      // window.log(this + " Timed out during commitLayout");
      this._commitLayoutFunc = cont;
      return true;
    } else {
      // window.log(this + " Committed all layout");
      this._commitLayoutFunc = null;
      this._windowPaintGroup[wid] = this;
      savedPaintGroup = this;
    }

    // Continue painting.
    while (true) {
      if (pastTime()) {
        this._dirty = true;
        // window.log("Ran out of time during painting
        //   (timeout=" + timeout + "). is " + savedPaintGroup);
        return true;
      }

      const paintGroup: WindowNode = savedPaintGroup;
      let painter: NodePainter = paintGroup._windowPainter[wid];
      if (paintGroup.isDirty() || !painter) {
        // Paint and render nodes marked for the current group.
        // console.log("Painting " + paintGroup);
        if (!painter) {
          painter = paintGroup.newPainter(window, paintContext);
          paintGroup._windowPainter[wid] = painter;
        }

        painter.paint();

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
    // window.log("Completed node painting");
    return false;
  }

  renderIteratively(
      window: Window,
      camera: Camera,
      paintContext: Component
  ): boolean {
    const start: Date = new Date();
    // console.log("Rendering iteratively");
    let dirtyRenders: number = 0;
    // let nodesRendered:number = 0;
    let heaviestPaintGroup: WindowNode = null;
    let mostRenders: number = 0;

    this.forEachPaintGroup((paintGroup:WindowNode)=>{
      // console.log("Rendering node " + paintGroup);
      const painter: NodePainter = paintGroup.painter(window);
      if (!paintGroup.render(window, camera, renderData, paintContext)) {
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
      renderTimes.sort(function(a, b) {
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
    }return dirtyRenders > 0;
  }

  getHeaviestNode(window: Window): WindowNode {
    let heaviest: number = 0;
    let heaviestNode: WindowNode = this;
    this.forEachPaintGroup((node:WindowNode)=>{
      const painter: NodePainter = node._windowPainter[window.id()];
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
      window: Window,
      renderWorld: Matrix3x3,
      renderScale: number,
      forceSimple: boolean,
      cam:Camera,
      paintContext:Component
  ): boolean {
    if (!this.localPaintGroup()) {
      throw new Error('Cannot render a node that is not a paint group');
    }
    const painter: NodePainter = this._windowPainter[window.id()];
    if (!painter) {
      return false;
    }
    painter.render(renderWorld, renderScale, forceSimple, cam, paintContext);
  }

  render(
      window: Window,
      camera: Camera,
      renderData: NodeRenderData,
      paintContext: Component
  ): boolean {
    // console.log("RENDERING THE NODE");
    if (!this.localPaintGroup()) {
      throw new Error('Cannot render a node that is not a paint group');
    }
    const painter: NodePainter = this._windowPainter[window.id()];
    if (!painter) {
      // window.log("Node has no painter for " + window.id());
      return false;
    }
    if (this._absoluteXPos === null) {
      // window.log("Node has no absolute pos");
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
      // window.log("Out of bounds: " + this);
      return !this._absoluteDirty;
    }

    this.prepare(window, paintContext);

    const world: Matrix3x3 = camera.project();
    makeScale3x3I(renderData.scaleMat, this._absoluteScale);
    makeTranslation3x3I(
        renderData.transMat,
        this._absoluteXPos,
        this._absoluteYPos,
    );
    matrixMultiply3x3I(
        renderData.worldMat,
        renderData.scaleMat,
        renderData.transMat,
    );
    const renderWorld: Matrix3x3 = matrixMultiply3x3I(
        renderData.worldMat,
        renderData.worldMat,
        world,
    );
    const renderScale: number =
      this._absoluteScale * (camera ? camera.scale() : 1);

    // console.log("Rendering paint group: " +
    //   this.absoluteX() + " " + this.absoluteY() +
    //   " " + this.absoluteScale());
    if (
      this._cache &&
      renderScale < CACHE_ACTIVATION_SCALE
    ) {
      window.log('Rendering ' + this + ' from cache.');
      const cleanRender = this._cache.render(
          window,
          renderWorld,
          renderData,
          CACHED_RENDERS === 0,
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
    window
        .overlay()
        .scale(
            camera.scale(),
            camera.scale()
        );
    window
        .overlay()
        .translate(camera.x() + this.absoluteX(),
            camera.y() + this.absoluteY());
    window
        .overlay()
        .scale(
            this.absoluteScale(),
            this.absoluteScale()
        );
    painter.render(renderWorld, renderScale, false, camera, paintContext);
    overlay.restore();

    if (this._absoluteDirty) {
      // window.log("Node was rendered with dirty absolute position.");
    }
    return !this.isDirty() && !this._absoluteDirty;
  }
}
