import TinySDF, { SDF_RADIUS } from "parsegraph-sdf";
import { BasicWindow } from "parsegraph-window";

// The width in pixels of a font's glyph page.
export const MAX_PAGE_WIDTH = 512;

export class GlyphPage {
  _id: number;
  _glyphTexture: { [id: string]: WebGLTexture };
  _firstGlyph: GlyphData;
  _lastGlyph: GlyphData;
  next: GlyphPage;

  constructor(font: Font) {
    this._id = font._maxPage++;
    this._glyphTexture = {};
    this._firstGlyph = null;
    this._lastGlyph = null;
    this.next = null;
  }
}

export class GlyphData {
  glyphPage: GlyphPage;
  x: number;
  y: number;
  width: number;
  height: number;
  ascent: number;
  descent: number;
  advance: number;
  radius: number;
  letter: string;
  length: number;
  painted: boolean;
  next: GlyphData;

  constructor(
    glyphPage: GlyphPage,
    glyph: string,
    x: number,
    y: number,
    width: number,
    height: number,
    ascent: number,
    descent: number,
    advance: number,
    radius: number
  ) {
    this.glyphPage = glyphPage;
    this.letter = glyph;
    this.length = this.letter.length;
    this.painted = false;
    this.x = x;
    this.y = y;
    this.width = width + radius * 2;
    this.ascent = ascent;
    this.descent = descent;
    this.height = this.ascent + this.descent + radius * 2;
    this.advance = advance;
    this.next = null;
  }
}

export class FontWindow {
  _glTextureSize: number;
  _numGlyphs: number;
  _textureArray: Uint8Array;
  _window: BasicWindow;
  _font: Font;

  constructor(font: Font, window: BasicWindow) {
    this._font = font;
    this._window = window;
    this._glTextureSize = null;
    this._numGlyphs = 0;
    this._textureArray = null;
  }

  gl() {
    return this._window.gl();
  }
}

/*
 * TODO Allow glyph texture data to be downloaded rather than generated.
 *
 * http://webglfundamentals.org/webgl/lessons/webgl-text-glyphs.html
 */
let fontCount = 0;
export default class Font {
  _id: number;
  _fontSize: number;
  _fontName: string;
  _fillStyle: string;
  _measureCanvas: HTMLCanvasElement;
  _measureCtx: CanvasRenderingContext2D;
  _windows: { [id: string]: FontWindow };
  _renderCanvas: HTMLCanvasElement;
  _renderCtx: CanvasRenderingContext2D;
  _glyphData: { [id: string]: GlyphData };
  _pages: GlyphPage[];
  _numGlyphs: number;
  _currentRowHeight: number;
  _padding: number;
  _x: number;
  _y: number;
  _maxPage: number;
  _sdf: TinySDF;
  constructor(fontSizePixels: number, fontName: string, fillStyle?: string) {
    this._id = fontCount++;
    this._fontSize = fontSizePixels;
    this._fontName = fontName;
    this._fillStyle = fillStyle;
    // console.log("Creating font " + this);

    this._measureCanvas = document.createElement("canvas");
    this._measureCtx = this._measureCanvas.getContext("2d");
    this._measureCtx.font = this.font();
    this._measureCtx.fillStyle = this._fillStyle;
    // this._measureCtx.textBaseline = 'top';
    console.log("Font font", this._measureCtx.font, this._measureCtx.fillStyle);

    this._windows = {};
    this._renderCanvas = null;
    this._renderCtx = null;

    this._pages = [];
    this._numGlyphs = 0;

    this._glyphData = {};
    this._currentRowHeight = 0;

    // Glyph atlas working position.
    this._padding = SDF_RADIUS * 2; // this.fontSize() / 4;
    this._x = this._padding;
    this._y = this._padding;

    this._maxPage = 0;

    this._sdf = new TinySDF(fontSizePixels, null, null, fontName);
  }

  toString() {
    return (
      "[Font " + this._id + ": " + this._fontName + " " + this._fillStyle + "]"
    );
  }

  getGlyph(glyphOrCode: string | number) {
    let glyph: string;
    if (typeof glyphOrCode !== "string") {
      glyph = String.fromCharCode(glyphOrCode as number);
    } else {
      glyph = glyphOrCode as string;
    }
    let glyphData = this._glyphData[glyph];
    if (glyphData !== undefined) {
      return glyphData;
    }
    const letter = this._measureCtx.measureText(glyph);
    const letterWidth = letter.width;
    const letterAscent = letter.actualBoundingBoxAscent || 0;
    const letterDescent = letter.actualBoundingBoxDescent || 0;
    const letterHeight = letterAscent + letterDescent;
    const advance = letterWidth;

    let glyphPage = null;
    if (this._pages.length === 0) {
      glyphPage = new GlyphPage(this);
      this._pages.push(glyphPage);
    } else {
      glyphPage = this._pages[this._pages.length - 1];
    }

    if (this._currentRowHeight < letterHeight) {
      this._currentRowHeight = letterHeight;
    }

    const pageTextureSize = this.pageTextureSize();
    if (this._x + letterWidth + this._padding > pageTextureSize) {
      // Move to the next row.
      this._x = this._padding;
      this._y += this._currentRowHeight + this._padding;
      this._currentRowHeight = letterHeight;
    }
    if (this._y + this._currentRowHeight + this._padding > pageTextureSize) {
      // Move to the next page.
      glyphPage = new GlyphPage(this);
      this._pages.push(glyphPage);
      this._x = this._padding;
      this._y = this._padding;
      this._currentRowHeight = letterHeight;
    }

    glyphData = new GlyphData(
      glyphPage,
      glyph,
      this._x,
      this._y,
      letterWidth,
      letterHeight,
      letterAscent,
      letterDescent,
      advance,
      this._sdf.radius
    );
    this._glyphData[glyph] = glyphData;

    if (glyphPage._lastGlyph) {
      glyphPage._lastGlyph.next = glyphData;
      glyphPage._lastGlyph = glyphData;
    } else {
      glyphPage._firstGlyph = glyphData;
      glyphPage._lastGlyph = glyphData;
    }

    this._x += glyphData.width + this._padding;
    ++this._numGlyphs;

    return glyphData;
  }

  get(glyphOrCode: string | number): GlyphData {
    return this.getGlyph(glyphOrCode);
  }

  hasGlyph(glyph: string | number): boolean {
    const glyphData = this._glyphData[glyph];
    return glyphData !== undefined;
  }
  has(glyph: string | number): boolean {
    return this.hasGlyph(glyph);
  }

  contextChanged(isLost: boolean, window: BasicWindow) {
    if (!isLost) {
      return;
    }
    this.dispose(window);
  }

  update(window: BasicWindow) {
    if (!window) {
      throw new Error("Window must be provided");
    }
    let gl = window.gl();
    if (gl.isContextLost()) {
      return;
    }
    const pageTextureSize = this.pageTextureSize();
    let ctx = this._windows[window.id()];
    if (!ctx) {
      ctx = new FontWindow(this, window);
      this._windows[window.id()] = ctx;
    }
    gl = ctx.gl();
    if (gl.isContextLost()) {
      return;
    }
    if (!ctx._glTextureSize) {
      ctx._glTextureSize = window.textureSize();
      // console.log("GLTEXTURESIZE=" + ctx._glTextureSize);
      ctx._textureArray = new Uint8Array(
        ctx._glTextureSize * ctx._glTextureSize
      );
    }
    if (!this._renderCanvas) {
      this._renderCanvas = document.createElement("canvas");
      this._renderCanvas.width = pageTextureSize;
      this._renderCanvas.height = pageTextureSize;
      this._renderCtx = this._renderCanvas.getContext("2d");
      this._renderCtx.font = this.font();
      this._renderCtx.fillStyle = this._fillStyle;
    }
    if (ctx._numGlyphs === this._numGlyphs) {
      // console.log("Dont need update");
      return;
    }
    // console.log(this.fullName() +
    //   " has " +
    //   this._numGlyphs +
    //   " and window has " +
    //   ctx._numGlyphs);
    ctx._numGlyphs = 0;

    let pageX = 0;
    let pageY = 0;
    let curTexture = null;
    // let pagesUpdated = 0;
    for (let i = 0; i < this._pages.length; ++i) {
      const page = this._pages[i];
      // console.log("Painting page " + page._id);
      this._renderCtx.clearRect(0, 0, pageTextureSize, pageTextureSize);
      for (
        let glyphData = page._firstGlyph;
        glyphData;
        glyphData = glyphData.next
      ) {
        const distanceGlyph = this._sdf.draw(glyphData.letter);
        const imageData = this._sdf.createImageData(this._renderCtx);
        imageData.data.set(distanceGlyph);
        this._renderCtx.putImageData(imageData, glyphData.x, glyphData.y);
        ++ctx._numGlyphs;
      }

      // Create texture.
      if (!curTexture) {
        curTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, curTexture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.ALPHA,
          ctx._glTextureSize,
          ctx._glTextureSize,
          0,
          gl.ALPHA,
          gl.UNSIGNED_BYTE,
          ctx._textureArray
        );
        // console.log("Upload time: " + elapsed(ut));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        // Prevents t-coordinate wrapping (repeating).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      page._glyphTexture[window.id()] = curTexture;

      // Draw from 2D canvas.
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        pageX,
        pageY,
        gl.ALPHA,
        gl.UNSIGNED_BYTE,
        this._renderCanvas
      );
      pageX += pageTextureSize;
      if (pageX >= ctx._glTextureSize) {
        pageY += pageTextureSize;
        pageX = 0;
      }
      if (pageY >= ctx._glTextureSize) {
        pageY = 0;
        pageX = 0;
        gl.generateMipmap(gl.TEXTURE_2D);
        curTexture = null;
      }
      // ++pagesUpdated;
    }
    this._renderCanvas.style.position = "absolute";
    this._renderCanvas.style.pointerEvents = "none";
    this._renderCanvas.style.right = "0";
    this._renderCanvas.style.top = "0";
    // document.body.appendChild(this._renderCanvas);
    if (curTexture) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    // console.log("Font updated " +
    //   pagesUpdated +
    //   " page(s) in " +
    //   elapsed(td) +
    //   "ms");
  }

  dispose(window: BasicWindow) {
    const ctx = this._windows[window.id()];
    if (!ctx) {
      return;
    }
    const gl = ctx.gl();
    for (let i = 0; i < this._pages.length; ++i) {
      const page = this._pages[i];
      if (page._glyphTexture[window.id()]) {
        const tex = page._glyphTexture[window.id()];
        if (gl && !gl.isContextLost()) {
          gl.deleteTexture(tex);
        }
        delete page._glyphTexture[window.id()];
      }
    }
    ctx._numGlyphs = 0;
  }

  clear() {
    for (let i = 0; i < this._pages.length; ++i) {
      const page = this._pages[i];
      for (const wid in page._glyphTexture) {
        if (!Object.prototype.hasOwnProperty.call(page._glyphTexture, wid)) {
          continue;
        }
        const tex = page._glyphTexture[wid];
        const ctx = this._windows[wid];
        if (ctx && ctx.gl() && !ctx.gl().isContextLost()) {
          ctx.gl().deleteTexture(tex);
        }
      }
      page._glyphTexture = {};
    }
    for (const wid in this._windows) {
      if (Object.prototype.hasOwnProperty.call(this._windows, wid)) {
        this._windows[wid]._numGlyphs = 0;
      }
    }
  }

  font() {
    return this._fontSize + "px " + this._fontName;
  }

  pageTextureSize() {
    return MAX_PAGE_WIDTH;
  }

  fontBaseline() {
    return this.fontSize();
  }

  fontSize() {
    return this._fontSize;
  }

  fullName() {
    return this._fontName + " " + this._fillStyle;
  }

  fontName() {
    return this._fontName;
  }

  isNewline(c: string) {
    return c === "\n";
  }
}
