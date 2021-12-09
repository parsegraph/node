const caretTests = new TestSuite("Caret");
caretTests.addTest("new Caret", function () {
  const dnp = new DefaultNodePalette();
  let car = new Caret("s");
  const n = dnp.spawn("b");
  car = new Caret(n);
  car = new Caret();
  if (car.node().type() !== dnp.spawn().type()) {
    return car.node().type() + " is not the default.";
  }
});

caretTests.addTest("Caret.onKey", function () {
  const car = new Caret();
  car.onKey(function () {
    console.log("Key pressed");
    return true;
  });
});
