import { defaultFont } from "./settings";

import Label from "./Label";
import { BasicWindow } from "parsegraph-window";
import WindowNodePainter from "./WindowNodePainter";
import Color from "parsegraph-color";
import Font from "./Font";
import Size from "parsegraph-size";

import NodeType from "./NodeType";

import {
  Direction,
  Axis,
  NodePalette,
  PreferredAxis,
  Alignment
} from "parsegraph-direction";
import Method from "parsegraph-method";
import WindowNode from "./WindowNode";

export function arrayRemove(list: any[], key: any): boolean {
  for (let i = 0; i < list.length; ++i) {
    if (list[i] === key) {
      list.splice(i, 1);
      return true;
    }
  }
  return false;
}

export function arrayRemoveAll(list: any[], key: any): number {
  let removals = 0;
  while (arrayRemove(list, key)) {
    ++removals;
  }
  return removals;
}

export class CustomEvents {
  _listeners: Method[];

  constructor() {
    this._listeners = null;
  }

  emit(...args: any): void {
    console.log("Emitting ", ...args);
    if (!this._listeners) {
      return;
    }
    this._listeners.forEach((listener) => {
      listener.apply(args);
    });
  }

  listen(func: Function, funcThisArg?: object): Method {
    if (!this._listeners) {
      this._listeners = [];
    }
    const method = new Method(func, funcThisArg);
    this._listeners.push(method);
    return method;
  }

  stopListening(method: Method): boolean {
    if (!this._listeners) {
      return false;
    }
    const removed = arrayRemove(this._listeners, method);
    if (this._listeners.length == 0) {
      this._listeners = null;
    }
    return removed;
  }
}

export default class Node<T extends NodeType<T>> extends WindowNode {
  _type: T;
  _scene: any;
  _label: Label;
  _selected: boolean;
  _events: CustomEvents;
  _style: object;

  constructor(newType: T, fromNode?: Node<T>, parentDirection?: Direction) {
    super(fromNode, parentDirection);
    this._type = newType;
    this._style = {};
    this._type.applyStyle(this);

    this._scene = null;
    this._label = null;
    this._selected = false;
  }

  horizontalPadding(): number {
    return this.blockStyle().horizontalPadding;
  }

  verticalPadding(): number {
    return this.blockStyle().verticalPadding;
  }

  size(bodySize?: Size): Size {
    bodySize = this.sizeWithoutPadding(bodySize);
    bodySize[0] += 2 * this.horizontalPadding() + 2 * this.borderThickness();
    bodySize[1] += 2 * this.verticalPadding() + 2 * this.borderThickness();
    // console.log("Calculated node size of (" + bodySize[0] + ", " +
    // bodySize[1] + ")");
    return bodySize;
  }

  getSeparation(axis: Axis, dir: Direction) {
    switch (axis) {
      case Axis.VERTICAL:
        return this.type().verticalSeparation(this, dir);
      case Axis.HORIZONTAL:
        return this.type().horizontalSeparation(this, dir);
      case Axis.Z:
        switch (this.nodeAlignmentMode(Direction.INWARD)) {
          case Alignment.INWARD_VERTICAL:
            return this.verticalPadding() + this.borderThickness();
          default:
            return this.horizontalPadding() + this.borderThickness();
        }
    }
  }

  borderThickness(): number {
    return this.blockStyle().borderThickness;
  }

  blockStyle(): any {
    return this._style;
  }

  setBlockStyle(style: object): void {
    if (this._style == style) {
      // Ignore idempotent style changes.
      return;
    }
    this._style = style;
    this.layoutWasChanged(Direction.INWARD);
  }

  palette(): NodePalette<Node<T>> {
    return this.type().palette();
  }

  newPainter(window: BasicWindow, paintContext: any): WindowNodePainter {
    return this.type().newPainter(window, this, paintContext);
  }

  sizeWithoutPadding(bodySize?: Size): Size {
    return this.type().sizeWithoutPadding(this, bodySize);
  }

  supportsDirection(inDirection: Direction): boolean {
    return this.type().supportsDirection(inDirection);
  }

  spawnNode(inDirection: Direction, newType: any): Node<T> {
    const node = this.type().palette().spawn(newType) as this;
    this.connectNode(inDirection, node);
    node.setLayoutPreference(PreferredAxis.PERPENDICULAR);
    node.setNodeFit(this.nodeFit());
    return node;
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
    return "[Node " + this._id + "]";
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

  label(): string {
    const l = this.realLabel();
    if (!l) {
      return null;
    }
    return l.getText();
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

  events(): CustomEvents {
    if (!this._events) {
      this._events = new CustomEvents();
    }
    return this._events;
  }

  isSelectedAt(direction: Direction): boolean {
    if (!this.hasNode(direction)) {
      return false;
    }
    return this.nodeAt(direction).isSelected();
  }

  isSelected(): boolean {
    return this._selected;
  }

  setSelected(selected: boolean): void {
    // console.log(new Error("setSelected(" + selected + ")"));
    this._selected = selected;
  }
}
