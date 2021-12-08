import FanPainter from "./FanPainter";
import {
  matrixMultiply3x3,
  makeScale3x3,
  makeTranslation3x3,
  Matrix3x3,
} from "parsegraph-matrix";
import { CAROUSEL_SHOW_DURATION, CAROUSEL_MIN_DISTANCE } from "./settings";
import Color from "parsegraph-color";
import Viewport from "./Viewport";
import WindowNode from "./WindowNode";
import CarouselAction from "./CarouselAction";
import Camera from "parsegraph-camera";
//import { toDegrees } from "parsegraph-toradians";
import { Keystroke } from "parsegraph-window";

class CarouselPlot {
  node: WindowNode;
  x: number;
  y: number;
  scale: number;

  constructor(node: WindowNode) {
    this.node = node;
  }
}

export default class Carousel {
  _viewport: Viewport;
  _updateRepeatedly: boolean;
  _showScale: number;
  onScheduleRepaint: Function;
  onScheduleRepaintThisArg: any;
  _carouselPaintingDirty: boolean;
  _carouselPlots: CarouselPlot[];
  _carouselCallbacks: CarouselAction[];
  _carouselCoords: number[];
  _carouselSize: number;
  _showCarousel: boolean;
  _selectedCarouselPlot: CarouselPlot;
  _selectedCarouselPlotIndex: number;
  _carouselHotkeys: { [id: string]: number };
  _fanPainter: FanPainter;
  _selectedPlot: WindowNode;
  _hideTime: Date;
  _cleaner: Function;
  _showTime: Date;

  constructor(viewport: Viewport) {
    this._viewport = viewport;

    this._updateRepeatedly = false;
    this._showScale = 1;

    this.onScheduleRepaint = null;
    this.onScheduleRepaintThisArg = null;

    // Carousel-rendered carets.
    this._carouselPaintingDirty = true;
    this._carouselPlots = [];
    this._carouselCallbacks = [];

    this._carouselHotkeys = {};

    // Location of the carousel, in world coordinates.
    this._carouselCoords = [0, 0];
    this._carouselSize = 25;

    this._showCarousel = false;
    this._selectedCarouselPlot = null;
    this._selectedCarouselPlotIndex = null;

    // GL painters are not created until needed.
    this._fanPainter = null;

    this._selectedPlot = null;
  }

  window() {
    return this._viewport.window();
  }

  camera() {
    return this._viewport.camera();
  }

  needsRepaint() {
    return this._carouselPaintingDirty || this._updateRepeatedly;
  }

  moveCarousel(worldX: number, worldY: number) {
    this._carouselCoords[0] = worldX;
    this._carouselCoords[1] = worldY;
  }

  setCarouselSize(size: number) {
    this._carouselSize = size;
  }

  showCarousel() {
    // console.log(new Error("Showing carousel"));
    this._showCarousel = true;
    this._updateRepeatedly = true;
    this._showTime = new Date();
  }

  isCarouselShown() {
    return this._showCarousel;
  }

  hideCarousel() {
    // console.log(new Error("Hiding carousel"));
    this._selectedCarouselPlot = null;
    this._selectedCarouselPlotIndex = null;
    this._showCarousel = false;
    this._hideTime = new Date();
    this._viewport.scheduleRepaint();
  }

  addToCarousel(action: CarouselAction) {
    // console.log("Adding to carousel", action);
    this._carouselCallbacks.push(action);
    const node = action.action();
    if (!node) {
      throw new Error("Node must not be null");
    }
    if (!node.localPaintGroup()) {
      node.setPaintGroup(true);
    }
    this._carouselPlots.push(new CarouselPlot(node));
    if (action.hotkey()) {
      this._carouselHotkeys[action.hotkey()] = this._carouselPlots.length - 1;
    }
    // console.log("Added to carousel");
  }

  clearCarousel() {
    // console.log("carousel cleared");
    this._carouselPlots.splice(0, this._carouselPlots.length);
    this._carouselCallbacks.splice(0, this._carouselCallbacks.length);
    this._carouselHotkeys = {};
    this._selectedCarouselPlot = null;
    this._selectedCarouselPlotIndex = null;
    if (this._cleaner) {
      const cleaner = this._cleaner;
      this._cleaner = null;
      cleaner();
    }
  }

  setCleaner(func: Function) {
    this._cleaner = func;
  }

  clearHotfixActionIndex(i: number) {
    for (const hotkey in this._carouselHotkeys) {
      if (
        !Object.prototype.hasOwnProperty.call(this._carouselHotkeys, hotkey)
      ) {
        continue;
      }
      if (this._carouselHotkeys[hotkey] === i) {
        delete this._carouselHotkeys[hotkey];
        return true;
      }
    }
    return false;
  }

  removeFromCarousel(node: WindowNode) {
    if (!node) {
      throw new Error("Node must not be null");
    }
    if (!node.localPaintGroup && node.root) {
      // Passed a Caret.
      node = node.root();
    }
    for (let i = 0; i < this._carouselPlots.length; ++i) {
      if (this._carouselPlots[i].node !== node) {
        continue;
      }
      // console.log("removed from carousel");
      const removed = this._carouselPlots.splice(i, 1)[0];
      this._carouselCallbacks.splice(i, 1);
      this.clearHotfixActionIndex(i);

      if (this._selectedCarouselPlot === removed) {
        this._selectedCarouselPlot = null;
        this._selectedCarouselPlotIndex = null;
      }
      return removed;
    }
    return null;
  }

  updateRepeatedly() {
    return this._updateRepeatedly;
  }

  clickCarousel(x: number, y: number, asDown: boolean) {
    if (!this.isCarouselShown()) {
      return false;
    }

    if (this._showTime) {
      const ms = new Date().getTime() - this._showTime.getTime();
      if (ms < CAROUSEL_SHOW_DURATION) {
        // Ignore events that occur so early.
        return true;
      }
    }

    const dist = Math.sqrt(
      Math.pow(Math.abs(x - this._carouselCoords[0]), 2) +
        Math.pow(Math.abs(y - this._carouselCoords[1]), 2)
    );
    if (dist < (this._carouselSize * 0.75) / this.camera().scale()) {
      if (asDown) {
        // console.log("Down events within the inner' +
        //   ' region are treated as 'cancel.'");
        this.hideCarousel();
        this.scheduleCarouselRepaint();
        return true;
      }

      // console.log("Up events within the inner region are ignored.");
      return false;
    } else if (dist > (this._carouselSize * 4) / this.camera().scale()) {
      this.hideCarousel();
      this.scheduleCarouselRepaint();
      // console.log("Click occurred so far outside that' +
      //   ' it is considered its own event.");
      return false;
    }

    const angleSpan = (2 * Math.PI) / this._carouselPlots.length;
    let mouseAngle = Math.atan2(
      y - this._carouselCoords[1],
      x - this._carouselCoords[0]
    );
    // console.log(
    //   toDegrees(mouseAngle) +
    //   " degrees = caret " +
    //   i +
    //   " angleSpan = " +
    //   angleSpan);
    if (this._carouselPlots.length == 1 && Math.abs(mouseAngle) > Math.PI / 2) {
      this.hideCarousel();
      this.scheduleCarouselRepaint();
      // console.log("Click occurred so far outside that' +
      //   ' it is considered its own event.");
      return false;
    }
    mouseAngle += Math.PI;
    const i = Math.floor(mouseAngle / angleSpan);

    // Click was within a carousel caret; invoke the listener.
    this.runAction(i);
    return true;
  }

  runAction(i: number) {
    this.hideCarousel();
    try {
      const action = this._carouselCallbacks[i];
      action.call();
    } catch (ex) {
      console.log("Error occurred while running command:", ex);
    }
    this.scheduleCarouselRepaint();
  }

  carouselKey(event: Keystroke) {
    if (!(event.name() in this._carouselHotkeys)) {
      return false;
    }
    const i = this._carouselHotkeys[event.name()];
    this.runAction(i);
    return true;
  }

  mouseOverCarousel(x: number, y: number) {
    if (!this.isCarouselShown()) {
      return 0;
    }

    const angleSpan = (2 * Math.PI) / this._carouselPlots.length;
    const mouseAngle =
      Math.PI +
      Math.atan2(y - this._carouselCoords[1], x - this._carouselCoords[0]);
    const dist = Math.sqrt(
      Math.pow(Math.abs(x - this._carouselCoords[0]), 2) +
        Math.pow(Math.abs(y - this._carouselCoords[1]), 2)
    );

    if (
      dist < (this._carouselSize * 8) / this.camera().scale() &&
      dist > CAROUSEL_MIN_DISTANCE / this.camera().scale()
    ) {
      if (
        this._carouselPlots.length > 1 ||
        Math.abs(mouseAngle - Math.PI) < Math.PI / 2
      ) {
        const i = Math.floor(mouseAngle / angleSpan);
        /* console.log(
          toDegrees(mouseAngle - Math.PI) +
            " degrees = caret " +
            i +
            " angleSpan = " +
            toDegrees(angleSpan)
        );*/
        const selectionAngle = angleSpan / 2 + i * angleSpan - Math.PI;
        if (i != this._selectedCarouselPlotIndex) {
          this._selectedCarouselPlotIndex = i;
          this._selectedCarouselPlot = this._carouselPlots[i];
        }
        if (this._fanPainter) {
          // console.log("Setting selection angle", selectionAngle, angleSpan);
          this._fanPainter.setSelectionAngle(selectionAngle);
          this._fanPainter.setSelectionSize(angleSpan);
        }
        this.scheduleCarouselRepaint();
        return 2;
      }
    }
    if (this._fanPainter) {
      this._fanPainter.setSelectionAngle(null);
      this._fanPainter.setSelectionSize(null);
      this._selectedCarouselPlot = null;
      this._selectedCarouselPlotIndex = null;
      this.scheduleCarouselRepaint();
      return 0;
    }
  }

  showScale() {
    return this._showScale;
  }

  arrangeCarousel() {
    if (this._carouselPlots.length === 0) {
      return;
    }

    const angleSpan = (2 * Math.PI) / this._carouselPlots.length;

    const MAX_CAROUSEL_SIZE = 150;

    const now = new Date();
    // Milliseconds
    const showDuration = CAROUSEL_SHOW_DURATION;
    if (this._showTime) {
      let ms = now.getTime() - this._showTime.getTime();
      if (ms < showDuration) {
        ms /= showDuration / 2;
        if (ms < 1) {
          this._showScale = 0.5 * ms * ms;
        } else {
          ms--;
          this._showScale = -0.5 * (ms * (ms - 2) - 1);
        }
      } else {
        this._showScale = 1;
        this._showTime = null;
        this._updateRepeatedly = false;
      }
    }
    // console.log("Show scale is " + this._showScale);

    let minScale = 1;
    this._carouselPlots.forEach(function (carouselData, i) {
      const root = carouselData.node;
      root.commitLayoutIteratively();

      // Set the origin.
      const caretRad =
        Math.PI +
        angleSpan / 2 +
        (i / this._carouselPlots.length) * (2 * Math.PI);
      carouselData.x =
        2 * this._carouselSize * this._showScale * Math.cos(caretRad);
      carouselData.y =
        2 * this._carouselSize * this._showScale * Math.sin(caretRad);

      // Set the scale.
      const commandSize = root.extentSize();
      const xMax = MAX_CAROUSEL_SIZE;
      const yMax = MAX_CAROUSEL_SIZE;
      let xShrinkFactor = 1;
      let yShrinkFactor = 1;
      if (commandSize.width() > xMax) {
        xShrinkFactor = commandSize.width() / xMax;
      }
      if (commandSize.height() > yMax) {
        yShrinkFactor = commandSize.height() / yMax;
      }
      // console.log(
      //   commandSize.width(),
      //   commandSize.height(),
      //   1/Math.max(xShrinkFactor,
      //   yShrinkFactor));
      minScale = Math.min(
        minScale,
        this._showScale / Math.max(xShrinkFactor, yShrinkFactor)
      );
    }, this);

    this._carouselPlots.forEach(function (carouselData, i) {
      if (i === this._selectedCarouselPlotIndex) {
        carouselData.scale = 1.25 * minScale;
      } else {
        carouselData.scale = minScale;
      }
    }, this);
  }

  setOnScheduleRepaint(func: Function, thisArg?: any) {
    thisArg = thisArg || this;
    this.onScheduleRepaint = func;
    this.onScheduleRepaintThisArg = thisArg;
  }

  scheduleCarouselRepaint() {
    // console.log("Scheduling carousel repaint.");
    this._carouselPaintingDirty = true;
    if (this.onScheduleRepaint) {
      this.onScheduleRepaint.call(this.onScheduleRepaintThisArg);
    }
  }

  contextChanged(isLost: boolean) {
    this._carouselPaintingDirty = true;
    if (this._fanPainter) {
      this._fanPainter.contextChanged(isLost);
    }
    this._carouselPlots.forEach((carouselData) => {
      const root = carouselData.node;
      root.contextChanged(isLost, this.window());
    });
  }

  paint(paintContext?: any) {
    // console.log("Painting carousel");
    if (
      !this._updateRepeatedly &&
      (!this._carouselPaintingDirty || !this._showCarousel)
    ) {
      return false;
    }

    // Paint the carousel.
    // console.log("Painting the carousel");
    this.arrangeCarousel();
    this._carouselPlots.forEach((carouselData) => {
      carouselData.node.paint(this.window(), 1000, paintContext);
    });

    // Paint the background highlighting fan.
    if (!this._fanPainter) {
      this._fanPainter = new FanPainter(this.window());
    } else {
      this._fanPainter.clear();
    }
    const fanPadding = 1.2;
    this._fanPainter.setAscendingRadius(
      this.showScale() * fanPadding * this._carouselSize
    );
    this._fanPainter.setDescendingRadius(
      this.showScale() * fanPadding * 2 * this._carouselSize
    );
    this._fanPainter.selectRad(0, 0, 0, Math.PI * 2, new Color(1, 1, 1, 1));

    this._carouselPaintingDirty = false;
    return this._updateRepeatedly;
  }

  render(world: Matrix3x3) {
    // console.log("Rendering carousel", this._showCarousel);
    if (!this._showCarousel) {
      return;
    }
    if (this._updateRepeatedly || this._carouselPaintingDirty) {
      this.paint();
    }

    world = matrixMultiply3x3(
      makeScale3x3(1 / this.camera().scale()),
      makeTranslation3x3(this._carouselCoords[0], this._carouselCoords[1]),
      world
    );

    // console.log("Rendering " + this + " in scene.");
    // console.log(this.absoluteX(), this.absoluteY());
    const window = this.window();
    const camera = this.camera();
    window.overlay().resetTransform();
    window.overlay().scale(camera.scale(), camera.scale());
    window
      .overlay()
      .translate(
        camera.x() + this._carouselCoords[0],
        camera.y() + this._carouselCoords[1]
      );
    window.overlay().scale(1 / camera.scale(), 1 / camera.scale());
    /* window
        .overlay()
        .scale(
            camera.scale(),
            camera.scale(),
        );
    window
        .overlay()
        .translate(this.camera().x() + this._carouselCoords[0],
            this.camera().y() + this._carouselCoords[1]);*/

    this._fanPainter.render(world);

    // Render the carousel if requested.
    // console.log("Rendering ", this._carouselPlots.length, " carousel plots");
    this._carouselPlots.forEach((carouselData) => {
      const root = carouselData.node;
      window.overlay().save();
      window.overlay().translate(carouselData.x, carouselData.y);
      window.overlay().scale(carouselData.scale, carouselData.scale);
      root.renderOffscreen(
        this.window(),
        // scale * trans * world
        matrixMultiply3x3(
          makeScale3x3(carouselData.scale),
          matrixMultiply3x3(
            makeTranslation3x3(carouselData.x, carouselData.y),
            world
          )
        ),
        1.0,
        false,
        new Camera(),
        null
      );
      window.overlay().restore();
    });
  }
}
