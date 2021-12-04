import { defaultUnicode } from "parsegraph-unicode";
import Font from "./Font";

export default class GlyphIterator {
  font: Font;
  index: number;
  len: number;
  prevLetter: number;
  text: string;

  constructor(font: Font, text: string) {
    this.font = font;
    this.index = 0;
    this.len = text.length;
    this.prevLetter = null;
    this.text = text;
  }

  next() {
    const unicode = defaultUnicode();
    if (!unicode.loaded()) {
      return null;
    }
    if (this.index >= this.len) {
      return null;
    }
    let start = this.text[this.index];
    const startIndex = this.index;
    let len = 1;
    if (this.text.codePointAt(this.index) > 0xffff) {
      len = 2;
      start = this.text.substring(this.index, this.index + 2);
    }
    this.index += len;
    if (unicode.isMark(start)) {
      // Show an isolated mark.
      // log("Found isolated Unicode mark character %x.\n", start[0]);
      const rv = this.font.getGlyph(start);
      return rv;
    }

    // log("Found Unicode character %x.\n", start[0]);

    // Form ligatures.
    let givenLetter = start.charCodeAt(0);
    if (givenLetter === 0x627 && this.prevLetter == 0x644) {
      // LAM WITH ALEF.
      if (this.prevLetter) {
        // Has a previous glyph, so final.
        givenLetter = 0xfefc;
      } else {
        // Isolated form.
        givenLetter = 0xfefb;
      }
      // Skip the ligature'd character.
      this.prevLetter = 0x627;
      // log("Found ligature %x->%x\n", gi->prevLetter, givenLetter);
    } else {
      let nextLetterChar = null;
      for (let i = 0; this.index + i < this.len; ) {
        let nextLetter = this.text[this.index + i];
        let len = 1;
        if (nextLetter.codePointAt(0) > 0xffff) {
          nextLetter = this.text.substring(this.index + 1, this.index + 3);
          len = 2;
        }
        if (unicode.isMark(nextLetter)) {
          i += len;
          continue;
        }
        // given, prev, next
        if (unicode.cursive(nextLetter[0], givenLetter, null)) {
          nextLetterChar = nextLetter[0];
        }
        break;
      }
      // RTL: [ 4, 3, 2, 1]
      //        ^-next
      //           ^-given
      //              ^-prev
      const cursiveLetter = unicode.cursive(
        givenLetter,
        this.prevLetter,
        nextLetterChar
      );
      if (cursiveLetter != null) {
        // console.log("Found cursive char " +
        // givenLetter.toString(16) + "->" + cursiveLetter.toString(16));
        this.prevLetter = givenLetter;
        givenLetter = cursiveLetter;
      } else {
        // console.log("Found non-cursive char " +
        // givenLetter.toString(16) + ".");
        this.prevLetter = null;
      }
    }

    // Add diacritical marks and combine ligatures.
    let foundVirama = false;
    while (this.index < this.len) {
      let letter = this.text[this.index];
      let llen = 1;
      if (this.text.codePointAt(this.index) > 0xffff) {
        llen = 2;
        letter = this.text.substring(this.index, this.index + 2);
      }
      if (llen == 2 && this.index == this.len - 1) {
        throw new Error("Unterminated UTF-16 character");
      }

      if (unicode.isMark(letter)) {
        foundVirama = letter[0].charCodeAt(0) == 0x094d;
        len += llen;
        this.index += llen;
        // log("Found Unicode mark character %x.\n", letter[0]);
        continue;
      } else if (foundVirama) {
        foundVirama = false;
        len += llen;
        this.index += llen;
        // log("Found Unicode character %x combined using Virama.\n", letter[0]);
        continue;
      }

      // Found a non-marking character that's part of a new glyph.
      break;
    }

    let trueText = this.text.substring(startIndex, startIndex + len);
    trueText = String.fromCodePoint(givenLetter) + trueText.substring(1);
    return this.font.getGlyph(trueText);
  }
}
