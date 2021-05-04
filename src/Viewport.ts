import Camera from 'parsegraph-camera';
import Carousel from './Carousel';
import Input from './Input';
import BurgerMenu from './BurgerMenu';
import CameraFilter from './CameraFilter';
import World from './World';
import EventNode from './EventNode';
import Window, {Component} from 'parsegraph-window';

export const FOCUS_SCALE = 0.25;

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
  _window:Window;
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

  hasEventHandler():boolean {
    return true;
  }

  constructor(window:Window, world:World) {
    super(viewportType);
    if (!window) {
      throw new Error('A window must be provided');
    }
    // Construct the graph.
    this._window = window;
    this._world = world;
    this._camera = new Camera();
    this._cameraFilter = new CameraFilter(this);

    this._carousel = new Carousel(this);
    this._input = new Input(this);

    this._menu = null;
    this._menu = new BurgerMenu(this);
    // this._piano = new AudioKeyboard(this._camera);
    this._renderedMouse = -1;
    this._needsRender = true;

    this._focusScale = FOCUS_SCALE;
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
    if (eventType === 'tick') {
      return this._input.update(eventData);
    }
    console.log('Unhandled event type: ' + eventType);
  };

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
    return this._window.layout(this.component()).width();
  };

  x() {
    return this._window.layout(this.component()).x();
  };

  y() {
    return this._window.layout(this.component()).y();
  };

  height() {
    return this._window.layout(this.component()).height();
  };

  shaders() {
    return this.window().shaders();
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
      this._world.needsRepaint() ||
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

  plot(...args:any) {
    return this.world().plot.apply(this.world(), ...args);
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
      // window.log("Viewport is not dirty");
      return false;
    }

    let needsUpdate = this._carousel.paint();
    needsUpdate = this._world.paint(window, timeout) || needsUpdate;

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
    if (noPrior) {
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
  ) {
    const gl = this._window.gl();
    if (gl.isContextLost()) {
      return false;
    }
    const cam = this.camera();
    if (!cam.setSize(width, height) && avoidIfPossible && !this.needsRender()) {
      return false;
    } else {
      this._menu.paint();
    }

    if (this._nodeShown) {
      if(this._cameraFilter.getRequiredScale() != this.getRequiredScale()) {
        this._cameraFilter.restart();
      } else if (
        !cam.containsAll(this._nodeShown.absoluteSizeRect()) &&
        !this._cameraFilter.animating()
      ) {
        this._cameraFilter.restart();
      } else {
        // console.log("Focused node is visible on screen");
      }
    }

    if(this._cameraFilter.render()) {
      this._window.log('Camera filter wants render.');
      this.scheduleRender();
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    const overlay = this.window().overlay();
    overlay.textBaseline = 'top';
    overlay.scale(this.camera().scale(), this.camera().scale());
    overlay.translate(this.camera().x(), this.camera().y());

    const needsUpdate = this._world.render(this._window, cam);
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
    if (
      !this._window.isOffscreen() &&
      this._window.focusedComponent() &&
      this._window.focusedComponent().peer() === this
    ) {
      this._carousel.render(world);
      this._menu.render();
    }
    if (!needsUpdate) {
      this._renderedMouse = this.input().mouseVersion();
      this._needsRender = this._needsRepaint;
    }

    return needsUpdate;
  };
}
