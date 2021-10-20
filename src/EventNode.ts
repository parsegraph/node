import Method from "parsegraph-method";
import Viewport from "./Viewport";

import Direction, { NodePalette } from "parsegraph-direction";
import WindowNode from "./WindowNode";
import Font from "./Font";

export function chainTab(
  a: EventNode,
  b: EventNode,
  swappedOut?: EventNode[]
): void {
  a.ensureExtended();
  b.ensureExtended();
  if (swappedOut) {
    swappedOut[0] = a ? a._extended.nextTabNode : null;
    swappedOut[1] = b ? b._extended.prevTabNode : null;
  }
  // console.log(a, b);
  if (a) {
    a._extended.nextTabNode = b;
  }
  if (b) {
    b._extended.prevTabNode = a;
  }
}

export function chainAllTabs(...args: EventNode[]): void {
  if (args.length < 2) {
    return;
  }
  const firstNode: EventNode = args[0];
  const lastNode: EventNode = args[args.length - 1];

  for (let i = 0; i <= args.length - 2; ++i) {
    chainTab(args[i], args[i + 1]);
  }
  chainTab(lastNode, firstNode);
}

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

// ////////////////////////////////////////////////////////////////////////////
//
// Extended node
//
// ////////////////////////////////////////////////////////////////////////////

export class ExtendedNode {
  ignoresMouse: boolean;
  events: CustomEvents;
  keyListener: Function;
  keyListenerThisArg: object;
  clickListener: Function;
  clickListenerThisArg: object;
  changeListener: Function;
  changeListenerThisArg: object;
  prevTabNode: EventNode;
  nextTabNode: EventNode;
  value: any;

  constructor() {
    this.ignoresMouse = false;
    this.events = null;
    this.keyListener = null;
    this.keyListenerThisArg = null;
    this.clickListener = null;
    this.clickListenerThisArg = null;
    this.changeListener = null;
    this.changeListenerThisArg = null;
    this.prevTabNode = null;
    this.nextTabNode = null;
    this.value = null;
  }

  getEvents() {
    if (!this.events) {
      this.events = new CustomEvents();
    }
    return this.events;
  }
}

export default abstract class EventNode extends WindowNode {
  _extended: ExtendedNode;
  _selected: boolean;

  // XXX Hacks for build because of Input errors
  _label: any;

  type(): any {
    return null;
  }

  abstract palette(): NodePalette<EventNode>;

  constructor(fromNode?: EventNode, parentDirection?: Direction) {
    super(fromNode, parentDirection);
    this._extended = null;
    this._selected = false;
  }

  label(): string {
    return null;
  }

  setLabel(text: string, font?: Font): void {
    console.log("Node does not support labels. Given " + text + " " + font);
    throw new Error("Node does not support labels");
  }

  events(): CustomEvents {
    return this.ensureExtended().getEvents();
  }

  toString(): string {
    return "[EventNode " + this._id + "]";
  }

  ensureExtended(): ExtendedNode {
    if (!this._extended) {
      // console.log(new Error("Extending"));
      this._extended = new ExtendedNode();
    }
    return this._extended;
  }

  setClickListener(listener: Function, thisArg?: object): void {
    if (!listener) {
      if (this._extended) {
        this._extended.clickListener = null;
        this._extended.clickListenerThisArg = null;
      }
      return;
    }
    if (!thisArg) {
      thisArg = this;
    }
    this.ensureExtended();
    this._extended.clickListener = listener;
    this._extended.clickListenerThisArg = thisArg;
    // console.log("Set click listener for node " + this._id);
  }

  setChangeListener(listener: Function, thisArg?: object): void {
    if (!listener) {
      if (this._extended) {
        this._extended.changeListener = null;
        this._extended.changeListenerThisArg = null;
      }
      return;
    }
    if (!thisArg) {
      thisArg = this;
    }
    this.ensureExtended();
    this._extended.changeListener = listener;
    this._extended.changeListenerThisArg = thisArg;
    // console.log("Set change listener for node " + this._id);
  }

  isClickable(): boolean {
    return this.hasClickListener() || !this.ignoresMouse();
  }

  setIgnoreMouse(value: boolean): void {
    if (!value && !this._extended) {
      return;
    }
    this.ensureExtended();
    this._extended.ignoresMouse = value;
  }

  ignoresMouse(): boolean {
    if (!this._extended) {
      return false;
    }
    return this._extended.ignoresMouse;
  }

  hasClickListener(): boolean {
    return this._extended && this._extended.clickListener != null;
  }

  hasChangeListener(): boolean {
    return this._extended && this._extended.changeListener != null;
  }

  valueChanged(...args: any): any {
    // Invoke the listener.
    if (!this.hasChangeListener()) {
      return;
    }
    return this._extended.changeListener.apply(
      this._extended.changeListenerThisArg,
      ...args
    );
  }

  click(viewport: Viewport): any {
    // Invoke the click listener.
    if (!this.hasClickListener()) {
      return;
    }
    return this._extended.clickListener.call(
      this._extended.clickListenerThisArg,
      viewport,
      this
    );
  }

  setKeyListener(listener: Function, thisArg?: object): void {
    if (!listener) {
      if (this._extended) {
        this._extended.keyListener = null;
        this._extended.keyListenerThisArg = null;
      }
      return;
    }
    if (!thisArg) {
      thisArg = this;
    }
    if (!this._extended) {
      this._extended = new ExtendedNode();
    }
    this._extended.keyListener = listener;
    this._extended.keyListenerThisArg = thisArg;
  }

  hasKeyListener(): boolean {
    return this._extended && this._extended.keyListener != null;
  }

  key(keyName: string, viewport?: Viewport): any {
    // Invoke the key listener.
    if (!this.hasKeyListener()) {
      return;
    }
    return this._extended.keyListener.call(
      this._extended.keyListenerThisArg,
      keyName,
      viewport
    );
  }

  value(): any {
    return this._extended && this._extended.value;
  }

  setValue(newValue: any, report?: boolean): void {
    this.ensureExtended();
    // console.log("Setting value to ", newValue);
    if (this._extended.value === newValue) {
      return;
    }
    this._extended.value = newValue;
    if (arguments.length === 1 || report) {
      this.valueChanged();
    }
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

  acceptsSelection(): boolean {
    return true;
  }
}
