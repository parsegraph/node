import { Direction, readDirection } from "parsegraph-direction";
import TestSuite from "parsegraph-testsuite";
import DefaultNodePalette from "./DefaultNodePalette";
import DefaultNodeType, { Type } from "./DefaultNodeType";
import WindowCaret from "./WindowCaret";
import Node from "./Node";

export default class Caret extends WindowCaret<Node<DefaultNodeType>> {
  constructor(
    given?: Node<DefaultNodeType> | string | Type,
    mathMode?: boolean
  ) {
    super(new DefaultNodePalette(mathMode), given);
  }

  onChange(changeListener: Function, thisArg?: object): void {
    this.node().setChangeListener(changeListener, thisArg);
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
    node.setLabel(text, font);
  }

  select(inDirection?: Direction | string): void {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    node.setSelected(true);
  }

  selected(inDirection?: Direction | string): boolean {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    return node.isSelected();
  }

  deselect(inDirection?: Direction | string): void {
    let node = this.node();
    if (arguments.length > 0) {
      node = node.nodeAt(readDirection(inDirection));
    }
    node.setSelected(false);
  }

  clone(): Caret {
    const car = new Caret(this.node());
    car.setFont(this.font());
    return car;
  }
}

const caretTests = new TestSuite("Caret");
caretTests.addTest("new Caret", function () {
  const dnp = new DefaultNodePalette();
  let car = new Caret("s");
  const n = dnp.spawn("b");
  car = new Caret(n);
  car = new Caret();
  if (car.node().type() !== dnp.spawn().type()) {
    return car.node().type() + " is not the default.";
  }
});

caretTests.addTest("Caret.onKey", function () {
  const car = new Caret();
  car.onKey(function () {
    console.log("Key pressed");
    return true;
  });
});
