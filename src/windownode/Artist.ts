import PaintContext from "./PaintContext";
import {Matrix3x3} from "parsegraph-matrix";
import Camera from "parsegraph-camera";

export default interface Artist {
  setup(ctx:PaintContext):void;

  /**
   * Renders the painted content.
   *
   * @param world the 3x3 world matrix
   * @param scale the scale of the world matrix
   * @param forceSimple if true, this is a hint to draw low-resolution models
   * @param paintContext component used for rendering
   */
  render(
    world: Matrix3x3,
    scale: number,
    forceSimple: boolean,
    camera: Camera,
    ctx:PaintContext
  ): void;
}
