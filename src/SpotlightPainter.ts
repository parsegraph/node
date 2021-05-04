import {compileProgram} from 'parsegraph-compileprogram';
import {
  generateRectangleVertices,
  generateRectangleTexcoords,
  Matrix3x3
} from 'parsegraph-matrix';
import PagingBuffer from 'parsegraph-pagingbuffer';
import Color from 'parsegraph-color';

import spotlightPainterVertexShader from './SpotlightPainter_VertexShader.glsl';
import spotlightPainterFragmentShader from './SpotlightPainter_FragmentShader.glsl';

import {GLProvider} from 'parsegraph-compileprogram';

export default class SpotlightPainter {
  _window: GLProvider;
  _program: any;

  _spotlightBuffer: PagingBuffer;
  aPosition: any;
  aTexCoord: any;
  aColor: any;
  uWorld:WebGLUniformLocation;

  constructor(window:GLProvider) {
    this._window = window;
    if (!this._window) {
      throw new Error('Window must be provided');
    }

    this._program = null;
    this.contextChanged(this._window.gl().isContextLost());
  }

  drawSpotlight(
      cx:number,
      cy:number,
      radius:number,
      color:Color,
  ) {
    if (this._spotlightBuffer === null) {
      return;
    }
    // console.log(cx + ", " + cy + ", " + radius + " " + color.toString());
    // Append position data.
    this._spotlightBuffer.appendData(
        this.aPosition,
        generateRectangleVertices(cx, cy, radius * 2, radius * 2),
    );

    // Append texture coordinate data.
    this._spotlightBuffer.appendData(
        this.aTexCoord,
        generateRectangleTexcoords(),
    );

    // Append color data.
    for (let k = 0; k < 3 * 2; ++k) {
      this._spotlightBuffer.appendData(
          this.aColor,
          color.r(),
          color.g(),
          color.b(),
          color.a(),
      );
    }
  };

  drawRectSpotlight(
      cx:number,
      cy:number,
      w:number,
      h:number,
      color:Color,
  ) {
    if (this._spotlightBuffer === null) {
      return;
    }
    // Append position data.
    this._spotlightBuffer.appendData(
        this.aPosition,
        generateRectangleVertices(cx, cy, w, h),
    );

    // Append texture coordinate data.
    this._spotlightBuffer.appendData(
        this.aTexCoord,
        generateRectangleTexcoords(),
    );

    // Append color data.
    for (let k = 0; k < 3 * 2; ++k) {
      this._spotlightBuffer.appendData(
          this.aColor,
          color.r(),
          color.g(),
          color.b(),
          color.a(),
      );
    }
  };

  clear() {
    this._spotlightBuffer.clear();
    this._spotlightBuffer.addPage();
  };

  contextChanged(isLost:boolean):void {
    if (isLost) {
      // console.log(new Error("Losing spotlight painter"));
      this._program = null;
      this._spotlightBuffer.clear();
      this._spotlightBuffer = null;
    } else {
      // console.log(new Error("Restoring spotlight painter"));
      const gl = this._window.gl();
      this._program = compileProgram(
          this._window,
          'SpotlightPainter',
          spotlightPainterVertexShader,
          spotlightPainterFragmentShader,
      );
      // Prepare attribute buffers.
      this._spotlightBuffer = new PagingBuffer(gl, this._program);
      this._spotlightBuffer.addPage();

      this.aPosition = this._spotlightBuffer.defineAttrib('a_position', 2);
      this.aTexCoord = this._spotlightBuffer.defineAttrib('a_texCoord', 2);
      this.aColor = this._spotlightBuffer.defineAttrib('a_color', 4);
    }
  };

  render(world:Matrix3x3):void {
    const gl = this._window.gl();
    if (gl.isContextLost()) {
      return;
    }
    // Cache program locations.
    this.uWorld = gl.getUniformLocation(this._program, 'u_world');

    // Render spotlights.
    gl.useProgram(this._program);
    gl.uniformMatrix3fv(this.uWorld, false, world);
    this._spotlightBuffer.renderPages();
  }

}
