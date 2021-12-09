import {Positioned} from 'parsegraph-layout';
import Artist, {Counts} from "./Artist";
import PaintContext from "./PaintContext";

export default interface Painted extends Positioned {
  draft(counts:Counts): void;
  paint(ctx:PaintContext): boolean;
  getArtist(): Artist;
}
