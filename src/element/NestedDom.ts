import Painted from "../windownode/Painted";
import { BasicWindow, Component } from "parsegraph-window";
import WindowNode from "../windownode/WindowNode";
import { Freezable } from "parsegraph-graphpainter";
import { Interactive } from "parsegraph-interact";
import Direction from "parsegraph-direction";

export type ElementFunc = (window: BasicWindow) => HTMLElement;

export default class NestedDom implements Painted, Interactive, Freezable {
  _element: ElementFunc;
  _windowElement: Map<Component, HTMLElement>;
  _node: WindowNode;

  constructor(node: WindowNode) {
    this._node = node;
    this._windowElement = new Map();
    this._element = null;
  }

  element(): ElementFunc {
    return this._element;
  }

  node() {
    return this._node;
  }

  setElement(element: ElementFunc): void {
    if (this._element === element) {
      return;
    }
    this._element = element;
    this._windowElement.forEach((elem) => {
      elem.remove();
    });
    this._windowElement.clear();
    this.node().layoutWasChanged(Direction.INWARD);
  }

  getWorldElement(window: BasicWindow, paintContext: Component): Element {
    if (!window.containerFor(paintContext)) {
      return null;
    }
    let worldEle: HTMLElement = window
      .containerFor(paintContext)
      .querySelector(".world");
    if (worldEle) {
      return worldEle;
    }
    worldEle = document.createElement("div");
    worldEle.className = "world";
    worldEle.style.width = "100vw";
    worldEle.style.height = "100vh";
    worldEle.style.transformOrigin = "top left";
    worldEle.style.position = "relative";
    worldEle.style.pointerEvents = "none";
    window.containerFor(paintContext).appendChild(worldEle);
    return worldEle;
  }

  prepare(window: BasicWindow, paintContext: Component): void {
    if (!window.containerFor(paintContext)) {
      return;
    }
    // Loop back to the first node, from the root.
    this.node().forEachPaintGroup((pg: WindowNode) => {
      pg.forEachNode((node: WindowNode) => {
        if (!this.element()) {
          return;
        }
        if (this.elementFor(paintContext)) {
          return;
        }
        const elem = this.element()(window);
        if (elem.parentNode !== this.getWorldElement(window, paintContext)) {
          if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
          }
          const sizer = document.createElement("div");
          // sizer.style.width = "100%";
          // sizer.style.height = "100%";
          sizer.style.display = "none";
          sizer.style.position = "absolute";
          new ResizeObserver(() => {
            node.layoutWasChanged();
            (paintContext as Viewport).world().scheduleRepaint();
            (paintContext as Viewport).scheduleUpdate();
            window.scheduleUpdate();
          }).observe(elem);
          this.getWorldElement(window, paintContext).appendChild(sizer);
          sizer.appendChild(elem);

          sizer.style.display = "block";
          sizer.style.transformOrigin = "center";
          sizer.style.cursor = "pointer";
          sizer.style.overflow = "hidden";
          sizer.style.transformOrigin = "top left";

          sizer.addEventListener("click", () => {
            const viewport = paintContext as Viewport;
            viewport.showInCamera(node);
            node.value().interact().click(viewport);
          });
          sizer.addEventListener("hover", () => {
            (paintContext as Viewport).setCursor("pointer");
          });
          sizer.addEventListener("blur", () => {
            (paintContext as Viewport).setCursor(null);
          });
        }
        this._windowElement.set(paintContext, elem);
      });
    });
  }

  elementFor(context: Component): HTMLElement {
    return this._windowElement.get(context);
  }
}
