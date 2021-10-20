import { compileProgram } from "parsegraph-compileprogram";
import PagingBuffer from "parsegraph-pagingbuffer";
import Color from "parsegraph-color";
import { BasicWindow } from "parsegraph-window";
import { Matrix3x3 } from "parsegraph-matrix";

import texturePainterVertexShader from "./TexturePainter_VertexShader.glsl";
import texturePainterFragmentShader from "./TexturePainter_FragmentShader.glsl";

export default class TexturePainter {
  _gl;
  _textureProgram: WebGLProgram;
  _texture: WebGLTexture;
  _texWidth: number;
  _texHeight: number;
  _buffer: PagingBuffer;
  aPosition: number;
  aColor: number;
  aBackgroundColor: number;
  aTexCoord: number;
  aAlpha: number;
  uWorld: WebGLUniformLocation;
  uTexture: WebGLUniformLocation;
  _color: Color;
  _backgroundColor: Color;
  _alpha: number;

  constructor(
    window: BasicWindow,
    textureId: WebGLTexture,
    texWidth: number,
    texHeight: number
  ) {
    this._gl = window.gl();

    // Compile the shader program.
    this._textureProgram = compileProgram(
      window,
      "TexturePainter",
      texturePainterVertexShader,
      texturePainterFragmentShader
    );
    this._texture = textureId;
    this._texWidth = texWidth;
    this._texHeight = texHeight;

    // Prepare attribute buffers.
    this._buffer = new PagingBuffer(this._gl, this._textureProgram);
    this.aPosition = this._buffer.defineAttrib("a_position", 2);
    this.aColor = this._buffer.defineAttrib("a_color", 4);
    this.aBackgroundColor = this._buffer.defineAttrib("a_backgroundColor", 4);
    this.aTexCoord = this._buffer.defineAttrib("a_texCoord", 2);
    this.aAlpha = this._buffer.defineAttrib("a_alpha", 1);

    // Cache program locations.
    this.uWorld = this._gl.getUniformLocation(this._textureProgram, "u_world");
    this.uTexture = this._gl.getUniformLocation(
      this._textureProgram,
      "u_texture"
    );

    this._color = new Color(1, 1, 1, 1);
    this._backgroundColor = new Color(0, 0, 0, 0);

    this._buffer.addPage();
    this._alpha = 1;
  }

  texture() {
    return this._texture;
  }

  setAlpha(alpha: number): void {
    this._alpha = alpha;
  }

  drawWholeTexture(
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number
  ): void {
    return this.drawTexture(
      0,
      0,
      this._texWidth,
      this._texHeight,
      x,
      y,
      width,
      height,
      scale
    );
  }

  drawTexture(
    iconX: number,
    iconY: number,
    iconWidth: number,
    iconHeight: number,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number
  ) {
    // Append position data.
    this._buffer.appendData(this.aPosition, [
      x,
      y,
      x + width * scale,
      y,
      x + width * scale,
      y + height * scale,

      x,
      y,
      x + width * scale,
      y + height * scale,
      x,
      y + height * scale,
    ]);

    // Append texture coordinate data.
    this._buffer.appendData(this.aTexCoord, [
      iconX / this._texWidth,
      (iconY + iconHeight) / this._texHeight,

      (iconX + iconWidth) / this._texWidth,
      (iconY + iconHeight) / this._texHeight,

      (iconX + iconWidth) / this._texWidth,
      iconY / this._texHeight,

      iconX / this._texWidth,
      (iconY + iconHeight) / this._texHeight,

      (iconX + iconWidth) / this._texWidth,
      iconY / this._texHeight,

      iconX / this._texWidth,
      iconY / this._texHeight,
    ]);
    for (let i = 0; i < 6; ++i) {
      this._buffer.appendData(this.aAlpha, this._alpha);
    }
  }

  clear(): void {
    this._buffer.clear();
    this._buffer.addPage();
  }

  render(world: Matrix3x3): void {
    const gl = this._gl;

    // Load program.
    this._gl.useProgram(this._textureProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.uniform1i(this.uTexture, 0);

    // Render texture.
    gl.uniformMatrix3fv(this.uWorld, false, world);
    this._buffer.renderPages();
  }
}
