import Direction, {
  readDirection,
  NodePalette
} from 'parsegraph-direction';
import {defaultFont} from './settings';
import Font from './Font';
import World from './World';
import WindowNode from './WindowNode';
import {LayoutCaret} from 'parsegraph-layout';

export default class WindowCaret<T extends WindowNode> extends LayoutCaret<T> {
  _font: Font;
  _world:World;

  /**
   * Accepts either no arguments, a Node, or a type or a reference to a type.
   */
  constructor(nodePalette:NodePalette<T>, type?:any) {
    super(nodePalette, type);
    this._font = defaultFont();
    this._world = null;
  }

  clone(): WindowCaret<T> {
    const car = new WindowCaret<T>(this.palette(), this.node());
    car.setFont(this.font());
    return car;
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
      throw new Error('Caret does not have a Font');
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
      throw new Error('Caret must have a world in order to freeze nodes');
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
