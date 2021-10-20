import { Direction, readDirection } from "parsegraph-direction";
import EventNode from "./EventNode";
import WindowCaret from "./WindowCaret";

export default class EventCaret<T extends EventNode> extends WindowCaret<T> {
  clone(): EventCaret<T> {
    const car = new EventCaret<T>(this.palette(), this.node());
    car.setFont(this.font());
    return car;
  }

  onClick(clickListener: Function, thisArg?: object): void {
    this.node().setClickListener(clickListener, thisArg);
  }

  onChange(changeListener: Function, thisArg?: object): void {
    this.node().setChangeListener(changeListener, thisArg);
  }

  onKey(keyListener: Function, thisArg?: object): void {
    this.node().setKeyListener(keyListener, thisArg);
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
}
