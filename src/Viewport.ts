import Camera from 'parsegraph-camera';
import Carousel from './Carousel';
import Input from './Input';
import BurgerMenu from './BurgerMenu';
import CameraFilter from './CameraFilter';
import World from './World';
import EventNode from './EventNode';
import {BasicWindow, Component, WindowInput} from 'parsegraph-window';

export const FOCUS_SCALE = 1;

const MIN_SPLIT_THRESHOLD = 800;
const MIN_MENU_THRESHOLD = 400;

export interface ViewportDisplayMode {
  render(viewport:Viewport):boolean;
  allowSplit(viewport:Viewport):boolean;
  showMenu(viewport:Viewport):boolean;
}

abstract class SplittingViewportDisplayMode implements ViewportDisplayMode {
  abstract render(viewport: Viewport): boolean;

  allowSplit(viewport:Viewport):boolean {
    return viewport.width() > MIN_SPLIT_THRESHOLD;
  }

  showMenu(viewport:Viewport):boolean {
    return viewport.width() > MIN_MENU_THRESHOLD;
  }
}

export class FullscreenViewportDisplayMode extends SplittingViewportDisplayMode {
  render(viewport:Viewport) {
    const cam = viewport.camera();
    let needsUpdate = false;
    if (viewport._nodeShown) {
      if(viewport._cameraFilter.getRequiredScale() != viewport.getRequiredScale()) {
        viewport._cameraFilter.restart();
      } else if (
        !cam.containsAll(viewport._nodeShown.absoluteSizeRect()) &&
        !viewport._cameraFilter.animating()
      ) {
        viewport._cameraFilter.restart();
      } else {
        // console.log("Focused node is visible on screen");
      }
      if(viewport._cameraFilter.render()) {
        viewport._window.log('Camera filter wants render.');
        viewport.scheduleRender();
        needsUpdate = true;
      }
    } else {
      const root = viewport._world._worldRoots[0];
      root.prepare(viewport._window, viewport);
      const size = root.extentSize();
      if (size.width() > 0 && size.height() > 0) {
        root.showInCamera(cam, false);
      }
    }

    return needsUpdate;
  }
}

abstract class MenulessViewportDisplayMode implements ViewportDisplayMode {
  allowSplit():boolean {
    return false;
  }

  showMenu():boolean {
    return false;
  }

  abstract render(viewport:Viewport):boolean;
}

export class SingleScreenViewportDisplayMode extends MenulessViewportDisplayMode {
  render(viewport:Viewport) {
    const cam = viewport.camera();
    const root = viewport._world._worldRoots[0];
    root.prepare(viewport._window, viewport);
    const size = root.extentSize();
    viewport._window.container().style.display = "inline-block";
    let needsUpdate = false;
    if (size.width() > 0 && size.height() > 0) {
      if (cam.setSize(size.width(), size.height())) {
        console.log("SETTING EXTENT SIZE:", size.width, size.height());
        viewport._window.setExplicitSize(size.width(), size.height());
        needsUpdate = true;
      }
      root.showInCamera(cam, false);
    } else {
      console.log("NO EXTENT SIZE");
      needsUpdate = true;
      viewport._world.scheduleRepaint();
    }
    return needsUpdate;
  }
}

export class FixedWidthViewportDisplayMode extends SplittingViewportDisplayMode {
  _w:number;
  _h:number;

  constructor(w:number, h:number) {
    super();
    this._w = w;
    this._h = h;
  }

  render(viewport:Viewport) {
    const cam = viewport.camera();
    console.log("Showing");
    const root = viewport._world._worldRoots[0];
    root.prepare(viewport._window, viewport);
    const size = root.extentSize();
    viewport._window.container().style.display = "inline-block";
    viewport._window.container().style.width = this._w + "px";
    viewport._window.container().style.height = this._h + "px";
    let needsUpdate = false;
    if (size.width() > 0 && size.height() > 0) {
      if (cam.setSize(this._w, this._h)) {
        console.log("SETTING EXTENT SIZE:", size.width, size.height());
        viewport._window.setExplicitSize(this._w, this._h);
        needsUpdate = true;
      }
      root.showInCamera(cam, false);
    } else {
      console.log("NO EXTENT SIZE");
      needsUpdate = true;
      viewport._world.scheduleRepaint();
    }
    return needsUpdate;
  }
}

export class FitInWindowViewportDisplayMode extends SplittingViewportDisplayMode {
  render(viewport:Viewport) {
    const cam = viewport.camera();
    console.log("Showing");
    const root = viewport._world._worldRoots[0];
    root.prepare(viewport._window, viewport);
    const size = root.extentSize();
    let needsUpdate = false;
    if (size.width() > 0 && size.height() > 0) {
      root.showInCamera(cam, false);
    } else {
      console.log("NO EXTENT SIZE");
      needsUpdate = true;
      viewport._world.scheduleRepaint();
    }
    return needsUpdate;
  }
}
/*
 * TODO Add gridX and gridY camera listeners, with support for loading from an
 * infinite grid of cells.
 *
 * TODO Add camera-movement listener, to let nodes watch for camera movement,
 * and thus let nodes detect when they are approaching critical screen
 * boundaries:
 *
 * enteringScreen leavingScreen
 *
 * Node distance is radially calculated (using the viewport's diagonal) from
 * the camera's center, adjusted by some constant.
 *
 * hysteresis factor gives the +/- from some preset large distance (probably
 * some hundreds of bud radiuses). Ignoring hysteresis, then when the camera
 * moves, the node's relative position may be changed. This distance is
 * recalculated, and if it is above some threshold plus hysteresis constant,
 * and the node's state was 'near', then the node's leavingScreen is called,
 * and the node's state is set to 'far'.
 *
 * Likewise, if the distance is lower than the same threshold minus hysteresis
 * constant, and the node's state was 'far', then the node's enteringScreen is
 * called, and the node's state is set to 'near'.
 *
 * This distance is checked when the node is painted and also when the camera
 * is moved.
 *
 * TODO Figure out how changing the grid size might change things.
 *
 * Grid updates based only on camera movement. Updates are reported in terms of
  * cells made visible in either direction.  The number of potentially visible
  * grid cells is determined for each axis using the camera's axis size
  * adjusted by some constant.
 */
const viewportType = 'Viewport';
export default class Viewport extends Component {
  _world:World;
  _camera:Camera;
  _cameraFilter:CameraFilter;
  _carousel:Carousel;
  _input:Input;
  _menu:BurgerMenu;
  _renderedMouse:number;
  _needsRender:boolean;
  _focusScale:number;
  _nodeShown:EventNode;
  _needsRepaint:boolean;
  _displayMode:ViewportDisplayMode;
  _window:BasicWindow;

  constructor(world:World) {
    super(viewportType);
    // Construct the graph.
    this._world = world;
    this._displayMode = new FullscreenViewportDisplayMode();
    this._camera = new Camera();
    this._cameraFilter = new CameraFilter(this);
    this._input = new Input(this);
    this._carousel = new Carousel(this);

    this._menu = new BurgerMenu(this);

    // this._piano = new AudioKeyboard(this._camera);
    this._renderedMouse = -1;
    this._needsRender = true;

    this._focusScale = FOCUS_SCALE;

    this._menu.showSplit(this._displayMode.allowSplit(this));
  }

  setDisplayMode(displayMode:ViewportDisplayMode) {
    this._displayMode = displayMode;
    this._menu.showSplit(this._displayMode.allowSplit(this));
  }

  setSingleScreen(single:boolean) {
    this._displayMode = single ? 
      new SingleScreenViewportDisplayMode() :
      new FullscreenViewportDisplayMode();
    this._menu.showSplit(!single);
  }

  setFixedWidth(w:number, h:number) {
    this.setDisplayMode(new FixedWidthViewportDisplayMode(w, h));
  }

  fitInWindow() {
    this.setDisplayMode(new FitInWindowViewportDisplayMode());
  }

  displayMode() {
    return this._displayMode;
  }

  peer():any {
    return this;
  }

  handleEvent(eventType:string, eventData:any) {
    if (eventType === 'blur') {
      this._menu.closeMenu();
      return true;
    }
    if (eventType === 'wheel') {
      return this._input.onWheel(eventData);
    }
    if (eventType === 'touchmove') {
      return this._input.onTouchmove(eventData);
    }
    if (eventType === 'touchzoom') {
      return this._input.onTouchzoom(eventData);
    }
    if (eventType === 'touchstart') {
      this._nodeShown = null;
      return this._input.onTouchstart(eventData);
    }
    if (eventType === 'touchend') {
      return this._input.onTouchend(eventData);
    }
    if (eventType === 'mousedown') {
      return this._input.onMousedown(eventData);
    }
    if (eventType === 'mousemove') {
      return this._input.onMousemove(eventData);
    }
    if (eventType === 'mouseup') {
      return this._input.onMouseup(eventData);
    }
    if (eventType === 'keydown') {
      return this._input.onKeydown(eventData);
    }
    if (eventType === 'keyup') {
      return this._input.onKeyup(eventData);
    }
    console.log('Unhandled event type: ' + eventType);
  };

  tick(startDate:number):boolean {
    return this._input.update(new Date(startDate));
  }

  _unmount:()=>void;

  mount(window:BasicWindow) {
    console.log("MOUNT", window)
    new WindowInput(window, this, (eventType:string, inputData?:any)=>{this.handleEvent(eventType, inputData);});
    this._menu.mount();
    this._window = window;
    this._unmount = this._world.addRepaintListener(()=>{
      this._window.scheduleUpdate();
    });
  }

  unmount() {
    if (this._unmount) {
      this._unmount();
      this._unmount = null;
    }
  }

  setCursor(cursor:string):void {
    (this.window().containerFor(this) as HTMLElement).style.cursor = cursor;
  }


  serialize() {
    return {
      componentType: viewportType,
      camera: this._camera.toJSON(),
    };
  };

  component() {
    return this;
  };

  width() {
    return this._window?.layout(this.component()).width();
  };

  x() {
    return this._window?.layout(this.component()).x();
  };

  y() {
    return this._window?.layout(this.component()).y();
  };

  height() {
    return this._window?.layout(this.component()).height();
  };

  shaders() {
    return this.window()?.shaders();
  };

  window() {
    return this._window;
  };

  gl() {
    return this._window.gl();
  };

  contextChanged(isLost:boolean) {
    const window = this.window();
    this._world.contextChanged(isLost, window);
    this._carousel.contextChanged(isLost);
    this._input.contextChanged(isLost);
    this._menu.contextChanged(isLost);
  };

  world() {
    return this._world;
  };

  carousel() {
    return this._carousel;
  };

  menu() {
    return this._menu;
  };

  camera() {
    return this._camera;
  };

  input() {
    return this._input;
  };

  dispose() {
    this._menu.dispose();
  };

  scheduleRepaint() {
    // console.log("Viewport is scheduling repaint");
    this.scheduleUpdate();
    this._needsRepaint = true;
    this._needsRender = true;
  };

  scheduleRender() {
    // console.log("Viewport is scheduling render");
    this.scheduleUpdate();
    this._needsRender = true;
  };

  needsRepaint() {
    return (
      this._needsRepaint ||
      this._world.needsRepaint(this._window) ||
      (this._carousel.isCarouselShown() && this._carousel.needsRepaint()) ||
      this._menu.needsRepaint()
    );
  };

  needsRender() {
    return (
      this.needsRepaint() ||
      this._cameraFilter.animating() ||
      this._needsRender ||
      this._renderedMouse !== this.input().mouseVersion()
    );
  };

  plot(node:EventNode) {
    return this.world().plot(node);
  };

  /*
  * Paints the graph up to the given time, in milliseconds.
  *
  * Returns true if the graph completed painting.
  */
  paint(timeout?:number) {
    const window = this._window;
    const gl = this._window.gl();
    if (gl.isContextLost()) {
      return false;
    }
    if (!this.needsRepaint()) {
      //console.log("No need to paint; viewport is not dirty for window " + window.id());
      return false;
    }

    let needsUpdate = this._carousel.paint(this);
    needsUpdate = this._world.paint(window, timeout, this) || needsUpdate;

    this._input.paint();
    // this._piano.paint();
    if (needsUpdate) {
      this.scheduleRepaint();
    } else {
      this._needsRepaint = false;
    }
    this._needsRender = true;
    return needsUpdate;
  };

  mouseVersion() {
    return this._renderedMouse;
  };

  showInCamera(node:EventNode) {
    const noPrior = !this._nodeShown;
    this._nodeShown = node;
    this._input.setFocusedNode(node);
    if (noPrior && node) {
      this._cameraFilter.restart();
      this._cameraFilter.finish();
    }
    this.scheduleRender();
  };

  setFocusScale(scale:number) {
    // console.log("Focus scale is changing: " + scale);
    this._focusScale = scale;
    this.scheduleRender();
  };

  getFocusScale() {
    // console.log("Reading focus scale: " + this._focusScale);
    return this._focusScale;
  };

  getRequiredScale() {
    return this.getFocusScale()/this._nodeShown.absoluteScale();
  };

  cameraFilter() {
    return this._cameraFilter;
  };

  render(
      width:number,
      height:number,
      avoidIfPossible?:boolean,
  ):boolean {
    const gl = this._window.gl();
    if (gl.isContextLost()) {
      return false;
    }
    const cam = this.camera();
    if (!cam.setSize(width, height) && avoidIfPossible && !this.needsRender()) {
      //console.log("Avoided render");
      return false;
    }

    let needsUpdate = this._displayMode.render(this);

    gl.clear(gl.COLOR_BUFFER_BIT);
    const overlay = this.window().overlay();
    overlay.textBaseline = 'top';

    needsUpdate = this._world.render(this._window, cam, this) || needsUpdate;
    if (needsUpdate) {
      this._window.log('World was rendered dirty.');
      this.scheduleRender();
    }

    gl.blendFunc(gl.SRC_ALPHA, gl.DST_ALPHA);
    const world = cam.project();
    if (this._input.render(world, cam.scale())) {
      this.scheduleRender();
    }
    // this._piano.render(world, cam.scale());
    if (!this._window.isOffscreen()) {
      this._carousel.render(world);
      if(this._displayMode.showMenu(this)) {
        this._menu.showSplit(this._displayMode.allowSplit(this));
        this._menu.paint();
        this._menu.render();
      }
    }
    this._renderedMouse = this.input().mouseVersion();
    if (!needsUpdate) {
      this._needsRender = this._needsRepaint;
    }

    return needsUpdate;
  };
}
