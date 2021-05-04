import {defaultUnicode} from 'parsegraph-unicode';
import TestSuite from 'parsegraph-testsuite';
import {RIGHT_TO_LEFT, defaultFont} from './settings';
import Caret from './Caret';
import Rect from 'parsegraph-rect';
import Font, { GlyphData } from './Font';
import GlyphPainter from './GlyphPainter';

const ctrlKeys:string[] = [
  'Control',
  'Alt',
  'Shift',
  'ArrowLeft',
  'ArrowRight',
  'ArrowDown',
  'ArrowUp',
  'Delete',
  'Escape',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  'CapsLock',
  'ScrollLock',
  'NumLock',
  'Insert',
  'Break',
  'Insert',
  'Enter',
  'Tab',
  'Backspace',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
];

export class GlyphIterator {
  font:Font;
  index:number;
  len:number;
  prevLetter:number;
  text:string;

  constructor(font:Font, text:string) {
    this.font = font;
    this.index = 0;
    this.len = text.length;
    this.prevLetter = null;
    this.text = text;
  }

  next() {
    const unicode = defaultUnicode();
    if (!unicode.loaded()) {
      return null;
    }
    if (this.index >= this.len) {
      return null;
    }
    let start = this.text[this.index];
    const startIndex = this.index;
    let len = 1;
    if (this.text.codePointAt(this.index) > 0xffff) {
      len = 2;
      start = this.text.substring(this.index, this.index + 2);
    }
    this.index += len;
    if (unicode.isMark(start)) {
      // Show an isolated mark.
      // log("Found isolated Unicode mark character %x.\n", start[0]);
      const rv = this.font.getGlyph(start);
      return rv;
    }

    // log("Found Unicode character %x.\n", start[0]);

    // Form ligatures.
    let givenLetter = start.charCodeAt(0);
    if (givenLetter === 0x627 && this.prevLetter == 0x644) {
      // LAM WITH ALEF.
      if (this.prevLetter) {
        // Has a previous glyph, so final.
        givenLetter = 0xfefc;
      } else {
        // Isolated form.
        givenLetter = 0xfefb;
      }
      // Skip the ligature'd character.
      this.prevLetter = 0x627;
      // log("Found ligature %x->%x\n", gi->prevLetter, givenLetter);
    } else {
      let nextLetterChar = null;
      for (let i = 0; this.index + i < this.len; ) {
        let nextLetter = this.text[this.index + i];
        let len = 1;
        if (nextLetter.codePointAt(0) > 0xffff) {
          nextLetter = this.text.substring(this.index + 1, this.index + 3);
          len = 2;
        }
        if (unicode.isMark(nextLetter)) {
          i += len;
          continue;
        }
        // given, prev, next
        if (unicode.cursive(nextLetter[0], givenLetter, null)) {
          nextLetterChar = nextLetter[0];
        }
        break;
      }
      // RTL: [ 4, 3, 2, 1]
      //        ^-next
      //           ^-given
      //              ^-prev
      const cursiveLetter = unicode.cursive(
          givenLetter,
          this.prevLetter,
          nextLetterChar,
      );
      if (cursiveLetter != null) {
        // console.log("Found cursive char " +
        // givenLetter.toString(16) + "->" + cursiveLetter.toString(16));
        this.prevLetter = givenLetter;
        givenLetter = cursiveLetter;
      } else {
        // console.log("Found non-cursive char " +
        // givenLetter.toString(16) + ".");
        this.prevLetter = null;
      }
    }

    // Add diacritical marks and combine ligatures.
    let foundVirama = false;
    while (this.index < this.len) {
      let letter = this.text[this.index];
      let llen = 1;
      if (this.text.codePointAt(this.index) > 0xffff) {
        llen = 2;
        letter = this.text.substring(this.index, this.index + 2);
      }
      if (llen == 2 && this.index == this.len - 1) {
        throw new Error('Unterminated UTF-16 character');
      }

      if (unicode.isMark(letter)) {
        foundVirama = letter[0].charCodeAt(0) == 0x094d;
        len += llen;
        this.index += llen;
        // log("Found Unicode mark character %x.\n", letter[0]);
        continue;
      } else if (foundVirama) {
        foundVirama = false;
        len += llen;
        this.index += llen;
        // log("Found Unicode character %x combined using Virama.\n", letter[0]);
        continue;
      }

      // Found a non-marking character that's part of a new glyph.
      break;
    }

    let trueText = this.text.substring(startIndex, startIndex + len);
    trueText = String.fromCodePoint(givenLetter) + trueText.substring(1);
    return this.font.getGlyph(trueText);
  };
}

class Line {
  _label:Label;
  _glyphs:GlyphData[];
  _width:number;
  _height:number;
  _text:string;
  _linePos:number;

  constructor(label:Label, text?:string) {
    if (!label) {
      throw new Error('Label must not be null');
    }
    this._label = label;

    // The glyphs contains the memory representation
    // of the Unicode string represented by this line.
    //
    // Diacritics are represented as additional characters in Unicode.
    // These characters result in a unique texture
    // rendering of the modified glyph.
    this._glyphs = [];
    this._width = 0;
    this._height = 0;
    this._text = '';
    if (arguments.length > 1 && text.length > 0) {
      this.appendText(text);
    }
  }

  isEmpty() {
    return this._width === 0;
  };

  font() {
    return this._label.font();
  };

  remove(pos:number, count:number) {
    const removed = this._glyphs.splice(pos, count);
    removed.forEach(function(glyphData) {
      this._width -= glyphData.width;
    }, this);
  };

  appendText(text:string) {
    const font = this.font();
    if (!font) {
      throw new Error('Line cannot add text without the label having a font.');
    }

    const gi = new GlyphIterator(font, text);
    let glyphData = null;
    while ((glyphData = gi.next()) != null) {
      // console.log("LETTER: " + glyphData.letter);
      this._glyphs.push(glyphData);
      this._height = Math.max(this._height, glyphData.height);
      this._width += glyphData.advance;
    }

    this._text += text;
  };

  insertText(pos:number, text:string) {
    const font = this.font();
    if (!font) {
      throw new Error('Line cannot add text without the label having a font.');
    }

    const gi = new GlyphIterator(font, text);
    let glyphData = null;
    const spliced:GlyphData[] = [];
    for (let i = 0; (glyphData = gi.next()) != null; ++i) {
      spliced.push(glyphData);
      this._height = Math.max(this._height, glyphData.height);
      this._width += glyphData.advance;
    }

    this._glyphs.splice.call(this._glyphs, pos, 0, ...spliced);

    this._text =
      this._text.slice(0, pos) +
      text +
      this._text.slice(pos + 1, this._text.length - pos);
  };

  length() {
    let len = 0;
    this._glyphs.forEach(function(glyphData) {
      len += glyphData.letter.length;
    });
    return len;
  };

  glyphCount(counts:{[id:number]:number}, pagesPerTexture:number) {
    if (counts) {
      this._glyphs.forEach(function(glyphData) {
        const bufIndex = Math.floor(glyphData.glyphPage._id / pagesPerTexture);
        if (Number.isNaN(bufIndex)) {
          throw new Error('Glyph page index must not be NaN');
        }
        if (!(bufIndex in counts)) {
          counts[bufIndex] = 1;
        } else {
          ++counts[bufIndex];
        }
      });
    }
    return this._glyphs.length;
  };

  getText() {
    let t = '';
    this._glyphs.forEach(function(glyphData) {
      t += glyphData.letter;
    });
    return t;
  };
  text() {
    return this.getText();
  }

  linePos() {
    return this._linePos;
  };

  label() {
    return this._label;
  };

  width() {
    return this._width;
  };

  height() {
    return this._height;
  };

  posAt(limit:number):number {
    let w = 0;
    for (let i = 0; i < limit && i < this._glyphs.length; ++i) {
      w += this._glyphs[i].width;
    }
    return w;
  };

  glyphs() {
    return this._glyphs;
  };

  drawLTRGlyphRun(
      painter:GlyphPainter,
      worldX:number,
      worldY:number,
      pos:any[],
      fontScale:number,
      startRun:number,
      endRun:number,
  ) {
    painter.drawLine(this._text, worldX, worldY, fontScale);
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
          fontScale,
      );
      pos[0] += (glyphData.advance - 1) * fontScale;
    }
  };

  drawRTLGlyphRun(
      painter:GlyphPainter,
      worldX:number,
      worldY:number,
      pos:any[],
      fontScale:number,
      startRun:number,
      endRun:number,
  ) {
    painter.drawLine(this._text, worldX, worldY, fontScale);
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
          fontScale,
      );
    }
    pos[0] += runWidth;
  };

  drawGlyphRun(
      painter:GlyphPainter,
      worldX:number,
      worldY:number,
      pos:any[],
      fontScale:number,
      startRun:number,
      endRun:number,
  ) {
    // Draw the run.
    if (pos[2] === 'L' || (!RIGHT_TO_LEFT && pos[2] === 'WS')) {
      this.drawLTRGlyphRun(
          painter,
          worldX,
          worldY,
          pos,
          fontScale,
          startRun,
          endRun,
      );
    } else {
      this.drawRTLGlyphRun(
          painter,
          worldX,
          worldY,
          pos,
          fontScale,
          startRun,
          endRun,
      );
    }
  };

  paint(
      painter:GlyphPainter,
      worldX:number,
      worldY:number,
      pos:any[],
      fontScale:number,
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
      if (pos[2] === 'WS' && glyphDirection !== 'WS') {
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
  };
}

const lineTests = new TestSuite('Line');

lineTests.addTest('new Line', function() {
  const font = defaultFont();
  const label = new Label(font);
  new Line(label, "");
  let f = 0;
  try {
    new Line(null, "");
    f = 2;
  } catch (ex) {
    f = 3;
  }
  if (f !== 3) {
    return 'Failed to recognize null label';
  }
});

export default class Label {
  _font:Font;
  _wrapWidth:number;
  _lines:Line[];
  _caretLine:number;
  _caretPos:number;
  _editable:boolean;
  _onTextChangedListener:Function;
  _onTextChangedListenerThisArg:object;
  _width:number;
  _height:number;
  _x:number;
  _y:number;
  _scale:number;
  _currentPos:number;
  _currentLine:number;

  constructor(font:Font) {
    if (!font) {
      throw new Error('Label requires a font.');
    }
    this._font = font;
    this._wrapWidth = null;
    this._lines = [];
    this._caretLine = 0;
    this._caretPos = 0;
    this._editable = false;
    this._onTextChangedListener = null;
    this._onTextChangedListenerThisArg = null;
    this._width = -1;
    this._height = 0;

    this._x = null;
    this._y = null;
    this._scale = null;

    this._currentPos = 0;
    this._currentLine = 0;
  }

  font() {
    return this._font;
  };

  isEmpty() {
    for (let i = 0; i < this._lines.length; ++i) {
      const l = this._lines[i];
      if (!l.isEmpty()) {
        return false;
      }
    }
    return true;
  };

  forEach(func:Function, funcThisArg?:any) {
    if (!funcThisArg) {
      funcThisArg = this;
    }
    this._lines.forEach((line)=>{
      func.call(funcThisArg, line);
    });
  };

  getText() {
    let t = '';
    this._lines.forEach(function(l) {
      if (t.length > 0) {
        t += '\n';
      }
      t += l.getText();
    });
    return t;
  };
  text() {
    return this.getText();
  }

  clear() {
    this._lines = [];
  };

  length() {
    let totallen = 0;
    this._lines.forEach(function(l, i) {
      if (i > 0) {
        totallen += 1;
      }
      totallen += l.length();
    });
    return totallen;
  };

  glyphCount(counts:{[id:number]:number}, pagesPerTexture:number):number {
    let totallen = 0;
    this._lines.forEach(function(l) {
      totallen += l.glyphCount(counts, pagesPerTexture);
    });
    return totallen;
  };

  setText(text:any):void {
    if (typeof text !== 'string') {
      text = '' + text;
    }
    this._lines = [];
    this._currentLine = 0;
    this._currentPos = 0;
    this._width = 0;
    this._height = 0;
    text.split(/\n/).forEach(function(textLine:string) {
      const l = new Line(this, textLine);
      this._lines.push(l);
      this._width = Math.max(this._width, l.width());
      this._height += l.height();
    }, this);
  };

  moveCaretDown() {
    console.log('Moving caret down');
  };

  moveCaretUp() {
    console.log('Moving caret up');
  };

  moveCaretBackward() {
    if (this._caretPos === 0) {
      if (this._caretLine <= 0) {
        return false;
      }
      this._caretLine--;
      this._caretPos = this._lines[this._caretLine]._glyphs.length;
      return true;
    }
    this._caretPos--;
    return true;
  };

  moveCaretForward() {
    if (this._caretPos == this._lines[this._caretLine]._glyphs.length) {
      if (this._caretLine === this._lines.length - 1) {
        // At the end.
        return false;
      }
      this._caretLine++;
      this._caretPos = 0;
      return true;
    }
    this._caretPos++;
    return true;
  };

  backspaceCaret() {
    const line = this._lines[this._caretLine];
    if (this._caretPos === 0) {
      if (this._caretLine === 0) {
        // Can't backspace anymore.
        return false;
      }
      this._caretLine--;
      this._caretPos = this._lines[this._caretLine]._glyphs.length;
      this.textChanged();
      return true;
    }
    this._caretPos--;
    line.remove(this._caretPos, 1);
    this._width = null;
    this.textChanged();
    return true;
  };

  deleteCaret() {
    const line = this._lines[this._caretLine];
    if (this._caretPos > line._glyphs.length - 1) {
      return false;
    }
    line.remove(this._caretPos, 1);
    this._width = null;
    this.textChanged();
    return true;
  };

  ctrlKey(key:string) {
    if (ctrlKeys.indexOf(key) >= 0) {
      return true;
    }
    return false;
  };

  key(key:string) {
    if (ctrlKeys.indexOf(key) >= 0) {
      switch (key) {
      case 'ArrowLeft':
        return this.moveCaretBackward();
      case 'ArrowRight':
        return this.moveCaretForward();
      case 'ArrowDown':
        return this.moveCaretDown();
      case 'ArrowUp':
        return this.moveCaretUp();
      case 'Delete':
        return this.deleteCaret();
      case 'Backspace':
        return this.backspaceCaret();
      }
      return false;
    }
    // Insert some character.
    // this.setText(this._labelNode._label.text() + key);

    while (this._caretLine > this._lines.length) {
      this._lines.push(new Line(this));
    }
    const insertLine = this._lines[this._caretLine];
    const insertPos = Math.min(this._caretPos, insertLine._glyphs.length);
    if (insertPos === insertLine._glyphs.length) {
      insertLine.appendText(key);
    } else {
      insertLine.insertText(insertPos, key);
    }

    if (this._width !== null) {
      this._width = Math.max(insertLine.width(), this._width);
      this._height = Math.max(this._height, insertLine.height());
    }
    this._caretPos += key.length;
    this.textChanged();
    return true;
  };

  onTextChanged(
      listener:Function,
      listenerThisArg:object,
  ) {
    this._onTextChangedListener = listener;
    this._onTextChangedListenerThisArg = listenerThisArg;
  };

  textChanged() {
    if (this._onTextChangedListener) {
      return this._onTextChangedListener.call(
          this._onTextChangedListenerThisArg,
          this,
      );
    }
  };

  editable() {
    return this._editable;
  };

  setEditable(editable:boolean) {
    this._editable = editable;
  };

  click(x:number, y:number) {
    if (y < 0 && x < 0) {
      this._caretLine = 0;
      this._caretPos = 0;
    }
    let curX = 0;
    let curY = 0;
    for (let i = 0; i < this._lines.length; ++i) {
      const line = this._lines[i];
      if (y > curY + line.height() && i != this._lines.length - 1) {
        // Some "next" line.
        curY += line.height();
        continue;
      }
      // Switch the caret line.
      this._caretLine = i;

      if (x < 0) {
        this._caretPos = 0;
        return;
      }
      for (let j = 0; j < line._glyphs.length; ++j) {
        const glyphData = line._glyphs[j];
        if (x > curX + glyphData.width) {
          curX += glyphData.width;
          continue;
        }
        if (x > curX + glyphData.width / 2) {
          curX += glyphData.width;
          continue;
        }

        this._caretPos = j;
        // console.log("CaretPos=" + this._caretPos);
        return;
      }

      this._caretPos = line._glyphs.length;
      return;
    }
    throw new Error('click fall-through that should not be reached');
  };

  lineAt(n:number):Line {
    return this._lines[n];
  };

  caretLine() {
    return this._caretLine;
  };

  caretPos() {
    return this._caretPos;
  };

  getCaretRect(outRect?:Rect):Rect {
    if (!outRect) {
      outRect = new Rect();
    }
    let y = 0;
    for (let i = 0; i < this._caretLine; ++i) {
      y += this._lines[i].height();
    }
    const line = this._lines[this._caretLine];
    const x = line.posAt(this._caretPos);
    const cw = 5;
    outRect.setX(x + cw / 2);
    outRect.setWidth(cw);
    outRect.setY(y + line.height() / 2);
    outRect.setHeight(line.height());
    return outRect;
  };

  glyphPos() {
    return this._caretPos;
  };

  fontSize() {
    return this._font.fontSize();
  };

  width() {
    if (this._width === null) {
      this._width = 0;
      this._lines.forEach(function(l) {
        this._width = Math.max(this._width, l.width());
      }, this);
    }
    return this._width;
  };

  height() {
    return this._height;
  };

  paint(
      painter:GlyphPainter,
      worldX:number,
      worldY:number,
      fontScale:number,
  ) {
    if (this.font() !== painter.font()) {
      throw new Error(
          'Painter must use the same font as this label: ' +
          this.font() +
          ', ' +
          painter.font(),
      );
    }
    const pos = [0, 0, 'WS'];

    for (let i = 0; i < this._lines.length; ++i) {
      const l = this._lines[i];
      l.paint(painter, worldX, worldY, pos, fontScale);
    }
  };
}

const labelTests = new TestSuite('Label');

labelTests.addTest('defaultFont', function() {
  const font = defaultFont();
  if (!font) {
    return 'No font created';
  }
});

labelTests.addTest('new Label', function() {
  const font = defaultFont();
  const label = new Label(font);
  if (!label) {
    return 'No label created';
  }
});

labelTests.addTest('Label.label', function() {
  const font = defaultFont();
  const label = new Label(font);
  if (!label) {
    return 'No label created';
  }

  const car = new Caret('s');
  car.setFont(font);
  car.label('No time');
});

labelTests.addTest('isEmpty', function() {
  const font = defaultFont();
  const l = new Label(font);
  if (!l.isEmpty()) {
    return 'New label must begin as empty.';
  }
  l.setText('No time');
  if (l.isEmpty()) {
    return 'Label with text must test as non-empty.';
  }
});

labelTests.addTest('Click before beginning', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time');
  l.click(-5, -5);

  if (l.caretLine() != 0) {
    return 'caretLine';
  }
  if (l.caretPos() != 0) {
    return 'caretPos';
  }
});

labelTests.addTest('Click on second character', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time');
  l.click(font.getGlyph('N').width + 1, 0);

  if (l.caretLine() != 0) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});

labelTests.addTest('Click on second line', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time\nLol');
  l.click(font.getGlyph('L').width + 1, l.lineAt(0).height() + 1);

  if (l.caretLine() != 1) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});

labelTests.addTest('Click past end', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time\nLol');
  l.click(
      font.getGlyph('L').width + 1,
      l.lineAt(0).height() + l.lineAt(1).height() + 1,
  );

  if (l.caretLine() != 1) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});