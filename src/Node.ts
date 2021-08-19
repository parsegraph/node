import {
  defaultFont,
} from './settings';

import Label from './Label';
import Window from 'parsegraph-window';
import NodePainter from './NodePainter';
import Color from 'parsegraph-color';
import Font from './Font';
import Size from 'parsegraph-size';

import NodeType from './NodeType';

import {
  Direction, NodePalette, PreferredAxis
} from 'parsegraph-direction';
import EventNode from './EventNode';

export default class Node<T extends NodeType<T>> extends EventNode {
  _type: T;
  _scene: any;
  _element: any;
  _label: Label;

  constructor(newType: T, fromNode?: Node<T>, parentDirection?: Direction) {
    super(fromNode, parentDirection);
    this._type = newType;
    this._type.applyStyle(this);

    this._scene = null;
    this._element = null;
    this._label = null;
  }

  palette():NodePalette<EventNode> {
    return this.type().palette();
  }

  newPainter(window:Window):NodePainter {
    return this.type().newPainter(window, this);
  }

  sizeWithoutPadding(bodySize?: Size): Size {
    return this.type().sizeWithoutPadding(this, bodySize);
  }

  supportsDirection(inDirection:Direction):boolean {
    return this.type().supportsDirection(inDirection);
  }

  spawnNode(inDirection:Direction, newType:any):Node<T> {
    const node = this.type().palette().spawn(newType) as this;
    this.connectNode(inDirection, node);
    node.setLayoutPreference(PreferredAxis.PERPENDICULAR);
    node.setNodeFit(this.nodeFit());
    return node;
  }

  verticalSeparation(direction: Direction): number {
    return this.type().verticalSeparation(this, direction);
  }

  horizontalSeparation(direction: Direction): number {
    return this.type().horizontalSeparation(this, direction);
  }

  type(): T {
    return this._type;
  }

  setType(newType: T): void {
    if (this._type === newType) {
      return;
    }
    this._type = newType;
    this._type.applyStyle(this);
    this.layoutWasChanged(Direction.INWARD);
  }

  typeAt(direction: Direction): T {
    if (!this.hasNode(direction)) {
      return null;
    }
    return this.nodeAt(direction).type();
  }

  toString(): string {
    return '[Node ' + this._id + ']';
  }

  backdropColor(): Color {
    const node: Node<T> = this;
    if (node.isSelected()) {
      return node.blockStyle().backgroundColor;
    }
    return node.blockStyle().selectedBackgroundColor;
  }

  isClickable(): boolean {
    if (this._label) {
      const label = this._label;
      if (label && !isNaN(label._x) && label.editable()) {
        return;
      }
    }

    return this.type().promiscuousClicks(this) || super.isClickable();
  }

  scene(): any {
    return this._scene;
  }

  setScene(scene: any): void {
    this._scene = scene;
    this.layoutWasChanged(Direction.INWARD);
  }

  element(): any {
    return this._element;
  }

  setElement(element: any): void {
    this._element = element;
    this.layoutWasChanged(Direction.INWARD);
  }

  label(): string {
    const l = this.realLabel();
    if (!l) {
      return null;
    }
    return l.text();
  }

  glyphCount(counts: any, pagesPerTexture: number): number {
    const l = this.realLabel();
    if (!l) {
      return 0;
    }
    return l.glyphCount(counts, pagesPerTexture);
  }

  realLabel(): Label {
    return this._label;
  }

  setLabel(text: string, font?: Font): void {
    if (!font) {
      font = defaultFont();
    }
    if (!this._label) {
      this._label = new Label(font);
    }
    this._label.setText(text);
    this.layoutWasChanged();
  }

  acceptsSelection(): boolean {
    return this.type().acceptsSelection(this);
  }
}
