import { defaultFont } from "./settings";
import CarouselAction from "./CarouselAction";
import { NodePalette } from "parsegraph-direction";
import WindowNode from "./WindowNode";
import EventNode from "./EventNode";
import Viewport from "./Viewport";

export default class ActionCarousel {
  _palette: NodePalette<EventNode>;
  _actions: CarouselAction[];
  _uninstaller: Function;

  constructor(palette: NodePalette<EventNode>) {
    if (!palette) {
      throw new Error("Palette must be defined");
    }
    this._palette = palette;
    this._actions = [];
  }

  findHotkey(action: string) {
    const idx = action.indexOf("&");
    if (idx < 0 || idx == action.length - 1) {
      return null;
    }
    const hotkey = action[idx + 1].toLowerCase();
    const parsedAction = action.substring(0, idx) + action.substring(idx + 1);
    return {
      action: parsedAction,
      hotkey: hotkey,
    };
  }

  addAction(
    action: string | EventNode,
    listener: Function,
    listenerThisArg?: any,
    hotkey?: string
  ) {
    if (typeof action === "string") {
      let label = action;
      action = this._palette.spawn();
      const hotkeyInfo = this.findHotkey(label);
      if (hotkeyInfo) {
        label = hotkeyInfo.action;
        hotkey = hotkey || hotkeyInfo.hotkey;
      }
      action.setLabel(label, defaultFont());
    }
    if (!listenerThisArg) {
      listenerThisArg = this;
    }
    const obj = new CarouselAction(
      action as WindowNode,
      listener,
      listenerThisArg
    );
    if (hotkey) {
      obj.setHotkey(hotkey.toLowerCase());
    }
    this._actions.push(obj);
  }

  install(node: EventNode, nodeData?: any) {
    node.setClickListener((viewport: Viewport) => {
      return this.onClick(viewport, node, nodeData);
    }, this);
    node.setKeyListener((keyName: string, viewport?: Viewport) => {
      return (
        viewport.carousel().isCarouselShown() && this.onKey(keyName, viewport)
      );
    }, this);

    let uninstaller: Function = null;

    const eventListener = node
      .events()
      .listen((eventName: string, viewport: Viewport) => {
        if (eventName === "carousel-load") {
          this.loadCarousel(viewport, node, nodeData);
        } else if (eventName === "carousel-stop") {
          if (uninstaller) {
            uninstaller();
            uninstaller = null;
          }
        }
      });

    uninstaller = () => {
      node.setClickListener(null);
      node.setKeyListener(null);
      node.events().stopListening(eventListener);
    };
    this._uninstaller = () => {
      if (!uninstaller) {
        return;
      }
      uninstaller();
      uninstaller = null;
    };
    return this._uninstaller;
  }

  uninstall() {
    if (!this._uninstaller) {
      return;
    }
    this._uninstaller();
    this._uninstaller = null;
  }

  onKey(_: string, viewport: Viewport) {
    const carousel = viewport.carousel();
    if (carousel.isCarouselShown()) {
      carousel.hideCarousel();
      return true;
    } else {
      return false;
    }
  }

  loadCarousel(viewport: Viewport, node: EventNode, nodeData?: any) {
    console.log("Loading carousel");
    const carousel = viewport.carousel();
    if (carousel.isCarouselShown()) {
      carousel.clearCarousel();
      carousel.hideCarousel();
      carousel.scheduleCarouselRepaint();
      return;
    }
    // console.log("Creating carousel");
    carousel.clearCarousel();
    carousel.moveCarousel(node.absoluteX(), node.absoluteY());

    for (let i = 0; i < this._actions.length; ++i) {
      const action = this._actions[i];
      action.setNodeData(node, nodeData);
      carousel.addToCarousel(action);
    }
    console.log("Scheduling carousel repaint");
    carousel.scheduleCarouselRepaint();
  }

  onClick(viewport: Viewport, node: EventNode, nodeData?: any) {
    const carousel = viewport.carousel();
    this.loadCarousel(viewport, node, nodeData);
    carousel.showCarousel();
    carousel.scheduleCarouselRepaint();
  }
}
