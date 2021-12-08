import Rect from "parsegraph-rect";
import { Keystroke } from "parsegraph-window";
import Font from "./Font";
import GlyphPainter from "./GlyphPainter";
import Line from "./Line";

const ctrlKeys: string[] = [
  "Control",
  "Alt",
  "Shift",
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "Delete",
  "Escape",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "CapsLock",
  "ScrollLock",
  "NumLock",
  "Insert",
  "Break",
  "Insert",
  "Enter",
  "Tab",
  "Backspace",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
];

export default class Label {
  _font: Font;
  _wrapWidth: number;
  _lines: Line[];
  _caretLine: number;
  _caretPos: number;
  _editable: boolean;
  _onTextChangedListener: Function;
  _onTextChangedListenerThisArg: object;
  _x: number;
  _y: number;
  _scale: number;
  _currentPos: number;
  _currentLine: number;

  constructor(font: Font) {
    if (!font) {
      throw new Error("Label requires a font.");
    }
    this._font = font;
    this._wrapWidth = null;
    this._lines = [];
    this._caretLine = 0;
    this._caretPos = 0;
    this._editable = false;
    this._onTextChangedListener = null;
    this._onTextChangedListenerThisArg = null;

    this._x = null;
    this._y = null;
    this._scale = null;

    this._currentPos = 0;
    this._currentLine = 0;
  }

  font() {
    return this._font;
  }

  isEmpty() {
    for (let i = 0; i < this._lines.length; ++i) {
      const l = this._lines[i];
      if (!l.isEmpty()) {
        return false;
      }
    }
    return true;
  }

  forEach(func: Function, funcThisArg?: any) {
    if (!funcThisArg) {
      funcThisArg = this;
    }
    this._lines.forEach((line) => {
      func.call(funcThisArg, line);
    });
  }

  getText() {
    return this._lines.map((l) => l.getText()).join("\n");
  }

  clear() {
    this._lines = [];
  }

  length() {
    let totallen = 0;
    this._lines.forEach(function (l, i) {
      if (i > 0) {
        totallen += 1;
      }
      totallen += l.length();
    });
    return totallen;
  }

  glyphCount(
    counts: { [id: number]: number },
    pagesPerTexture: number
  ): number {
    let totallen = 0;
    this._lines.forEach(function (l) {
      totallen += l.glyphCount(counts, pagesPerTexture);
    });
    return totallen;
  }

  setText(text: any): void {
    if (typeof text !== "string") {
      text = "" + text;
    }
    this._lines = [];
    this._currentLine = 0;
    this._currentPos = 0;
    text.split(/\n/).forEach(function (textLine: string) {
      const l = new Line(this, textLine);
      this._lines.push(l);
    }, this);
    this.textChanged();
  }

  moveCaretDown() {
    console.log("Moving caret down");
  }

  moveCaretUp() {
    console.log("Moving caret up");
  }

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
  }

  currentLine(): Line {
    return this._lines[this._caretLine];
  }

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
  }

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
    this.textChanged();
    return true;
  }

  deleteCaret() {
    const line = this._lines[this._caretLine];
    if (this._caretPos > line._glyphs.length - 1) {
      return false;
    }
    line.remove(this._caretPos, 1);
    this.textChanged();
    return true;
  }

  ctrlKey(event: Keystroke) {
    if (ctrlKeys.indexOf(event.name()) >= 0) {
      return true;
    }
    return false;
  }

  moveToStart(): boolean {
    if (this._caretPos === 0) {
      return false;
    }
    this._caretPos = 0;
    return true;
  }

  moveToEnd(): boolean {
    if (this._caretPos === this.currentLine().length()) {
      return false;
    }
    this._caretPos = this.currentLine().length();
    return true;
  }

  key(event: Keystroke) {
    console.log(event.name());
    if (ctrlKeys.indexOf(event.name()) >= 0) {
      switch (event.name()) {
        case "ArrowLeft":
          return this.moveCaretBackward();
        case "ArrowRight":
          return this.moveCaretForward();
        case "ArrowDown":
          return this.moveCaretDown();
        case "ArrowUp":
          return this.moveCaretUp();
        case "Delete":
          return this.deleteCaret();
        case "Backspace":
          return this.backspaceCaret();
        case "Home":
          return this.moveToStart();
        case "End":
          return this.moveToEnd();
      }
      return false;
    }
    // Insert some character.

    while (this._caretLine > this._lines.length) {
      this._lines.push(new Line(this));
    }
    const insertLine = this._lines[this._caretLine];
    const insertPos = Math.min(this._caretPos, insertLine._glyphs.length);
    if (insertPos === insertLine._glyphs.length) {
      insertLine.appendText(event.key());
    } else {
      insertLine.insertText(insertPos, event.key());
    }

    this._caretPos += event.key().length;
    return true;
  }

  onTextChanged(listener: Function, listenerThisArg: object) {
    this._onTextChangedListener = listener;
    this._onTextChangedListenerThisArg = listenerThisArg;
  }

  textChanged() {
    if (this._onTextChangedListener) {
      return this._onTextChangedListener.call(
        this._onTextChangedListenerThisArg,
        this
      );
    }
  }

  editable() {
    return this._editable;
  }

  setEditable(editable: boolean) {
    this._editable = editable;
  }

  click(x: number, y: number) {
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
        if (x > curX + glyphData.advance) {
          curX += glyphData.advance;
          continue;
        }
        if (x > curX + glyphData.advance / 2) {
          curX += glyphData.advance;
          continue;
        }

        this._caretPos = j;
        // console.log("CaretPos=" + this._caretPos);
        return;
      }

      this._caretPos = line._glyphs.length;
      return;
    }
    throw new Error("click fall-through that should not be reached");
  }

  lineAt(n: number): Line {
    return this._lines[n];
  }

  caretLine() {
    return this._caretLine;
  }

  caretPos() {
    return this._caretPos;
  }

  getCaretRect(outRect?: Rect): Rect {
    if (!outRect) {
      outRect = new Rect();
    }
    let y = 0;
    for (let i = 0; i < this._caretLine; ++i) {
      y += this._lines[i].height();
    }
    const line = this._lines[this._caretLine];
    const x = line.posAt(this._caretPos);
    console.log("Caret X", x);
    const cw = 5;
    outRect.setX(x + cw / 2);
    outRect.setWidth(cw);
    outRect.setY(y);
    outRect.setHeight(line.height());
    return outRect;
  }

  glyphPos() {
    return this._caretPos;
  }

  fontSize() {
    return this._font.fontSize();
  }

  width() {
    return this._lines.reduce(
      (total: number, line: Line) => Math.max(total, line.width()),
      0
    );
  }

  height() {
    return this._lines.reduce(
      (total: number, line: Line) => total + line.height(),
      0
    );
  }

  paint(
    painter: GlyphPainter,
    worldX: number,
    worldY: number,
    fontScale: number
  ) {
    if (this.font() !== painter.font()) {
      throw new Error(
        "Painter must use the same font as this label: " +
          this.font() +
          ", " +
          painter.font()
      );
    }
    const pos = [0, 0, "WS"];

    const offset = (fontScale * (-this.height() + this._lines[0].height())) / 2;
    for (let i = 0; i < this._lines.length; ++i) {
      const l = this._lines[i];
      l.paint(painter, worldX, offset + worldY, pos, fontScale);
    }
  }
}
