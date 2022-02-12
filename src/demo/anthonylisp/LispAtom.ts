import LispCell, { LispType } from "./LispCell";

// return true iff given character is '0'..'9'
function isdig(c: string): boolean {
  return !!c.match(/\d+/);
}

// numbers become Numbers; every other token is a Symbol
export default function LispAtom(token: string) {
  // console.log("Making atom for " + token);
  if (
    isdig(token[0]) ||
    (token[0] === "-" && token.length > 1 && isdig(token[1]))
  ) {
    return new LispCell(LispType.Number, token);
  }
  return new LispCell(LispType.Symbol, token);
}
