import TestSuite from 'parsegraph-testsuite';
import Color from 'parsegraph-color';
import Window from 'parsegraph-window';
import {defaultFont} from './settings';

// TODO Add runs of selected text
let glyphPainterCount = 0;

import glyphPainterVertexShader from './GlyphPainter_VertexShader.glsl';
import glyphPainterFragmentShader from './GlyphPainter_FragmentShader.glsl';
import Font, { GlyphData } from './Font';
import { Matrix3x3 } from 'parsegraph-matrix';
import { compileProgram } from 'parsegraph-compileprogram';

export default class GlyphPainter {
  _window:Window;
  _font:Font;
  _id:number;
  _maxSize:number;
  _textProgram:WebGLProgram;
  _numTextBuffers:number;
  _textBuffers:{[id:string]:GlyphPageRenderer};
  _stride:number;
  _vertexBuffer:Float32Array;
  _color:Color;
  _backgroundColor:Color;
  _lines:any[];

  uWorld:WebGLUniformLocation;
  uScale:WebGLUniformLocation;
  uGlyphTexture:WebGLUniformLocation;

  aPosition:number;
  aColor:number;
  aBackgroundColor:number;
  aScale:number;
  aTexCoord:number;
  constructor(window:Window, font:Font) {
    if (!window) {
      throw new Error("Window or other GLProvider must be given");
    }
    if (!font) {
      throw new Error('Font must be provided');
    }
    this._font = font;
    this._id = ++glyphPainterCount;

    this._window = window;
    this._textBuffers = {};
    this._numTextBuffers = 0;
    this._maxSize = 0;

    this._textProgram = null;

    // Position: 2 * 4 (two floats) : 0-7
    // Color: 4 * 4 (four floats) : 8-23
    // Background Color: 4 * 4 (four floats) : 24 - 39
    // Texcoord: 2 * 4 (two floats): 40-47
    // Scale: 4 (one float): 48-51
    this._stride = 52;
    this._vertexBuffer = new Float32Array(this._stride / 4);

    this._color = new Color(1, 1, 1, 1);
    this._backgroundColor = new Color(0, 0, 0, 0);

    this._lines = [];
  }

  window() {
    return this._window;
  };

  contextChanged() {
    this._textProgram = null;
    this.clear();
  };

  color() {
    return this._color;
  };

  setColor(r:Color|number, ...args:number[]) {
    if (args.length > 0) {
      this._color = new Color(r as number, ...args);
    } else {
      this._color = r as Color;
    }
  };

  backgroundColor() {
    return this._backgroundColor;
  };

  setBackgroundColor(r:Color|number, ...args:number[]) {
    if (args.length > 0) {
      this._backgroundColor = new Color(r as number, ...args);
    } else {
      this._backgroundColor = r as Color;
    }
  };

  fontSize() {
    return this._font.fontSize();
  };

  font() {
    return this._font;
  };

  drawLine(
      text:string,
      worldX:number,
      worldY:number,
      fontScale:number,
  ) {
    // console.log("Drawing line: " + text + " at scale " + fontScale);
    this._lines.push({
      text: text,
      x: worldX,
      y: worldY,
      scale: fontScale,
    });
  };

  drawGlyph(
      glyphData:GlyphData|string|number,
      x:number,
      y:number,
      fontScale:number,
  ) {
    if (typeof glyphData !== 'object') {
      glyphData = this._font.getGlyph(glyphData);
    }
    glyphData.painted = true;

    const gl = this.window().gl();
    const glTextureSize = this.window().getTextureSize();
    if (gl.isContextLost()) {
      return;
    }
    // console.log("GLTEXTURESIZE=" + this._glTextureSize);
    const pagesPerRow = glTextureSize / this.font().pageTextureSize();
    const pagesPerTexture = Math.pow(pagesPerRow, 2);

    // Select the correct buffer.
    const gpid = Math.floor(glyphData.glyphPage._id / pagesPerTexture);
    const gp = this._textBuffers[gpid];
    if (!gp) {
      throw new Error(
          'GlyphPageRenderer ' + gpid + ' must be available when drawing glyph.',
      );
    }

    if (this._maxSize < glyphData.width * fontScale) {
      this._maxSize = glyphData.width * fontScale;
    }
    gp.drawGlyph(glyphData, x, y, fontScale);
  };

  initBuffer(numGlyphs:any) {
    this.clear();
    let maxPage:number = NaN;
    for (const i in numGlyphs) {
      if (!Object.prototype.hasOwnProperty.call(numGlyphs, i)) {
        continue;
      }
      if (i == 'font') {
        continue;
      }
      if (Number.isNaN(maxPage)) {
        maxPage = parseInt(i);
      }
      maxPage = Math.max(parseInt(i), maxPage);
      let gp = this._textBuffers[i];
      if (!gp) {
        gp = new GlyphPageRenderer(this, parseInt(i));
        ++this._numTextBuffers;
        this._textBuffers[i] = gp;
      }
      gp.initBuffer(numGlyphs[i]);
    }
    if (Number.isNaN(maxPage)) {
      maxPage = -1;
    }
  };

  clear() {
    for (const i in this._textBuffers) {
      if (Object.prototype.hasOwnProperty.call(this._textBuffers, i)) {
        const gp = this._textBuffers[i];
        gp.clear();
      }
    }
    this._textBuffers = {};
    this._numTextBuffers = 0;
    this._maxSize = 0;
    this._lines = [];
  };

  render(world:Matrix3x3, scale:number) {
    const overlay = this.window().overlay();
    overlay.font = '72px sans-serif';
    overlay.save();
    for (let i = 0; i < this._lines.length; ++i) {
      const line = this._lines[i];
      overlay.save();
      overlay.scale(line.scale, line.scale);
      overlay.fillText(line.text, line.x/line.scale, line.y/line.scale);
      // console.log("GlyphPainter.render:", line.text, line.x, line.y, scale, line.scale);
      overlay.restore();
    }
    overlay.restore();
    return;
    this._font.update(this._window);
    // console.log(new Error("GlyphPainter scale="+scale));
    // console.log("Max scale of a single largest glyph would be: " +
    //   (this._maxSize *scale));
    if (scale < 0.2 && this._maxSize * scale < 1) {
      return;
    }

    if (this._maxSize / (world[0] / world[8]) < 1) {
      return;
    }

    const gl = this.window().gl();
    if (gl.isContextLost()) {
      return;
    }

    // Compile the shader program.
    if (this._textProgram === null) {
      this._textProgram = compileProgram(
          this.window(),
          'GlyphPainter',
          glyphPainterVertexShader,
          glyphPainterFragmentShader,
      );
      /* if(gl.getExtension("OES_standard_derivatives") != null) {
              this._textProgram = compileProgram(this.window(),
                  "GlyphPainter",
                  glyphPainterVertexShader,
                  glyphPainterFragmentShader
              );
          }
          else {
              throw new Error("TextPainter requires' +
                ' OES_standard_derivatives GL extension");
          }*/

      // Cache program locations.
      this.uWorld = gl.getUniformLocation(this._textProgram, 'u_world');
      this.uScale = gl.getUniformLocation(this._textProgram, 'u_scale');
      this.uGlyphTexture = gl.getUniformLocation(
          this._textProgram,
          'u_glyphTexture',
      );
      this.aPosition = gl.getAttribLocation(this._textProgram, 'a_position');
      this.aColor = gl.getAttribLocation(this._textProgram, 'a_color');
      this.aBackgroundColor = gl.getAttribLocation(
          this._textProgram,
          'a_backgroundColor',
      );
      this.aTexCoord = gl.getAttribLocation(this._textProgram, 'a_texCoord');
      this.aScale = gl.getAttribLocation(this._textProgram, 'a_scale');
      // console.log(this.a_scale);
    }

    // Load program.
    gl.useProgram(this._textProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniformMatrix3fv(this.uWorld, false, world);
    gl.uniform1f(this.uScale, scale);

    // Render glyphs for each page.
    gl.enableVertexAttribArray(this.aPosition);
    gl.enableVertexAttribArray(this.aTexCoord);
    gl.enableVertexAttribArray(this.aColor);
    gl.enableVertexAttribArray(this.aBackgroundColor);
    gl.enableVertexAttribArray(this.aScale);
    for (const i in this._textBuffers) {
      if (Object.prototype.hasOwnProperty.call(this._textBuffers, i)) {
        const gp = this._textBuffers[i];
        gp.render();
      }
    }
    gl.disableVertexAttribArray(this.aPosition);
    gl.disableVertexAttribArray(this.aTexCoord);
    gl.disableVertexAttribArray(this.aColor);
    gl.disableVertexAttribArray(this.aBackgroundColor);
    gl.disableVertexAttribArray(this.aScale);
  };
}

export class GlyphPageRenderer {
  _painter:GlyphPainter;
  _glyphBufferVertexIndex:number;
  _dataBufferVertexIndex:number;
  _dataBufferNumVertices:number;
  _glyphBufferNumVertices:number;
  _textureIndex:number;
  _glyphBuffer:WebGLBuffer;
  _dataBuffer:Float32Array;
  constructor(painter:GlyphPainter, textureIndex:number) {
    this._painter = painter;
    this._textureIndex = textureIndex;
    this._glyphBuffer = null;
    this._glyphBufferNumVertices = null;
    this._glyphBufferVertexIndex = 0;
    this._dataBufferVertexIndex = 0;
    this._dataBufferNumVertices = 6;
    this._dataBuffer = new Float32Array(
        (this._dataBufferNumVertices * this._painter._stride) / 4,
    );
  }

  initBuffer(numGlyphs:number) {
    if (this._glyphBufferNumVertices / 6 === numGlyphs) {
      // console.log("Reusing existing buffer");
      this._glyphBufferVertexIndex = 0;
      this._dataBufferVertexIndex = 0;
      return;
    } else {
      // console.log("Recreating buffer with " + numGlyphs +
      //   " from " + this._glyphBufferNumVertices);
    }
    if (this._glyphBuffer) {
      this.clear();
    }
    const gl = this._painter.window().gl();
    this._glyphBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glyphBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        this._painter._stride * 6 * numGlyphs,
        gl.STATIC_DRAW,
    );
    this._glyphBufferNumVertices = numGlyphs * 6;
  };

  clear() {
    const gl = this._painter.window().gl();
    if (this._glyphBuffer && !gl.isContextLost()) {
      gl.deleteBuffer(this._glyphBuffer);
    }
    this._glyphBuffer = null;
    this._glyphBufferNumVertices = null;
    this._dataBufferVertexIndex = 0;
    this._glyphBufferVertexIndex = 0;
  };

  flush() {
    if (this._dataBufferVertexIndex === 0) {
      return;
    }
    const gl = this._painter.window().gl();
    const stride = this._painter._stride;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._glyphBuffer);

    if (
      this._dataBufferVertexIndex + this._glyphBufferVertexIndex >
      this._glyphBufferNumVertices
    ) {
      throw new Error(
          'GL buffer of ' +
          this._glyphBufferNumVertices +
          ' vertices is full; cannot flush all ' +
          this._dataBufferVertexIndex +
          ' vertices because the GL buffer already has ' +
          this._glyphBufferVertexIndex +
          ' vertices.',
      );
    }
    if (this._dataBufferVertexIndex >= this._dataBufferNumVertices) {
      // console.log("Writing " + this._dataBufferNumVertices +
      // " vertices to offset " + this._glyphBufferVertexIndex +
      // " of " + this._glyphBufferNumVertices + " vertices");
      gl.bufferSubData(
          gl.ARRAY_BUFFER,
          this._glyphBufferVertexIndex * stride,
          this._dataBuffer,
      );
    } else {
      // console.log("Partial flush (" + this._glyphBufferVertexIndex + "/" +
      // this._glyphBufferNumVertices + " from " +
      // (this._dataBufferVertexIndex*stride/4) + ")");
      gl.bufferSubData(
          gl.ARRAY_BUFFER,
          this._glyphBufferVertexIndex * stride,
          this._dataBuffer.slice(0, (this._dataBufferVertexIndex * stride) / 4),
      );
    }
    this._glyphBufferVertexIndex += this._dataBufferVertexIndex;
    this._dataBufferVertexIndex = 0;
  };

  writeVertex() {
    const pos = (this._dataBufferVertexIndex++ * this._painter._stride) / 4;
    this._dataBuffer.set(this._painter._vertexBuffer, pos);
    if (this._dataBufferVertexIndex >= this._dataBufferNumVertices) {
      this.flush();
    }
  };

  drawGlyph(
      glyphData:GlyphData,
      x:number,
      y:number,
      fontScale:number,
  ) {
    const gl = this._painter.window().gl();
    const font = this._painter.font();
    const glTextureSize = this._painter.window().getTextureSize();
    if (gl.isContextLost()) {
      return;
    }
    const pageTextureSize = font.pageTextureSize();
    const pagesPerRow = glTextureSize / pageTextureSize;
    const pagesPerTexture = Math.pow(pagesPerRow, 2);
    const pageIndex = glyphData.glyphPage._id % pagesPerTexture;
    const pageX = pageTextureSize * (pageIndex % pagesPerRow);
    const pageY = pageTextureSize * Math.floor(pageIndex / pagesPerRow);

    // Position: 2 * 4 (two floats) : 0-7
    // Color: 4 * 4 (four floats) : 8-23
    // Background Color: 4 * 4 (four floats) : 24 - 39
    // Texcoord: 2 * 4 (two floats): 40-47
    // Scale: 4 (one float): 48-51
    const buf = this._painter._vertexBuffer;

    // Append color data.
    const color = this._painter._color;
    buf[2] = color.r();
    buf[3] = color.g();
    buf[4] = color.b();
    buf[5] = color.a();

    // Append background color data.
    const bg = this._painter._backgroundColor;
    buf[6] = bg.r();
    buf[7] = bg.g();
    buf[8] = bg.b();
    buf[9] = bg.a();

    // Add font scale
    buf[12] = fontScale;

    y -= glyphData.ascent;

    // Position data.
    buf[0] = x;
    buf[1] = y;
    // Texcoord data
    buf[10] = (pageX + glyphData.x) / glTextureSize;
    buf[11] = (pageY + glyphData.y) / glTextureSize;
    this.writeVertex();

    // Position data.
    buf[0] = x + glyphData.width * fontScale;
    buf[1] = y;
    // Texcoord data
    buf[10] = (pageX + glyphData.x + glyphData.width) / glTextureSize;
    buf[11] = (pageY + glyphData.y) / glTextureSize;
    this.writeVertex();

    // Position data.
    buf[0] = x + glyphData.width * fontScale;
    buf[1] = y + glyphData.height * fontScale;
    // Texcoord data
    buf[10] = (pageX + glyphData.x + glyphData.width) / glTextureSize;
    buf[11] = (pageY + glyphData.y + glyphData.height) / glTextureSize;
    this.writeVertex();

    // Position data.
    buf[0] = x;
    buf[1] = y;
    // Texcoord data
    buf[10] = (pageX + glyphData.x) / glTextureSize;
    buf[11] = (pageY + glyphData.y) / glTextureSize;
    this.writeVertex();

    // Position data.
    buf[0] = x + glyphData.width * fontScale;
    buf[1] = y + glyphData.height * fontScale;
    // Texcoord data
    buf[10] = (pageX + glyphData.x + glyphData.width) / glTextureSize;
    buf[11] = (pageY + glyphData.y + glyphData.height) / glTextureSize;
    this.writeVertex();

    // Position data.
    buf[0] = x;
    buf[1] = y + glyphData.height * fontScale;
    // Texcoord data
    buf[10] = (pageX + glyphData.x) / glTextureSize;
    buf[11] = (pageY + glyphData.y + glyphData.height) / glTextureSize;
    this.writeVertex();
  };

  render() {
    if (!this._glyphBuffer) {
      throw new Error('GlyphPageRenderer must be initialized before rendering');
    }
    this.flush();
    if (this._glyphBufferVertexIndex === 0) {
      return;
    }
    const gl = this._painter.window().gl();
    const glyphTexture = this._painter._font._pages[this._textureIndex]
        ._glyphTexture[this._painter.window().id()];
    // console.log("Rendering " + (this._glyphBufferVertexIndex/6) +
    //   " glyphs of glyph page " + this._textureIndex);
    gl.bindTexture(gl.TEXTURE_2D, glyphTexture);
    gl.uniform1i(this._painter.uGlyphTexture, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this._glyphBuffer);
    // Position: 2 * 4 (two floats) : 0-7
    // Color: 4 * 4 (four floats) : 8-23
    // Background Color: 4 * 4 (four floats) : 24 - 39
    // Texcoord: 2 * 4 (two floats): 40-47
    // Scale: 4 (one float): 48-51
    const painter = this._painter;
    const stride = this._painter._stride;
    gl.vertexAttribPointer(painter.aPosition, 2, gl.FLOAT, false, stride, 0);
    gl.vertexAttribPointer(painter.aColor, 4, gl.FLOAT, false, stride, 8);
    gl.vertexAttribPointer(
        painter.aBackgroundColor,
        4,
        gl.FLOAT,
        false,
        stride,
        24,
    );
    gl.vertexAttribPointer(painter.aTexCoord, 2, gl.FLOAT, false, stride, 40);
    gl.vertexAttribPointer(painter.aScale, 1, gl.FLOAT, false, stride, 48);
    gl.drawArrays(gl.TRIANGLES, 0, this._glyphBufferVertexIndex);
  };
}

const glyphPainterTests = new TestSuite(
    'GlyphPainter',
);

glyphPainterTests.addTest('GlyphPainter', function() {
  const window = new Window();
  const font = defaultFont();

  const painter = new GlyphPainter(window, font);
  painter.initBuffer({0: 1000, 1: 1000});
  for (let i = 0; i < 1000; ++i) {
    painter.drawGlyph(String.fromCharCode(32 + i), 0, 0, 1);
  }
  painter.initBuffer({0: 1000});
  for (let i = 0; i < 400; ++i) {
    painter.drawGlyph(String.fromCharCode(32 + i), 0, 0, 1);
  }
  painter.initBuffer({0: 1000, 1: 1000});
  for (let i = 0; i < 1000; ++i) {
    painter.drawGlyph(String.fromCharCode(32 + i), 0, 0, 1);
  }
  painter.initBuffer({});
  painter.initBuffer({0: 1000, 1: 1000});
  for (let i = 0; i < 1000; ++i) {
    painter.drawGlyph(String.fromCharCode(32 + i), 0, 0, 1);
  }
});
