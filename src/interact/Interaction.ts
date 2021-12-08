import { Component, Keystroke } from "parsegraph-window";
import Interactive from "./Interactive";

export type KeyListener = (event: Keystroke, comp: Component) => boolean;

export type EventListener = (comp: Component) => boolean;
export type FocusListener = (focused:boolean, comp: Component) => boolean;

import Method from 'parsegraph-method';

export default class Interaction {
  _ignoresMouse: boolean;
  _keyListener: Method<KeyListener>;
  _clickListener: Method<EventListener>;
  _focusListener: Method<FocusListener>;
  _prevInteractive: Interactive;
  _nextInteractive: Interactive;

  constructor() {
    this._ignoresMouse = false;
    this._keyListener = null;
    this._clickListener = null;
    this._focusListener = null;
    this._prevInteractive = null;
    this._nextInteractive = null;
  }

  setClickListener(listener: EventListener, thisArg?: object): void {
    if (!listener) {
      this._clickListener = null;
      return;
    }
    this._clickListener = new Method(listener, thisArg || this);
    // console.log("Set click listener for node " + this._id);
  }

  isClickable(): boolean {
    return this.hasClickListener() || !this.ignoresMouse();
  }

  setIgnoreMouse(value: boolean): void {
    if (!value) {
      return;
    }
    this._ignoresMouse = value;
  }

  ignoresMouse(): boolean {
    return this._ignoresMouse;
  }

  hasClickListener(): boolean {
    return this._clickListener != null;
  }

  click(comp: Component): any {
    // Invoke the click listener.
    if (!this.hasClickListener()) {
      return;
    }
    return this._clickListener.call(
      comp,
      this
    );
  }

  setKeyListener(listener: KeyListener, thisArg?: object): void {
    if (!listener) {
      this._keyListener = null;
      return;
    }
    this._keyListener = new Method(listener, thisArg || this);
  }

  hasKeyListener(): boolean {
    return this._keyListener != null;
  }

  key(event: Keystroke, comp?: Component): any {
    // Invoke the key listener.
    if (!this.hasKeyListener()) {
      return;
    }
    return this._keyListener.call(
      event,
      comp
    );
  }

  setFocusListener(listener: FocusListener, thisArg?: object): void {
    if (!listener) {
      this._focusListener = null;
      return;
    }
    this._focusListener = new Method(listener, thisArg || this);
  }

  hasFocusListener() {
    return this._focusListener != null;
  }

  focus(comp?: Component) {
    if (!this.hasFocusListener()) {
      return false;
    }
    return this._focusListener.call(true, comp);
  }

  blur(comp?: Component) {
    if (!this.hasFocusListener()) {
      return false;
    }
    return this._focusListener.call(false, comp);
  }

}
