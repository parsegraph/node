import Freezer from "./Freezer";
import paintGroupBounds from "./paintGroupBounds";
import WindowNode from "../windownode/WindowNode";
import BasicWindow from "parsegraph-window";
import { Matrix3x3 } from "parsegraph-matrix";

export default class FrozenNode {
  _node: WindowNode;
  _freezer: Freezer;
  _windowFragments: { [id: string]: any };
  _validated: boolean;
  _x: number;
  _y: number;
  _width: number;
  _height: number;

  constructor(freezer: Freezer, node: WindowNode) {
    this._node = node;
    this._freezer = freezer;
    this._windowFragments = {};
    this.invalidate();
  }

  invalidate() {
    // console.log("Invalidating cache for " + this._node);
    for (const wid in this._windowFragments) {
      if (!Object.prototype.hasOwnProperty.call(this._windowFragments, wid)) {
        continue;
      }
      const fragments = this._windowFragments[wid];
      for (const i in fragments) {
        if (Object.prototype.hasOwnProperty.call(fragments, i)) {
          const frag = fragments[i];
          frag.dispose();
        }
      }
      fragments.splice(0, fragments.length);
    }
    this._validated = false;
    this._width = NaN;
    this._height = NaN;
    this._x = NaN;
    this._y = NaN;
  }

  validate() {
    if (this._validated) {
      return;
    }
    const bounds = paintGroupBounds(this.node());
    this._width = bounds.left + bounds.right;
    this._height = bounds.top + bounds.bottom;
    this._x = bounds.left;
    this._y = bounds.top;

    this._validated = true;
  }

  paint(window: BasicWindow) {
    // console.log("Painting frozen node");
    this.validate();
    let fragments = this._windowFragments[window.id()];
    if (!fragments) {
      fragments = [];
      this._windowFragments[window.id()] = fragments;
    }

    if (fragments.length === 0) {
      const scale = this._freezer.textureScale();
      const fragWidth = this._width * scale;
      const fragHeight = this._height * scale;
      const fragX = this._x * scale;
      const fragY = this._y * scale;
      const textureSize = window.textureSize();
      const fragSize = textureSize * scale;
      const numRows = Math.ceil(fragHeight / textureSize);
      const numCols = Math.ceil(fragWidth / textureSize);
      for (let y = 0; y < numRows; ++y) {
        for (let x = 0; x < numCols; ++x) {
          const frag = this._freezer.allocate(
            window,
            Math.min(fragWidth - textureSize * x, textureSize),
            Math.min(fragHeight - textureSize * y, textureSize)
          );
          frag.assignNode(
            this,
            (x * fragSize) / this._freezer.textureScale() - fragX,
            (y * fragSize) / this._freezer.textureScale() - fragY
          );
          fragments.push(frag);
        }
      }
    }
    for (const i in fragments) {
      if (Object.prototype.hasOwnProperty.call(fragments, i)) {
        fragments[i].paint();
      }
    }
  }

  render(
    window: BasicWindow,
    world: Matrix3x3,
    renderData: any,
    needsSetup: boolean
  ) {
    // console.log("Frozen render");
    if (!this._validated) {
      return false;
    }
    const fragments = this._windowFragments[window.id()];
    if (!fragments) {
      return false;
    }
    let renderedClean = true;
    let needsLoad = true;
    for (const i in fragments) {
      if (!fragments[i].render(world, renderData, needsSetup, needsLoad)) {
        renderedClean = false;
      } else {
        needsLoad = false;
        needsSetup = false;
      }
    }
    return renderedClean;
  }

  node() {
    return this._node;
  }
}

