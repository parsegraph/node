import GraphicsWindow, { TimingBelt } from "parsegraph-window";
import Color from 'parsegraph-color';
import Viewport from "./Viewport";
import World from "./World";

export default function render(belt:TimingBelt, world:World, container:Element) {
    const window = new GraphicsWindow(new Color(0, 0, 0, 0));
    container.appendChild(window.container());
    belt.addWindow(window);
    const viewport = new Viewport(world);
    window.addComponent(viewport);
    viewport.setSingleScreen(true);
    return belt;
}