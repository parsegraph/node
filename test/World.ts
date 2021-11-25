import TestSuite from "parsegraph-testsuite";
import { Caret, World } from "../dist/parsegraph-node.lib";

const worldTests = new TestSuite("World");

worldTests.addTest("World.plot", function () {
  const w = new World();

  let f = 0;
  try {
    f = 1;
    w.plot(null);
    f = 2;
  } catch (ex) {
    f = 3;
  }
  if (f != 3) {
    return "plot must fail with null node";
  }
});

worldTests.addTest("world.plot with caret", function () {
  const w = new World();
  const car = new Caret("b");
  let f = 0;
  try {
    f = 1;
    w.plot(car.node());
    f = 2;
  } catch (ex) {
    f = ex;
  }
  if (f != 2) {
    return "plot must handle being passed a Caret: " + f;
  }
});

worldTests.addTest("boundingRect", function () {
  const w = new World();
  const car = new Caret("b");
  w.plot(car.node());
  const r = w.boundingRect();
  // console.log(r);
  if (isNaN(r.width())) {
    return "Width must not be NaN";
  }
});
