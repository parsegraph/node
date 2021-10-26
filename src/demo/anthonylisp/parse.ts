import LispCell, { LispType } from "./LispCell";
import LispAtom from "./LispAtom";

/**
 * Convert given string to list of tokens.
 */
export function tokenize(str: string): string[] {
  console.log("Got string: ", str);
  var tokens = [];
  str = str.toString();
  var i = 0;
  while (i < str.length) {
    var c = str.charAt(i);
    if (c === ";") {
      while (c !== "\n") {
        c = str.charAt(++i);
      }
      ++i;
      continue;
    }
    if (c === " ") {
      ++i;
      continue;
    }
    if (c === "\n") {
      tokens.push(c);
      ++i;
      continue;
    }
    if (c === "(" || c === ")") {
      tokens.push(c);
      ++i;
      continue;
    }

    // A string.
    if (c === '"') {
      ++i;
      var start = i;
      var count = 0;
      c = str.charAt(i);
      while (c != '"') {
        ++count;
        ++i;
        c = str.charAt(i);
      }
      tokens.push(str.substring(start, start + count));
      ++i;
      continue;
    }

    // A symbol or procedure name.
    var start = i;
    var count = 0;
    while (
      i < str.length &&
      c !== " " &&
      c !== "\n" &&
      c !== "(" &&
      c !== ")"
    ) {
      ++count;
      c = str.charAt(i++);
    }
    --count;
    --i;
    tokens.push(str.substring(start, start + count));
  }
  return tokens;
}

/**
 * Returns the Lisp expression in the given tokens.
 */
export function parseTokens(tokens: string[]): LispCell {
  let token: string = tokens.shift();
  while (token == "\n") {
    token = tokens.shift();
  }
  if (token === "(") {
    var c = new LispCell(LispType.List);
    var newLined = false;
    while (tokens.length > 1 && tokens[0] !== ")") {
      if (tokens[0] === "\n") {
        tokens.shift();
        newLined = true;
        continue;
      }
      var child = parseTokens(tokens);
      if (newLined) {
        child.newLined = true;
        newLined = false;
      }
      c.list.push(child);
    }
    tokens.shift();
    return c;
  } else {
    return LispAtom(token);
  }
}

/**
 * Return the Lisp expression represented by the given string.
 */
export default function parse(src: string): LispCell {
  return parseTokens(tokenize("(" + src + ")"));
}
