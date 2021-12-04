import { renderFullscreen } from "../render";
import { TimingBelt } from "parsegraph-window";
import { PreferredAxis } from 'parsegraph-direction';
import World from "../World";
import DefaultNodePalette from "../DefaultNodePalette";
import Direction from 'parsegraph-direction';
import Caret from "../Caret";
import ActionCarousel from "../ActionCarousel";

function createFrame(url:string, w:number = 300, h:number = 500) {
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.style.backgroundColor = "grey";
  frame.style.pointerEvents = "auto";
  frame.style.width = w + "px";
  frame.style.height = h + "px";
  return frame;
}

document.addEventListener("DOMContentLoaded", () => {
  const belt = new TimingBelt();
  const world = new World();

  const car = new Caret();
  car.replace('b');
  car.label("parsegraph-node");

  const demoFrame = car.spawnMove('d', 'e');

  car.spawnMove('d', 'u', 'c');

  car.push();
  car.pull('d');
  car.spawnMove('d', 'b');
  car.label("Coverage");
  car.onClick(()=>{
    window.location.href = "/coverage";
  });
  car.spawnMove('d', 'e');
  car.element(()=>{
    return createFrame("/coverage");
  });

  car.pop();

  car.spawnMove('f', 'u');
  car.push();
  car.pull('d');
  car.spawnMove('d', 'b');
  car.label("Docs");
  car.onClick(()=>{
    window.location.href = "/docs";
  });
  car.spawnMove('d', 'e');
  car.element(()=>{
    return createFrame("/docs");
  });
  car.pop();

  const refresh = () => {
    world.clear();

    world.plot(car.root());
    belt.scheduleUpdate();
    world.scheduleRepaint();
  };

  fetch('/demos').then((resp)=>{
    return resp.text();
  }).then(text=>{
    text.split("\n").forEach(demo=>{
      car.spawnMove('f', 'u');
      car.push();
      const n = car.spawnMove('d', 'b');
      car.label(demo);
      const ac = new ActionCarousel();
      ac.addAction("Demo", ()=>{
        demoFrame.setElement(()=>{
          return createFrame("/" + demo + ".html", 800, 600);
        });
        demoFrame.layoutChanged();
        refresh();
      });
      ac.addAction("Open", ()=>{
        window.location.href = "/" + demo + ".html";
      });
      ac.install(n);
      car.pop();
    });
    refresh();
  });

  refresh();
  renderFullscreen(belt, world, document.getElementById("parsegraph-tree"));
});
