import Direction from "parsegraph-direction";
import GraphicsWindow from "parsegraph-window";
import ActionCarousel from './ActionCarousel';
import Caret from './Caret';
import Viewport from './Viewport';
import DefaultNodePalette from "./DefaultNodePalette";
import DefaultNodeType from "./DefaultNodeType";
import EventNode from "./EventNode";
import Node from "./Node";
import Widget from "./Widget";
import World from "./World";

export default class EnvironmentWidget implements Widget {
    _world:World;
    _window:GraphicsWindow;

    _root:Node<DefaultNodeType>;

    _nodeCount:number;

    _ac:ActionCarousel;

    constructor(window:GraphicsWindow, world:World) {
        this._window = window;
        this._world = world;
        this._nodeCount = 0;

        const ac = new ActionCarousel(new DefaultNodePalette());
        ac.addAction("JSON", (...args:any)=>{
            console.log(...args);
        }, this, "j");
        ac.addAction("JavaScript", (...args:any)=>{
            console.log(...args);
        }, this, "s");
        this._ac = ac;
    }

    blockSpawner(viewport:Viewport, node:EventNode) {
        const caret = new Caret(node as Node<DefaultNodeType>);
        ['b', 'f'].forEach((dir)=>{
            if (caret.has(dir)) {
                return;
            }
            caret.push();
            caret.spawnMove(dir, 'u');
            caret.onClick(this.blockSpawner, this);
            caret.pop();
        });
        if (!caret.has('d')) {
            console.log("Block spawning from ", node, caret.node());
            caret.pull('d');
            caret.spawnMove('d', 'b');
            caret.label("" + (++this._nodeCount));
        }
        caret.onClick(null);
        this.scheduleUpdate();
    }

    root():EventNode {
        if (this._root) {
            return this._root;
        }

        const car = new Caret('u');
        this._ac.install(car.node(), car.node())

        // car.onClick(this.blockSpawner, this);
        this._root = car.root();

        return this._root;
    }

    allowConnection(dir:Direction):boolean {
        return dir === Direction.UPWARD;
    }

    window():GraphicsWindow {
        return this._window;
    }

    world():World {
        return this._world;
    }

    scheduleUpdate() {
        this._world.scheduleRepaint();
        this._window.scheduleUpdate();
    }
}