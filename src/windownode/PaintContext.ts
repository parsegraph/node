import {Component} from "parsegraph-window";
import Artist from "./Artist";
import Rect from "parsegraph-rect";

export default class PaintContext {
  _artist: Artist;
  _context: {[key:string]:any};
  _component: Component;
  _bounds: Rect;

  constructor(comp:Component, artist:Artist) {
    this._component = comp;
    this._artist = artist;
    this._bounds = new Rect();
  }

  bounds(): Rect {
    return this._bounds;
  }

  artist() {
    return this._artist;
  }

  component() {
    return this._component;
  }

  window() {
    return this.component().window();
  }

  gl() {
    return this.window().gl();
  }

  get(key:string): any {
    return this._context[key];
  }

  set(key:string, val:any) {
    this._context[key] = val;
  }

}
