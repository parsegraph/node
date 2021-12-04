import SpotlightPainter from "parsegraph-spotlightpainter";
import Color from "parsegraph-color";
import Animator from "parsegraph-animator";
import lerp from "parsegraph-lerp";
import smoothstep from "parsegraph-smoothstep";
import { Component } from "parsegraph-window";
import { LayoutNode } from "parsegraph-layout";
import { Matrix3x3 } from "parsegraph-matrix";

const FOCUSED_SPOTLIGHT_COLOR = new Color(1, 1, 1, 0.5);
const FOCUSED_SPOTLIGHT_SCALE = 6;

export default class AnimatedSpotlight {
  _viewport: Component;
  _painter: SpotlightPainter;
  _animator: Animator;
  _fromNode: LayoutNode;
  _toNode: LayoutNode;
  _spotlightColor: Color;
  constructor(viewport: Component) {
    this._viewport = viewport;
    this._painter = null;
    this._animator = new Animator(480);
    this._fromNode = null;
    this._toNode = null;
    this._spotlightColor = FOCUSED_SPOTLIGHT_COLOR;
  }

  contextChanged(isLost: boolean) {
    if (this._painter) {
      this._painter.contextChanged(isLost);
    }
  }

  clear() {
    if (this._painter) {
      this._painter.clear();
    }
  }

  focusedNode() {
    return this._toNode;
  }

  getSpotlightScale(node: LayoutNode) {
    const s = node.absoluteSize();
    const srad = Math.min(
      FOCUSED_SPOTLIGHT_SCALE * s.width() * node.absoluteScale(),
      FOCUSED_SPOTLIGHT_SCALE * s.height() * node.absoluteScale()
    );
    return srad;
  }

  drawNodeFocus() {
    const node = this.focusedNode();
    const srad = this.getSpotlightScale(node);
    this.drawSpotlight(
      node.absoluteX(),
      node.absoluteY(),
      srad,
      this._spotlightColor
    );
  }

  animator() {
    return this._animator;
  }

  restart(toNode: LayoutNode) {
    this.animator().restart();
    this._fromNode = this._toNode;
    this._toNode = toNode;
    this._viewport.scheduleUpdate();
  }

  drawSpotlight(x: number, y: number, srad: number, color: Color) {
    if (!this._painter) {
      this._painter = new SpotlightPainter(this._viewport.window());
    }
    // console.log(x, y, srad, color);
    this._painter.drawSpotlight(x, y, srad, color);
  }

  animating() {
    return this.animator().animating();
  }

  animate(t: number) {
    if (!this._toNode) {
      throw new Error("Cannot animate to nothing");
    }
    t = smoothstep(t);
    let x = this._toNode.absoluteX();
    let y = this._toNode.absoluteY();
    let scale = this.getSpotlightScale(this._toNode);
    if (this._fromNode) {
      x = lerp(this._fromNode.absoluteX(), x, t);
      y = lerp(this._fromNode.absoluteY(), y, t);
      scale = lerp(this.getSpotlightScale(this._fromNode), scale, t);
    }
    this.drawSpotlight(x, y, scale, this._spotlightColor);
  }

  paint() {
    // console.log("Painting animated spotlight");
    this.clear();
    if (!this.animating()) {
      this.drawNodeFocus();
    }
  }

  render(world: Matrix3x3) {
    // console.log("Rendering animated spotlight");
    if (this.animator().animating()) {
      this.clear();
      const t = this.animator().t();
      if (t >= 1) {
        this.animator().stop();
      }
      this.animate(t);
    }
    if (this._painter) {
      this._painter.render(world);
    }
    return this.animating();
  }
}
