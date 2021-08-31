import TestSuite from 'parsegraph-testsuite';
import {compileProgram} from 'parsegraph-compileprogram';
import {
  generateRectangleVertices,
  generateRectangleTexcoords,
  Matrix3x3,
} from 'parsegraph-matrix';
import PagingBuffer from 'parsegraph-pagingbuffer';
import Color from 'parsegraph-color';
import {toRadians} from 'parsegraph-toradians';
import GraphicsWindow, { BasicWindow } from 'parsegraph-window';

// TODO Separate coloring and slicing from drawing the circle... Basically, make this actually just draw the fans we want.
import fanPainterVertexShader from './FanPainter_VertexShader.glsl';
import fanPainterFragmentShader from './FanPainter_FragmentShader.glsl';

/*
 * Shows a circle that allows some parts to show as selected.
 */
export default class FanPainter {
  _window:BasicWindow;
  _ascendingRadius:number;
  _descendingRadius:number;
  _selectionAngle:number;
  _selectionSize:number;
  fanProgram:WebGLProgram;
  _fanBuffer:PagingBuffer;
  aPosition:number;
  aColor:number;
  aTexCoord:number;
  aSelectionAngle:number;
  aSelectionSize:number;
  uWorld:WebGLUniformLocation;

  constructor(window:BasicWindow) {
    this._window = window;
    if (!this._window) {
      throw new Error('Window or other GLProvider must be given');
    }

    this._ascendingRadius = 250;
    this._descendingRadius = 250;
    this._selectionAngle = null;
    this._selectionSize = null;

    // Compile the shader program.
    this.fanProgram = compileProgram(
        this._window,
        'FanPainter',
        fanPainterVertexShader,
        fanPainterFragmentShader,
    );

    // Prepare attribute buffers.
    this._fanBuffer = new PagingBuffer(window.gl(), this.fanProgram);
    this.aPosition = this._fanBuffer.defineAttrib('a_position', 2);
    this.aColor = this._fanBuffer.defineAttrib('a_color', 4);
    this.aTexCoord = this._fanBuffer.defineAttrib('a_texCoord', 2);
    this.aSelectionAngle = this._fanBuffer.defineAttrib('a_selectionAngle', 1);
    this.aSelectionSize = this._fanBuffer.defineAttrib('a_selectionSize', 1);

    // Cache program locations.
    this.uWorld = this.window()
        .gl()
        .getUniformLocation(this.fanProgram, 'u_world');

    this._fanBuffer.addPage();
  }

  contextChanged(isLost:boolean) {
    console.log("FanPainter context lost is " + isLost);
  }

  selectDeg(
      userX:number,
      userY:number,
      startAngle:number,
      spanAngle:number,
      startColor:Color,
  ) {
    return this.selectRad(
        userX,
        userY,
        toRadians(startAngle),
        toRadians(spanAngle),
        startColor,
    );
  };

  /*
  * Highlights arcs under the given selection.
  */
  selectRad(
      userX:number,
      userY:number,
      startAngle:number,
      spanAngle:number,
      startColor:Color
  ) {
    // FanPainter.prototype.drawFan = function() //    cx, cy, radius, color)

    //  console.log(
    //    userx +
    //    ", " + userY + ". startAngle=" +
    //    startAngle + ", spanAngle=" + spanAngle);

    const radius = this._ascendingRadius + this._descendingRadius;
    // Append position data.
    this._fanBuffer.appendData(
        this.aPosition,
        generateRectangleVertices(userX, userY, radius * 2, radius * 2),
    );

    // Append texture coordinate data.
    this._fanBuffer.appendData(
        this.aTexCoord,
        generateRectangleTexcoords(),
    );

    // Append color data.
    const color = startColor;
    for (let k = 0; k < 3 * 2; ++k) {
      this._fanBuffer.appendRGBA(this.aColor, color);
      this._fanBuffer.appendData(
          this.aSelectionAngle,
        this._selectionAngle !== null ? this._selectionAngle : 0,
      );
      this._fanBuffer.appendData(
          this.aSelectionSize,
        this._selectionSize !== null ? this._selectionSize : 0,
      );
    }
  };

  setAscendingRadius(
      ascendingRadius:number,
  ) {
    this._ascendingRadius = ascendingRadius;
  };

  setDescendingRadius(
      descendingRadius:number,
  ) {
    this._descendingRadius = descendingRadius;
  };

  setSelectionAngle(selectionAngle:number) {
    // console.log("Selection angle: " + selectionAngle);
    this._selectionAngle = selectionAngle;
  };

  setSelectionSize(selectionSize:number) {
    // console.log("Selection size: " + selectionSize);
    this._selectionSize = Math.min(Math.PI / 2.0, selectionSize);
  };

  window() {
    return this._window;
  };

  clear() {
    this._fanBuffer.clear();
    this._fanBuffer.addPage();
  };

  render(viewMatrix:Matrix3x3) {
    if (!viewMatrix) {
      throw new Error('A viewMatrix must be provided');
    }
    // Render faces.
    const gl = this._window.gl();
    gl.useProgram(this.fanProgram);
    gl.uniformMatrix3fv(this.uWorld, false, viewMatrix);
    this._fanBuffer.renderPages();
  };
}

const fanPainterTests = new TestSuite(
    'FanPainter',
);

fanPainterTests.addTest('FanPainter', function() {
  const window = new GraphicsWindow();
  const painter = new FanPainter(window);
  painter.selectDeg(
      0,
      0,
      0,
      90,
      new Color(0, 0, 0, 1),
  );
});
