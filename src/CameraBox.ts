import CameraBoxPainter from "./CameraBoxPainter";
import Rect from "parsegraph-rect";
import Font from "./Font";
import { GLProvider } from "parsegraph-blockpainter";
import Camera from "parsegraph-camera";
import World from "./World";
import { BasicWindow } from "parsegraph-window";

export default class CameraBox {
  _world: World;
  _showCameraBoxes: boolean;
  _cameraBoxDirty: boolean;
  _painters: { [id: string]: CameraBoxPainter };
  _glyphAtlas: Font;
  _numBoxes: number;
  _cameraBoxes: any;

  constructor(world: World) {
    // Camera boxes.
    this._showCameraBoxes = true;
    this._cameraBoxDirty = true;
    this._cameraBoxes = {};
    this._painters = {};

    this._glyphAtlas = null;

    this._numBoxes = 0;

    this._world = world;
  }

  contextChanged(isLost: boolean, window?: GLProvider) {
    this._cameraBoxDirty = true;
    if (!isLost) {
      return;
    }
    for (const wid in this._painters) {
      if (window.id() === wid) {
        this._painters[wid].contextChanged(isLost);
      }
    }
  }

  needsRepaint() {
    return this._cameraBoxDirty;
  }

  glyphAtlas() {
    return this._glyphAtlas;
  }

  setCameraMouse(name: string, x: number, y: number) {
    if (!(name in this._cameraBoxes)) {
      ++this._numBoxes;
      this._cameraBoxes[name] = {};
    }
    this._cameraBoxes[name].mouseX = x;
    this._cameraBoxes[name].mouseY = y;
    this._cameraBoxes[name].when = new Date();
    this._cameraBoxDirty = true;
    this.scheduleRepaint();
  }

  setCamera(name: string, camera: any) {
    let oldMouseX;
    let oldMouseY;
    if (!(name in this._cameraBoxes)) {
      ++this._numBoxes;
    } else {
      oldMouseX = this._cameraBoxes[name].mouseX;
      oldMouseY = this._cameraBoxes[name].mouseY;
    }
    this._cameraBoxes[name] = camera;
    this._cameraBoxes[name].mouseX = oldMouseX;
    this._cameraBoxes[name].mouseY = oldMouseY;
    this._cameraBoxes[name].when = new Date();
    this._cameraBoxDirty = true;
    this.scheduleRepaint();
  }

  removeCamera(name: string) {
    if (!(name in this._cameraBoxes)) {
      return;
    }
    delete this._cameraBoxes[name];
    --this._numBoxes;
    this._cameraBoxDirty = true;
    this.scheduleRepaint();
  }

  scheduleRepaint() {
    this._world.scheduleRepaint();
  }

  paint(window: BasicWindow) {
    // console.log("Repainting camera boxes");
    let needsRepaint = false;
    if (this._showCameraBoxes && this._cameraBoxDirty) {
      let painter = this._painters[window.id()];
      if (!painter) {
        painter = new CameraBoxPainter(window);
        this._painters[window.id()] = painter;
      } else {
        painter.clear();
      }
      painter._blockPainter.initBuffer(this._numBoxes);
      const rect = new Rect();
      for (const name in this._cameraBoxes) {
        if (Object.prototype.hasOwnProperty.call(this._cameraBoxes, name)) {
          const cameraBox = this._cameraBoxes[name];
          const hw = cameraBox.width / cameraBox.scale;
          const hh = cameraBox.height / cameraBox.scale;
          rect.setX(-cameraBox.cameraX + hw / 2);
          rect.setY(-cameraBox.cameraY + hh / 2);
          rect.setWidth(cameraBox.width / cameraBox.scale);
          rect.setHeight(cameraBox.height / cameraBox.scale);
          needsRepaint =
            painter.drawBox(
              name,
              rect,
              cameraBox.scale,
              cameraBox.mouseX,
              cameraBox.mouseY,
              cameraBox.when
            ) || needsRepaint;
        }
      }
      this._cameraBoxDirty = needsRepaint;
    }
    return needsRepaint;
  }

  render(window: GLProvider, camera: Camera) {
    if (!this._showCameraBoxes) {
      return true;
    }
    const gl = window.gl();
    if (!gl) {
      return false;
    }
    const painter = this._painters[window.id()];
    if (!painter) {
      return false;
    }
    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
    painter.render(camera.project(), camera.scale());
  }
}
