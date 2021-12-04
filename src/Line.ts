import Label from "./Label";
import { defaultUnicode } from "parsegraph-unicode";
import { RIGHT_TO_LEFT } from "./settings";
import { GlyphData } from "./Font";
import GlyphPainter from "./GlyphPainter";
import GlyphIterator from "./GlyphIterator";

export default class Line {
  _label: Label;
  _glyphs: GlyphData[];
  _linePos: number;

  constructor(label: Label, text?: string) {
    if (!label) {
      throw new Error("Label must not be null");
    }
    this._label = label;

    // The glyphs contains the memory representation
    // of the Unicode string represented by this line.
    //
    // Diacritics are represented as additional characters in Unicode.
    // These characters result in a unique texture
    // rendering of the modified glyph.
    this._glyphs = [];
    if (arguments.length > 1 && text.length > 0) {
      this.appendText(text);
    }
  }

  isEmpty() {
    return this._glyphs.length === 0;
  }

  font() {
    return this._label.font();
  }

  remove(pos: number, count: number) {
    this._glyphs.splice(pos, count);
  }

  appendText(text: string) {
    const font = this.font();
    if (!font) {
      throw new Error("Line cannot add text without the label having a font.");
    }

    const gi = new GlyphIterator(font, text);
    let glyphData = null;
    while ((glyphData = gi.next()) != null) {
      // console.log("LETTER: " + glyphData.letter);
      this._glyphs.push(glyphData);
    }
  }

  insertText(pos: number, text: string) {
    const font = this.font();
    if (!font) {
      throw new Error("Line cannot add text without the label having a font.");
    }

    const gi = new GlyphIterator(font, text);
    let glyphData = null;
    const spliced: GlyphData[] = [];
    for (let i = 0; (glyphData = gi.next()) != null; ++i) {
      spliced.push(glyphData);
    }

    this._glyphs.splice.call(this._glyphs, pos, 0, ...spliced);
  }

  length() {
    let len = 0;
    this._glyphs.forEach(function (glyphData) {
      len += glyphData.letter.length;
    });
    return len;
  }

  glyphCount(counts: { [id: number]: number }, pagesPerTexture: number) {
    if (counts) {
      this._glyphs.forEach(function (glyphData) {
        const bufIndex = Math.floor(glyphData.glyphPage._id / pagesPerTexture);
        if (Number.isNaN(bufIndex)) {
          throw new Error("Glyph page index must not be NaN");
        }
        if (!(bufIndex in counts)) {
          counts[bufIndex] = 1;
        } else {
          ++counts[bufIndex];
        }
      });
    }
    return this._glyphs.length;
  }

  getText(startRun?: number, endRun?: number): string {
    if (arguments.length == 0) {
      startRun = 0;
    }
    if (arguments.length < 2) {
      endRun = this._glyphs.length - startRun - 1;
    }
    let str = "";
    for (let q = startRun; q <= endRun; ++q) {
      const glyphData = this._glyphs[q];
      str += glyphData.letter;
    }
    return str;
  }

  linePos() {
    return this._linePos;
  }

  label() {
    return this._label;
  }

  width() {
    return this._glyphs.reduce(
      (total: number, glyph: GlyphData) => total + glyph.advance,
      0
    );
  }

  height() {
    return this._glyphs.reduce(
      (height: number, glyph: GlyphData) => Math.max(height, glyph.height),
      0
    );
  }

  posAt(limit: number): number {
    let w = 0;
    for (let i = 0; i < limit && i < this._glyphs.length; ++i) {
      w += this._glyphs[i].advance;
    }
    return w;
  }

  glyphs() {
    return this._glyphs;
  }

  drawLTRGlyphRun(
    painter: GlyphPainter,
    worldX: number,
    worldY: number,
    pos: any[],
    fontScale: number,
    startRun: number,
    endRun: number
  ) {
    const text = this.getText();
    painter.drawLine(text, worldX + pos[0], worldY + pos[1], fontScale);
    // log("Drawing LTR run from %d to %d.", startRun, endRun);
    let maxAscent = 0;
    for (let q = startRun; q <= endRun; ++q) {
      const glyphData = this._glyphs[q];
      maxAscent = Math.max(maxAscent, glyphData.ascent);
    }
    for (let q = startRun; q <= endRun; ++q) {
      const glyphData = this._glyphs[q];
      painter.drawGlyph(
        glyphData,
        worldX + pos[0],
        worldY + pos[1] + maxAscent,
        fontScale
      );
      pos[0] += (glyphData.advance - 1) * fontScale;
    }
  }

  drawRTLGlyphRun(
    painter: GlyphPainter,
    worldX: number,
    worldY: number,
    pos: any[],
    fontScale: number,
    startRun: number,
    endRun: number
  ) {
    const text = this.getText();
    painter.drawLine(text, worldX, worldY, fontScale);
    let runWidth = 0;
    let maxAscent = 0;
    for (let q = startRun; q <= endRun; ++q) {
      const glyphData = this._glyphs[q];
      runWidth += glyphData.advance * fontScale;
      maxAscent = Math.max(maxAscent, glyphData.ascent);
    }
    let advance = 0;
    for (let q = startRun; q <= endRun; ++q) {
      const glyphData = this._glyphs[q];
      advance += (glyphData.advance - 1) * fontScale;
      painter.drawGlyph(
        glyphData,
        worldX + pos[0] + runWidth - advance,
        worldY + pos[1] + maxAscent,
        fontScale
      );
    }
    pos[0] += runWidth;
  }

  drawGlyphRun(
    painter: GlyphPainter,
    worldX: number,
    worldY: number,
    pos: any[],
    fontScale: number,
    startRun: number,
    endRun: number
  ) {
    // Draw the run.
    if (pos[2] === "L" || (!RIGHT_TO_LEFT && pos[2] === "WS")) {
      this.drawLTRGlyphRun(
        painter,
        worldX,
        worldY,
        pos,
        fontScale,
        startRun,
        endRun
      );
    } else {
      this.drawRTLGlyphRun(
        painter,
        worldX,
        worldY,
        pos,
        fontScale,
        startRun,
        endRun
      );
    }
  }

  paint(
    painter: GlyphPainter,
    worldX: number,
    worldY: number,
    pos: any[],
    fontScale: number
  ) {
    let startRun = 0;
    const unicode = defaultUnicode();
    if (!unicode.loaded()) {
      return;
    }
    for (let j = 0; j < this._glyphs.length; ++j) {
      const glyphData = this._glyphs[j];
      const glyphDirection =
        unicode.getGlyphDirection(glyphData.letter) || pos[2];
      if (pos[2] === "WS" && glyphDirection !== "WS") {
        // Use the glyph's direction if there is none currently in use.
        pos[2] = glyphDirection;
      }
      if (j < this._glyphs.length - 1 && pos[2] === glyphDirection) {
        // console.log("Found another character in glyph run.\n");
        continue;
      }
      this.drawGlyphRun(painter, worldX, worldY, pos, fontScale, startRun, j);

      // Set the new glyph direction.
      pos[2] = glyphDirection;
      startRun = j;
    }
    pos[1] += this.height() * fontScale;
    pos[0] = 0;
  }
}
