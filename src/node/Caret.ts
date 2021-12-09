import { Direction, readDirection } from "parsegraph-direction";
import DefaultNodePalette from "./DefaultNodePalette";
import DefaultNodeType, { Type } from "./DefaultNodeType";
import WindowCaret from "../windownode/WindowCaret";
import Node from "./Node";
import { defaultFont } from "../settings";
import Font from "parsegraph-font";

export default class Caret extends WindowCaret<Node<DefaultNodeType>> {
  _font: Font;

  constructor(
    given?: Node<DefaultNodeType> | string | Type,
    mathMode?: boolean
  ) {
    super(new DefaultNodePalette(mathMode), given);
  }

  element(elem?: any): any {
    if (elem === undefined) {
      return this.node().value().element();
    }
    this.node().value().setElement(elem);
    return this;
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

  label(...args: any[]) {
    let node;
    let text;
    let font;
    switch (args.length) {
      case 0:
        return this.node().label();
      case 1:
        node = this.node();
        text = args[0];
        font = this.font();
        break;
      case 2:
        if (typeof args[1] === "object") {
          node = this.node();
          text = args[0];
          font = args[1];
        } else {
          node = this.node();
          node = node.nodeAt(readDirection(args[0]));
          text = args[1];
          font = this.font();
          // console.log(typeof args[0]);
          // console.log(typeof args[1]);
        }
        break;
      case 3:
        node = this.node();
        node = node.nodeAt(readDirection(args[0]));
        text = args[1];
        font = args[2];
        break;
    }
    node.value().setLabel(text, font);
  }

  select(inDirection?: Direction | string): void {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    node.value().setSelected(true);
  }

  selected(inDirection?: Direction | string): boolean {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    return node.value().isSelected();
  }

  deselect(inDirection?: Direction | string): void {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    node.value().setSelected(false);
  }

  clone(): Caret {
    const car = new Caret(this.node());
    car.setFont(this.font());
    return car;
  }
}
