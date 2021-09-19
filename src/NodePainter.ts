import Rect from 'parsegraph-rect';
import { BasicWindow, Component } from 'parsegraph-window';
import {Matrix3x3} from 'parsegraph-matrix';
import Camera from 'parsegraph-camera';

export default interface NodePainter {
  contextChanged(isLost: boolean): void;
  bounds(): Rect;

  weight(): number;

  window(): BasicWindow;

  /**
   * Disposes of any resources allocated during painting, resetting the painter.
   */
  clear(): void;

  /**
   * Paints this painter's node and all nodes in its group.
   */
  paint(paintContext:Component):void;

  /**
   * Renders the painted group.
   * 
   * @param world the 3x3 world matrix
   * @param scale the scale of the world matrix
   * @param forceSimple if true, this is a hint to draw low-resolution models
   * @param paintContext component used for rendering
   */
  render(world: Matrix3x3, scale: number, forceSimple: boolean, camera:Camera, paintContext: Component): void;

  /**
   * Returns the number of consecutive renders without a change in painting.
   */
  consecutiveRenders():number;
}
