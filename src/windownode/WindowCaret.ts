import Direction, { DirectionNode, DirectionCaret, readDirection } from "parsegraph-direction";
import World from "../World";
import Painted from "./Painted";
import Interactive from "../interact/Interactive";
import Freezable from "../freezer/Freezable";
import {EventListener, FocusListener, KeyListener} from "../interact/Interaction";

export default class WindowCaret<Value extends Painted & Interactive & Freezable> extends DirectionCaret<Value> {
  _world: World;

  clone(): WindowCaret<Value> {
    const car = new WindowCaret<Value>(this.node(), this.palette());
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

  setWorld(world: World): void {
    this._world = world;
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
    node.value().getCache().freeze(this._world.freezer());
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
    node.value().getCache().thaw();
  }
}
