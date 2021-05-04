import Rect from 'parsegraph-rect';
import Window from 'parsegraph-window';
import {Matrix3x3} from 'parsegraph-matrix';

export default interface NodePainter {
  contextChanged(isLost: boolean): void;
  bounds(): Rect;

  weight(): number;

  window(): Window;

  /**
   * Disposes of any resources allocated during painting, resetting the painter.
   */
  clear(): void;

  /**
   * Paints this painter's node and all nodes in its group.
   */
  paint():void;

  /**
   * Renders the painted group.
   * 
   * @param world the 3x3 world matrix
   * @param scale the scale of the world matrix
   * @param forceSimple if true, this is a hint to draw low-resolution models
   */
  render(world: Matrix3x3, scale: number, forceSimple: boolean): void;

  /**
   * Returns the number of consecutive renders without a change in painting.
   */
  consecutiveRenders():number;
}
