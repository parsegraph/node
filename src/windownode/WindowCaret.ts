import Direction, { DirectionNode, DirectionCaret, readDirection } from "parsegraph-direction";
import { defaultFont } from "../settings";
import Font from "parsegraph-font";
import World from "../World";
import Painted from "./Painted";
import Interactive from "../interact/Interactive";
import {EventListener, FocusListener, KeyListener} from "../interact/Interaction";

export default class WindowCaret<Value extends Painted & Interactive> extends DirectionCaret<Value> {
  _font: Font;
  _world: World;

  clone(): WindowCaret<Value> {
    const car = new WindowCaret<Value>(this.node(), this.palette());
    car.setFont(this.font());
    car.setWorld(this._world);
    return car;
  }

  onClick(clickListener: EventListener, thisArg?: object): void {
    this.node().value().interact().setClickListener(clickListener, thisArg);
  }

  onKey(keyListener: KeyListener, thisArg?: object): void {
    this.node().value().interact().setKeyListener(keyListener, thisArg);
  }

  onFocus(focusListener: FocusListener, thisArg?: object): void {
    this.node().value().interact().setFocusListener(focusListener, thisArg);
  }

  setFont(font: Font): void {
    this._font = font;
  }

  font(): Font {
    if (!this._font) {
      this._font = defaultFont();
    }
    return this._font;
  }

  setWorld(world: World): void {
    this._world = world;
  }

  element(elem?: any): any {
    if (elem === undefined) {
      return this.node().value().element();
    }
    this.node().value().setElement(elem);
    return this;
  }

  freeze(inDirection?: Direction | string): void {
    // Interpret the given direction for ease-of-use.
    inDirection = readDirection(inDirection);
    let node: DirectionNode<Value>;
    if (arguments.length === 0) {
      node = this.node();
    } else {
      node = this.node().nodeAt(inDirection);
    }
    if (!this._world) {
      throw new Error("Caret must have a world in order to freeze nodes");
    }
    node.value().freeze(this._world.freezer());
  }

  thaw(inDirection?: Direction | string): void {
    // Interpret the given direction for ease-of-use.
    inDirection = readDirection(inDirection);
    let node: DirectionNode<Value>;
    if (arguments.length === 0) {
      node = this.node();
    } else {
      node = this.node().nodeAt(inDirection);
    }
    node.value().thaw();
  }
}
