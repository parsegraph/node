import Interactive from "../interact/Interactive";
import Interaction from "../interact/Interaction";

import Painted from "./Painted";
import WindowNode from "./WindowNode";
import {Layout} from "parsegraph-layout";
import FreezerCache from "../freezer/FreezerCache";
import Freezable from "../freezer/Freezable";
import Artist, {Counts} from "./Artist";
import PaintContext from "./PaintContext";
import {Matrix3x3} from "parsegraph-matrix";
import Camera from "parsegraph-camera";
import Size from "parsegraph-size";

import BlockPainter from "parsegraph-blockpainter";

class BlockArtist implements Artist {
  setup(ctx: PaintContext, counts: Counts) {
    const painter = new BlockPainter(ctx.window());
    painter.initBuffer(counts.blocks || 0);
    ctx.set("blockpainter", painter);
  }

  render(
    world: Matrix3x3,
    scale: number,
    forceSimple: boolean,
    _: Camera,
    ctx:PaintContext
  ): void {
    const painter = BlockArtist.getBlockPainter(ctx);
    painter.render(world, scale, forceSimple);
  }

  static countBlock(counts: {[key:string]:number}, val:number = 1): void {
    counts.blocks = counts.blocks || 0;
    counts.blocks += val;
  }

  static getBlockPainter(ctx: PaintContext): BlockPainter {
    return ctx.get("blockpainter");
  }

  static _instance:BlockArtist = null;
  static instance() {
    if (!BlockArtist._instance) {
      BlockArtist._instance = new BlockArtist();
    }
    return BlockArtist._instance;
  }
}

export default class Block implements Interactive, Painted, Freezable {
  _layout:Layout;
  _interactor:Interaction;
  _node: WindowNode;
  _cache: FreezerCache;

  constructor(node:WindowNode) {
    this._node = node;
    this._interactor = new Interaction();
    this._layout = new Layout(node);
    this._cache = new FreezerCache(node);
  }

  draft(counts:Counts): void {
    BlockArtist.countBlock(counts);
  }

  getSeparation() {
    return 10;
  }

  size(size?:Size): Size {
    if (!size) {
      size = new Size();
    }
    size.setWidth(100);
    size.setHeight(100);
    return size;
  }

  paint(ctx:PaintContext): boolean {
    const layout = this.getLayout();
    BlockArtist.getBlockPainter(ctx).drawBlock(
      layout.groupX(),
      layout.groupY(),
      this.size().width(),
      this.size().height(),
      0, 0);
    return false;
  }

  getArtist(): Artist {
    return BlockArtist.instance();
  }

  node():WindowNode {
    return this._node;
  }

  getCache() {
    return this._cache;
  }

  getLayout():Layout {
    return this._layout;
  }

  interact():Interaction {
    return this._interactor;
  }
}
