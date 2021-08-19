import Camera from 'parsegraph-camera';
import {compileProgram} from 'parsegraph-compileprogram';
import Window from 'parsegraph-window';

// The maximum scale where nodes will be rendered from a cache.
export const FREEZER_TEXTURE_SCALE = 0.01;

import freezerVertexShader from './Freezer_VertexShader.glsl';
import freezerFragmentShader from './Freezer_FragmentShader.glsl';
import { Matrix3x3 } from 'parsegraph-matrix';
import WindowNode from './WindowNode';
import Size from 'parsegraph-size';
import { Direction, nameDirection } from 'parsegraph-direction';

const FREEZER_MARGIN = 8;

export class FreezerWindow {
  _freezer:Freezer;
  _window:Window;
  _gl:WebGLRenderingContext;
  _shaders:{[id:string]:WebGLProgram};
  _highAspectRow:FreezerRow;
  _lowAspectRow:FreezerRow;
  _program:WebGLProgram;
  uWorld:WebGLUniformLocation;
  uTexture:WebGLUniformLocation;
  aPosition:number;
  aTexCoord:number;
  _origFramebuffer:WebGLFramebuffer;
  _origRenderbuffer:WebGLRenderbuffer;
  _framebuffer:WebGLFramebuffer;
  _activated:boolean;
  _renderbuffer:WebGLRenderbuffer;

  constructor (freezer:Freezer, window:Window) {
    this._freezer = freezer;
    this._window = window;
    this._gl = this._window.gl();
    this._shaders = this._window.shaders();
    this._highAspectRow = new FreezerRow(freezer, window, true);
    this._lowAspectRow = new FreezerRow(freezer, window, false);
  }

  allocate(width:number, height:number):FrozenNodeFragment {
    const frag = new FrozenNodeFragment(width, height);
    const aspect = width / height;
    if (aspect < 1 / 4) {
      this._lowAspectRow.allocate(frag);
    } else {
      this._highAspectRow.allocate(frag);
    }
    return frag;
  };

  contextChanged(isLost:boolean) {
    console.log("Freezer context lost is " + isLost);
  }

  renderFragment(
      frag:FrozenNodeFragment,
      world:Matrix3x3,
      needsSetup:boolean,
      needsLoad:boolean,
  ) {
    const gl = this.gl();
    if (needsSetup) {
      if (!this._program) {
        this._program = compileProgram(
            this._window,
            'Freezer',
            freezerVertexShader,
            freezerFragmentShader,
        );
        this.uWorld = gl.getUniformLocation(this._program, 'u_world');
        this.uTexture = gl.getUniformLocation(this._program, 'u_texture');
        this.aPosition = gl.getAttribLocation(this._program, 'a_position');
        this.aTexCoord = gl.getAttribLocation(this._program, 'a_texCoord');
      }
      gl.useProgram(this._program);

      gl.activeTexture(gl.TEXTURE0);
      // console.log("Using texture " + frag.slot()._id);
      gl.enableVertexAttribArray(this.aPosition);
      gl.enableVertexAttribArray(this.aTexCoord);
    }
    gl.bindTexture(gl.TEXTURE_2D, frag.slot().glTexture());
    gl.uniform1i(this.uTexture, 0);
    if (needsLoad || needsSetup) {
      gl.uniformMatrix3fv(this.uWorld, false, world);
    }

    const FLOAT_SIZE = 4;
    const stride = 4 * FLOAT_SIZE;
    gl.bindBuffer(gl.ARRAY_BUFFER, frag.vertexBuffer());
    gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(
        this.aTexCoord,
        2,
        gl.FLOAT,
        false,
        stride,
        2 * FLOAT_SIZE,
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // gl.disableVertexAttribArray(this.a_position);
    // gl.disableVertexAttribArray(this.a_texCoord);
    /* if((err = gl.getError()) != gl.NO_ERROR && err != gl.CONTEXT_LOST_WEBGL) {
          throw new Error("GL error during cached rendering");
      }*/
  };

  textureSize() {
    return this._window.textureSize();
  };

  activate(slot:FreezerSlot) {
    const gl = this._gl;
    this._origFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    this._origRenderbuffer = gl.getParameter(gl.RENDERBUFFER_BINDING);
    this._activated = true;

    if (!this._framebuffer) {
      this._framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);

      this._renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
      const tsize = this.textureSize();
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, tsize, tsize);
      gl.framebufferRenderbuffer(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER,
          this._renderbuffer,
      );
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
    }
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        slot.glTexture(),
        0,
    );
  };

  deactivate() {
    if (!this._activated) {
      return;
    }
    const gl = this._gl;
    this._activated = false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._origFramebuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._origRenderbuffer);
  };

  gl() {
    return this._gl;
  };
}

export default class Freezer {
  _frozenNodes:FrozenNode[];
  _textureScale:number;
  _camera:Camera;
  _windowData:{[id:string]:FreezerWindow};
  _framebuffer:WebGLFramebuffer;
  _renderbuffer:WebGLRenderbuffer;
  _activated:boolean;
  _lowAspectRow:FreezerRow;
  _highAspectRow:FreezerRow;
  _program:WebGLProgram;

  constructor() {
    this._frozenNodes = [];
    this._textureScale = FREEZER_TEXTURE_SCALE;

    this._windowData = {};

    this._camera = new Camera();

    this._framebuffer = null;
    this._renderbuffer = null;
    this._activated = false;
  }

  windowData(window:Window) {
    return this._windowData[window.id()];
  };

  cache(node:WindowNode) {
    const item = new FrozenNode(this, node);
    this._frozenNodes.push(item);
    return item;
  };

  contextChanged(isLost:boolean) {
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
  };

  allocate(window:Window, width:number, height:number) {
    let wdata = this._windowData[window.id()];
    if (!wdata) {
      wdata = new FreezerWindow(this, window);
      this._windowData[window.id()] = wdata;
    }
    return wdata.allocate(width, height);
  };

  camera() {
    return this._camera;
  };

  textureScale() {
    return this._textureScale;
  };
}

export class FreezerRow {
  _freezer:Freezer;
  _window:Window;
  _colFirst:boolean;
  _slots:FreezerSlot[];
  _x:number;
  _y:number;
  _currentMax:number;

  constructor(freezer:Freezer, window:Window, colFirst:boolean) {
    this._freezer = freezer;
    this._window = window;
    this._colFirst = colFirst;
    this._slots = [];

    this._x = 0;
    this._y = 0;
    this._currentMax = 0;
  }

  gl() {
    return this._window.gl();
  };

  window() {
    return this._window;
  };

  textureSize() {
    return this._window.textureSize();
  };

  allocate(frag:FrozenNodeFragment) {
    let lastSlot = this._slots[this._slots.length - 1];
    if (!lastSlot) {
      lastSlot = new FreezerSlot(this);
      this._slots.push(lastSlot);
    }
    const neededWidth = frag.width();
    const neededHeight = frag.height();
    const tsize = this.textureSize();
    if (neededHeight > tsize || neededHeight > tsize) {
      throw new Error(
          'Fragment size of ' +
          neededWidth +
          'x' +
          neededHeight +
          ' is too large for any row to allocate (tsize=' +
          tsize +
          ')',
      );
    }
    // Search for a space.
    if (this._colFirst) {
      if (this._y + neededHeight > tsize) {
        this._x += this._currentMax + FREEZER_MARGIN;
        this._y = 0;
      }
      if (this._x + neededWidth > tsize) {
        lastSlot = new FreezerSlot(this);
        this._slots.push(lastSlot);
        this._x = 0;
        this._y = 0;
        this._currentMax = 0;
      }
      // console.log("COL", lastSlot, this._x);
      frag.assignSlot(lastSlot, this._x, this._y, neededWidth, neededHeight);
      this._y += neededHeight + FREEZER_MARGIN;
      this._currentMax = Math.max(
          this._currentMax,
          neededWidth + FREEZER_MARGIN,
      );
    } else {
      // Row first
      if (this._x + neededWidth > tsize) {
        this._x = 0;
        this._y += this._currentMax + FREEZER_MARGIN;
      }
      if (this._y + neededHeight > tsize) {
        lastSlot = new FreezerSlot(this);
        this._slots.push(lastSlot);
        this._x = 0;
        this._y = 0;
        this._currentMax = 0;
      }
      // console.log("ROW", lastSlot, this._x);
      frag.assignSlot(lastSlot, this._x, this._y, neededWidth, neededHeight);
      this._x += neededWidth + FREEZER_MARGIN;
      this._currentMax = Math.max(
          this._currentMax,
          neededHeight + FREEZER_MARGIN,
      );
    }
  };

  contextChanged(isLost:boolean) {
    for (const i in this._slots) {
      if (Object.prototype.hasOwnProperty.call(this._slots, i)) {
        const slot = this._slots[i];
        slot.contextChanged(isLost);
      }
    }
    this._slots.splice(0, this._slots.length);
    this._x = 0;
    this._y = 0;
    this._currentMax = 0;
  };

  freezer() {
    return this._freezer;
  };
}

let freezerSlotCount = 0;

export class FreezerSlot {
  _id:number;
  _row:FreezerRow;
  _glTexture:WebGLTexture;
  _fragments:FrozenNodeFragment[];

  constructor(row:FreezerRow) {
    this._id = ++freezerSlotCount;
    this._row = row;
    this._glTexture = null;
    this._fragments = [];
    this.init();
  }

  glTexture() {
    return this._glTexture;
  };

  gl() {
    return this.window().gl();
  };

  window() {
    return this._row.window();
  };

  init() {
    const tsize = this._row.textureSize();
    const gl = this.gl();
    this._glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._glTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        tsize,
        tsize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    // console.log("Creating new freezer texture");
  };

  contextChanged(isLost:boolean) {
    if (!isLost) {
      this.init();
    } else {
      for (const i in this._fragments) {
        if (Object.prototype.hasOwnProperty.call(this._fragments, i)) {
          this._fragments[i].dispose();
        }
      }
      this._fragments.splice(0, this._fragments.length);
    }
  };

  addFragment(frag:FrozenNodeFragment) {
    this._fragments.push(frag);
  };

  freezer() {
    return this._row.freezer();
  };
}

export class FrozenNode {
  _node:WindowNode;
  _freezer:Freezer;
  _windowFragments:{[id:string]:any};
  _validated:boolean;
  _x:number;
  _y:number;
  _width:number;
  _height:number;


  constructor(freezer:Freezer, node:WindowNode) {
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
  };

  validate() {
    if (this._validated) {
      return;
    }
    const bounds = calculatePaintGroupBounds(this.node());
    this._width = bounds.left + bounds.right;
    this._height = bounds.top + bounds.bottom;
    this._x = bounds.left;
    this._y = bounds.top;

    this._validated = true;
  };

  paint(window:Window) {
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
              Math.min(fragHeight - textureSize * y, textureSize),
          );
          frag.assignNode(
              this,
              (x * fragSize) / this._freezer.textureScale() - fragX,
              (y * fragSize) / this._freezer.textureScale() - fragY,
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
  };

  render(
      window:Window,
      world:Matrix3x3,
      renderData:any,
      needsSetup:boolean,
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
  };

  node() {
    return this._node;
  };
}

export class FrozenNodeFragment {
  _width:number;
  _height:number;
  _x:number;
  _y:number;
  _frozenNode:FrozenNode;
  _slot:FreezerSlot;
  _textureX:number;
  _textureY:number;
  _textureWidth:number;
  _textureHeight:number;
  _vertexBuffer:WebGLBuffer;

  constructor(width:number, height:number) {
    this._width = width;
    this._height = height;
    this._x = NaN;
    this._y = NaN;
    this._frozenNode = null;
    this._slot = null;
    this._textureX = NaN;
    this._textureY = NaN;
    this._vertexBuffer = null;
  }

  assignNode(
      frozenNode:FrozenNode,
      x:number,
      y:number,
  ) {
    this._frozenNode = frozenNode;
    this._x = x;
    this._y = y;
  };

  assignSlot(
      slot:FreezerSlot,
      textureX:number,
      textureY:number,
      textureWidth:number,
      textureHeight:number,
  ) {
    this._slot = slot;
    this._slot.addFragment(this);
    this._textureX = textureX;
    this._textureY = textureY;
    this._textureWidth = textureWidth;
    this._textureHeight = textureHeight;
  };

  vertexBuffer() {
    return this._vertexBuffer;
  };

  window() {
    return this._slot.window();
  };

  windowData() {
    return this.freezer().windowData(this.window());
  };

  gl() {
    return this.window().gl();
  };

  paint() {
    if (this._vertexBuffer) {
      return;
    }
    if (!this._slot) {
      throw new Error(
          'Fragment must be assigned a slot in order for it to be painted',
      );
    }
    const freezer = this.freezer();
    const wdata = this.freezer().windowData(this.window());
    try {
      const gl = wdata.gl();
      gl.bindTexture(gl.TEXTURE_2D, this._slot.glTexture());
      gl.generateMipmap(gl.TEXTURE_2D);
      wdata.activate(this._slot);
      const cam = freezer.camera();
      cam.setSize(this._width, this._height);
      const scale = freezer.textureScale();
      cam.setScale(scale);
      cam.setOrigin(-this._x / scale, -this._y / scale);
      // console.log(
      //   "Viewport=",
      //   this._textureX,
      //   this._textureY,
      //   this._textureWidth,
      //   this._textureHeight);
      gl.viewport(
          this._textureX,
          this._textureY,
          this._textureWidth,
          this._textureHeight,
      );
      const tsize = wdata.textureSize();
      const world = cam.project();
      // console.log("Rnedering offscreen");
      this._frozenNode.node().renderOffscreen(this.window(), world, scale, false, cam);
      // console.log("Dnone");

      if (!this._vertexBuffer) {
        this._vertexBuffer = gl.createBuffer();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);

      const arr = new Float32Array(6 * 4);
      arr[0] = this._x;
      arr[1] = this._y + this._height;
      arr[2] = this._textureX / tsize;
      arr[3] = this._textureY / tsize;
      // arr[2] = 0;
      // arr[3] = 0;

      arr[4] = this._x + this._width;
      arr[5] = this._y + this._height;
      arr[6] = (this._textureX + this._textureWidth) / tsize;
      arr[7] = this._textureY / tsize;
      // arr[6] = 1;
      // arr[7] = 0;

      arr[8] = this._x + this._width;
      arr[9] = this._y;
      arr[10] = (this._textureX + this._textureWidth) / tsize;
      arr[11] = (this._textureY + this._textureHeight) / tsize;
      // arr[10] = 1;
      // arr[11] = 1;

      arr[12] = arr[0];
      arr[13] = arr[1];
      arr[14] = arr[2];
      arr[15] = arr[3];

      arr[16] = arr[8];
      arr[17] = arr[9];
      arr[18] = arr[10];
      arr[19] = arr[11];

      arr[20] = arr[0];
      arr[21] = arr[9];
      arr[22] = arr[2];
      arr[23] = arr[11];
      // console.log(arr);
      for (let i = 0; i < 6; ++i) {
        arr[4 * i] /= scale;
        arr[4 * i + 1] /= scale;
      }

      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    } finally {
      wdata.deactivate();
    }
  };

  render(
      world:Matrix3x3,
      renderData:any,
      needsSetup:boolean,
      needsLoad:boolean,
  ) {
    if (!this._vertexBuffer) {
      return false;
    }
    this.windowData().renderFragment(this, world, needsSetup, needsLoad);
    return true;
  };

  dispose() {
    if (this._vertexBuffer) {
      const gl = this.gl();
      if (!gl.isContextLost()) {
        console.log('Disposing of vertex buffer');
        gl.deleteBuffer(this._vertexBuffer);
      }
      this._vertexBuffer = null;
    }
    this._slot = null;
    this._textureX = NaN;
    this._textureY = NaN;
    this._textureWidth = NaN;
    this._textureHeight = NaN;
  };

  width() {
    return this._width;
  };

  height() {
    return this._height;
  };

  slot() {
    return this._slot;
  };

  freezer() {
    if (!this._slot) {
      throw new Error('This fragment has not been assigned a slot');
    }
    return this._slot.freezer();
  };
}

export function calculatePaintGroupBounds(nodeRoot:WindowNode) {
  if (!nodeRoot.localPaintGroup()) {
    throw new Error('Node must be a paint group');
  }
  let node = nodeRoot;
  const parentSize = new Size();
  const groupBounds:{[id:number]:any} = {};
  // let numNodes = 0;
  do {
    // ++numNodes;
    node = node._layoutNext;
    node.size(parentSize);
    const parentBounds = {
      left: parentSize.width() / 2,
      top: parentSize.height() / 2,
      right: parentSize.width() / 2,
      bottom: parentSize.height() / 2,
    };
    groupBounds[node._id] = parentBounds;
    const order = node.layoutOrder();
    for (let i = 0; i < order.length; ++i) {
      const dir = order[i];
      if (dir === Direction.OUTWARD || dir === Direction.INWARD) {
        continue;
      }
      if (!node.hasChildAt(dir)) {
        continue;
      }
      const child = node.nodeAt(dir);
      if (child.findPaintGroup() === nodeRoot) {
        // Node is part of the same paint group.
        const childBounds = groupBounds[child._id];
        if (!childBounds) {
          throw new Error(
              'Child paint group bounds must have' +
              ' been calculated before its parent',
          );
        }
        if (Number.isNaN(childBounds.left)) {
          throw new Error('Bounds must not be NaN');
        }
        const neighbor = node.neighborAt(dir);
        switch (dir) {
          case Direction.UPWARD:
            parentBounds.top = Math.max(
                parentBounds.top,
                childBounds.top + neighbor.separation,
            );
            parentBounds.left = Math.max(
                parentBounds.left,
                childBounds.left - neighbor.alignmentOffset,
            );
            parentBounds.right = Math.max(
                parentBounds.right,
                childBounds.right + neighbor.alignmentOffset,
            );
            parentBounds.bottom = Math.max(
                parentBounds.bottom,
                childBounds.bottom - neighbor.separation,
            );
            break;
          case Direction.DOWNWARD:
            parentBounds.top = Math.max(
                parentBounds.top,
                childBounds.top - neighbor.separation,
            );
            parentBounds.left = Math.max(
                parentBounds.left,
                childBounds.left - neighbor.alignmentOffset,
            );
            parentBounds.right = Math.max(
                parentBounds.right,
                childBounds.right + neighbor.alignmentOffset,
            );
            parentBounds.bottom = Math.max(
                parentBounds.bottom,
                childBounds.bottom + neighbor.separation,
            );
            break;
          case Direction.FORWARD:
            parentBounds.top = Math.max(
                parentBounds.top,
                childBounds.top - neighbor.alignmentOffset,
            );
            parentBounds.left = Math.max(
                parentBounds.left,
                childBounds.left - neighbor.separation,
            );
            parentBounds.right = Math.max(
                parentBounds.right,
                childBounds.right + neighbor.separation,
            );
            parentBounds.bottom = Math.max(
                parentBounds.bottom,
                childBounds.bottom + neighbor.alignmentOffset,
            );
            break;
          case Direction.BACKWARD:
            parentBounds.top = Math.max(
                parentBounds.top,
                childBounds.top - neighbor.alignmentOffset,
            );
            parentBounds.left = Math.max(
                parentBounds.left,
                childBounds.left + neighbor.separation,
            );
            parentBounds.right = Math.max(
                parentBounds.right,
                childBounds.right - neighbor.separation,
            );
            parentBounds.bottom = Math.max(
                parentBounds.bottom,
                childBounds.bottom + neighbor.alignmentOffset,
            );
            break;
          default:
            throw new Error(
                'Unexpected node direction: ' + nameDirection(dir),
            );
        }
      } else {
        // Node is part of a different paint group.
        const neighbor = node.neighborAt(dir);
        switch (dir) {
          case Direction.UPWARD:
            parentBounds.top = Math.max(
                parentBounds.top,
                parentSize.height() / 2 + neighbor.lineLength,
            );
            break;
          case Direction.DOWNWARD:
            parentBounds.bottom = Math.max(
                parentBounds.bottom,
                parentSize.height() / 2 + neighbor.lineLength,
            );
            break;
          case Direction.FORWARD:
            parentBounds.right = Math.max(
                parentBounds.right,
                parentSize.width() / 2 + neighbor.lineLength,
            );
            break;
          case Direction.BACKWARD:
            parentBounds.left = Math.max(
                parentBounds.left,
                parentSize.width() / 2 + neighbor.lineLength,
            );
            break;
          default:
            throw new Error(
                'Unexpected node direction: ' + nameDirection(dir),
            );
        }
      }
    }
  } while (node !== nodeRoot);
  // console.log(
  //   nodeRoot,
  //   "Bounds in " + numNodes + " nodes", groupBounds[node._id]);
  return groupBounds[node._id];
}
