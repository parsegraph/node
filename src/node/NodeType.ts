import { Direction, NodePalette } from "parsegraph-direction";
import Node from "./Node";
import Size from "parsegraph-size";
import WindowNodePainter from "./WindowNodePainter";
import { BasicWindow, Component } from "parsegraph-window";

export default interface NodeType<T extends NodeType<T>> {
  supportsDirection(dir: Direction): boolean;
  name(): string;
  palette(): NodePalette<Node<T>>;
  applyStyle(node: Node<T>): void;
  sizeWithoutPadding(node: Node<T>, bodySize?: Size): Size;

  horizontalSeparation(node: Node<T>, direction: Direction): number;
  verticalSeparation(node: Node<T>, direction: Direction): number;

  acceptsSelection(node: Node<T>): boolean;
  newPainter(
    window: BasicWindow,
    node: Node<T>,
    paintContext: Component
  ): WindowNodePainter;
  promiscuousClicks(node: Node<T>): boolean;
}
