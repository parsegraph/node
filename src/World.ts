import Freezer from "./Freezer";
import CameraBox from "./camerabox/CameraBox";
import { Direction } from "parsegraph-direction";
import WindowNode from "./windownode/WindowNode";
import Rect from "parsegraph-rect";
import { BasicWindow, Component } from "parsegraph-window";
import Camera from "parsegraph-camera";
import GraphPainter from "./windownode/GraphPainter";

export default class World {
  _worldPaintingDirty: Map<BasicWindow, boolean>;
  _worldPainters: GraphPainter[];
  _nodeUnderCursor: WindowNode;
  _previousWorldPaintState: Map<BasicWindow, number>;
  _freezer: Freezer;
  _cameraBox: CameraBox;
  _repaintListeners: [Function, object][];

  constructor() {
    // World-rendered graphs.
    this._worldPaintingDirty = new Map();
    this._worldPainters = [];

    // The node currently under the cursor.
    this._nodeUnderCursor = null;

    this._previousWorldPaintState = new Map();
    this._freezer = new Freezer();
    this._cameraBox = new CameraBox(this);

    this._repaintListeners = [];
  }

  freezer(): Freezer {
    return this._freezer;
  }

  forEach(cb: (node: WindowNode, painter: GraphPainter) => void): void {
    this._worldPainters.forEach(function (painter) {
      cb(painter.root(), painter);
    });
  }

  contextChanged(isLost: boolean, window: BasicWindow): void {
    this._worldPaintingDirty.set(window, true);
    this._previousWorldPaintState.delete(window);
    this._worldPainters.forEach((painter) => {
      painter.contextChanged(isLost, window);
    });
    this._cameraBox.contextChanged(isLost, window);
  }

  plot(node: WindowNode): void {
    if (!node) {
      throw new Error("Node must not be null");
    }
    if (!node.localPaintGroup()) {
      node.setPaintGroup(true);
    }
    this._worldPainters.push(new GraphPainter(node));
  }

  removePlot(plot: WindowNode) {
    this._worldPainters = this._worldPainters.filter((painter) => {
      return painter.root() !== plot;
    });
    this._previousWorldPaintState.clear();
  }

  clear() {
    this._worldPainters = [];
    this._previousWorldPaintState.clear();
  }

  /*
   * Receives a mouseover event at the given coordinates, in world space.
   *
   * Returns true if this event processing requires a graph repaint.
   */
  mouseOver(x: number, y: number, comp: Component): number {
    if (!this.readyForInput()) {
      return 1;
    }

    const selectedNode: WindowNode = this.nodeUnderCoords(x, y);
    if (this._nodeUnderCursor === selectedNode) {
      // The node under cursor is already the node under cursor, so don't
      // do anything.
      // console.log("Node was the same");
      return selectedNode ? 1 : 0;
    }

    if (this._nodeUnderCursor && this._nodeUnderCursor !== selectedNode) {
      // console.log("Node is changing, so repainting.");
      this._nodeUnderCursor.value().interact().blur(comp);
      this.scheduleRepaint();
    }

    this._nodeUnderCursor = selectedNode;
    if (!selectedNode) {
      // No node was actually found.
      // console.log("No node actually found.");
      return 0;
    }

    if (this._nodeUnderCursor.value().interact().focus(comp)) {
      this.scheduleRepaint();
      return 0;
    }

    return 2;
  }
  boundingRect(outRect?: Rect): Rect {
    if (!outRect) {
      outRect = new Rect(0, 0, 0, 0);
    }
    this._worldPainters.forEach((painter) => {
      const plot = painter.root();
      const layout = plot.value().getLayout();
      layout.commitLayoutIteratively();

      // Get plot extent data.
      const nx: number = layout.absoluteX();
      const ny: number = layout.absoluteY();

      const boundingValues: [number, number, number] = [0, 0, 0];
      layout.extentsAt(Direction.FORWARD).boundingValues(boundingValues);
      let h: number = boundingValues[0];
      layout.extentsAt(Direction.DOWNWARD).boundingValues(boundingValues);
      let w: number = boundingValues[0];

      const be: number = nx - layout.extentOffsetAt(Direction.FORWARD);
      const ue: number = ny - layout.extentOffsetAt(Direction.DOWNWARD);
      const fe: number = be + w;
      const de: number = ue + h;

      // Get rect values.
      w = fe + be;
      h = de + ue;

      // Calculate center by averaging axis extremes.
      const cx: number = be + w / 2;
      const cy: number = ue + h / 2;

      // Get current bounding rect.
      const inx: number = outRect._x;
      const iny: number = outRect._y;
      const inw: number = outRect._width;
      const inh: number = outRect._height;

      let outw: number;
      let outh: number;
      let outx: number;
      let outy: number;

      if (!inw || !inh || !inx || !iny) {
        outw = w;
        outh = h;
        outx = cx;
        outy = cy;
      } else {
        // Combine rect extents.
        const hmin: number = Math.min(inx - inw / 2, cx - w / 2);
        const hmax: number = Math.max(inx + inw / 2, cx + w / 2);
        const vmin: number = Math.min(iny - inh / 2, cy - h / 2);
        const vmax: number = Math.max(iny + inh / 2, cy + h / 2);

        // Calculate width and center.
        outw = hmax - hmin;
        outh = vmax - vmin;
        outx = hmin + outw / 2;
        outy = vmin + outh / 2;
      }

      // Store results.
      outRect._x = outx;
      outRect._y = outy;
      outRect._width = outw;
      outRect._height = outh;
    });

    return outRect;
  }
  scheduleRepaint(): void {
    // console.log(new Error("Scheduling repaint"));
    this._worldPaintingDirty.forEach((_: boolean, w: BasicWindow) => {
      this._worldPaintingDirty.set(w, true);
    });
    this._previousWorldPaintState.clear();
    this._repaintListeners.forEach((onRepaint) => {
      onRepaint[0].call(onRepaint[1]);
    });
  }

  addRepaintListener(onRepaint: Function, onRepaintThisArg?: object) {
    const listener: [Function, object] = [onRepaint, onRepaintThisArg];
    this._repaintListeners.push(listener);
    return () => {
      this._repaintListeners = this._repaintListeners.filter(
        (cand) => cand !== listener
      );
    };
  }

  nodeUnderCursor(): WindowNode {
    return this._nodeUnderCursor;
  }
  readyForInput(): boolean {
    // Test if there is a node under the given coordinates.
    for (let i: number = this._worldPainters.length - 1; i >= 0; --i) {
      const root: WindowNode = this._worldPainters[i].root();
      if (root.needsCommit() || root.isDirty()) {
        return false;
      }
    }
    return true;
  }
  commitLayout(timeout?: number): boolean {
    let completed = true;
    for (let i: number = this._worldPainters.length - 1; i >= 0; --i) {
      if (
        this._worldPainters[i]
          .root()
          .value()
          .getLayout()
          .commitLayoutIteratively(timeout)
      ) {
        completed = false;
      }
    }
    return completed;
  }

  /*
   * Tests whether the given position, in world space, is within a node.
   */
  nodeUnderCoords(x: number, y: number): WindowNode {
    // Test if there is a node under the given coordinates.
    for (let i: number = this._worldPainters.length - 1; i >= 0; --i) {
      const selectedNode: WindowNode = this._worldPainters[i]
        .root()
        .value()
        .getLayout()
        .nodeUnderCoords(x, y) as WindowNode;
      if (selectedNode) {
        // Node located; no further search.
        return selectedNode;
      }
    }
    return null;
  }
  needsRepaint(window: BasicWindow): boolean {
    return (
      !this._worldPaintingDirty.has(window) ||
      this._worldPaintingDirty.get(window) ||
      this._cameraBox.needsRepaint()
    );
  }

  paint(paintContext: Component, timeout?: number): boolean {
    const window = paintContext.window();
    const gl = window.gl();
    if (gl.isContextLost()) {
      return false;
    }
    // console.log("Painting world for window " + window.id() + ", timeout=" + timeout);
    const t: number = new Date().getTime();
    const pastTime: Function = function () {
      return timeout !== undefined && new Date().getTime() - t > timeout;
    };
    const timeRemaining: Function = function () {
      if (timeout === undefined) {
        return timeout;
      }
      return Math.max(0, timeout - (new Date().getTime() - t));
    };

    if (
      !this._worldPaintingDirty.has(window) ||
      this._worldPaintingDirty.get(window)
    ) {
      // console.log("World needs repaint");
      // Restore the last state.
      let i: number = 0;
      let savedState: number;
      if (this._previousWorldPaintState.has(window)) {
        savedState = this._previousWorldPaintState.get(window);
        i = savedState;
      }

      while (i < this._worldPainters.length) {
        if (pastTime()) {
          this._previousWorldPaintState.set(window, i);
          return true;
        }
        const painter = this._worldPainters[i];
        if (!painter.root().localPaintGroup()) {
          throw new Error("World root must have a paint group");
        }
        const needsUpdate: boolean = painter.paint(
          paintContext,
          timeRemaining()
        );
        if (needsUpdate) {
          this._previousWorldPaintState.set(window, i);
          return true;
        }

        ++i;
      }
      // console.log("Done painting window " + window.id());
      this._worldPaintingDirty.set(window, false);
    } else {
      // console.log('World does not need repaint');
    }

    this._cameraBox.paint(window);

    return false;
  }

  render(paintContext: Component, camera: Camera): boolean {
    const gl = paintContext.window().gl();
    if (gl.isContextLost()) {
      return false;
    }
    let needsUpdate: boolean = false;
    this._worldPainters.forEach((painter) => {
      needsUpdate =
        painter.renderIteratively(paintContext, camera) || needsUpdate;
    });
    this._cameraBox.render(paintContext, camera);
    return needsUpdate;
  }
}
