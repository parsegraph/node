import Camera from "parsegraph-camera";
import BasicWindow from "parsegraph-window";

// The maximum scale where nodes will be rendered from a cache.
export const FREEZER_TEXTURE_SCALE = 0.01;

import WindowNode from "../windownode/WindowNode";

import FrozenNode from "./FrozenNode";
import FreezerWindow from "./FreezerWindow";
import FreezerRow from "./FreezerRow";

export default class Freezer {
  _frozenNodes: FrozenNode[];
  _textureScale: number;
  _camera: Camera;
  _windowData: { [id: string]: FreezerWindow };
  _framebuffer: WebGLFramebuffer;
  _renderbuffer: WebGLRenderbuffer;
  _activated: boolean;
  _lowAspectRow: FreezerRow;
  _highAspectRow: FreezerRow;
  _program: WebGLProgram;

  constructor() {
    this._frozenNodes = [];
    this._textureScale = FREEZER_TEXTURE_SCALE;

    this._windowData = {};

    this._camera = new Camera();

    this._framebuffer = null;
    this._renderbuffer = null;
    this._activated = false;
  }

  windowData(window: BasicWindow) {
    return this._windowData[window.id()];
  }

  cache(node: WindowNode) {
    const item = new FrozenNode(this, node);
    this._frozenNodes.push(item);
    return item;
  }

  contextChanged(isLost: boolean) {
    for (const wid in this._windowData) {
      if (Object.prototype.hasOwnProperty.call(this._windowData, wid)) {
        const wdata = this._windowData[wid];
        wdata.contextChanged(isLost);
      }
    }
    this._lowAspectRow.contextChanged(isLost);
    this._highAspectRow.contextChanged(isLost);
    if (isLost) {
      this._activated = false;
      this._framebuffer = null;
      this._renderbuffer = null;
      this._program = null;
    }
  }

  allocate(window: BasicWindow, width: number, height: number) {
    let wdata = this._windowData[window.id()];
    if (!wdata) {
      wdata = new FreezerWindow(this, window);
      this._windowData[window.id()] = wdata;
    }
    return wdata.allocate(width, height);
  }

  camera() {
    return this._camera;
  }

  textureScale() {
    return this._textureScale;
  }
}
