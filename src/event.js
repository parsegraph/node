export function addEventListener(
    targetElement,
    eventName,
    listener,
    useCapture,
) {
  if (useCapture === undefined) {
    // Unspecified, so default to false.
    useCapture = false;
  }
  if (targetElement.addEventListener) {
    // Standard way.
    return targetElement.addEventListener(eventName, listener, useCapture);
  }

  // Internet Explorer before IE 9.
  window.setTimeout(function() {
    if (!/^on/.test(eventName)) {
      eventName = 'on' + eventName;
    }
    targetElement.attachEvent(eventName, listener);
  });
}

export function addEventMethod(
    targetElement,
    eventName,
    listener,
    listenerThisArg,
    useCapture,
) {
  return addEventListener(
      targetElement,
      eventName,
      function(...args) {
        listener.apply(listenerThisArg, args);
      },
      useCapture,
  );
}

export function removeEventListener(
    targetElement,
    eventName,
    listener,
    useCapture,
) {
  if (useCapture === undefined) {
    // Unspecified, so default to false.
    useCapture = false;
  }
  if (targetElement.removeEventListener) {
    // Standard way.
    return targetElement.removeEventListener(eventName, listener, useCapture);
  }

  // Internet Explorer before IE 9.
  window.setTimeout(function() {
    if (!/^on/.test(eventName)) {
      eventName = 'on' + eventName;
    }
    targetElement.detachEvent(eventName, listener);
  });
}

export function addButtonListener(targetElement, listener, listenerThisArg) {
  return [
    addEventMethod(targetElement, 'click', listener, listenerThisArg),
    addEventMethod(
        targetElement,
        'keydown',
        function(event) {
          if (event.keyCode === 32 || event.keyCode === 13) {
            listener.call(listenerThisArg, event);
          }
        },
        this,
    ),
  ];
}

export function writeError(ex) {
  let err = '';
  switch (typeof ex) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'function':
      err += ex;
      break;
    case 'object':
      if (typeof ex.toString == 'function') {
        err += ex.toString();
      } else if (typeof ex.toJSON == 'function') {
        err += ex.toJSON();
      } else {
        err += ex;
      }
      break;
  }
  return err;
}
