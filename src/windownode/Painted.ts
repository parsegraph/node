import {Positioned} from 'parsegraph-layout';
import Artist from "./Artist";
import PaintContext from "./PaintContext";

export default interface Painted extends Positioned {
  paint(ctx:PaintContext): boolean;
  getArtist(): Artist;
}
