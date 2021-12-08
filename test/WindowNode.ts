import {DirectionNode} from "parsegraph-direction";
import {Layout, Positioned} from "parsegraph-layout";
import Size from 'parsegraph-size';

class SceneContext implements Artist {
  static _context:SceneContext;

  install(ctx:PaintContext) {

  }

  static getNamespace() {
    if (!this._context) {
      this._context = new SceneContext();
    }
    return this._context;
  }

  static getPainter(ctx:PaintContext) {
    return ctx.get("Painter") as DefaultNodePainter;
  }
}

class Scene implements Painted, Interactive, Positioned {
  _layout: Layout;
  _interact: Interaction;

  constructor(node:DirectionNode<Scene>) {
    this._layout = new Layout(node);
    this._interact = new Interaction();
  }

  getLayout() {
    return this._layout;
  }

  size(size?:Size): Size {
    if (!size) {
      size = new Size();
    }
    size.setWidth(100);
    size.setHeight(100);
    return size;
  }

  getSeparation() {
    return 10;
  }

  interact(): Interaction {
    return this._interact;
  }

  getArtist() {
    return SceneContext.getArtist();
  }

  paint(ctx: PaintContext): boolean {
    const painter = SceneContext.getPainter(ctx);
  }
}

describe("WindowNode", ()=>{
  it("works", ()=>{
    const n = new DirectionNode<Scene>();
    n.setValue(new Scene(n));
  });
});
