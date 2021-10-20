import { defaultFont } from "./settings";
import { timediffMs } from "parsegraph-timing";
import Color from "parsegraph-color";
import Label from "./Label";
import GlyphPainter from "./GlyphPainter";
import BlockPainter from "parsegraph-blockpainter";
import { BasicWindow } from "parsegraph-window";
import Rect from "parsegraph-rect";
import { Matrix3x3 } from "parsegraph-matrix";

export default class CameraBoxPainter {
  _blockPainter: BlockPainter;
  _glyphPainter: GlyphPainter;
  _borderColor: Color;
  _backgroundColor: Color;
  _textColor: Color;
  _fontSize: number;

  constructor(window: BasicWindow) {
    this._blockPainter = new BlockPainter(window);
    this._glyphPainter = new GlyphPainter(window, defaultFont());

    this._borderColor = new Color(1, 1, 1, 0.1);
    this._backgroundColor = new Color(1, 1, 1, 0.1);
    this._textColor = new Color(1, 1, 1, 1);
    this._fontSize = 24;
  }

  contextChanged(isLost: boolean) {
    if (!isLost) {
      return;
    }
    this._blockPainter.contextChanged(isLost);
    this._glyphPainter.contextChanged();
  }

  clear() {
    this._glyphPainter.clear();
    this._blockPainter.clear();
  }

  drawBox(
    name: string,
    rect: Rect,
    scale: number,
    mouseX: number,
    mouseY: number,
    when: Date
  ) {
    const painter = this._blockPainter;

    const now = new Date();
    const diff = timediffMs(when, now);
    let interp = 1;
    const fadeDelay = 500;
    const fadeLength = 1000;
    if (diff > fadeDelay) {
      interp = 1 - (diff - fadeDelay) / fadeLength;
    }
    this._borderColor.setA(0.1 * interp);
    this._backgroundColor.setA(0.1 * interp);
    painter.setBorderColor(this._borderColor);
    painter.setBackgroundColor(this._backgroundColor);
    this._glyphPainter.color().setA(interp);
    this._glyphPainter.backgroundColor().setA(interp);

    painter.drawBlock(
      rect.x(),
      rect.y(),
      rect.width(),
      rect.height(),
      0.01,
      0.1,
      scale
    );
    const font = this._glyphPainter.font();
    const label = new Label(font);
    label.setText(name);
    const lw = (label.width() * (this._fontSize / font.fontSize())) / scale;
    const lh = (label.height() * (this._fontSize / font.fontSize())) / scale;

    if (mouseX === undefined) {
      mouseX = rect.width() / 2 - lw;
    }
    if (mouseY === undefined) {
      mouseY = 0;
    }
    if (mouseX < 0) {
      mouseX = 0;
    }
    mouseX = Math.min(mouseX, rect.width());
    mouseY = Math.min(mouseY, rect.height());
    if (mouseY < 0) {
      mouseY = 0;
    }

    label.paint(
      this._glyphPainter,
      rect.x() - lw / 2 - rect.width() / 2 + mouseX / scale,
      rect.y() - lh / 2 - rect.height() / 2 + mouseY / scale,
      this._fontSize / font.fontSize() / scale
    );

    return interp > 0;
  }

  render(world: Matrix3x3, scale: number) {
    this._blockPainter.render(world, scale);
    this._glyphPainter.render(world, scale);
  }
}
