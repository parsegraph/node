import TestSuite from 'parsegraph-testsuite';
import {Caret, Label, Line, defaultFont} from '../src';

const lineTests = new TestSuite('Line');

lineTests.addTest('new Line', function() {
  const font = defaultFont();
  const label = new Label(font);
  new Line(label, "");
  let f = 0;
  try {
    new Line(null, "");
    f = 2;
  } catch (ex) {
    f = 3;
  }
  if (f !== 3) {
    return 'Failed to recognize null label';
  }
});

const labelTests = new TestSuite('Label');

labelTests.addTest('defaultFont', function() {
  const font = defaultFont();
  if (!font) {
    return 'No font created';
  }
});

labelTests.addTest('new Label', function() {
  const font = defaultFont();
  const label = new Label(font);
  if (!label) {
    return 'No label created';
  }
});

labelTests.addTest('Label.label', function() {
  const font = defaultFont();
  const label = new Label(font);
  if (!label) {
    return 'No label created';
  }

  const car = new Caret('s');
  car.setFont(font);
  car.label('No time');
});

labelTests.addTest('isEmpty', function() {
  const font = defaultFont();
  const l = new Label(font);
  if (!l.isEmpty()) {
    return 'New label must begin as empty.';
  }
  l.setText('No time');
  if (l.isEmpty()) {
    return 'Label with text must test as non-empty.';
  }
});

labelTests.addTest('Click before beginning', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time');
  l.click(-5, -5);

  if (l.caretLine() != 0) {
    return 'caretLine';
  }
  if (l.caretPos() != 0) {
    return 'caretPos';
  }
});

labelTests.addTest('Click on second character', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time');
  l.click(font.getGlyph('N').width + 1, 0);

  if (l.caretLine() != 0) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});

labelTests.addTest('Click on second line', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time\nLol');
  l.click(font.getGlyph('L').width + 1, l.lineAt(0).height() + 1);

  if (l.caretLine() != 1) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});

labelTests.addTest('Click past end', function() {
  const font = defaultFont();
  const l = new Label(font);
  l.setText('No time\nLol');
  l.click(
      font.getGlyph('L').width + 1,
      l.lineAt(0).height() + l.lineAt(1).height() + 1,
  );

  if (l.caretLine() != 1) {
    return 'caretLine';
  }
  if (l.caretPos() != 1) {
    return 'l.caretPos()=' + l.caretPos();
  }
});

