import {Alignment} from 'parsegraph-layout';
import Node from './Node';
import NodeType from './NodeType';
import Direction, {NodePalette} from 'parsegraph-direction';
import Size from 'parsegraph-size';

import style, {
  BUD_LEAF_SEPARATION,
  BUD_TO_BUD_VERTICAL_SEPARATION,
} from './DefaultNodeStyle';
import NodePainter from './NodePainter';
import Window from 'parsegraph-window';
import DefaultNodePainter from './DefaultNodePainter';

export enum Type {
  BUD,
  SLOT,
  BLOCK,
  SLIDER,
  SCENE,
  ELEMENT
}

export function readType(given: string|Type):Type {
  if (typeof given !== "string") {
    return given as Type;
  }
  given = (given as string).toLowerCase().substring(0, 3);

  switch (given) {
    // 'b' is ambiguous, but blocks are more common, so assume that.
    case 'b':
    case 'bl':
    case 'blo':
      return Type.BLOCK;
    case 'u':
    case 'bu':
    case 'bud':
      return Type.BUD;
    case 's':
    case 'sl':
    case 'slo':
      return Type.SLOT;
    case 'sli':
    case 'l':
    case 'i':
      return Type.SLIDER;
    case 'sc':
    case 'sce':
    case 'c':
      return Type.SCENE;
    case 'e':
    case 'el':
    case 'ele':
      return Type.ELEMENT;
  }
  return null;
}

export default class DefaultNodeType implements NodeType<DefaultNodeType> {
  _type:Type;
  _palette:NodePalette<Node<DefaultNodeType>>;
  _mathMode:boolean;

  constructor(palette:NodePalette<Node<DefaultNodeType>>, type:Type, mathMode?:boolean) {
    this._type = type;
    this._palette = palette;
    this._mathMode = mathMode;
  }

  promiscuousClicks(node:Node<DefaultNodeType>):boolean {
    return node.type().is(Type.SLIDER);
  }

  newPainter(window:Window, node:Node<DefaultNodeType>):NodePainter {
    return new DefaultNodePainter(window, node);
  }

  palette():NodePalette<Node<DefaultNodeType>> {
    return this._palette;
  }

  type():Type {
    return this._type;
  }

  supportsDirection(inDirection:Direction):boolean {
    if (this.is(Type.SLIDER)) {
      return false;
    }
    if (this.is(Type.SCENE) && inDirection == Direction.INWARD) {
      return false;
    }
    return true;
  }

  applyStyle(node:Node<DefaultNodeType>):void {
    node.setBlockStyle(style(this.type(), this._mathMode));
  }

  name():string {
    switch (this.type()) {
      case Type.SLOT:
        return 'SLOT';
      case Type.BLOCK:
        return 'BLOCK';
      case Type.BUD:
        return 'BUD';
      case Type.SLIDER:
        return 'SLIDER';
      case Type.SCENE:
        return 'SCENE';
      case Type.ELEMENT:
        return 'ELEMENT';
    }
  }

  elementSize(node:Node<DefaultNodeType>, bodySize:Size):void {
    const style = node.blockStyle();
    bodySize[0] = 0;
    bodySize[1] = 0;
    const elem = node.element();
    if (elem) {
      bodySize[0] = elem.offsetWidth;
      bodySize[1] = elem.offsetHeight;
    }
    bodySize[0] = Math.max(style.minWidth, bodySize[0]);
    bodySize[1] = Math.max(style.minHeight, bodySize[1]);
  }

  sizeWithoutPadding(node:Node<DefaultNodeType>, bodySize?:Size):Size {
    if (!bodySize) {
      // console.log(new Error("Creating size"));
      bodySize = new Size();
    }
    if (this.is(Type.ELEMENT)) {
      this.elementSize(node, bodySize);
      return bodySize;
    }

    // Find the size of this node's drawing area.
    const style = node.blockStyle();

    const label = node.realLabel();
    if (label && !label.isEmpty()) {
      const scaling = style.fontSize / label.font().fontSize();
      bodySize[0] = label.width() * scaling;
      bodySize[1] = label.height() * scaling;
      if (isNaN(bodySize[0]) || isNaN(bodySize[1])) {
        throw new Error('Label returned a NaN size.');
      }
    } else if (!bodySize) {
      // console.log(new Error("Creating size"));
      bodySize = new Size(style.minWidth, style.minHeight);
    } else {
      bodySize[0] = style.minWidth;
      bodySize[1] = style.minHeight;
    }
    if (node.hasNode(Direction.INWARD)) {
      const nestedNode = node.nodeAt(Direction.INWARD);
      const nestedSize = nestedNode.extentSize();
      const scale = nestedNode.scale();

      if (
        node.nodeAlignmentMode(Direction.INWARD) == Alignment.INWARD_VERTICAL
      ) {
        // Align vertical.
        bodySize.setWidth(
            Math.max(bodySize.width(), scale * nestedSize.width()),
        );

        if (node.label()) {
          // Allow for the content's size.
          bodySize.setHeight(
              Math.max(
                  style.minHeight,
                  bodySize.height() +
                node.verticalPadding() +
                scale * nestedSize.height(),
              ),
          );
        } else {
          bodySize.setHeight(
              Math.max(
                  bodySize.height(),
                  scale * nestedSize.height() + 2 * node.verticalPadding(),
              ),
          );
        }
      } else {
        // Align horizontal.
        if (node.label()) {
          // Allow for the content's size.
          bodySize.setWidth(
              bodySize.width() +
              node.horizontalPadding() +
              scale * nestedSize.width(),
          );
        } else {
          bodySize.setWidth(
              Math.max(bodySize.width(), scale * nestedSize.width()),
          );
        }

        bodySize.setHeight(
            Math.max(
                bodySize.height(),
                scale * nestedSize.height() + 2 * node.verticalPadding(),
            ),
        );
      }
    }

    // Buds appear circular
    if (this.is(Type.BUD)) {
      const aspect = bodySize.width() / bodySize.height();
      if (aspect < 2 && aspect > 1 / 2) {
        bodySize.setWidth(Math.max(bodySize.width(), bodySize.height()));
        bodySize.setHeight(bodySize.width());
      }
    }

    bodySize[0] = Math.max(style.minWidth, bodySize[0]);
    bodySize[1] = Math.max(style.minHeight, bodySize[1]);
    return bodySize;
  }

  verticalSeparation(node:Node<DefaultNodeType>, direction: Direction): number {
    if (this.is(Type.BUD) && node.typeAt(direction).is(Type.BUD)) {
      return (
        node.blockStyle().verticalSeparation +
        BUD_TO_BUD_VERTICAL_SEPARATION
      );
    }
    return node.blockStyle().verticalSeparation;
  }

  horizontalSeparation(node:Node<DefaultNodeType>, direction: Direction): number {
    const style = node.blockStyle();

    if (
      node.hasNode(direction) &&
      node.nodeAt(direction).type().is(Type.BUD) &&
      !node.nodeAt(direction).hasAnyNodes()
    ) {
      return BUD_LEAF_SEPARATION * style.horizontalSeparation;
    }
    return style.horizontalSeparation;
  }

  is(val:Type):boolean {
    return this._type === val;
  }

  acceptsSelection(selectedNode:Node<DefaultNodeType>):boolean {
    if (selectedNode.type().is(Type.SLIDER)) {
      return true;
      // console.log("Selecting slider and repainting");
    } else if (selectedNode.hasClickListener() && !selectedNode.isSelected()) {
      // console.log("Selecting node and repainting");
      return true;
    }
    return false;
  }
}
