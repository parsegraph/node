const properKeyCodes:{[id:number]:string} = {
  13:"Enter",
  27:"Escape",
  37:"ArrowLeft",
  38:"ArrowUp",
  39:"ArrowRight",
  40:"ArrowDown",
}

const directKeyNames:string[] = [
  'Enter',
  'Escape',
  'ArrowLeft',
  'ArrowUp',
  'ArrowRight',
  'ArrowDown',
  'PageDown',
  'PageUp',
  'Home',
  'End',
]

const mappedKeyNames:{[id:string]:string} = {
  "-":"ZoomIn",
  "_":"ZoomIn",
  "+":"ZoomOut",
  "=":"ZoomOut",
};

export default function getproperkeyname(event:KeyboardEvent) {
  const keyName = event.key;
  console.log(keyName + " " + event.keyCode);
  if (directKeyNames.indexOf(keyName) >= 0) {
    return keyName;

  }
  return mappedKeyNames[keyName] ||
    properKeyCodes[event.keyCode] ||
    keyName;
}
