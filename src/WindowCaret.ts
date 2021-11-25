import Direction, { readDirection, NodePalette } from "parsegraph-direction";
import { defaultFont } from "./settings";
import Font from "./Font";
import World from "./World";
import WindowNode, { KeyListener } from "./WindowNode";
import { LayoutCaret } from "parsegraph-layout";

export default class WindowCaret<T extends WindowNode> extends LayoutCaret<T> {
  _font: Font;
  _world: World;

  constructor(palette: NodePalette<T>, given?: any) {
    super(palette, given);
    this._font = defaultFont();
    this._world = null;
  }

  element(elem?: any): any {
    if (elem === undefined) {
      return this.node().element();
    }
    this.node().setElement(elem);
    return this;
  }

  clone(): WindowCaret<T> {
    const car = new WindowCaret<T>(this.palette(), this.node());
    car.setFont(this.font());
    car.setWorld(this._world);
    return car;
  }

  onClick(clickListener: Function, thisArg?: object): void {
    this.node().setClickListener(clickListener, thisArg);
  }

  onKey(keyListener: KeyListener, thisArg?: object): void {
    this.node().setKeyListener(keyListener, thisArg);
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Style and UI-related methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  setFont(font: Font): void {
    this._font = font;
  }

  font(): Font {
    if (!this._font) {
      throw new Error("Caret does not have a Font");
    }
    return this._font;
  }

  setWorld(world: World): void {
    this._world = world;
  }

  freeze(inDirection?: Direction | string): void {
    // Interpret the given direction for ease-of-use.
    inDirection = readDirection(inDirection);
    let node: T;
    if (arguments.length === 0) {
      node = this.node();
    } else {
      node = this.node().nodeAt(inDirection);
    }
    if (!this._world) {
      throw new Error("Caret must have a world in order to freeze nodes");
    }
    node.freeze(this._world.freezer());
  }

  thaw(inDirection?: Direction | string): void {
    // Interpret the given direction for ease-of-use.
    inDirection = readDirection(inDirection);
    let node: T;
    if (arguments.length === 0) {
      node = this.node();
    } else {
      node = this.node().nodeAt(inDirection);
    }
    node.thaw();
  }
}
