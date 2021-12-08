import TestSuite from "parsegraph-testsuite";

nodeTests = new TestSuite("Node");

viewport_Tests.addTest("Label test", function () {
  const car = new Caret("b");
  car.label("No time");
  car.root().commitLayoutIteratively();
});

export default function simpleGraph(container, node) {
  if (node.root) {
    node = node.root();
  }
  const graph = new Viewport();
  graph.window().resize(500, 500);
  container.appendChild(graph.window().container());
  graph.plot(node);
  graph.scheduleRepaint();
  const timer = new AnimationTimer();
  timer.setListener(function () {
    node.showInCamera(graph.camera(), true);
    graph.window().paint();
    graph.window().render();
  });
  graph.input().setListener(function () {
    timer.schedule();
  });
  timer.schedule();
}

nodeTests.addTest("Node.setLabel", function () {
  const n = new Node(BLOCK);
  const font = defaultFont();
  n.setLabel("No time", font);
});

nodeTests.addTest("Node lisp test", function () {
  const car = makeCaret(BUD);
  car.push();
  car.spawnMove("f", "s");
  car.spawnMove("f", "s");
  car.pop();
  car.spawnMove("d", "u");
  car.push();
  car.spawnMove("f", "s");
  car.push();
  car.spawnMove("f", "s");
  car.spawnMove("i", "b");
  car.spawnMove("d", "u");
  car.spawnMove("f", "b");
  car.spawnMove("i", "s");
  car.spawnMove("f", "s");
  car.pop();
  car.pull("f");
  car.spawnMove("d", "u");
  car.connect("f", makeChild2());
  car.spawnMove("d", "u");
  car.connect("f", makeChild2());
  car.pop();
  car.spawnMove("d", "u");
  car.root().commitLayoutIteratively();
  // getLayoutNodes(car.root());
  const window = new Window();
  const world = new World();
  const g = new Viewport(window, world);
  world.plot(car.root());
  g.input().setListener(function () {
    g.window().paint();
    g.window().render();
  });
});
