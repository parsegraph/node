import checkGLError from "parsegraph-checkglerror";
import {
  Direction,
  forEachCardinalDirection,
  isVerticalDirection,
  directionSign,
} from "parsegraph-direction";
import { Alignment } from "parsegraph-layout";
import Node from "./Node";

import { Matrix3x3 } from "parsegraph-matrix";

import DefaultNodeType, { Type } from "./DefaultNodeType";
import BlockPainter from "parsegraph-blockpainter";
import {
  SELECTED_LINE_COLOR,
  LINE_COLOR,
  LINE_THICKNESS,
  EXTENT_BORDER_ROUNDEDNESS,
  EXTENT_BORDER_THICKNESS,
  EXTENT_BORDER_COLOR,
  EXTENT_BACKGROUND_COLOR,
} from "./DefaultNodeStyle";
import Size from "parsegraph-size";
import GlyphPainter from "./GlyphPainter";
import Rect from "parsegraph-rect";
import { BasicWindow, Component } from "parsegraph-window";
import Color from "parsegraph-color";
import Font from "./Font";
import TexturePainter from "./TexturePainter";
import WindowNodePainter from "./WindowNodePainter";
import Camera from "parsegraph-camera";
import WindowNode from "./WindowNode";

class PaintedElement {
  _window: BasicWindow;
  _node: WindowNode;
  _size: Size;

  constructor(window: BasicWindow, node: WindowNode) {
    this._window = window;
    this._node = node;
    this._size = new Size();
  }

  paint(paintContext: Component): void {
    const node = this._node;
    const elem = node.elementFor(paintContext).parentElement;
    this._node.size(this._size);
    const size = this._size;
    elem.style.width = `${size.width()}px`;
    elem.style.height = `${size.height()}px`;
    const x = node.groupX();
    const y = node.groupY();
    const absScale = node.groupScale();
    const posTranslate = `translate(${x}px, ${y}px)`;
    const halfSizeTranslate = `translate(${-size.width() / 2}px, ${
      -size.height() / 2
    }px)`;
    const nodeScale = `scale(${absScale}, ${absScale})`;
    const newTransform = [posTranslate, nodeScale, halfSizeTranslate].join(" ");
    elem.style.transform = newTransform;
  }

  render(camera: Camera, paintContext: Component): void {
    console.log(camera, paintContext);
  }
}

export default class DefaultNodePainter implements WindowNodePainter {
  _window: BasicWindow;
  _paintContext: Component;
  _node: Node<DefaultNodeType>;
  _backgroundColor: Color;
  _blockPainter: BlockPainter;
  _renderBlocks: boolean;
  _extentPainter: BlockPainter;
  _renderExtents: boolean;
  _fontPainters: { [key: string]: GlyphPainter };
  _renderText: boolean;
  _textures: TexturePainter[];
  _pagesPerGlyphTexture: number;
  _mass: number;
  _consecutiveRenders: number;
  _renderLines: boolean;
  _renderScenes: boolean;
  _elements: PaintedElement[];
  _renderedElements: Map<Component, PaintedElement[]>;
  bodySize: Size;

  consecutiveRenders(): number {
    return this._consecutiveRenders;
  }

  constructor(
    window: BasicWindow,
    node: Node<DefaultNodeType>,
    paintContext: Component
  ) {
    this._window = window;
    this._paintContext = paintContext;
    this._node = node;

    this._backgroundColor = window.backgroundColor();

    this._blockPainter = new BlockPainter(window);
    this._renderBlocks = true;

    this._extentPainter = new BlockPainter(window);
    // this._renderExtents = true;

    this._fontPainters = {};
    this._elements = [];

    this._renderText = true;

    this._textures = [];

    this._pagesPerGlyphTexture = NaN;

    this.bodySize = new Size();
  }

  contextChanged(isLost: boolean): void {
    this._blockPainter.contextChanged(isLost);
    this._extentPainter.contextChanged(isLost);
    for (const fontName in this._fontPainters) {
      if (Object.prototype.hasOwnProperty.call(this._fontPainters, fontName)) {
        const fontPainter = this._fontPainters[fontName];
        fontPainter.contextChanged();
      }
    }
    this._textures.forEach(function (/* t */) {
      // t.contextChanged(isLost);
    });
    this._pagesPerGlyphTexture = NaN;
  }

  bounds(): Rect {
    return this._blockPainter.bounds();
  }

  getFontPainter(font: Font): GlyphPainter {
    const fullFontName: string = font.fullName();
    let painter: GlyphPainter = this._fontPainters[fullFontName];
    if (!painter) {
      painter = new GlyphPainter(this.window(), font);
      this._fontPainters[fullFontName] = painter;
    }
    return painter;
  }

  window(): BasicWindow {
    return this._window;
  }

  gl() {
    return this._window.gl();
  }

  setBackground(r: any, ...args: any[]): void {
    if (args.length > 0) {
      return this.setBackground(new Color(r, ...args));
    }
    this._backgroundColor = r;
  }

  backgroundColor(): Color {
    return this._backgroundColor;
  }

  clear(): void {
    this._blockPainter.clear();
    this._extentPainter.clear();
    for (const fontName in this._fontPainters) {
      if (Object.prototype.hasOwnProperty.call(this._fontPainters, fontName)) {
        const fontPainter: GlyphPainter = this._fontPainters[fontName];
        fontPainter.clear();
      }
    }

    // const gl = this.gl();
    this._textures.forEach(function (t) {
      t.clear();
      // gl.deleteTexture(t._texture);
    });
    this._textures = [];

    this._elements = [];
    this._renderedElements = new Map();
  }

  drawSlider(node: Node<DefaultNodeType>): void {
    const style = node.blockStyle();
    const painter = this._blockPainter;

    const drawLine: Function = function (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      thickness: number,
      color: Color
    ) {
      const cx = x1 + (x2 - x1) / 2;
      const cy = y1 + (y2 - y1) / 2;

      let size;
      if (x1 == x2) {
        // Vertical line.
        size = new Size(
          LINE_THICKNESS * node.groupScale() * thickness,
          Math.abs(y2 - y1)
        );
      } else {
        // Horizontal line.
        size = new Size(
          Math.abs(x2 - x1),
          LINE_THICKNESS * node.groupScale() * thickness
        );
      }

      if (color === undefined) {
        if (node.isSelected()) {
          color = SELECTED_LINE_COLOR.premultiply(style.backgroundColor);
        } else {
          color = LINE_COLOR.premultiply(style.backgroundColor);
        }
      }
      painter.setBorderColor(color);
      painter.setBackgroundColor(color);
      painter.drawBlock(
        node.groupX() + cx,
        node.groupY() + cy,
        size.width(),
        size.height(),
        0,
        0,
        node.groupScale()
      );
    };

    const groupSize = node.groupSize(this.bodySize);

    // Draw the connecting line into the slider.
    switch (node.parentDirection()) {
      case Direction.UPWARD:
        // Draw downward connecting line into the horizontal slider.
        drawLine(0, -groupSize.height() / 2, 0, 0, 1);

        break;
      case Direction.DOWNWARD:
        // Draw upward connecting line into the horizontal slider.
        break;
    }

    // Draw the bar that the slider bud is on.
    drawLine(-groupSize.width() / 2, 0, groupSize.width() / 2, 0, 1.5);

    // Draw the first and last ticks.

    // If snapping, show the intermediate ticks.

    // if(isVerticalDirection(node.parentDirection())) {
    let value = node.value();
    if (value == null) {
      value = 0.5;
    }

    const sliderWidth = groupSize.width();

    if (node.isSelected()) {
      painter.setBorderColor(
        style.selectedBorderColor.premultiply(node.backdropColor())
      );
      painter.setBackgroundColor(
        style.selectedBackgroundColor.premultiply(node.backdropColor())
      );
    } else {
      painter.setBorderColor(
        style.borderColor.premultiply(node.backdropColor())
      );
      painter.setBackgroundColor(
        style.backgroundColor.premultiply(node.backdropColor())
      );
    }

    // Draw the slider bud.
    if (isNaN(value)) {
      value = 0;
    }
    const thumbWidth = groupSize.height() / 1.5;
    painter.drawBlock(
      node.groupX() -
        sliderWidth / 2 +
        thumbWidth / 2 +
        (sliderWidth - thumbWidth) * value,
      node.groupY(),
      groupSize.height() / 1.5,
      groupSize.height() / 1.5,
      style.borderRoundness / 1.5,
      style.borderThickness / 1.5,
      node.groupScale()
    );
    // }

    if (!node.label()) {
      return;
    }

    // var fontScale = .7;
    const fontPainter = this.getFontPainter(node.realLabel().font());
    //    fontPainter.setFontSize(
    //        fontScale * style.fontSize * node.groupScale()
    //    );
    fontPainter.setColor(
      node.isSelected() ? style.selectedFontColor : style.fontColor
    );

    // fontPainter.setFontSize(
    //        fontScale * style.fontSize * node.groupScale()
    //    );
    /* if(style.maxLabelChars) {
            fontPainter.setWrapWidth(
                fontScale *
                style.fontSize *
                style.maxLabelChars *
                style.letterWidth *
                node.groupScale()
            );
        }

    const textMetrics = fontPainter.measureText(node.label());
    node._label[0] =
      node.groupX() -
      sliderWidth / 2 +
      sliderWidth * value -
      textMetrics[0] / 2;
    node._label[1] = node.groupY() - textMetrics[1] / 2;
    fontPainter.setPosition(node._label[0], node._label[1]);
    fontPainter.drawText(node.label());
  */
  }

  drawElement(node: Node<DefaultNodeType>): void {
    if (!node.element()) {
      return;
    }

    const elem = new PaintedElement(this._window, node);
    this._elements.push(elem);
  }

  drawScene(node: Node<DefaultNodeType>): void {
    if (!node.scene()) {
      return;
    }

    const sceneSize = node.sizeWithoutPadding(this.bodySize);
    const sceneX = node.groupX();
    const sceneY = node.groupY();

    // Render and draw the scene texture.
    const shaders: { [key: string]: WebGLProgram } = this._window.shaders();
    const gl = this.gl();
    if (!shaders.framebuffer) {
      const framebuffer = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      shaders.framebuffer = framebuffer;

      // Thanks to http://learningwebgl.com/blog/?p=1786
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        sceneSize.width(),
        sceneSize.height(),
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
      );

      const renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(
        gl.RENDERBUFFER,
        gl.DEPTH_COMPONENT16,
        sceneSize.width(),
        sceneSize.height()
      );
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        t,
        0
      );
      gl.framebufferRenderbuffer(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER,
        renderbuffer
      );

      shaders.framebufferTexture = t;
      shaders.framebufferRenderBuffer = renderbuffer;
    } else {
      gl.bindTexture(gl.TEXTURE_2D, shaders.framebufferTexture);
      gl.bindRenderbuffer(gl.RENDERBUFFER, shaders.framebufferRenderBuffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, shaders.framebuffer);

      this._textures.forEach(function (t) {
        // gl.deleteTexture(t._texture);
        t.clear();
      });
      this._textures = [];
    }

    gl.clearColor(
      this._backgroundColor.r(),
      this._backgroundColor.g(),
      this._backgroundColor.b(),
      this._backgroundColor.a()
    );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);

    const s = node.scene();
    s.paint();
    s.render(sceneSize.width(), sceneSize.height());

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const p = new TexturePainter(
      this.window(),
      shaders.framebufferTexture as number,
      sceneSize.width(),
      sceneSize.height()
    );
    p.drawWholeTexture(
      sceneX - sceneSize.width() / 2,
      sceneY - sceneSize.height() / 2,
      sceneSize.width(),
      sceneSize.height(),
      node.groupScale()
    );
    this._textures.push(p);
  }

  weight(): number {
    return this._mass * this._consecutiveRenders;
  }

  initBlockBuffer(counts: any) {
    this._consecutiveRenders = 0;
    this._mass = counts.numBlocks;
    this._elements = [];
    this._blockPainter.initBuffer(counts.numBlocks);
    if (counts.numExtents) {
      this._extentPainter.initBuffer(counts.numExtents);
    }
    if (counts.numGlyphs) {
      for (const fullFontName in counts.numGlyphs) {
        if (
          Object.prototype.hasOwnProperty.call(counts.numGlyphs, fullFontName)
        ) {
          const numGlyphs = counts.numGlyphs[fullFontName];
          let fontPainter = this._fontPainters[fullFontName];
          if (!fontPainter) {
            fontPainter = new GlyphPainter(this.window(), numGlyphs.font);
            this._fontPainters[fullFontName] = fontPainter;
          }
          fontPainter.initBuffer(numGlyphs);
        }
      }
    }
  }

  countNode(node: Node<DefaultNodeType>, counts: any): void {
    if (!counts.numBlocks) {
      counts.numBlocks = 0;
    }

    if (this.isExtentRenderingEnabled()) {
      if (!counts.numExtents) {
        counts.numExtents = 0;
      }
      forEachCardinalDirection(function (direction: Direction) {
        const extent = node.extentsAt(direction);
        counts.numExtents += extent.numBounds();
      }, this);
    }

    if (node.type().is(Type.SLIDER)) {
      if (node.parentDirection() === Direction.UPWARD) {
        // Only downward direction is currently supported.
        ++counts.numBlocks;
      }
      // One for the joining line.
      ++counts.numBlocks;
      // One for the block.
      ++counts.numBlocks;
    } else {
      forEachCardinalDirection(function (direction: Direction) {
        if (node.parentDirection() == direction) {
          return;
        }
        if (node.hasChild(direction)) {
          // Count one for the line
          ++counts.numBlocks;
        }
      }, this);

      // One for the block.
      ++counts.numBlocks;
    }

    if (!node.realLabel()) {
      return;
    }

    const font = node.realLabel().font();
    const fontPainter = this.getFontPainter(font);

    if (isNaN(this._pagesPerGlyphTexture)) {
      const glTextureSize = this.window().textureSize();
      if (this.gl().isContextLost()) {
        return;
      }
      const pagesPerRow = glTextureSize / fontPainter.font().pageTextureSize();
      this._pagesPerGlyphTexture = Math.pow(pagesPerRow, 2);
    }
    if (isNaN(this._pagesPerGlyphTexture)) {
      return;
    }

    if (!counts.numGlyphs) {
      counts.numGlyphs = {};
    }

    let numGlyphs = counts.numGlyphs[font.fullName()];
    if (!numGlyphs) {
      numGlyphs = { font: font };
      counts.numGlyphs[font.fullName()] = numGlyphs;
    }

    node.glyphCount(numGlyphs, this._pagesPerGlyphTexture);
    // console.log(node + " Count=" + counts.numBlocks);
  }

  paint(paintContext: Component): void {
    const paintGroup = this._node;
    const counts: { [key: string]: number } = {};
    paintGroup.forEachNode((node: Node<DefaultNodeType>) => {
      // console.log("Counting node " + node);
      this.countNode(node, counts);
    });
    // console.log("Glyphs: " + counts.numGlyphs);
    this.initBlockBuffer(counts);
    paintGroup.forEachNode((node: Node<DefaultNodeType>) => {
      this.drawNode(node);
    });

    this._elements.forEach((elem) => elem.paint(paintContext));
  }

  drawNode(node: Node<DefaultNodeType>) {
    const gl = this.gl();
    if (gl.isContextLost()) {
      return;
    }
    if (this.isExtentRenderingEnabled() && !node.isRoot()) {
      this.paintExtent(node);
    }
    checkGLError(gl, "Before Node drawNode");

    switch (node.type().type()) {
      case Type.SLIDER:
        return this.drawSlider(node);
      case Type.SCENE:
        this.paintLines(node);
        this.paintBlock(node);
        return this.drawScene(node);
      case Type.ELEMENT:
        this.paintLines(node);
        this.drawElement(node);
        break;
      default:
        this.paintLines(node);
        this.paintBlock(node);
    }
    checkGLError(gl, "After Node drawNode");
  }

  drawLine(direction: Direction, node: Node<DefaultNodeType>) {
    if (node.parentDirection() == direction) {
      return;
    }
    if (!node.hasChild(direction)) {
      // Do not draw lines unless there is a node.
      return;
    }
    const directionData = node.neighborAt(direction);

    const selectedColor = SELECTED_LINE_COLOR.premultiply(
      this.backgroundColor()
    );
    const color = LINE_COLOR.premultiply(this.backgroundColor());

    const painter = this._blockPainter;
    if (node.isSelected() && node.isSelectedAt(direction)) {
      painter.setBorderColor(selectedColor);
      painter.setBackgroundColor(selectedColor);
    } else {
      // Not selected.
      painter.setBorderColor(color);
      painter.setBackgroundColor(color);
    }

    const parentScale = node.groupScale();
    const scale = directionData.getNode().groupScale();
    if (typeof scale !== "number" || isNaN(scale)) {
      console.log(directionData.node);
      throw new Error(
        directionData.node + "'s groupScale must be a number but was " + scale
      );
    }

    const thickness = LINE_THICKNESS * scale * directionData.getNode().scale();
    // console.log(thickness, scale);
    if (isVerticalDirection(direction)) {
      const length =
        directionSign(direction) *
        parentScale *
        (directionData.lineLength -
         directionSign(direction) * node.size().height() / 2 );
      painter.drawBlock(
        node.groupX(),
        node.groupY() + length / 2 + parentScale * directionSign(direction) * node.size().height() / 2,
        thickness,
        Math.abs(length),
        0,
        0,
        scale
      );
    } else {
      // Horizontal line.
      const length =
        directionSign(direction) *
        parentScale *
        (directionData.lineLength -
         directionSign(direction) * node.size().width() / 2 );
      painter.drawBlock(
        node.groupX() + length / 2 + parentScale * directionSign(direction) * node.size().width() / 2,
        node.groupY(),
        Math.abs(length),
        thickness,
        0,
        0,
        scale
      );
    }
  }

  paintLines(node: Node<DefaultNodeType>) {
    forEachCardinalDirection((dir: Direction) => {
      this.drawLine(dir, node);
    });
  }

  paintBound(node: Node<DefaultNodeType>, rect: Rect) {
    if (isNaN(rect.height()) || isNaN(rect.width())) {
      return;
    }
    this._extentPainter.drawBlock(
      rect.x() + rect.width() / 2,
      rect.y() + rect.height() / 2,
      rect.width(),
      rect.height(),
      EXTENT_BORDER_ROUNDEDNESS,
      EXTENT_BORDER_THICKNESS,
      node.groupScale()
    );
  }

  paintDownwardExtent(node: Node<DefaultNodeType>) {
    const extent = node.extentsAt(Direction.DOWNWARD);
    const rect = new Rect(
      node.groupX() -
        node.groupScale() * node.extentOffsetAt(Direction.DOWNWARD),
      node.groupY(),
      0,
      0
    );

    extent.forEach((length: number, size: number) => {
      length *= node.groupScale();
      size *= node.groupScale();
      rect.setWidth(length);
      rect.setHeight(size);
      this.paintBound(node, rect);
      rect.setX(rect.x() + length);
    });
  }

  paintUpwardExtent(node: Node<DefaultNodeType>) {
    const extent = node.extentsAt(Direction.UPWARD);
    const rect = new Rect(
      node.groupX() - node.groupScale() * node.extentOffsetAt(Direction.UPWARD),
      0,
      0,
      0
    );

    extent.forEach((length: number, size: number) => {
      length *= node.groupScale();
      size *= node.groupScale();
      rect.setY(node.groupY() - size);
      rect.setWidth(length);
      rect.setHeight(size);
      this.paintBound(node, rect);
      rect.setX(rect.x() + length);
    });
  }

  paintBackwardExtent(node: Node<DefaultNodeType>) {
    const extent = node.extentsAt(Direction.BACKWARD);
    const rect = new Rect(
      0,
      node.groupY() -
        node.groupScale() * node.extentOffsetAt(Direction.BACKWARD),
      0,
      0
    );

    extent.forEach((length: number, size: number) => {
      length *= node.groupScale();
      size *= node.groupScale();
      rect.setHeight(length);
      rect.setX(node.groupX() - size);
      rect.setWidth(size);
      this.paintBound(node, rect);
      rect.setY(rect.y() + length);
    });
  }

  paintForwardExtent(node: Node<DefaultNodeType>) {
    const extent = node.extentsAt(Direction.FORWARD);
    const rect = new Rect(
      node.groupX(),
      node.groupY() -
        node.extentOffsetAt(Direction.FORWARD) * node.groupScale(),
      0,
      0
    );

    extent.forEach((length: number, size: number) => {
      length *= node.groupScale();
      size *= node.groupScale();
      rect.setHeight(length);
      rect.setWidth(size);
      this.paintBound(node, rect);
      rect.setY(rect.y() + length);
    });
  }

  paintExtent(node: Node<DefaultNodeType>) {
    const painter = this._extentPainter;
    painter.setBorderColor(EXTENT_BORDER_COLOR);
    painter.setBackgroundColor(EXTENT_BACKGROUND_COLOR);

    this.paintDownwardExtent(node);
    this.paintUpwardExtent(node);
    // this.paintBackwardExtent(node);
    // this.paintForwardExtent(node);
  }

  paintBlock(node: Node<DefaultNodeType>): void {
    const style = node.blockStyle();
    const painter = this._blockPainter;

    /* // Set colors if selected.
        if(node.isSelected()) {
            painter.setBorderColor(
                style.selectedBorderColor.premultiply(
                    node.backdropColor()
                )
            );
            painter.setBackgroundColor(
                style.selectedBackgroundColor.premultiply(
                    node.backdropColor()
                )
            );
        } else */ {
      painter.setBorderColor(
        style.borderColor.premultiply(node.backdropColor())
      );
      painter.setBackgroundColor(
        style.backgroundColor.premultiply(node.backdropColor())
      );
    }

    // Draw the block.
    const size = node.groupSize(this.bodySize);
    // console.log(nameType(node.type()) +
    //   " x=" +
    //   node.groupX() +
    //   ", " +
    //   node.groupY());
    painter.drawBlock(
      node.groupX(),
      node.groupY(),
      size.width(),
      size.height(),
      style.borderRoundness,
      style.borderThickness,
      node.groupScale()
    );

    // Draw the label.
    const label = node.realLabel();
    if (!label) {
      return;
    }
    const fontScale = (style.fontSize * node.groupScale()) / label.fontSize();
    let labelX;
    let labelY;
    const fontPainter = this.getFontPainter(label.font());
    fontPainter.setColor(
      node.isSelected() ? style.selectedFontColor : style.fontColor
    );
    if (node.hasNode(Direction.INWARD)) {
      const nodeSize = node.sizeWithoutPadding(this.bodySize);
      if (
        node.nodeAlignmentMode(Direction.INWARD) == Alignment.INWARD_VERTICAL
      ) {
        // Align vertical.
        labelX = node.groupX() - (fontScale * label.width()) / 2;
        labelY = node.groupY() - (node.groupScale() * nodeSize.height()) / 2;
      } else {
        // Align horizontal.
        labelX = node.groupX() - (node.groupScale() * nodeSize.width()) / 2;
        labelY = node.groupY() - (fontScale * label.height()) / 2;
      }
    } else {
      labelX = node.groupX() - (fontScale * label.width()) / 2;
      labelY = node.groupY();
    }
    const l = node.realLabel();
    l._x = labelX;
    l._y = labelY;
    l._scale = fontScale;
    label.paint(fontPainter, labelX, labelY, fontScale);
  }

  render(
    world: Matrix3x3,
    scale: number,
    forceSimple: boolean,
    camera: Camera,
    paintContext: Component
  ): void {
    // console.log("RENDERING THE NODE from nodepainter");
    ++this._consecutiveRenders;
    const gl = this.gl();
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    if (this._renderBlocks) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      this._blockPainter.render(world, scale, forceSimple);
    }
    if (this._renderExtents) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);
      this._extentPainter.render(world, scale);
    }

    if (!forceSimple && this._renderText) {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      for (const fontName in this._fontPainters) {
        if (
          Object.prototype.hasOwnProperty.call(this._fontPainters, fontName)
        ) {
          const fontPainter = this._fontPainters[fontName];
          fontPainter.render(world, scale);
        }
      }
    }

    if (this._textures.length > 0) {
      this._textures.forEach(function (t) {
        t.render(world);
      });
    }

    this._elements.forEach((elem) => elem.render(camera, paintContext));
  }

  enableExtentRendering(): void {
    this._renderExtents = true;
  }

  disableExtentRendering(): void {
    this._renderExtents = false;
  }

  isExtentRenderingEnabled(): boolean {
    return this._renderExtents;
  }

  enableBlockRendering(): void {
    this._renderBlocks = true;
  }

  disableBlockRendering(): void {
    this._renderBlocks = false;
  }

  isBlockRenderingEnabled(): boolean {
    return this._renderBlocks;
  }

  enableLineRendering(): void {
    this._renderLines = true;
  }

  disableLineRendering(): void {
    this._renderLines = false;
  }

  isLineRenderingEnabled(): boolean {
    return this._renderLines;
  }

  enableTextRendering(): void {
    this._renderText = true;
  }

  disableTextRendering(): void {
    this._renderText = false;
  }

  isTextRenderingEnabled(): boolean {
    return this._renderText;
  }

  enableSceneRendering(): void {
    this._renderScenes = true;
  }

  disableSceneRendering(): void {
    this._renderScenes = false;
  }

  isSceneRenderingEnabled(): boolean {
    return this._renderScenes;
  }
}
