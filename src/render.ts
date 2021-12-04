import GraphicsWindow, { TimingBelt } from "parsegraph-window";
import Color from "parsegraph-color";
import Viewport, {
  ViewportDisplayMode,
  FullscreenViewportDisplayMode,
  SingleScreenViewportDisplayMode,
  FixedWidthViewportDisplayMode,
  FitInWindowViewportDisplayMode,
} from "./Viewport";
import World from "./World";

export default function render(
  belt: TimingBelt,
  world: World,
  container: Element,
  viewportDisplayMode?: ViewportDisplayMode
): [GraphicsWindow, Viewport] {
  const window = new GraphicsWindow(new Color(0.1, 0, 0.3, 1));
  container.appendChild(window.container());
  belt.addWindow(window);
  const viewport = new Viewport(world);
  if (viewportDisplayMode != null) {
    viewport.setDisplayMode(viewportDisplayMode);
  } else {
    viewport.setSingleScreen(true);
  }
  window.addComponent(viewport);
  return [window, viewport];
}

export function renderFullscreen(
  belt: TimingBelt,
  world: World,
  container: Element
) {
  return render(belt, world, container, new FullscreenViewportDisplayMode());
}

export function renderSingleScreen(
  belt: TimingBelt,
  world: World,
  container: Element
) {
  return render(belt, world, container, new SingleScreenViewportDisplayMode());
}

export function renderFixedWidth(
  belt: TimingBelt,
  world: World,
  container: Element,
  w: number,
  h: number
) {
  return render(
    belt,
    world,
    container,
    new FixedWidthViewportDisplayMode(w, h)
  );
}

export function renderFitInWindow(
  belt: TimingBelt,
  world: World,
  container: Element
) {
  return render(belt, world, container, new FitInWindowViewportDisplayMode());
}
